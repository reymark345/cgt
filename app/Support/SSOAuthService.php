<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class SSOAuthService
{
    public function authorizationUrl(string $state, string $codeChallenge): string
    {
        $query = [
            'response_type' => 'code',
            'client_id' => config('sso.client_id'),
            'redirect_uri' => config('sso.redirect_uri'),
            'state' => $state,
            'code_challenge' => $codeChallenge,
            'code_challenge_method' => 'S256',
        ];

        if (filled(config('sso.scopes'))) {
            $query['scope'] = config('sso.scopes');
        }

        return $this->endpoint('authorize_url', 'authorize_path').'?'.http_build_query($query);
    }

    /**
     * @return array<string, mixed>
     */
    public function exchangeCode(string $code, string $codeVerifier): array
    {
        $response = $this->http()
            ->asForm()
            ->post($this->endpoint('token_url', 'token_path'), [
                'grant_type' => 'authorization_code',
                'client_id' => config('sso.client_id'),
                'client_secret' => config('sso.client_secret'),
                'redirect_uri' => config('sso.redirect_uri'),
                'code' => $code,
                'code_verifier' => $codeVerifier,
            ]);

        if ($response->failed()) {
            throw new RuntimeException($response->json('error_description') ?: 'Unable to exchange SSO authorization code.');
        }

        return $response->json();
    }

    /**
     * @return array<string, mixed>
     */
    public function userInfo(string $accessToken): array
    {
        $response = $this->http()
            ->withToken($accessToken)
            ->acceptJson()
            ->get($this->endpoint('user_url', 'user_path'));

        if ($response->failed()) {
            throw new RuntimeException('Unable to fetch SSO user profile.');
        }

        return $response->json();
    }

    /**
     * @param array<string, mixed> $profile
     * @param array<string, mixed> $token
     */
    public function syncUser(array $profile, array $token): User
    {
        $profile = $profile['data'] ?? $profile['user'] ?? $profile;
        $ssoId = (string) ($profile['id'] ?? $profile['sub'] ?? $profile['user_id'] ?? '');
        $email = $profile['email'] ?? null;
        $username = $profile['username'] ?? $profile['preferred_username'] ?? null;

        $lookup = collect([
            $ssoId ? ['sso_id' => $ssoId] : null,
            $email ? ['email' => $email] : null,
            $username ? ['username' => $username] : null,
        ])->filter()->first();

        if (! $lookup) {
            throw new RuntimeException('SSO profile did not include a usable id, email, or username.');
        }

        return User::query()->updateOrCreate($lookup, [
            'sso_id' => $ssoId ?: null,
            'name' => $profile['name']
                ?? trim(($profile['first_name'] ?? '').' '.($profile['last_name'] ?? ''))
                ?: ($username ?: $email ?: 'SSO User'),
            'email' => $email,
            'username' => $username,
            'contact_number' => $profile['contact_number'] ?? null,
            'mobile_no' => $profile['mobile_no'] ?? $profile['mobile_number'] ?? null,
            'avatar' => $profile['avatar'] ?? $profile['picture'] ?? null,
            'mfa_enabled' => (bool) ($profile['mfa_enabled'] ?? false),
            'mfa_verified' => (bool) ($profile['mfa_verified'] ?? false),
            'access_token' => $token['access_token'] ?? null,
            'refresh_token' => $token['refresh_token'] ?? null,
            'token_expires_at' => isset($token['expires_in'])
                ? Carbon::now()->addSeconds((int) $token['expires_in'])
                : null,
        ]);
    }

    public function logout(string $accessToken): void
    {
        $this->http()
            ->withToken($accessToken)
            ->acceptJson()
            ->post($this->url(config('sso.logout_path')));
    }

    public function makeCodeVerifier(): string
    {
        return Str::random(96);
    }

    public function makeCodeChallenge(string $codeVerifier): string
    {
        return rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');
    }

    private function http(): PendingRequest
    {
        return Http::timeout(20)->withOptions([
            'verify' => (bool) config('sso.verify_ssl'),
        ]);
    }

    private function url(string $path): string
    {
        return rtrim(config('sso.base_url'), '/').'/'.ltrim($path, '/');
    }

    private function endpoint(string $urlKey, string $pathKey): string
    {
        $url = config("sso.{$urlKey}");

        if (is_string($url) && str_starts_with($url, 'http')) {
            return $url;
        }

        return $this->url(config("sso.{$pathKey}"));
    }
}
