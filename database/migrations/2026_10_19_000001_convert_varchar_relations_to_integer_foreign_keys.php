<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $requestTables = [
        'opening' => 'opening',
        'distribution' => 'distribution',
        'otc_withdrawal' => 'otc-withdrawal',
        'replacement' => 'replacement',
        'transfer_of_fund' => 'transfer-of-fund',
        'force_pin' => 'force-pin',
        'locking' => 'locking',
        'lifting' => 'lifting',
    ];

    public function up(): void
    {
        // 1. Build lookup maps from live database
        $usersByName = [];
        $usersByEmail = [];
        $usersByUsername = [];

        if (Schema::hasTable('users')) {
            foreach (DB::table('users')->select('id', 'name', 'email', 'username')->get() as $u) {
                $id = (int) $u->id;
                if ($u->name) {
                    $usersByName[mb_strtolower(trim($u->name))] = $id;
                }
                if ($u->email) {
                    $usersByEmail[mb_strtolower(trim($u->email))] = $id;
                }
                if ($u->username) {
                    $usersByUsername[mb_strtolower(trim($u->username))] = $id;
                }
            }
        }

        $defaultAdminId = $usersByName[mb_strtolower('Reymark N. Valdehueza')]
            ?? (int) (DB::table('users')->orderBy('id')->value('id') ?: 1);

        $resolveUserId = function ($rawValue) use ($usersByName, $usersByEmail, $usersByUsername, $defaultAdminId): ?int {
            if ($rawValue === null) {
                return null;
            }
            $str = trim((string) $rawValue);
            if ($str === '') {
                return null;
            }
            if (ctype_digit($str)) {
                $intVal = (int) $str;
                if (DB::table('users')->where('id', $intVal)->exists()) {
                    return $intVal;
                }
            }
            $lower = mb_strtolower($str);
            if (isset($usersByName[$lower])) {
                return $usersByName[$lower];
            }
            if (isset($usersByEmail[$lower])) {
                return $usersByEmail[$lower];
            }
            if (isset($usersByUsername[$lower])) {
                return $usersByUsername[$lower];
            }
            if (in_array($lower, ['authorized user', 'system initialization', 'system', 'admin', 'administrator'], true)) {
                return $defaultAdminId;
            }
            // Partial match fallback
            foreach ($usersByName as $nameLower => $uid) {
                if (str_contains($nameLower, $lower) || str_contains($lower, $nameLower)) {
                    return $uid;
                }
            }

            return $defaultAdminId;
        };

        // 2. Update `users` table: `role_id` -> `roles_permissions.id` and `approved_by` -> `users.id`
        if (Schema::hasTable('users')) {
            if (!Schema::hasColumn('users', 'role_id')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->unsignedBigInteger('role_id')->nullable()->after('portal_status');
                });
            }

            if (Schema::hasTable('roles_permissions')) {
                $rolesByName = [];
                $rolesBySlug = [];
                foreach (DB::table('roles_permissions')->select('id', 'name', 'slug')->get() as $r) {
                    $rolesByName[mb_strtolower(trim($r->name))] = (int) $r->id;
                    $rolesBySlug[mb_strtolower(trim($r->slug))] = (int) $r->id;
                }
                $defaultRoleId = $rolesBySlug['grants-staff'] ?? $rolesByName['grants staff'] ?? null;

                foreach (DB::table('users')->select('id', 'role', 'role_id')->get() as $u) {
                    $roleLower = mb_strtolower(trim((string) ($u->role ?? '')));
                    $matchedRoleId = $rolesByName[$roleLower] ?? $rolesBySlug[$roleLower] ?? $defaultRoleId;
                    if ($matchedRoleId !== null) {
                        DB::table('users')->where('id', $u->id)->update(['role_id' => $matchedRoleId]);
                    }
                }

                $this->addForeignKeyIfMissing('users', 'role_id', 'roles_permissions', 'id');
            }

            if (Schema::hasColumn('users', 'approved_by')) {
                foreach (DB::table('users')->select('id', 'approved_by')->get() as $u) {
                    $resolvedApprover = $resolveUserId($u->approved_by);
                    DB::table('users')->where('id', $u->id)->update([
                        'approved_by' => $resolvedApprover !== null ? (string) $resolvedApprover : null,
                    ]);
                }

                $this->dropForeignKeyIfExists('users', 'approved_by');
                DB::statement('ALTER TABLE `users` MODIFY `approved_by` BIGINT UNSIGNED NULL');
                $this->addForeignKeyIfMissing('users', 'approved_by', 'users', 'id');
            }
        }

        // 3. Update `household_requests`: `request_id` -> `request.id` and `created_by` -> `users.id`
        if (Schema::hasTable('household_requests')) {
            if (!Schema::hasColumn('household_requests', 'request_id')) {
                Schema::table('household_requests', function (Blueprint $table) {
                    $table->unsignedBigInteger('request_id')->nullable()->after('hh_id');
                });
            }

            if (Schema::hasTable('request')) {
                $requestMap = [];
                foreach (DB::table('request')->select('id', 'name')->get() as $reqRow) {
                    $requestMap[mb_strtolower(trim($reqRow->name))] = (int) $reqRow->id;
                }

                foreach ($requestMap as $reqName => $reqId) {
                    DB::table('household_requests')
                        ->whereRaw('LOWER(TRIM(request_name)) = ?', [$reqName])
                        ->update(['request_id' => $reqId]);
                }

                $this->addForeignKeyIfMissing('household_requests', 'request_id', 'request', 'id');
            }

            if (Schema::hasColumn('household_requests', 'created_by')) {
                $distinctCreators = DB::table('household_requests')
                    ->select('created_by')
                    ->whereNotNull('created_by')
                    ->distinct()
                    ->pluck('created_by');

                foreach ($distinctCreators as $rawCreator) {
                    $uid = $resolveUserId($rawCreator);
                    DB::table('household_requests')
                        ->where('created_by', $rawCreator)
                        ->update(['created_by' => $uid !== null ? (string) $uid : null]);
                }

                $this->dropForeignKeyIfExists('household_requests', 'created_by');
                DB::statement('ALTER TABLE `household_requests` MODIFY `created_by` BIGINT UNSIGNED NULL');
                $this->addForeignKeyIfMissing('household_requests', 'created_by', 'users', 'id');
            }
        }

        // 4. Update all 8 Request module tables: `household_request_id` -> `household_requests.id` and `created_by` -> `users.id`
        foreach ($this->requestTables as $tableName => $requestSlug) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            if (!Schema::hasColumn($tableName, 'household_request_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->unsignedBigInteger('household_request_id')->nullable()->after('id');
                });
            }

            if (Schema::hasTable('household_requests')) {
                // Match each request table row to its corresponding household_requests row by hh_id + request_name
                $hhReqRows = DB::table('household_requests')
                    ->select('id', 'hh_id')
                    ->where('request_name', $requestSlug)
                    ->orderBy('id')
                    ->get();

                $hhMap = [];
                foreach ($hhReqRows as $hr) {
                    $hhMap[trim((string) $hr->hh_id)] = (int) $hr->id;
                }

                $hhCol = Schema::hasColumn($tableName, 'household_id_number') ? 'household_id_number' : 'hh_id';
                foreach (DB::table($tableName)->select('id', $hhCol, 'household_request_id')->get() as $row) {
                    if ($row->household_request_id) {
                        continue;
                    }
                    $hhKey = trim((string) ($row->{$hhCol} ?? ''));
                    if (isset($hhMap[$hhKey])) {
                        DB::table($tableName)->where('id', $row->id)->update([
                            'household_request_id' => $hhMap[$hhKey],
                        ]);
                    }
                }

                $this->addForeignKeyIfMissing($tableName, 'household_request_id', 'household_requests', 'id');
            }

            if (Schema::hasColumn($tableName, 'created_by')) {
                $distinctCreators = DB::table($tableName)
                    ->select('created_by')
                    ->whereNotNull('created_by')
                    ->distinct()
                    ->pluck('created_by');

                foreach ($distinctCreators as $rawCreator) {
                    $uid = $resolveUserId($rawCreator);
                    DB::table($tableName)
                        ->where('created_by', $rawCreator)
                        ->update(['created_by' => $uid !== null ? (string) $uid : null]);
                }

                $this->dropForeignKeyIfExists($tableName, 'created_by');
                DB::statement("ALTER TABLE `{$tableName}` MODIFY `created_by` BIGINT UNSIGNED NULL");
                $this->addForeignKeyIfMissing($tableName, 'created_by', 'users', 'id');
            }
        }

        // 5. Update `audit_trail`: add foreign key on `user_id` -> `users.id`
        if (Schema::hasTable('audit_trail') && Schema::hasColumn('audit_trail', 'user_id')) {
            DB::statement('UPDATE `audit_trail` SET `user_id` = NULL WHERE `user_id` IS NOT NULL AND `user_id` NOT IN (SELECT `id` FROM `users`)');
            $this->dropForeignKeyIfExists('audit_trail', 'user_id');
            DB::statement('ALTER TABLE `audit_trail` MODIFY `user_id` BIGINT UNSIGNED NULL');
            $this->addForeignKeyIfMissing('audit_trail', 'user_id', 'users', 'id');
        }

        // 6. Update `lbp_covered_municipalities`: add `lbp_branch_id` -> `lbp_branch_directories.id`
        if (Schema::hasTable('lbp_covered_municipalities') && Schema::hasTable('lbp_branch_directories')) {
            if (!Schema::hasColumn('lbp_covered_municipalities', 'lbp_branch_id')) {
                Schema::table('lbp_covered_municipalities', function (Blueprint $table) {
                    $table->unsignedBigInteger('lbp_branch_id')->nullable()->after('municipality');
                });
            }

            $branchMap = [];
            foreach (DB::table('lbp_branch_directories')->select('id', 'branch')->get() as $b) {
                $branchMap[mb_strtolower(trim($b->branch))] = (int) $b->id;
            }

            foreach (DB::table('lbp_covered_municipalities')->select('id', 'covered_lbp_branch')->get() as $m) {
                $branchLower = mb_strtolower(trim((string) $m->covered_lbp_branch));
                $branchId = $branchMap[$branchLower] ?? null;

                // Known alias: 'Surigao - San Nicolas' -> 'Surigao - Luna'
                if ($branchId === null && str_contains($branchLower, 'surigao')) {
                    $branchId = $branchMap[mb_strtolower('Surigao - Luna')] ?? null;
                }

                if ($branchId !== null) {
                    DB::table('lbp_covered_municipalities')->where('id', $m->id)->update([
                        'lbp_branch_id' => $branchId,
                    ]);
                }
            }

            $this->addForeignKeyIfMissing('lbp_covered_municipalities', 'lbp_branch_id', 'lbp_branch_directories', 'id');
        }

        // 7. Update Import tables (`emv_imports`, `grantee_imports`, `payroll_imports`): add `created_by` -> `users.id`
        foreach (['emv_imports', 'grantee_imports', 'payroll_imports'] as $importTable) {
            if (!Schema::hasTable($importTable)) {
                continue;
            }
            if (!Schema::hasColumn($importTable, 'created_by')) {
                Schema::table($importTable, function (Blueprint $table) {
                    $table->unsignedBigInteger('created_by')->nullable()->after('status');
                });
                DB::table($importTable)->whereNull('created_by')->update(['created_by' => $defaultAdminId]);
            } else {
                foreach (DB::table($importTable)->select('id', 'created_by')->get() as $imp) {
                    $uid = $resolveUserId($imp->created_by) ?? $defaultAdminId;
                    DB::table($importTable)->where('id', $imp->id)->update(['created_by' => $uid]);
                }
                $this->dropForeignKeyIfExists($importTable, 'created_by');
                DB::statement("ALTER TABLE `{$importTable}` MODIFY `created_by` BIGINT UNSIGNED NULL");
            }

            $this->addForeignKeyIfMissing($importTable, 'created_by', 'users', 'id');
        }
    }

    public function down(): void
    {
        // Reverse foreign keys safely if rolled back
        foreach (array_keys($this->requestTables) as $tableName) {
            if (Schema::hasTable($tableName)) {
                $this->dropForeignKeyIfExists($tableName, 'created_by');
                $this->dropForeignKeyIfExists($tableName, 'household_request_id');
            }
        }
        $this->dropForeignKeyIfExists('household_requests', 'created_by');
        $this->dropForeignKeyIfExists('household_requests', 'request_id');
        $this->dropForeignKeyIfExists('users', 'role_id');
        $this->dropForeignKeyIfExists('users', 'approved_by');
        $this->dropForeignKeyIfExists('audit_trail', 'user_id');
        $this->dropForeignKeyIfExists('lbp_covered_municipalities', 'lbp_branch_id');
        foreach (['emv_imports', 'grantee_imports', 'payroll_imports'] as $importTable) {
            $this->dropForeignKeyIfExists($importTable, 'created_by');
        }
    }

    private function addForeignKeyIfMissing(string $table, string $column, string $refTable, string $refColumn): void
    {
        $dbName = DB::getDatabaseName();
        $exists = DB::selectOne("
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME = ?
              AND COLUMN_NAME = ?
              AND REFERENCED_TABLE_NAME = ?
            LIMIT 1
        ", [$dbName, $table, $column, $refTable]);

        if ($exists) {
            return;
        }

        $fkName = substr("fk_{$table}_{$column}", 0, 60);
        DB::statement("
            ALTER TABLE `{$table}`
            ADD CONSTRAINT `{$fkName}`
            FOREIGN KEY (`{$column}`) REFERENCES `{$refTable}`(`{$refColumn}`)
            ON DELETE SET NULL
            ON UPDATE CASCADE
        ");
    }

    private function dropForeignKeyIfExists(string $table, string $column): void
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) {
            return;
        }
        $dbName = DB::getDatabaseName();
        $fks = DB::select("
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME = ?
              AND COLUMN_NAME = ?
              AND REFERENCED_TABLE_NAME IS NOT NULL
        ", [$dbName, $table, $column]);

        foreach ($fks as $fk) {
            DB::statement("ALTER TABLE `{$table}` DROP FOREIGN KEY `{$fk->CONSTRAINT_NAME}`");
        }
    }
};
