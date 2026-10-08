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
        if (! Schema::hasTable('payroll_database')) {
            Schema::create('payroll_database', function (Blueprint $table) {
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

        if (! Schema::hasTable('payroll_imports')) {
            Schema::create('payroll_imports', function (Blueprint $table) {
                $table->id();
                $table->string('filename');
                $table->string('file_path');
                $table->unsignedBigInteger('file_size')->default(0);
                $table->string('extension', 10)->default('xlsx');
                $table->string('status', 30)->default('pending')->index();
                $table->unsignedInteger('total_rows')->default(0);
                $table->unsignedInteger('processed_rows')->default(0);
                $table->unsignedInteger('imported_count')->default(0);
                $table->unsignedInteger('updated_count')->default(0);
                $table->float('percentage', 5, 2)->default(0.00);
                $table->text('error_message')->nullable();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_imports');
        Schema::dropIfExists('payroll_database');
    }
};

