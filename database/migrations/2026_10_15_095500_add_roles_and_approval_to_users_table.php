<?php

use App\Models\RolePermission;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        User::ensureRoleAndApprovalColumnsExist();
        RolePermission::ensureTableExists();
    }

    public function down(): void
    {
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn(['role', 'is_approved', 'approval_status', 'approved_at', 'approved_by']);
            });
        }

        Schema::dropIfExists('roles_permissions');
    }
};

