<?php

namespace App\Http\Controllers;

use App\Models\RolePermission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RolePermissionController extends Controller
{
    /**
     * Render the Pending Admin Approval screen for unapproved staff accounts.
     */
    public function pendingApproval(Request $request): Response|RedirectResponse
    {
        User::ensureRoleAndApprovalColumnsExist();
        RolePermission::ensureTableExists();

        $user = $request->session()->get('sso_user_id')
            ? User::find($request->session()->get('sso_user_id'))
            : null;

        if (! $user) {
            return redirect()->route('login');
        }

        if ($user->isApprovedAccount()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('PendingApproval', [
            'account' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'position' => $user->position,
                'division' => $user->division,
                'section' => $user->section,
                'avatar' => $user->avatar,
                'role' => $user->role ?: 'Financial Analyst',
                'approvalStatus' => $user->approval_status ?: 'pending',
                'requestedAt' => optional($user->created_at)->format('M d, Y h:i A'),
            ],
        ]);
    }

    /**
     * Return all roles, permission catalog, and user accounts with approval/role status.
     */
    public function index(Request $request): JsonResponse
    {
        User::ensureRoleAndApprovalColumnsExist();
        RolePermission::ensureTableExists();

        $roles = RolePermission::query()
            ->orderByRaw("CASE WHEN slug = 'admin' THEN 0 WHEN slug IN ('financial-analyst', 'grants-staff') THEN 1 ELSE 2 END")
            ->orderBy('id')
            ->get()
            ->map(function (RolePermission $role) {
                $userCount = User::whereRaw('LOWER(role) = ?', [strtolower($role->name)])->count();

                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'roleName' => $role->name,
                    'roleKey' => $role->slug,
                    'description' => $role->description,
                    'permissions' => array_merge(
                        RolePermission::resolvePermissionsForRole($role->name),
                        is_array($role->permissions) ? $role->permissions : []
                    ),
                    'isSystem' => (bool) $role->is_system,
                    'userCount' => $userCount,
                    'updatedAt' => optional($role->updated_at)->format('M d, Y h:i A'),
                ];
            });

        $permissionCatalog = [];
        foreach (RolePermission::permissionDefinitions() as $key => $meta) {
            $permissionCatalog[] = [
                'key' => $key,
                'label' => $meta['label'],
                'category' => $meta['category'],
                'description' => $meta['description'],
            ];
        }

        $users = User::with(['approver:id,name', 'rolePermission:id,name,slug'])
            ->orderByRaw('CASE WHEN is_approved = 0 THEN 0 ELSE 1 END')
            ->orderBy('id')
            ->get()
            ->map(fn (User $user) => self::formatUser($user));

        return response()->json([
            'success' => true,
            'roles' => $roles,
            'permissionCatalog' => $permissionCatalog,
            'users' => $users,
        ]);
    }

    /**
     * Create a new role (for expanding Roles & Permissions).
     */
    public function storeRole(Request $request): JsonResponse
    {
        User::ensureRoleAndApprovalColumnsExist();
        RolePermission::ensureTableExists();

        $validated = $request->validate([
            'role_name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'permissions' => ['nullable', 'array'],
        ]);

        $roleName = trim($validated['role_name']);
        $roleKey = Str::slug($roleName);

        if ($roleKey === '') {
            return response()->json([
                'success' => false,
                'message' => 'Please provide a valid role name.',
            ], 422);
        }

        if (RolePermission::where('slug', $roleKey)->orWhereRaw('LOWER(name) = ?', [strtolower($roleName)])->exists()) {
            return response()->json([
                'success' => false,
                'message' => "A role named \"{$roleName}\" already exists.",
            ], 422);
        }

        $defaultPerms = [
            'access_dashboard' => true,
            'access_inquiry' => true,
            'access_references' => true,
            'access_requests' => true,
            'edit_print_forms' => false,
            'access_libraries' => false,
            'access_system' => false,
        ];

        $inputPerms = is_array($validated['permissions'] ?? null) ? $validated['permissions'] : [];
        $mergedPerms = [];
        foreach ($defaultPerms as $k => $v) {
            $mergedPerms[$k] = array_key_exists($k, $inputPerms) ? (bool) $inputPerms[$k] : $v;
        }

        $role = RolePermission::create([
            'name' => $roleName,
            'slug' => $roleKey,
            'description' => trim((string) ($validated['description'] ?? '')),
            'badge_color' => 'indigo',
            'permissions' => $mergedPerms,
            'is_system' => false,
            'is_default' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Role \"{$role->name}\" created successfully.",
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'roleName' => $role->name,
                'roleKey' => $role->slug,
                'description' => $role->description,
                'permissions' => $role->permissions,
                'isSystem' => (bool) $role->is_system,
                'userCount' => 0,
                'updatedAt' => optional($role->updated_at)->format('M d, Y h:i A'),
            ],
        ]);
    }

    /**
     * Update an existing role's permissions and description.
     */
    public function updateRole(Request $request, int $id): JsonResponse
    {
        User::ensureRoleAndApprovalColumnsExist();
        RolePermission::ensureTableExists();

        $role = RolePermission::findOrFail($id);

        $validated = $request->validate([
            'role_name' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'permissions' => ['required', 'array'],
        ]);

        $permissions = [];
        foreach (array_keys(RolePermission::permissionDefinitions()) as $key) {
            $permissions[$key] = ! empty($validated['permissions'][$key]);
        }

        // Ensure Admin role always keeps full access
        if ($role->slug === 'admin' || strtolower($role->name) === 'admin') {
            foreach ($permissions as $k => $_) {
                $permissions[$k] = true;
            }
        }

        $oldRoleName = $role->name;
        $newRoleName = $role->is_system
            ? $role->name
            : (trim((string) ($validated['role_name'] ?? $role->name)) ?: $role->name);

        $role->update([
            'name' => $newRoleName,
            'description' => isset($validated['description']) ? trim((string) $validated['description']) : $role->description,
            'permissions' => $permissions,
        ]);

        if ($oldRoleName !== $newRoleName) {
            User::where('role', $oldRoleName)->orWhere('role_id', $role->id)->update([
                'role' => $newRoleName,
                'role_id' => $role->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Permissions for \"{$role->name}\" updated successfully.",
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'roleName' => $role->name,
                'roleKey' => $role->slug,
                'description' => $role->description,
                'permissions' => $role->permissions,
                'isSystem' => (bool) $role->is_system,
                'userCount' => User::whereRaw('LOWER(role) = ?', [strtolower($role->name)])->count(),
                'updatedAt' => optional($role->updated_at)->format('M d, Y h:i A'),
            ],
        ]);
    }

    /**
     * Approve or set pending/revoke a user's login access and optionally assign their role.
     */
    public function approveUser(Request $request, int $id): JsonResponse
    {
        User::ensureRoleAndApprovalColumnsExist();
        RolePermission::ensureTableExists();

        $targetUser = User::findOrFail($id);
        $adminUserId = $request->session()->get('sso_user_id')
            ? (int) $request->session()->get('sso_user_id')
            : User::resolveCurrentUserId($request);
        $adminUser = $adminUserId ? User::find($adminUserId) : null;

        $validated = $request->validate([
            'approved' => ['nullable', 'boolean'],
            'action' => ['nullable', 'string', 'in:approve,reject,pending,revoke'],
            'role' => ['nullable', 'string', 'max:100'],
        ]);

        if (array_key_exists('approved', $validated) && $validated['approved'] !== null) {
            $approved = (bool) $validated['approved'];
        } else {
            $approved = strtolower((string) ($validated['action'] ?? '')) === 'approve';
        }

        // Prevent locking out the primary Admin or current Admin user
        if (! $approved && ($targetUser->id === 1 || ($adminUser && $targetUser->id === $adminUser->id))) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot revoke approval for the primary Administrator account.',
            ], 422);
        }

        $roleName = ! empty($validated['role'])
            ? trim($validated['role'])
            : ($targetUser->role ?: 'Financial Analyst');

        $roleModel = RolePermission::whereRaw('LOWER(name) = ?', [strtolower($roleName)])
            ->orWhere('slug', Str::slug($roleName))
            ->first();

        $targetUser->update([
            'role_id' => $roleModel?->id ?? $targetUser->role_id,
            'role' => $roleModel?->name ?? $roleName,
            'is_approved' => $approved,
            'approval_status' => $approved ? 'approved' : 'pending',
            'approved_at' => $approved ? now() : null,
            'approved_by' => $approved ? ($adminUser?->id ?? 1) : null,
        ]);

        $statusLabel = $approved ? 'approved for login' : 'set to pending approval';

        return response()->json([
            'success' => true,
            'message' => "{$targetUser->name} has been {$statusLabel} ({$targetUser->role}).",
            'user' => self::formatUser($targetUser->fresh(['approver:id,name', 'rolePermission:id,name,slug'])),
        ]);
    }

    /**
     * Update a user's assigned role (e.g. Admin or Financial Analyst).
     */
    public function updateUserRole(Request $request, int $id): JsonResponse
    {
        User::ensureRoleAndApprovalColumnsExist();
        RolePermission::ensureTableExists();

        $targetUser = User::findOrFail($id);
        $adminUserId = $request->session()->get('sso_user_id')
            ? (int) $request->session()->get('sso_user_id')
            : User::resolveCurrentUserId($request);
        $adminUser = $adminUserId ? User::find($adminUserId) : null;

        $validated = $request->validate([
            'role' => ['required', 'string', 'max:100'],
        ]);

        $newRole = trim($validated['role']);

        // Prevent demoting primary Admin (id = 1) or self from Admin
        if (
            strtolower($newRole) !== 'admin'
            && ($targetUser->id === 1 || ($adminUser && $targetUser->id === $adminUser->id))
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot remove Admin role from your own or the primary Administrator account.',
            ], 422);
        }

        // If promoted to Admin, automatically approve login as well
        $isPromotedToAdmin = strtolower($newRole) === 'admin';
        $roleModel = RolePermission::whereRaw('LOWER(name) = ?', [strtolower($newRole)])
            ->orWhere('slug', Str::slug($newRole))
            ->first();

        $targetUser->update([
            'role_id' => $roleModel?->id ?? $targetUser->role_id,
            'role' => $roleModel?->name ?? $newRole,
            'is_approved' => $isPromotedToAdmin ? true : $targetUser->is_approved,
            'approval_status' => $isPromotedToAdmin ? 'approved' : $targetUser->approval_status,
            'approved_at' => ($isPromotedToAdmin && ! $targetUser->approved_at) ? now() : $targetUser->approved_at,
            'approved_by' => ($isPromotedToAdmin && ! $targetUser->approved_by) ? ($adminUser?->id ?? 1) : $targetUser->approved_by,
        ]);

        return response()->json([
            'success' => true,
            'message' => "{$targetUser->name}'s role has been updated to {$targetUser->role}.",
            'user' => self::formatUser($targetUser->fresh(['approver:id,name', 'rolePermission:id,name,slug'])),
        ]);
    }

    /**
     * Format User model for frontend consumption.
     *
     * @return array<string, mixed>
     */
    public static function formatUser(User $user): array
    {
        $isApproved = $user->isApprovedAccount();
        $approvedByName = $user->relationLoaded('approver') && $user->approver
            ? $user->approver->name
            : ($user->approved_by ? User::resolveUserNameById($user->approved_by) : null);

        return [
            'id' => $user->id,
            'employeeId' => $user->employee_id,
            'idNumber' => $user->id_number,
            'name' => $user->name,
            'email' => $user->email,
            'username' => $user->username,
            'avatar' => $user->avatar,
            'position' => $user->position,
            'employmentStatus' => $user->empstatus,
            'portalStatus' => $user->portal_status,
            'division' => $user->division,
            'section' => $user->section,
            'areaOfAssignment' => $user->area_of_assignment,
            'contactNumber' => $user->contact_number,
            'roleId' => $user->role_id,
            'role' => $user->role ?: 'Financial Analyst',
            'isApproved' => $isApproved,
            'approvalStatus' => $user->approval_status ?: ($isApproved ? 'approved' : 'pending'),
            'approvedAt' => optional($user->approved_at)->format('M d, Y h:i A'),
            'approvedBy' => $approvedByName,
            'approvedById' => $user->approved_by,
            'lastLogin' => optional($user->last_login_at ?? $user->updated_at)->format('M d, Y h:i A'),
        ];
    }
}

