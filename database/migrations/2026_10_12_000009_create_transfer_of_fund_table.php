<?php

use App\Models\EmvRecord;
use App\Models\GranteeList;
use App\Models\HouseholdRequest;
use App\Models\PayrollRecord;
use App\Models\TransferOfFund;
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
        if (! Schema::hasTable('transfer_of_fund')) {
            Schema::create('transfer_of_fund', function (Blueprint $table) {
                $table->id();
                $table->string('item_no')->nullable()->index();
                $table->text('address')->nullable();
                $table->string('household_id_number')->nullable()->index();
                $table->string('old_card_number')->nullable()->index();
                $table->string('old_cardholder_name')->nullable();
                $table->string('new_card_number')->nullable()->index();
                $table->string('new_cardholder_name')->nullable();
                $table->string('status', 50)->default('Pending')->index();
                $table->text('remarks')->nullable();
                $table->string('created_by')->nullable();
                $table->timestamps();
            });
        }

        // Sync any existing 'transfer-of-fund' (or 'tof') household requests into the transfer_of_fund table
        if (Schema::hasTable('household_requests') && Schema::hasTable('transfer_of_fund')) {
            $tofRequests = DB::table('household_requests')
                ->whereIn('request_name', ['transfer-of-fund', 'tof', 'tof-branch', 'transfer_of_fund'])
                ->get();

            foreach ($tofRequests as $req) {
                $hhId = $req->hh_id;
                $exists = DB::table('transfer_of_fund')->where('household_id_number', $hhId)->exists();
                if (! $exists) {
                    $stripped = preg_replace('/^hhid[-\s]*/i', '', $hhId);
                    $candidates = array_values(array_unique(array_filter([
                        $hhId,
                        $stripped,
                        'HHID'.$stripped,
                        'HHID '.$stripped,
                        'HHID-'.$stripped,
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
                    if (empty($addressParts) && $payroll) {
                        $addressParts = array_filter([
                            $payroll->barangay ?? null,
                            $payroll->municipality ?? null,
                            $payroll->province ?? null,
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
                        $granteeName = $req->beneficiary_name ?: null;
                    }

                    $cardNumber = $emv->card_number ?? $emv->lbp_account ?? $grantee->lbp_account ?? $payroll->account_number ?? null;
                    $newCardNumber = $payroll->new_account_number ?? null;

                    $nextItemNo = (DB::table('transfer_of_fund')->max('id') ?? 0) + 1;

                    DB::table('transfer_of_fund')->insert([
                        'item_no' => (string) $nextItemNo,
                        'address' => $address,
                        'household_id_number' => $hhId,
                        'old_card_number' => $cardNumber,
                        'old_cardholder_name' => $granteeName,
                        'new_card_number' => $newCardNumber,
                        'new_cardholder_name' => $granteeName,
                        'status' => 'Pending',
                        'remarks' => $req->remarks,
                        'created_by' => $req->created_by,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transfer_of_fund');
    }
};

