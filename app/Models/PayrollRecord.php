<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class PayrollRecord extends Model
{
    protected $table = 'payroll';

    protected $guarded = ['id'];

    protected $casts = [
        'educ_dc_elem' => 'float',
        'educ_jr_hs' => 'float',
        'educ_sr_hs' => 'float',
        'educ_total_hs' => 'float',
        'total_educ' => 'float',
        'health' => 'float',
        'rice_amount' => 'float',
        'f1kd_amount' => 'float',
        'gross_amount' => 'float',
        'adjustment_amount' => 'float',
        'net_amount' => 'float',
    ];

    /**
     * The standard columns in Payroll database.
     */
    public const COLUMNS = [
        'period',
        'year',
        'payroll_description',
        'region',
        'province',
        'municipality',
        'barangay',
        'address_psgc',
        'last_name',
        'first_name',
        'middle_name',
        'household_id',
        'payment_mode_classification',
        'mode_of_payment',
        'account_number',
        'new_account_number',
        'status',
        'reason',
        'payroll_date',
        'finance_approval',
        'educ_dc_elem',
        'educ_jr_hs',
        'educ_sr_hs',
        'educ_total_hs',
        'total_educ',
        'health',
        'rice_amount',
        'f1kd_amount',
        'gross_amount',
        'adjustment_amount',
        'net_amount',
        'hh_set',
        'set_group',
    ];

    /**
     * Ensure the payroll table exists and has all required columns.
     */
    public static function ensureTableExists(): void
    {
        if (Schema::hasTable('payroll_database') && ! Schema::hasTable('payroll')) {
            Schema::rename('payroll_database', 'payroll');
        }

        if (! Schema::hasTable('payroll')) {
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
                $table->string('new_account_number')->nullable()->index();
                $table->string('status', 50)->nullable()->index();
                $table->text('reason')->nullable();
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
        } else {
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
    }
}

