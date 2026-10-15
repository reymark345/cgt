<?php

namespace App\Http\Middleware;

use App\Models\AuditTrail;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RecordAuditTrail
{
    /**
     * Handle an incoming request and record all POST actions into audit_trail.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Capture user before request executes (e.g. before logout clears session)
        $userBefore = $this->resolveUser($request);

        $response = $next($request);

        // Only record POST method requests
        if (! $request->isMethod('POST') && strtoupper($request->getRealMethod()) !== 'POST') {
            return $response;
        }

        try {
            AuditTrail::ensureTableExists();

            $user = $userBefore ?? $this->resolveUser($request);
            $path = trim($request->path(), '/');
            $routeName = $request->route()?->getName();

            [$module, $action] = $this->resolveModuleAndAction($request, $path, $routeName);
            $targetId = $this->resolveTargetId($request);
            $payload = $this->buildSanitizedPayload($request);

            AuditTrail::create([
                'user_id' => $user?->id,
                'user_name' => $user?->name ?? 'System / Guest',
                'user_email' => $user?->email,
                'user_position' => $user?->position,
                'user_division' => $user?->division,
                'method' => 'POST',
                'module' => $module,
                'action' => $action,
                'route_name' => $routeName,
                'url' => '/'.$path,
                'target_id' => $targetId,
                'payload' => $payload,
                'status_code' => $response->getStatusCode(),
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit((string) $request->userAgent(), 500),
            ]);
        } catch (\Throwable $e) {
            // Never block the user response if audit logging encounters an error
        }

        return $response;
    }

    /**
     * Resolve the currently authenticated SSO or Laravel user.
     */
    protected function resolveUser(Request $request): ?User
    {
        try {
            if ($request->hasSession() && $request->session()->has('sso_user_id')) {
                $user = User::find($request->session()->get('sso_user_id'));
                if ($user) {
                    return $user;
                }
            }

            if ($request->user()) {
                return $request->user();
            }
        } catch (\Throwable $e) {
            // Ignore session errors
        }

        return null;
    }

    /**
     * Determine human-readable module and action from the POST request.
     *
     * @return array{0: string, 1: string}
     */
    protected function resolveModuleAndAction(Request $request, string $path, ?string $routeName): array
    {
        $lowerPath = strtolower($path);

        $moduleMap = [
            'grantees' => 'Grantee List',
            'emv-database' => 'EMV Database',
            'emv-records' => 'EMV Database',
            'payroll' => 'Payroll',
            'inquiry' => 'Inquiry',
            'opening' => 'Opening',
            'distribution' => 'Distribution',
            'otc-withdrawal' => 'OTC Withdrawal',
            'replacement' => 'Replacement',
            'transfer-of-fund' => 'Transfer of Fund',
            'force-pin' => 'Force PIN',
            'locking' => 'Locking',
            'lifting' => 'Lifting',
            'libraries' => 'Directory',
            'sso' => 'Authentication',
        ];

        $firstSegment = explode('/', $lowerPath)[0] ?? '';
        $module = $moduleMap[$firstSegment] ?? Str::headline($firstSegment ?: 'System');

        // Specific action descriptions
        if (str_contains($lowerPath, 'process-batch')) {
            return [$module, "Processed {$module} Import Batch"];
        }

        if (str_ends_with($lowerPath, '/import')) {
            $fileName = $request->file('file')?->getClientOriginalName();

            return [$module, $fileName ? "Imported {$module} File ({$fileName})" : "Imported {$module} File"];
        }

        if ($lowerPath === 'inquiry/add-request') {
            $reqType = $request->input('request_type') ?: $request->input('module');
            $hhId = $request->input('hh_id') ?: $request->input('household_id');
            $suffix = $reqType ? ' ['.$reqType.']' : '';
            if ($hhId) {
                $suffix .= " for HH ID {$hhId}";
            }

            return ['Inquiry', 'Added Household Service Request'.$suffix];
        }

        if (str_ends_with($lowerPath, '/store')) {
            $id = $request->input('id');
            $hhId = $request->input('hh_id') ?: $request->input('household_id');
            $verb = $id ? 'Updated' : 'Created';
            $suffix = $hhId ? " (HH ID: {$hhId})" : ($id ? " (#{$id})" : '');

            return [$module, "{$verb} {$module} Record{$suffix}"];
        }

        if (str_ends_with($lowerPath, '/destroy')) {
            $routeId = $request->route('id') ?? $request->input('id');

            return [$module, "Deleted {$module} Record".($routeId ? " (#{$routeId})" : '')];
        }

        if (str_ends_with($lowerPath, '/update')) {
            $routeId = $request->route('id') ?? $request->input('id');
            $hhId = $request->input('household_id') ?: $request->input('hh_id');
            $suffix = $hhId ? " (HH ID: {$hhId})" : ($routeId ? " (#{$routeId})" : '');

            return [$module, "Updated {$module} Record{$suffix}"];
        }

        if ($lowerPath === 'sso/logout') {
            return ['Authentication', 'Signed Out of Portal (SSO)'];
        }

        if ($routeName) {
            return [$module, Str::headline(str_replace('.', ' ', $routeName))];
        }

        return [$module, 'Submitted POST Request to /'.$path];
    }

    /**
     * Extract target identifier (HH ID, Record ID, or File Name) from the request.
     */
    protected function resolveTargetId(Request $request): ?string
    {
        $candidates = [
            $request->input('hh_id'),
            $request->input('household_id'),
            $request->route('id'),
            $request->input('id'),
            $request->file('file')?->getClientOriginalName(),
        ];

        foreach ($candidates as $candidate) {
            if (is_scalar($candidate) && trim((string) $candidate) !== '') {
                return Str::limit(trim((string) $candidate), 190, '');
            }
        }

        return null;
    }

    /**
     * Build a sanitized array of the request input and uploaded files.
     */
    protected function buildSanitizedPayload(Request $request): array
    {
        $excluded = [
            '_token',
            '_method',
            'password',
            'password_confirmation',
            'current_password',
            'token',
            'secret',
        ];

        $data = $request->except($excluded);

        foreach ($request->allFiles() as $key => $file) {
            if (is_array($file)) {
                $data[$key] = array_map(fn ($f) => [
                    'file_name' => $f->getClientOriginalName(),
                    'size_bytes' => $f->getSize(),
                    'mime_type' => $f->getClientMimeType(),
                ], $file);
            } elseif ($file) {
                $data[$key] = [
                    'file_name' => $file->getClientOriginalName(),
                    'size_bytes' => $file->getSize(),
                    'mime_type' => $file->getClientMimeType(),
                ];
            }
        }

        return $data;
    }
}

