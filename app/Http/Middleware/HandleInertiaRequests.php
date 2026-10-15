<?php

namespace App\Http\Middleware;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        User::ensureRoleAndApprovalColumnsExist();
        \App\Models\RolePermission::ensureTableExists();

        $user = $request->session()->get('sso_user_id')
            ? User::find($request->session()->get('sso_user_id'))
            : null;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'username' => $user->username,
                    'position' => $user->position,
                    'avatar' => $user->avatar,
                    'division' => $user->division,
                    'section' => $user->section,
                    'role' => $user->role ?: 'Grants Staff',
                    'is_admin' => $user->isAdmin(),
                    'is_approved' => $user->isApprovedAccount(),
                    'approval_status' => $user->approval_status ?: ($user->isApprovedAccount() ? 'approved' : 'pending'),
                    'permissions' => $user->effectivePermissions(),
                ] : null,
            ],
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
