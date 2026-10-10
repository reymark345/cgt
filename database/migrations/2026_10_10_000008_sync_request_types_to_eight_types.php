<?php

use App\Models\Distribution;
use App\Models\EmvRecord;
use App\Models\GranteeList;
use App\Models\HouseholdRequest;
use App\Models\PayrollRecord;
use App\Support\EmvSpreadsheetImporter;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Standard 8 request types.
     */
    public const STANDARD_EIGHT = [
        ['name' => 'opening', 'label' => 'Opening', 'description' => 'Account opening and bank endorsement batch'],
        ['name' => 'distribution', 'label' => 'Distribution', 'description' => 'Payout distribution logistics and field issuance logs'],
        ['name' => 'otc-withdrawal', 'label' => 'OTC Withdrawal', 'description' => 'Over The Counter payout schedules and authorization'],
        ['name' => 'replacement', 'label' => 'Replacement', 'description' => 'Card replacement batch series and re-issuance'],
        ['name' => 'transfer-of-fund', 'label' => 'Transfer of Fund', 'description' => 'Transfer of Funds crediting batches and transmittals'],
        ['name' => 'force-pin', 'label' => 'Force PIN', 'description' => 'Card PIN reset and force authorization requests'],
        ['name' => 'locking', 'label' => 'Locking', 'description' => 'Card lock requests and frozen transactions'],
        ['name' => 'lifting', 'label' => 'Lifting', 'description' => 'Card restriction lifting and unfreeze clearance'],
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('request')) {
            // Truncate request table to ensure clean 1-8 IDs
            DB::table('request')->truncate();
            $now = now();
            foreach (self::STANDARD_EIGHT as $item) {
                DB::table('request')->insert([
                    'name' => $item['name'],
                    'label' => $item['label'],
                    'description' => $item['description'],
                    'status' => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // Clean up and normalize any existing legacy request names in household_requests
        if (Schema::hasTable('household_requests')) {
            DB::table('household_requests')
                ->whereIn('request_name', ['distribution-series', 'distribution_series'])
                ->update([
                    'request_name' => 'distribution',
                    'request_label' => 'Distribution',
                ]);

            DB::table('household_requests')
                ->where('request_name', 'lock')
                ->update([
                    'request_name' => 'locking',
                    'request_label' => 'Locking',
                ]);

            DB::table('household_requests')
                ->where('request_name', 'otc')
                ->update([
                    'request_name' => 'otc-withdrawal',
                    'request_label' => 'OTC Withdrawal',
                ]);

            DB::table('household_requests')
                ->whereIn('request_name', ['tof', 'tof-branch'])
                ->update([
                    'request_name' => 'transfer-of-fund',
                    'request_label' => 'Transfer of Fund',
                ]);

            DB::table('household_requests')
                ->where('request_name', 'replacement-series')
                ->update([
                    'request_name' => 'replacement',
                    'request_label' => 'Replacement',
                ]);

            // Sync any existing 'distribution' household request into distribution table if missing
            if (Schema::hasTable('distribution')) {
                $distRequests = DB::table('household_requests')
                    ->where('request_name', 'distribution')
                    ->get();

                foreach ($distRequests as $dReq) {
                    $hhId = $dReq->hh_id;
                    $alreadyInDist = DB::table('distribution')->where('household_id_number', $hhId)->exists();
                    if (! $alreadyInDist) {
                        $stripped = preg_replace('/^hhid[-\s]*/i', '', $hhId);
                        $candidates = array_values(array_unique(array_filter([
                            $hhId,
                            $stripped,
                            'HHID' . $stripped,
                            'HHID ' . $stripped,
                            'HHID-' . $stripped,
                        ])));

                        $grantee = GranteeList::whereIn('hh_id', $candidates)->first();
                        $emv = EmvRecord::whereIn('hh_id', $candidates)->latest('id')->first();
                        $payroll = PayrollRecord::whereIn('household_id', $candidates)->latest('id')->first();

                        $addressParts = [];
                        if ($grantee) {
                            $addressParts = array_filter([
                                $grantee->purok ?? null,
                                $grantee->barangay ?? null,
                                $grantee->municipality ?? null,
                                $grantee->province ?? null,
                            ]);
                        }
                        if (empty($addressParts) && $emv) {
                            $addressParts = array_filter([
                                $emv->barangay ?? null,
                                $emv->municipality ?? null,
                                $emv->province ?? null,
                            ]);
                        }
                        $address = ! empty($addressParts) ? implode(', ', $addressParts) : null;

                        $granteeName = null;
                        if ($grantee) {
                            $granteeName = trim("{$grantee->first_name} {$grantee->middle_name} {$grantee->last_name} {$grantee->ext_name}");
                        }
                        if (empty($granteeName) && $emv) {
                            $granteeName = trim("{$emv->first_name} {$emv->mid_name} {$emv->last_name}");
                        }
                        if (empty($granteeName) && $payroll) {
                            $granteeName = trim("{$payroll->first_name} {$payroll->middle_name} {$payroll->last_name}");
                        }
                        if (empty($granteeName)) {
                            $granteeName = $dReq->beneficiary_name ?: null;
                        }

                        $cardNumber = $emv->card_number ?? $emv->lbp_account ?? $grantee->lbp_account ?? $payroll->card_number ?? $payroll->account_number ?? null;
                        $runDate = EmvSpreadsheetImporter::normalizeDateValue($emv->run_date ?? null) ?? ($emv->run_date ?? null);
                        $schedule = EmvSpreadsheetImporter::normalizeDateValue($emv->agreed_distribution_date ?? null) ?? ($emv->agreed_distribution_date ?? null);

                        $nextItemNo = (Distribution::max('id') ?? 0) + 1;

                        Distribution::create([
                            'item_no' => (string) $nextItemNo,
                            'address' => $address,
                            'household_id_number' => $hhId,
                            'run_date' => $runDate,
                            'name' => $granteeName,
                            'card_number' => $cardNumber,
                            'schedule' => $schedule,
                            'status' => 'Pending',
                            'remarks' => $dReq->remarks,
                            'created_by' => $dReq->created_by,
                        ]);
                    }
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No down action needed
    }
};

