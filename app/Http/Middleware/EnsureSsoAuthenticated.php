<?php

namespace App\Http\Middleware;

use App\Models\RolePermission;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSsoAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->has('sso_user_id')) {
            return redirect()
                ->route('login')
                ->with('error', 'Please sign in with SSO to continue.');
        }

        User::ensureRoleAndApprovalColumnsExist();
        RolePermission::ensureTableExists();

        $user = User::find($request->session()->get('sso_user_id'));
        if (! $user) {
            $request->session()->forget('sso_user_id');

            return redirect()
                ->route('login')
                ->with('error', 'Session expired. Please sign in again.');
        }

        $isPendingRoute = $request->routeIs('pending.approval') || $request->is('pending-approval');

        if (! $user->isApprovedAccount()) {
            if ($isPendingRoute) {
                return $next($request);
            }

            if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                return response()->json([
                    'message' => 'Your account is pending administrator approval.',
                ], 403);
            }

            return redirect()->route('pending.approval');
        }

        if ($isPendingRoute) {
            return redirect()->route('dashboard');
        }

        // Enforce role-based access for Libraries, System, and Request Print Forms
        $path = trim(strtolower($request->path()), '/');

        // 1. System routes (Users, Roles & Permissions, Audit Trails, User Manual)
        $isSystemRoute = in_array($path, [
            'users',
            'roles-and-permissions',
            'roles-permissions',
            'audit-trails',
            'audit-trail',
            'user-manual',
            'manual',
        ], true) || str_starts_with($path, 'roles-permissions/') || str_starts_with($path, 'audit-trails/');

        if ($isSystemRoute && ! $user->hasPermission('access_system')) {
            if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                return response()->json(['message' => 'Access denied. Admin privileges required for System modules.'], 403);
            }

            return redirect()->route('dashboard')->with('error', 'Access denied. Only Admin can access System modules.');
        }

        // 2. Libraries routes (Directory view & updates)
        $isLibraryRoute = $path === 'directory' || $path === 'libraries/directory' || str_starts_with($path, 'libraries/');
        if ($isLibraryRoute) {
            $requiredPermission = $request->isMethod('post') ? 'update_libraries' : 'access_libraries';
            if (! $user->hasPermission($requiredPermission)) {
                if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                    return response()->json(['message' => 'Access denied. Only Admin can view or update Libraries.'], 403);
                }

                return redirect()->route('dashboard')->with('error', 'Access denied. Only Admin can view or update Libraries.');
            }
        }

        // 3. Request Forms Print Preview routes (/{module}/print) - allowed for roles with Request module access
        if (str_ends_with($path, '/print') && ! $user->hasPermission('access_requests')) {
            if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                return response()->json(['message' => 'Access denied. You do not have permission to access Request Print Preview forms.'], 403);
            }

            return redirect()->route('dashboard')->with('error', 'Access denied. You do not have permission to access Request Print Preview forms.');
        }

        return $next($request);
    }
}

