<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('emv_database')) {
            Schema::create('emv_database', function (Blueprint $table) {
                $table->id();
                $table->string('item_no')->nullable()->index();
                $table->string('region')->nullable();
                $table->string('province')->nullable();
                $table->string('municipality')->nullable()->index();
                $table->string('barangay')->nullable();
                $table->string('hh_id')->nullable()->index();
                $table->string('lbp_account')->nullable()->index();
                $table->string('run_date')->nullable();
                $table->string('first_name')->nullable();
                $table->string('mid_name')->nullable();
                $table->string('last_name')->nullable()->index();
                $table->string('acct_description')->nullable();
                $table->string('cct_type')->nullable()->index();
                $table->string('lbp_servicing_branch')->nullable()->index();
                $table->string('distribution_status')->nullable()->index();
                $table->string('date_claimed')->nullable();
                $table->string('reason_why_unclaimed')->nullable();
                $table->string('recommended_action')->nullable();
                $table->string('action_taken')->nullable();
                $table->string('date_acted')->nullable();
                $table->string('agreed_distribution_date')->nullable();
                $table->timestamps();
            });

            return;
        }

        // Drop legacy indexes if they exist
        $legacyIndexes = [
            'emv_database_office_index',
            'emv_database_entryid_index',
            'emv_database_reference_index',
            'emv_database_status_index',
        ];

        foreach ($legacyIndexes as $idx) {
            try {
                DB::statement("ALTER TABLE emv_database DROP INDEX `{$idx}`");
            } catch (\Throwable $e) {
                // Ignore if not present
            }
        }

        // Legacy / duplicate columns to remove
        $legacyColumns = [
            'office',
            'purok',
            'address',
            'entryid',
            'lastname',
            'firstname',
            'middlename',
            'extensionname',
            'birthday',
            'age',
            'clientstatus',
            'member_status',
            'registrationstatus',
            'sex',
            'relationship_to_hh_head',
            'ipaffiliation',
            'hh_set',
            'group',
            'mothers_maiden',
            'date_of_enumeration',
            'lbp_account_number',
            'mode_of_payment',
            'date_tagged_hhstatus',
            'tagged_by',
            'date_registered',
            'reference',
            'type',
            'status',
            'supplier',
            'deliveryDate',
            'transactionDate',
            'amount',
            'inventoryType',
            'jevNo',
            'jevDate',
            'createdBy',
        ];

        $existingCols = Schema::getColumnListing('emv_database');
        $toDrop = array_intersect($legacyColumns, $existingCols);

        if (! empty($toDrop)) {
            $dropParts = array_map(fn ($col) => "DROP COLUMN `{$col}`", $toDrop);
            DB::statement('ALTER TABLE emv_database ' . implode(', ', $dropParts));
        }

        // Ensure all 21 columns exist
        $standardColumns = [
            'item_no', 'region', 'province', 'municipality', 'barangay',
            'hh_id', 'lbp_account', 'run_date', 'first_name', 'mid_name',
            'last_name', 'acct_description', 'cct_type', 'lbp_servicing_branch',
            'distribution_status', 'date_claimed', 'reason_why_unclaimed',
            'recommended_action', 'action_taken', 'date_acted', 'agreed_distribution_date',
        ];

        $currentCols = Schema::getColumnListing('emv_database');
        $missing = array_diff($standardColumns, $currentCols);

        if (! empty($missing)) {
            Schema::table('emv_database', function (Blueprint $table) use ($missing) {
                foreach ($missing as $col) {
                    $table->string($col)->nullable();
                }
            });
        }

        // Ensure key indexes exist
        $indexesToEnsure = [
            'hh_id',
            'lbp_account',
            'last_name',
            'municipality',
            'distribution_status',
            'cct_type',
            'lbp_servicing_branch',
        ];

        foreach ($indexesToEnsure as $col) {
            try {
                Schema::table('emv_database', function (Blueprint $table) use ($col) {
                    $table->index($col);
                });
            } catch (\Throwable $e) {
                // Index already exists
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op to preserve data integrity
    }
};

