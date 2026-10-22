<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RolePermission extends Model
{
    protected $table = 'roles_permissions';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'badge_color',
        'is_system',
        'is_default',
        'permissions',
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
            'is_default' => 'boolean',
            'permissions' => 'array',
        ];
    }

    /**
     * Default permission keys and their metadata.
     *
     * @return array<string, array{label: string, description: string, category: string}>
     */
    public static function permissionDefinitions(): array
    {
        return [
            'access_dashboard' => [
                'label' => 'Overview & Dashboard',
                'description' => 'View executive KPIs, charts, and summary metrics on the Dashboard.',
                'category' => 'Core Modules',
            ],
            'access_inquiry' => [
                'label' => 'Household Inquiry & Transactions',
                'description' => 'Search beneficiaries by Household ID / Name and submit service requests.',
                'category' => 'Core Modules',
            ],
            'access_references' => [
                'label' => 'References (Grantee, EMV Database, Payroll)',
                'description' => 'View and search Grantee Masterlist, EMV Card Database, and Payroll records.',
                'category' => 'Core Modules',
            ],
            'access_requests' => [
                'label' => 'Request Modules (8 Service Trackers)',
                'description' => 'View and manage records under Opening, Distribution, OTC, Replacement, Transfer of Fund, Force PIN, Locking, and Lifting.',
                'category' => 'Request & Forms',
            ],
            'edit_print_forms' => [
                'label' => 'Edit Letter Details in Print Preview',
                'description' => 'Customize and edit official LBP endorsement letter details (header, addressee, signatory, and letter body messages) inside Request Print Preview.',
                'category' => 'Request & Forms',
            ],
            'access_libraries' => [
                'label' => 'Libraries Sidebar & Directory Management',
                'description' => 'View and update Libraries (LBP Branch Covered Municipality & LBP Branch Directory).',
                'category' => 'Administration',
            ],
            'access_system' => [
                'label' => 'System Administration (Users, Roles & Audit Trails)',
                'description' => 'Access System sidebar, manually approve/revoke user logins, assign roles & permissions, and inspect Audit Trails.',
                'category' => 'Administration',
            ],
        ];
    }

    /**
     * Ensure the roles_permissions table and user role/approval columns exist and are seeded.
     */
    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('roles_permissions')) {
            Schema::create('roles_permissions', function (Blueprint $table) {
                $table->id();
                $table->string('name', 100)->unique();
                $table->string('slug', 100)->unique();
                $table->text('description')->nullable();
                $table->string('badge_color', 40)->default('blue');
                $table->boolean('is_system')->default(false);
                $table->boolean('is_default')->default(false);
                $table->json('permissions')->nullable();
                $table->timestamps();
            });
        }

        if (static::query()->count() === 0) {
            static::seedDefaults();
        } else {
            // Automatically migrate legacy 'Grants Staff' role to 'Financial Analyst'
            $legacyRole = static::query()
                ->where('slug', 'grants-staff')
                ->orWhereRaw('LOWER(name) = ?', ['grants staff'])
                ->first();
            if ($legacyRole) {
                $legacyRole->update([
                    'name' => 'Financial Analyst',
                    'slug' => 'financial-analyst',
                ]);
            }
            if (Schema::hasTable('users') && Schema::hasColumn('users', 'role')) {
                \Illuminate\Support\Facades\DB::table('users')
                    ->whereRaw('LOWER(role) = ?', ['grants staff'])
                    ->update(['role' => 'Financial Analyst']);
            }
        }
    }

    /**
     * Seed the initial Admin and Financial Analyst roles.
     */
    public static function seedDefaults(): void
    {
        $defaults = [
            [
                'name' => 'Admin',
                'slug' => 'admin',
                'description' => 'Full system administrator. Has complete access to all modules, is the only role allowed to view/update Libraries and Edit Letter Details in Request Print Previews, and manually approves staff accounts for login.',
                'badge_color' => 'emerald',
                'is_system' => true,
                'is_default' => false,
                'permissions' => [
                    'access_dashboard' => true,
                    'access_inquiry' => true,
                    'access_references' => true,
                    'access_requests' => true,
                    'edit_print_forms' => true,
                    'access_libraries' => true,
                    'access_system' => true,
                ],
            ],
            [
                'name' => 'Financial Analyst',
                'slug' => 'financial-analyst',
                'description' => 'Default role assigned to staff users. Requires manual Admin approval before proceeding into the application. Allowed to view and print forms across all Request modules, but cannot Edit Letter Details in Print Preview, nor access System or Libraries.',
                'badge_color' => 'blue',
                'is_system' => true,
                'is_default' => true,
                'permissions' => [
                    'access_dashboard' => true,
                    'access_inquiry' => true,
                    'access_references' => true,
                    'access_requests' => true,
                    'edit_print_forms' => false,
                    'access_libraries' => false,
                    'access_system' => false,
                ],
            ],
        ];

        foreach ($defaults as $roleData) {
            static::query()->updateOrCreate(
                ['slug' => $roleData['slug']],
                $roleData
            );
        }
    }

    /**
     * Resolve effective permissions array for a given role name.
     *
     * @return array<string, bool>
     */
    public static function resolvePermissionsForRole(?string $roleName): array
    {
        static::ensureTableExists();

        $normalized = trim((string) $roleName);
        if (strcasecmp($normalized, 'Admin') === 0) {
            return [
                'access_dashboard' => true,
                'access_inquiry' => true,
                'access_references' => true,
                'access_requests' => true,
                'edit_print_forms' => true,
                'access_libraries' => true,
                'access_system' => true,
            ];
        }

        $role = static::query()
            ->whereRaw('LOWER(name) = ?', [strtolower($normalized)])
            ->orWhereRaw('LOWER(slug) = ?', [strtolower($normalized)])
            ->first();

        if ($role && is_array($role->permissions)) {
            return array_merge([
                'access_dashboard' => true,
                'access_inquiry' => true,
                'access_references' => true,
                'access_requests' => true,
                'edit_print_forms' => false,
                'access_libraries' => false,
                'access_system' => false,
            ], $role->permissions);
        }

        // Default Financial Analyst permissions
        return [
            'access_dashboard' => true,
            'access_inquiry' => true,
            'access_references' => true,
            'access_requests' => true,
            'edit_print_forms' => false,
            'access_libraries' => false,
            'access_system' => false,
        ];
    }
}

