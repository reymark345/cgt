<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Rename payroll_database to payroll if it exists
        if (Schema::hasTable('payroll_database') && ! Schema::hasTable('payroll')) {
            Schema::rename('payroll_database', 'payroll');
        } elseif (! Schema::hasTable('payroll')) {
            // Fallback: create payroll table if neither exists
            Schema::create('payroll', function (Blueprint $table) {
                $table->id();
                $table->string('period')->nullable()->index();
                $table->string('year')->nullable()->index();
                $table->string('payroll_description')->nullable()->index();
                $table->string('region')->nullable();
                $table->string('province')->nullable();
                $table->string('municipality')->nullable()->index();
                $table->string('barangay')->nullable();
                $table->string('address_psgc')->nullable();
                $table->string('last_name')->nullable()->index();
                $table->string('first_name')->nullable();
                $table->string('middle_name')->nullable();
                $table->string('household_id')->nullable()->index();
                $table->string('payment_mode_classification')->nullable();
                $table->string('mode_of_payment')->nullable();
                $table->string('account_number')->nullable()->index();
                $table->string('payroll_date')->nullable();
                $table->string('finance_approval')->nullable();
                $table->decimal('educ_dc_elem', 12, 2)->default(0);
                $table->decimal('educ_jr_hs', 12, 2)->default(0);
                $table->decimal('educ_sr_hs', 12, 2)->default(0);
                $table->decimal('educ_total_hs', 12, 2)->default(0);
                $table->decimal('total_educ', 12, 2)->default(0);
                $table->decimal('health', 12, 2)->default(0);
                $table->decimal('rice_amount', 12, 2)->default(0);
                $table->decimal('f1kd_amount', 12, 2)->default(0);
                $table->decimal('gross_amount', 12, 2)->default(0);
                $table->decimal('adjustment_amount', 12, 2)->default(0);
                $table->decimal('net_amount', 12, 2)->default(0);
                $table->string('hh_set')->nullable()->index();
                $table->string('set_group')->nullable();
                $table->timestamps();
            });
        }

        // 2. Add new_account_number, status, and reason columns to payroll table
        Schema::table('payroll', function (Blueprint $table) {
            if (! Schema::hasColumn('payroll', 'new_account_number')) {
                $table->string('new_account_number')->nullable()->after('account_number')->index();
            }
            if (! Schema::hasColumn('payroll', 'status')) {
                $table->string('status', 50)->nullable()->after('new_account_number')->index();
            }
            if (! Schema::hasColumn('payroll', 'reason')) {
                $table->text('reason')->nullable()->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('payroll')) {
            Schema::table('payroll', function (Blueprint $table) {
                if (Schema::hasColumn('payroll', 'reason')) {
                    $table->dropColumn('reason');
                }
                if (Schema::hasColumn('payroll', 'status')) {
                    $table->dropColumn('status');
                }
                if (Schema::hasColumn('payroll', 'new_account_number')) {
                    $table->dropColumn('new_account_number');
                }
            });

            if (! Schema::hasTable('payroll_database')) {
                Schema::rename('payroll', 'payroll_database');
            }
        }
    }
};

