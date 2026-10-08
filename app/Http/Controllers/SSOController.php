<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\PortalEmployeeService;
use App\Support\SSOAuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class SSOController extends Controller
{
    public function login(Request $request, SSOAuthService $sso): RedirectResponse
    {
        if (! config('sso.client_id') || ! config('sso.client_secret')) {
            return redirect()
                ->route('login')
                ->with('error', 'SSO is not configured. Please set SSO_CLIENT_ID and SSO_CLIENT_SECRET.');
        }

        $state = Str::random(40);
        $codeVerifier = $sso->makeCodeVerifier();

        $request->session()->put('sso_state', $state);
        $request->session()->put('sso_code_verifier', $codeVerifier);

        return redirect()->away($sso->authorizationUrl($state, $sso->makeCodeChallenge($codeVerifier)));
    }

    public function callback(Request $request, SSOAuthService $sso, PortalEmployeeService $portal): RedirectResponse
    {
        if ($request->filled('error')) {
            return redirect()
                ->route('login')
                ->with('error', $request->string('error_description')->toString() ?: 'SSO login was cancelled.');
        }

        $state = $request->session()->pull('sso_state');
        $codeVerifier = $request->session()->pull('sso_code_verifier');

        if (! $state || ! $codeVerifier || ! $request->filled('code') || ! hash_equals((string) $state, $request->string('state')->toString())) {
            return redirect()
                ->route('login')
                ->with('error', 'Invalid SSO response. Please try again.');
        }

        try {
            $token = $sso->exchangeCode($request->string('code')->toString(), (string) $codeVerifier);
            $profile = $sso->userInfo($token['access_token']);
            $user = $sso->syncUser($profile, $token);
            $portal->syncForUser($user);

            $request->session()->regenerate();
            $request->session()->put('sso_user_id', $user->id);

            return redirect()
                ->route('dashboard')
                ->with('message', 'Signed in with Caraga Connect SSO.');
        } catch (RuntimeException $exception) {
            Log::warning('SSO login failed', ['message' => $exception->getMessage()]);

            return redirect()
                ->route('login')
                ->with('error', $exception->getMessage());
        }
    }

    public function logout(Request $request, SSOAuthService $sso): RedirectResponse
    {
        $user = $request->session()->get('sso_user_id')
            ? User::find($request->session()->get('sso_user_id'))
            : null;

        if ($user?->access_token) {
            $sso->logout($user->access_token);
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('message', 'Signed out.');
    }
}
