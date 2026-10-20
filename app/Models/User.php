<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class User extends Model
{
    protected $fillable = [
        'sso_id',
        'employee_id',
        'id_number',
        'name',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'username',
        'contact_number',
        'mobile_no',
        'account_number',
        'position',
        'empstatus',
        'salary_rate',
        'salary_grade',
        'step_inc',
        'item_number',
        'project',
        'fundsource',
        'former_incumbent',
        'date_vacated',
        'division',
        'section',
        'area_of_assignment',
        'gender',
        'civil_status',
        'birthdate',
        'avatar',
        'portal_status',
        'role_id',
        'course',
        'address',
        'official_email',
        'is_solo_parent',
        'solo_parent_details',
        'is_senior_citizen',
        'is_pwd',
        'type_of_disability',
        'is_indigenous',
        'type_of_indigenous_group',
        'portal_profile',
        'mfa_enabled',
        'mfa_verified',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'role',
        'is_approved',
        'approval_status',
        'approved_at',
        'approved_by',
        'last_login_at',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    protected function casts(): array
    {
        return [
            'mfa_enabled' => 'boolean',
            'mfa_verified' => 'boolean',
            'salary_rate' => 'decimal:2',
            'salary_grade' => 'integer',
            'step_inc' => 'integer',
            'date_vacated' => 'date',
            'birthdate' => 'date',
            'is_solo_parent' => 'boolean',
            'is_senior_citizen' => 'boolean',
            'is_pwd' => 'boolean',
            'is_indigenous' => 'boolean',
            'portal_profile' => 'array',
            'access_token' => 'encrypted',
            'refresh_token' => 'encrypted',
            'token_expires_at' => 'datetime',
            'role_id' => 'integer',
            'is_approved' => 'boolean',
            'approved_at' => 'datetime',
            'approved_by' => 'integer',
            'last_login_at' => 'datetime',
        ];
    }

    public function rolePermission(): BelongsTo
    {
        return $this->belongsTo(RolePermission::class, 'role_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(self::class, 'approved_by');
    }

    /**
     * Resolve the integer `users.id` for the currently authenticated or SSO session user.
     */
    public static function resolveCurrentUserId(?Request $request = null): ?int
    {
        $authId = Auth::id();
        if ($authId && is_numeric($authId)) {
            return (int) $authId;
        }

        $request = $request ?? request();
        if ($request && $request->hasSession()) {
            $ssoUser = $request->session()->get('sso_user');
            if (is_array($ssoUser)) {
                if (! empty($ssoUser['local_user_id']) && is_numeric($ssoUser['local_user_id'])) {
                    return (int) $ssoUser['local_user_id'];
                }
                if (! empty($ssoUser['id'])) {
                    $foundBySso = static::query()->where('sso_id', (string) $ssoUser['id'])->value('id');
                    if ($foundBySso) {
                        return (int) $foundBySso;
                    }
                    if (is_numeric($ssoUser['id'])) {
                        $foundById = static::query()->where('id', (int) $ssoUser['id'])->value('id');
                        if ($foundById) {
                            return (int) $foundById;
                        }
                    }
                }
                if (! empty($ssoUser['email'])) {
                    $foundByEmail = static::query()->where('email', (string) $ssoUser['email'])->value('id');
                    if ($foundByEmail) {
                        return (int) $foundByEmail;
                    }
                }
                if (! empty($ssoUser['username'])) {
                    $foundByUsername = static::query()->where('username', (string) $ssoUser['username'])->value('id');
                    if ($foundByUsername) {
                        return (int) $foundByUsername;
                    }
                }
                if (! empty($ssoUser['name'])) {
                    $foundByName = static::query()->where('name', (string) $ssoUser['name'])->value('id');
                    if ($foundByName) {
                        return (int) $foundByName;
                    }
                }
            }
        }

        $fallbackId = static::query()->orderBy('id')->value('id');

        return $fallbackId ? (int) $fallbackId : null;
    }

    /**
     * Resolve a display name from a user ID or existing string name.
     */
    public static function resolveUserNameById($idOrName): string
    {
        if ($idOrName instanceof self) {
            return $idOrName->name ?: ($idOrName->email ?: 'Authorized User');
        }
        if ($idOrName === null || $idOrName === '') {
            return '—';
        }
        if (is_numeric($idOrName)) {
            $user = static::query()->select('id', 'name', 'email')->find((int) $idOrName);
            if ($user) {
                return $user->name ?: ($user->email ?: 'User #' . $user->id);
            }
        }

        return (string) $idOrName;
    }

    /**
     * Ensure role and approval columns exist on users table and seed initial Admin.
     */
    public static function ensureRoleAndApprovalColumnsExist(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        RolePermission::ensureTableExists();

        if (! Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('role_id')->nullable()->after('portal_status');
                $table->string('role', 100)->default('Grants Staff')->after('role_id');
                $table->boolean('is_approved')->default(false)->after('role');
                $table->string('approval_status', 40)->default('pending')->after('is_approved');
                $table->timestamp('approved_at')->nullable()->after('approval_status');
                $table->unsignedBigInteger('approved_by')->nullable()->after('approved_at');
            });

            $adminRoleId = RolePermission::query()->where('slug', 'admin')->value('id');
            $staffRoleId = RolePermission::query()->where('slug', 'grants-staff')->value('id');

            // Ensure the primary Admin (id = 1 / rnvaldehueza) is set as Admin and Approved
            $adminUser = static::query()
                ->where('id', 1)
                ->orWhere('username', 'rnvaldehueza')
                ->first() ?? static::query()->orderBy('id', 'asc')->first();

            if ($adminUser) {
                $adminUser->update([
                    'role_id' => $adminRoleId,
                    'role' => 'Admin',
                    'is_approved' => true,
                    'approval_status' => 'approved',
                    'approved_at' => now(),
                    'approved_by' => $adminUser->id,
                ]);
            }

            // Default all other users to Grants Staff and pending approval unless already approved
            static::query()
                ->where('id', '!=', $adminUser?->id ?? 0)
                ->update([
                    'role_id' => $staffRoleId,
                    'role' => 'Grants Staff',
                    'is_approved' => false,
                    'approval_status' => 'pending',
                ]);
        }

        if (! Schema::hasColumn('users', 'last_login_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('last_login_at')->nullable()->after('token_expires_at');
            });
        }
    }

    public function isAdmin(): bool
    {
        return strcasecmp(trim((string) $this->role), 'Admin') === 0;
    }

    public function isApprovedAccount(): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        return (bool) $this->is_approved && strtolower((string) $this->approval_status) === 'approved';
    }

    /**
     * @return array<string, bool>
     */
    public function effectivePermissions(): array
    {
        return RolePermission::resolvePermissionsForRole($this->role ?: 'Grants Staff');
    }

    public function hasPermission(string $permissionKey): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        $perms = $this->effectivePermissions();

        return ! empty($perms[$permissionKey]);
    }
}

