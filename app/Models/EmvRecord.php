<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class EmvRecord extends Model
{
    protected $table = 'emv_database';

    protected $guarded = ['id'];

    /**
     * The 21 standard columns of the reconstructed EMV database schema.
     */
    public const COLUMNS = [
        'item_no',
        'region',
        'province',
        'municipality',
        'barangay',
        'hh_id',
        'lbp_account',
        'run_date',
        'first_name',
        'mid_name',
        'last_name',
        'acct_description',
        'cct_type',
        'lbp_servicing_branch',
        'distribution_status',
        'date_claimed',
        'reason_why_unclaimed',
        'recommended_action',
        'action_taken',
        'date_acted',
        'agreed_distribution_date',
    ];

    /**
     * Ensure the emv_database table exists with all 21 columns and proper indexes.
     */
    public static function ensureTableExists(): void
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
        } else {
            // Drop legacy columns if present
            $legacyColumns = [
                'office', 'purok', 'address', 'entryid', 'lastname', 'firstname',
                'middlename', 'extensionname', 'birthday', 'age', 'clientstatus',
                'member_status', 'registrationstatus', 'sex', 'relationship_to_hh_head',
                'ipaffiliation', 'hh_set', 'group', 'mothers_maiden', 'date_of_enumeration',
                'lbp_account_number', 'mode_of_payment', 'date_tagged_hhstatus',
                'tagged_by', 'date_registered', 'reference', 'type', 'status',
                'supplier', 'deliveryDate', 'transactionDate', 'amount', 'inventoryType',
                'jevNo', 'jevDate', 'createdBy',
            ];
            $existingColumns = Schema::getColumnListing('emv_database');
            $legacyPresent = array_intersect($legacyColumns, $existingColumns);
            if (! empty($legacyPresent)) {
                $legacyIndexes = [
                    'emv_database_office_index',
                    'emv_database_entryid_index',
                    'emv_database_reference_index',
                    'emv_database_status_index',
                ];
                foreach ($legacyIndexes as $idx) {
                    try {
                        \Illuminate\Support\Facades\DB::statement("ALTER TABLE emv_database DROP INDEX `{$idx}`");
                    } catch (\Throwable $e) {}
                }
                Schema::table('emv_database', function (Blueprint $table) use ($legacyPresent) {
                    $table->dropColumn($legacyPresent);
                });
                $existingColumns = Schema::getColumnListing('emv_database');
            }

            // Ensure any missing columns are added automatically
            $missing = array_diff(self::COLUMNS, $existingColumns);

            if (! empty($missing)) {
                Schema::table('emv_database', function (Blueprint $table) use ($missing) {
                    foreach ($missing as $col) {
                        $table->string($col)->nullable();
                    }
                });
            }

            // Ensure key indexes exist for lightning-fast queries
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
    }

    /**
     * Pre-seed the 12 CARAGA sample rows if they are not already present.
     */
    public static function ensureSampleDataSeeded(): void
    {
        $hasSampleData = self::where('hh_id', 'HHID160202004-1516-00001')->exists();
        if ($hasSampleData) {
            return;
        }

        $now = now()->toDateTimeString();

        $samples = [
            [
                'item_no' => '1',
                'region' => 'CARAGA',
                'province' => 'AGUSAN DEL NORTE',
                'municipality' => 'BUTUAN CITY (Capital)',
                'barangay' => 'AMBAGO',
                'hh_id' => 'HHID160202004-1516-00001',
                'lbp_account' => 'EMV6031310003600051203',
                'run_date' => '04/17/2018',
                'first_name' => 'CARLITA',
                'mid_name' => 'AGAGDAG',
                'last_name' => 'ABRAHAM',
                'acct_description' => 'RECARDING/3',
                'cct_type' => 'RCCT/1',
                'lbp_servicing_branch' => 'BUTUAN/0036',
                'distribution_status' => 'Claimed/1',
                'date_claimed' => '05/05/2018',
                'reason_why_unclaimed' => null,
                'recommended_action' => null,
                'action_taken' => null,
                'date_acted' => null,
                'agreed_distribution_date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'item_no' => '2',
                'region' => 'CARAGA',
                'province' => 'AGUSAN DEL NORTE',
                'municipality' => 'BUTUAN CITY (Capital)',
                'barangay' => 'AMBAGO',
                'hh_id' => 'HHID160202004-7091-00003',
                'lbp_account' => 'EMV6031310003600051211',
                'run_date' => '04/17/2018',
                'first_name' => 'ENECITA',
                'mid_name' => 'BINIGAY',
                'last_name' => 'ABRAHAM',
                'acct_description' => 'RECARDING/3',
                'cct_type' => 'RCCT/1',
                'lbp_servicing_branch' => 'BUTUAN/0036',
                'distribution_status' => 'Claimed/1',
                'date_claimed' => '05/05/2018',
                'reason_why_unclaimed' => null,
                'recommended_action' => null,
                'action_taken' => null,
                'date_acted' => null,
                'agreed_distribution_date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'item_no' => '3',
                'region' => 'CARAGA',
                'province' => 'AGUSAN DEL NORTE',
                'municipality' => 'BUTUAN CITY (Capital)',
                'barangay' => 'AMBAGO',
                'hh_id' => 'HHID160202004-0150-00004',
                'lbp_account' => 'EMV6031310003600051229',
                'run_date' => '04/17/2018',
                'first_name' => 'ARLYN',
                'mid_name' => 'PINTAC',
                'last_name' => 'ABUNDO',
                'acct_description' => 'RECARDING/3',
                'cct_type' => 'RCCT/1',
                'lbp_servicing_branch' => 'BUTUAN/0036',
                'distribution_status' => 'Claimed/1',
                'date_claimed' => '05/05/2018',
                'reason_why_unclaimed' => null,
                'recommended_action' => null,
                'action_taken' => null,
                'date_acted' => null,
                'agreed_distribution_date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'item_no' => '4',
                'region' => 'CARAGA',
                'province' => 'AGUSAN DEL NORTE',
                'municipality' => 'BUTUAN CITY (Capital)',
                'barangay' => 'AMBAGO',
                'hh_id' => 'HHID160202004-0123-00048',
                'lbp_account' => 'EMV6031310003600051237',
                'run_date' => '04/17/2018',
                'first_name' => 'JULIET',
                'mid_name' => 'FLORES',
                'last_name' => 'ABUNDO',
                'acct_description' => 'RECARDING/3',
                'cct_type' => 'RCCT/1',
                'lbp_servicing_branch' => 'BUTUAN/0036',
                'distribution_status' => 'Claimed/1',
                'date_claimed' => '05/05/2018',
                'reason_why_unclaimed' => null,
                'recommended_action' => null,
                'action_taken' => null,
                'date_acted' => null,
                'agreed_distribution_date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'item_no' => '5',
                'region' => 'CARAGA',
                'province' => 'AGUSAN DEL NORTE',
                'municipality' => 'BUTUAN CITY (Capital)',
                'barangay' => 'AMBAGO',
                'hh_id' => 'HHID160202004-0239-00093',
                'lbp_account' => 'EMV6031310003600051245',
                'run_date' => '04/17/2018',
                'first_name' => 'ELENA',
                'mid_name' => 'LADAO',
                'last_name' => 'ADAN',
                'acct_description' => 'RECARDING/3',
                'cct_type' => 'RCCT/1',
                'lbp_servicing_branch' => 'BUTUAN/0036',
                'distribution_status' => 'Claimed/1',
                'date_claimed' => '05/05/2018',
                'reason_why_unclaimed' => null,
                'recommended_action' => null,
                'action_taken' => null,
                'date_acted' => null,
                'agreed_distribution_date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'item_no' => '6',
                'region' => 'CARAGA',
                'province' => 'AGUSAN DEL NORTE',
                'municipality' => 'BUTUAN CITY (Capital)',
                'barangay' => 'AMBAGO',
                'hh_id' => 'HHID160202004-0239-00027',
                'lbp_account' => 'EMV6031310003600051252',
                'run_date' => '04/17/2018',
                'first_name' => 'MARIO',
                'mid_name' => 'LABADAN',
                'last_name' => 'AGAGDANG',
                'acct_description' => 'RECARDING/3',
                'cct_type' => 'RCCT/1',
                'lbp_servicing_branch' => 'BUTUAN/0036',
                'distribution_status' => 'Claimed/1',
                'date_claimed' => '05/05/2018',
                'reason_why_unclaimed' => null,
                'recommended_action' => null,
                'action_taken' => null,
                'date_acted' => null,
                'agreed_distribution_date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'item_no' => '7',
                'region' => 'CARAGA',
                'province' => 'AGUSAN DEL NORTE',
                'municipality' => 'BUTUAN CITY (Capital)',
                'barangay' => 'AMBAGO',
                'hh_id' => 'HHID160202004-0150-00105',
                'lbp_account' => 'EMV6031310003600051278',
                'run_date' => '04/17/2018',
                'first_name' => 'ALMA',
                'mid_name' => 'GONZALES',
                'last_name' => 'AGUILLON',
                'acct_description' => 'RECARDING/3',
                'cct_type' => 'RCCT/1',
                'lbp_servicing_branch' => 'BUTUAN/0036',
                'distribution_status' => 'Claimed/1',
                'date_claimed' => '05/05/2018',
                'reason_why_unclaimed' => null,
                'recommended_action' => null,
                'action_taken' => null,
                'date_acted' => null,
                'agreed_distribution_date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'item_no' => '8',
                'region' => 'CARAGA',
                'province' => 'AGUSAN DEL NORTE',
                'municipality' => 'BUTUAN CITY (Capital)',
                'barangay' => 'AMBAGO',
                'hh_id' => 'HHID160202004-0127-00022',
                'lbp_account' => 'EMV6031310003600051286',
                'run_date' => '04/17/2018',
                'first_name' => 'EUFRACIA',
                'mid_name' => 'DAGANI',
                'last_name' => 'ALBARECO',
                'acct_description' => 'RECARDING/3',
                'cct_type' => 'RCCT/1',
                'lbp_servicing_branch' => 'BUTUAN/0036',
                'distribution_status' => 'Claimed/1',
                'date_claimed' => '05/05/2018',
                'reason_why_unclaimed' => null,
                'recommended_action' => null,
                'action_taken' => null,
                'date_acted' => null,
                'agreed_distribution_date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'item_no' => '9',
                'region' => 'CARAGA',
                'province' => 'AGUSAN DEL NORTE',
                'municipality' => 'BUTUAN CITY (Capital)',
                'barangay' => 'AMBAGO',
                'hh_id' => 'HHID160202004-0581-00023',
                'lbp_account' => 'EMV6031310003600051294',
                'run_date' => '04/17/2018',
                'first_name' => 'LUZ',
                'mid_name' => 'JAMEL',
                'last_name' => 'ALBURO',
                'acct_description' => 'RECARDING/3',
                'cct_type' => 'RCCT/1',
                'lbp_servicing_branch' => 'BUTUAN/0036',
                'distribution_status' => 'Claimed/1',
                'date_claimed' => '05/05/2018',
                'reason_why_unclaimed' => null,
                'recommended_action' => null,
                'action_taken' => null,
                'date_acted' => null,
                'agreed_distribution_date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'item_no' => '10',
                'region' => 'CARAGA',
                'province' => 'AGUSAN DEL NORTE',
                'municipality' => 'BUTUAN CITY (Capital)',
                'barangay' => 'AMBAGO',
                'hh_id' => 'HHID160202004-0247-00006',
                'lbp_account' => 'EMV6031310003600051302',
                'run_date' => '04/17/2018',
                'first_name' => 'ANGELITA',
                'mid_name' => 'PALARAN',
                'last_name' => 'ALPECHE',
                'acct_description' => 'RECARDING/3',
                'cct_type' => 'RCCT/1',
                'lbp_servicing_branch' => 'BUTUAN/0036',
                'distribution_status' => 'Claimed/1',
                'date_claimed' => '05/05/2018',
                'reason_why_unclaimed' => null,
                'recommended_action' => null,
                'action_taken' => null,
                'date_acted' => null,
                'agreed_distribution_date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'item_no' => '11',
                'region' => 'CARAGA',
                'province' => 'AGUSAN DEL NORTE',
                'municipality' => 'BUTUAN CITY (Capital)',
                'barangay' => 'AMBAGO',
                'hh_id' => 'HHID160202004-0589-00001',
                'lbp_account' => 'EMV6031310003600051328',
                'run_date' => '04/17/2018',
                'first_name' => 'NORMA',
                'mid_name' => 'DURANGO',
                'last_name' => 'ANDUYAN',
                'acct_description' => 'RECARDING/3',
                'cct_type' => 'RCCT/1',
                'lbp_servicing_branch' => 'BUTUAN/0036',
                'distribution_status' => 'Claimed/1',
                'date_claimed' => '05/05/2018',
                'reason_why_unclaimed' => null,
                'recommended_action' => null,
                'action_taken' => null,
                'date_acted' => null,
                'agreed_distribution_date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'item_no' => '12',
                'region' => 'CARAGA',
                'province' => 'AGUSAN DEL NORTE',
                'municipality' => 'BUTUAN CITY (Capital)',
                'barangay' => 'AMBAGO',
                'hh_id' => 'HHID160202004-1491-00016',
                'lbp_account' => 'EMV6031310003600051336',
                'run_date' => '04/17/2018',
                'first_name' => 'VILMA',
                'mid_name' => 'ASAYTONA',
                'last_name' => 'ANORA',
                'acct_description' => 'RECARDING/3',
                'cct_type' => 'RCCT/1',
                'lbp_servicing_branch' => 'BUTUAN/0036',
                'distribution_status' => 'Claimed/1',
                'date_claimed' => '05/05/2018',
                'reason_why_unclaimed' => null,
                'recommended_action' => null,
                'action_taken' => null,
                'date_acted' => null,
                'agreed_distribution_date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        self::insert($samples);
    }
}
