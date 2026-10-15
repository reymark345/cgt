<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
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
            'is_approved' => 'boolean',
            'approved_at' => 'datetime',
        ];
    }

    /**
     * Ensure role and approval columns exist on users table and seed initial Admin.
     */
    public static function ensureRoleAndApprovalColumnsExist(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        if (! Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role', 100)->default('Grants Staff')->after('portal_status');
                $table->boolean('is_approved')->default(false)->after('role');
                $table->string('approval_status', 40)->default('pending')->after('is_approved');
                $table->timestamp('approved_at')->nullable()->after('approval_status');
                $table->string('approved_by', 150)->nullable()->after('approved_at');
            });

            // Ensure the primary Admin (id = 1 / rnvaldehueza) is set as Admin and Approved
            $adminUser = static::query()
                ->where('id', 1)
                ->orWhere('username', 'rnvaldehueza')
                ->first() ?? static::query()->orderBy('id', 'asc')->first();

            if ($adminUser) {
                $adminUser->update([
                    'role' => 'Admin',
                    'is_approved' => true,
                    'approval_status' => 'approved',
                    'approved_at' => now(),
                    'approved_by' => 'System Initialization',
                ]);
            }

            // Default all other users to Grants Staff and pending approval unless already approved
            static::query()
                ->where('id', '!=', $adminUser?->id ?? 0)
                ->update([
                    'role' => 'Grants Staff',
                    'is_approved' => false,
                    'approval_status' => 'pending',
                ]);
        }

        RolePermission::ensureTableExists();
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

