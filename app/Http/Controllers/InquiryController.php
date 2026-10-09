<?php

namespace App\Http\Controllers;

use App\Models\EmvRecord;
use App\Models\GranteeList;
use App\Models\HouseholdRequest;
use App\Models\Opening;
use App\Models\PayrollRecord;
use App\Models\RequestType;
use App\Models\User;
use App\Support\EmvSpreadsheetImporter;
use App\Support\GranteeSpreadsheetImporter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InquiryController extends Controller
{
    /**
     * Search and consolidate Grantee List, EMV Database, and Payroll records by HH_ID.
     */
    public function search(Request $request): JsonResponse
    {
        $raw = trim((string) $request->input('hh_id', ''));
        if ($raw === '') {
            return response()->json([
                'success' => false,
                'message' => 'Please provide a Household ID (HH_ID) to search.',
                'data' => null,
            ], 422);
        }

        GranteeList::ensureTableExists();
        EmvRecord::ensureTableExists();
        PayrollRecord::ensureTableExists();
        RequestType::ensureTableExists();
        HouseholdRequest::ensureTableExists();

        // Normalize HH_ID variations:
        // Handles "013302003-6338-00086", "HHID013302003-6338-00086", "HHID-013302003-6338-00086", etc.
        $stripped = preg_replace('/^hhid[-\s]*/i', '', $raw);
        $candidates = array_values(array_unique(array_filter([
            $raw,
            $stripped,
            'HHID' . $stripped,
            'HHID ' . $stripped,
            'HHID-' . $stripped,
        ])));

        // 1. Query Grantee List
        $granteeQuery = GranteeList::query();
        $granteeQuery->where(function ($q) use ($candidates, $stripped) {
            $q->whereIn('hh_id', $candidates);
            if (! empty($stripped) && strlen($stripped) >= 6) {
                $q->orWhere('hh_id', 'like', "%{$stripped}%");
            }
        });
        $grantees = $granteeQuery->orderBy('id', 'asc')->get()->map(function (GranteeList $grantee) {
            return [
                'id' => $grantee->id,
                'region' => (string) ($grantee->region ?? ''),
                'province' => (string) ($grantee->province ?? ''),
                'municipality' => (string) ($grantee->municipality ?? ''),
                'barangay' => (string) ($grantee->barangay ?? ''),
                'purok' => (string) ($grantee->purok ?? ''),
                'district' => (string) ($grantee->district ?? ''),
                'hh_id' => (string) ($grantee->hh_id ?? ''),
                'entry_id' => (string) ($grantee->entry_id ?? ''),
                'first_name' => (string) ($grantee->first_name ?? ''),
                'middle_name' => (string) ($grantee->middle_name ?? ''),
                'last_name' => (string) ($grantee->last_name ?? ''),
                'ext_name' => (string) ($grantee->ext_name ?? ''),
                'maiden_name' => (string) ($grantee->maiden_name ?? ''),
                'contact_number' => (string) ($grantee->contact_number ?? ''),
                'birthday' => GranteeSpreadsheetImporter::normalizeDateValue($grantee->birthday) ?? (string) ($grantee->birthday ?? ''),
                'hh_grantee' => (string) ($grantee->hh_grantee ?? ''),
                'current_age' => (string) ($grantee->current_age ?? ''),
                'age' => (string) ($grantee->age ?? ''),
                'sex' => (string) ($grantee->sex ?? ''),
                'old_client_status' => (string) ($grantee->old_client_status ?? ''),
                'client_status' => (string) ($grantee->client_status ?? ''),
                'date_tagged' => GranteeSpreadsheetImporter::normalizeDateValue($grantee->date_tagged) ?? (string) ($grantee->date_tagged ?? ''),
                'tagged_by' => (string) ($grantee->tagged_by ?? ''),
                'cs_category' => (string) ($grantee->cs_category ?? ''),
                'member_status' => (string) ($grantee->member_status ?? ''),
                'relation_to_hh' => (string) ($grantee->relation_to_hh ?? ''),
                'hh_set' => (string) ($grantee->hh_set ?? ''),
                'registration_status' => (string) ($grantee->registration_status ?? ''),
                'ip_label' => (string) ($grantee->ip_label ?? ''),
                'ip_status' => (string) ($grantee->ip_status ?? ''),
                'payment_mode' => (string) ($grantee->payment_mode ?? ''),
                'lbp_account' => (string) ($grantee->lbp_account ?? ''),
                'date_of_enumeration' => GranteeSpreadsheetImporter::normalizeDateValue($grantee->date_of_enumeration) ?? (string) ($grantee->date_of_enumeration ?? ''),
                'date_registered' => GranteeSpreadsheetImporter::normalizeDateValue($grantee->date_registered) ?? (string) ($grantee->date_registered ?? ''),
                'date_registered_v2' => GranteeSpreadsheetImporter::normalizeDateValue($grantee->date_registered_v2) ?? (string) ($grantee->date_registered_v2 ?? ''),
                'family_id' => (string) ($grantee->family_id ?? ''),
                'rel_to_fam_head' => (string) ($grantee->rel_to_fam_head ?? ''),
                'selected_family' => (string) ($grantee->selected_family ?? ''),
                'final_l3_result' => (string) ($grantee->final_l3_result ?? ''),
                'createdAt' => optional($grantee->created_at)->format('M d, Y'),
                'updatedAt' => optional($grantee->updated_at)->format('M d, Y'),
            ];
        });

        // 2. Query EMV Database (supports multiple cards/rows per HH_ID)
        $emvQuery = EmvRecord::query();
        $emvQuery->where(function ($q) use ($candidates, $stripped) {
            $q->whereIn('hh_id', $candidates);
            if (! empty($stripped) && strlen($stripped) >= 6) {
                $q->orWhere('hh_id', 'like', "%{$stripped}%");
            }
        });
        $emvRecords = $emvQuery->orderBy('id', 'asc')->get()->map(function (EmvRecord $record) {
            return [
                'id' => $record->id,
                'item_no' => (string) ($record->item_no ?? ''),
                'region' => (string) ($record->region ?? ''),
                'province' => (string) ($record->province ?? ''),
                'municipality' => (string) ($record->municipality ?? ''),
                'barangay' => (string) ($record->barangay ?? ''),
                'hh_id' => (string) ($record->hh_id ?? ''),
                'lbp_account' => (string) ($record->lbp_account ?? ''),
                'run_date' => EmvSpreadsheetImporter::normalizeDateValue($record->run_date) ?? (string) ($record->run_date ?? ''),
                'first_name' => (string) ($record->first_name ?? ''),
                'mid_name' => (string) ($record->mid_name ?? ''),
                'last_name' => (string) ($record->last_name ?? ''),
                'acct_description' => (string) ($record->acct_description ?? ''),
                'cct_type' => (string) ($record->cct_type ?? ''),
                'lbp_servicing_branch' => (string) ($record->lbp_servicing_branch ?? ''),
                'distribution_status' => (string) ($record->distribution_status ?? ''),
                'date_claimed' => EmvSpreadsheetImporter::normalizeDateValue($record->date_claimed) ?? (string) ($record->date_claimed ?? ''),
                'reason_why_unclaimed' => (string) ($record->reason_why_unclaimed ?? ''),
                'recommended_action' => (string) ($record->recommended_action ?? ''),
                'action_taken' => (string) ($record->action_taken ?? ''),
                'date_acted' => EmvSpreadsheetImporter::normalizeDateValue($record->date_acted) ?? (string) ($record->date_acted ?? ''),
                'agreed_distribution_date' => EmvSpreadsheetImporter::normalizeDateValue($record->agreed_distribution_date) ?? (string) ($record->agreed_distribution_date ?? ''),
                'createdAt' => optional($record->created_at)->format('M d, Y'),
                'updatedAt' => optional($record->updated_at)->format('M d, Y'),
            ];
        });

        // 3. Query Payroll Records (supports multiple period disbursement cycles)
        $payrollQuery = PayrollRecord::query();
        $payrollQuery->where(function ($q) use ($candidates, $stripped) {
            $q->whereIn('household_id', $candidates);
            if (! empty($stripped) && strlen($stripped) >= 6) {
                $q->orWhere('household_id', 'like', "%{$stripped}%");
            }
        });
        $payrollRecords = $payrollQuery->orderBy('year', 'desc')->orderBy('period', 'desc')->get()->map(function (PayrollRecord $record) {
            return [
                'id' => $record->id,
                'period' => (string) ($record->period ?? ''),
                'year' => (string) ($record->year ?? ''),
                'payroll_description' => (string) ($record->payroll_description ?? ''),
                'region' => (string) ($record->region ?? ''),
                'province' => (string) ($record->province ?? ''),
                'municipality' => (string) ($record->municipality ?? ''),
                'barangay' => (string) ($record->barangay ?? ''),
                'address_psgc' => (string) ($record->address_psgc ?? ''),
                'last_name' => (string) ($record->last_name ?? ''),
                'first_name' => (string) ($record->first_name ?? ''),
                'middle_name' => (string) ($record->middle_name ?? ''),
                'household_id' => (string) ($record->household_id ?? ''),
                'payment_mode_classification' => (string) ($record->payment_mode_classification ?? ''),
                'mode_of_payment' => (string) ($record->mode_of_payment ?? ''),
                'account_number' => (string) ($record->account_number ?? ''),
                'new_account_number' => (string) ($record->new_account_number ?? ''),
                'status' => (string) ($record->status ?? ''),
                'reason' => (string) ($record->reason ?? ''),
                'payroll_date' => (string) ($record->payroll_date ?? ''),
                'finance_approval' => (string) ($record->finance_approval ?? ''),
                'educ_dc_elem' => (float) ($record->educ_dc_elem ?? 0),
                'educ_jr_hs' => (float) ($record->educ_jr_hs ?? 0),
                'educ_sr_hs' => (float) ($record->educ_sr_hs ?? 0),
                'educ_total_hs' => (float) ($record->educ_total_hs ?? 0),
                'total_educ' => (float) ($record->total_educ ?? 0),
                'health' => (float) ($record->health ?? 0),
                'rice_amount' => (float) ($record->rice_amount ?? 0),
                'f1kd_amount' => (float) ($record->f1kd_amount ?? 0),
                'gross_amount' => (float) ($record->gross_amount ?? 0),
                'adjustment_amount' => (float) ($record->adjustment_amount ?? 0),
                'net_amount' => (float) ($record->net_amount ?? 0),
                'hh_set' => (string) ($record->hh_set ?? ''),
                'set_group' => (string) ($record->set_group ?? ''),
                'createdAt' => optional($record->created_at)->toIso8601String(),
                'updatedAt' => optional($record->updated_at)->toIso8601String(),
            ];
        });

        // Compute Financial Summary for this Household
        $totalGross = (float) $payrollRecords->sum('gross_amount');
        $totalNet = (float) $payrollRecords->sum('net_amount');
        $totalAdjustments = (float) $payrollRecords->sum('adjustment_amount');

        // Resolve Primary Household Name & Location
        $primaryGrantee = $grantees->first();
        $primaryEmv = $emvRecords->first();
        $primaryPayroll = $payrollRecords->first();

        $fullName = '';
        $location = '';
        $displayHhid = $raw;

        if ($primaryGrantee) {
            $fullName = trim("{$primaryGrantee['first_name']} {$primaryGrantee['middle_name']} {$primaryGrantee['last_name']} {$primaryGrantee['ext_name']}");
            $locationParts = array_filter([$primaryGrantee['purok'], $primaryGrantee['barangay'], $primaryGrantee['municipality'], $primaryGrantee['province']]);
            $location = implode(', ', $locationParts);
            $displayHhid = $primaryGrantee['hh_id'] ?: $raw;
        } elseif ($primaryEmv) {
            $fullName = trim("{$primaryEmv['first_name']} {$primaryEmv['mid_name']} {$primaryEmv['last_name']}");
            $locationParts = array_filter([$primaryEmv['barangay'], $primaryEmv['municipality'], $primaryEmv['province']]);
            $location = implode(', ', $locationParts);
            $displayHhid = $primaryEmv['hh_id'] ?: $raw;
        } elseif ($primaryPayroll) {
            $fullName = trim("{$primaryPayroll['first_name']} {$primaryPayroll['middle_name']} {$primaryPayroll['last_name']}");
            $locationParts = array_filter([$primaryPayroll['barangay'], $primaryPayroll['municipality'], $primaryPayroll['province']]);
            $location = implode(', ', $locationParts);
            $displayHhid = $primaryPayroll['household_id'] ?: $raw;
        }

        $totalMatches = $grantees->count() + $emvRecords->count() + $payrollRecords->count();

        // 4. Query Household Requests
        $defaultCreator = $this->resolveCurrentUserName($request);
        $requests = HouseholdRequest::where(function ($q) use ($candidates, $stripped) {
            $q->whereIn('hh_id', $candidates);
            if (! empty($stripped) && strlen($stripped) >= 6) {
                $q->orWhere('hh_id', 'like', "%{$stripped}%");
            }
        })->orderBy('created_at', 'desc')->get()->map(function (HouseholdRequest $req) use ($defaultCreator) {
            $creator = $req->created_by;
            if (empty($creator) || $creator === 'Authorized User') {
                $creator = $defaultCreator;
            }

            return [
                'id' => $req->id,
                'hh_id' => $req->hh_id,
                'request_name' => $req->request_name,
                'request_label' => $req->request_label,
                'beneficiary_name' => $req->beneficiary_name,
                'remarks' => $req->remarks,
                'status' => $req->status,
                'created_by' => $creator,
                'created_at' => optional($req->created_at)->format('M d, Y h:i A'),
                'updated_at' => optional($req->updated_at)->format('M d, Y h:i A'),
            ];
        });

        return response()->json([
            'success' => true,
            'query' => $raw,
            'display_hhid' => $displayHhid,
            'total_matches' => $totalMatches,
            'summary' => [
                'full_name' => $fullName,
                'location' => $location,
                'client_status' => $primaryGrantee['client_status'] ?? null,
                'grantee_count' => $grantees->count(),
                'emv_count' => $emvRecords->count(),
                'payroll_count' => $payrollRecords->count(),
                'request_count' => $requests->count(),
                'total_gross' => $totalGross,
                'total_net' => $totalNet,
                'total_adjustments' => $totalAdjustments,
            ],
            'grantee' => $primaryGrantee,
            'grantees' => $grantees,
            'emv_records' => $emvRecords,
            'payroll_records' => $payrollRecords,
            'requests' => $requests,
        ]);
    }

    /**
     * Get available request types from database table 'request'.
     */
    public function requestOptions(): JsonResponse
    {
        RequestType::ensureTableExists();

        $options = DB::table('request')
            ->select('id', 'name', 'label', 'description', 'status')
            ->where('status', 'active')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'options' => $options,
        ]);
    }

    /**
     * Add a request for a Household ID.
     */
    public function addRequest(Request $request): JsonResponse
    {
        $hhId = trim((string) $request->input('hh_id', ''));
        $rawNames = $request->input('request_names', $request->input('request_name'));
        $remarks = trim((string) $request->input('remarks', ''));
        $beneficiaryName = trim((string) $request->input('beneficiary_name', ''));

        if (is_array($rawNames)) {
            $requestNames = array_values(array_unique(array_filter(array_map('trim', $rawNames))));
        } else {
            $single = trim((string) $rawNames);
            $requestNames = $single !== '' ? [$single] : [];
        }

        if ($hhId === '' || empty($requestNames)) {
            return response()->json([
                'success' => false,
                'message' => 'Household ID and at least one Request Type are required.',
            ], 422);
        }

        RequestType::ensureTableExists();
        HouseholdRequest::ensureTableExists();

        // Load all requested type rows
        $typeRows = DB::table('request')->whereIn('name', $requestNames)->get()->keyBy('name');

        // Get creator info from session / auth / input
        $creator = $this->resolveCurrentUserName($request);

        $createdRecords = [];
        foreach ($requestNames as $reqName) {
            $typeRow = $typeRows->get($reqName);
            $label = $typeRow ? ($typeRow->label ?: $typeRow->name) : ucwords(str_replace('-', ' ', $reqName));

            $record = HouseholdRequest::create([
                'hh_id' => $hhId,
                'request_name' => $reqName,
                'request_label' => $label,
                'beneficiary_name' => $beneficiaryName ?: null,
                'remarks' => $remarks ?: null,
                'status' => 'Pending',
                'created_by' => $creator,
            ]);

            if ($reqName === 'opening') {
                Opening::ensureTableExists();

                $grantee = GranteeList::where('hh_id', $hhId)->first();
                $emv = EmvRecord::where('hh_id', $hhId)->latest('id')->first();
                $payroll = PayrollRecord::where('household_id', $hhId)->latest('id')->first();

                $addressParts = array_filter([
                    $grantee->purok ?? null,
                    $grantee->barangay ?? null,
                    $grantee->municipality ?? null,
                    $grantee->province ?? null,
                ]);
                $address = ! empty($addressParts) ? implode(', ', $addressParts) : null;

                $oldGranteeName = $grantee
                    ? trim("{$grantee->first_name} {$grantee->middle_name} {$grantee->last_name} {$grantee->ext_name}")
                    : ($beneficiaryName ?: null);

                $oldCardNumber = $emv->card_number ?? $grantee->lbp_account ?? $payroll->card_number ?? null;
                $oldStatus = $grantee->client_status ?? $grantee->old_client_status ?? 'Active';
                $nextItemNo = (Opening::max('id') ?? 0) + 1;

                Opening::create([
                    'item_no' => (string) $nextItemNo,
                    'address' => $address,
                    'household_id_number' => $hhId,
                    'name_of_new_grantee' => null,
                    'name_of_old_grantee' => $oldGranteeName,
                    'card_number_of_old' => $oldCardNumber,
                    'status_of_old_grantee' => $oldStatus,
                    'status' => 'Pending',
                    'remarks' => $remarks ?: null,
                    'created_by' => $creator,
                ]);
            }

            $createdRecords[] = [
                'id' => $record->id,
                'hh_id' => $record->hh_id,
                'request_name' => $record->request_name,
                'request_label' => $record->request_label,
                'beneficiary_name' => $record->beneficiary_name,
                'remarks' => $record->remarks,
                'status' => $record->status,
                'created_by' => $record->created_by,
                'created_at' => optional($record->created_at)->format('M d, Y h:i A'),
            ];
        }

        $count = count($createdRecords);
        $message = $count === 1
            ? "Request '{$createdRecords[0]['request_label']}' successfully added for Household {$hhId}."
            : "Successfully added {$count} requests for Household {$hhId}.";

        return response()->json([
            'success' => true,
            'message' => $message,
            'requests' => $createdRecords,
            'request' => $createdRecords[0] ?? null,
        ]);
    }

    /**
     * Get requests for a specific household.
     */
    public function householdRequests(Request $request): JsonResponse
    {
        $hhId = trim((string) $request->input('hh_id', ''));
        if ($hhId === '') {
            return response()->json([
                'success' => false,
                'requests' => [],
            ]);
        }

        HouseholdRequest::ensureTableExists();

        $defaultCreator = $this->resolveCurrentUserName($request);
        $requests = HouseholdRequest::where('hh_id', $hhId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($req) use ($defaultCreator) {
                $creator = $req->created_by;
                if (empty($creator) || $creator === 'Authorized User') {
                    $creator = $defaultCreator;
                }

                return [
                    'id' => $req->id,
                    'hh_id' => $req->hh_id,
                    'request_name' => $req->request_name,
                    'request_label' => $req->request_label,
                    'beneficiary_name' => $req->beneficiary_name,
                    'remarks' => $req->remarks,
                    'status' => $req->status,
                    'created_by' => $creator,
                    'created_at' => optional($req->created_at)->format('M d, Y h:i A'),
                ];
            });

        return response()->json([
            'success' => true,
            'requests' => $requests,
        ]);
    }

    /**
     * Resolve the current authenticated user's full name.
     */
    protected function resolveCurrentUserName(Request $request): string
    {
        $passed = trim((string) $request->input('created_by', ''));
        if ($passed !== '' && $passed !== 'Authorized User') {
            return $passed;
        }

        $ssoUserId = $request->session()->get('sso_user_id');
        if ($ssoUserId) {
            $user = User::find($ssoUserId);
            if ($user && ! empty($user->name)) {
                return $user->name;
            }
        }

        $sessionUser = session('user');
        if (is_object($sessionUser) && ! empty($sessionUser->name)) {
            return $sessionUser->name;
        }
        if (is_array($sessionUser) && ! empty($sessionUser['name'])) {
            return $sessionUser['name'];
        }

        $authUser = auth()->user();
        if ($authUser && ! empty($authUser->name)) {
            return $authUser->name;
        }

        $firstUser = User::first();
        if ($firstUser && ! empty($firstUser->name)) {
            return $firstUser->name;
        }

        return 'Authorized User';
    }

    /**
     * Get quick sample HH_IDs for test demonstrations.
     */
    public function samples(): JsonResponse
    {
        GranteeList::ensureTableExists();
        EmvRecord::ensureTableExists();
        PayrollRecord::ensureTableExists();

        // 1. Find an HH_ID with multiple EMV cards
        $multiEmv = EmvRecord::select('hh_id', DB::raw('count(*) as count'))
            ->whereNotNull('hh_id')
            ->where('hh_id', '!=', '')
            ->groupBy('hh_id')
            ->having('count', '>', 1)
            ->first();

        // 2. Find a sample with Grantee & EMV records
        $sampleGrantee = GranteeList::select('hh_id', 'first_name', 'last_name')
            ->whereNotNull('hh_id')
            ->where('hh_id', '!=', '')
            ->first();

        // 3. Find a sample with Payroll records
        $samplePayroll = PayrollRecord::select('household_id as hh_id', 'first_name', 'last_name')
            ->whereNotNull('household_id')
            ->where('household_id', '!=', '')
            ->first();

        $samples = [];
        if ($multiEmv) {
            $samples[] = [
                'hh_id' => $multiEmv->hh_id,
                'label' => "Multi-Card ({$multiEmv->count} EMV Accounts)",
            ];
        }
        if ($sampleGrantee) {
            $samples[] = [
                'hh_id' => $sampleGrantee->hh_id,
                'label' => "Grantee: {$sampleGrantee->first_name} {$sampleGrantee->last_name}",
            ];
        }
        if ($samplePayroll) {
            $samples[] = [
                'hh_id' => $samplePayroll->hh_id,
                'label' => "Payroll: {$samplePayroll->first_name} {$samplePayroll->last_name}",
            ];
        }

        return response()->json([
            'success' => true,
            'samples' => $samples,
        ]);
    }
}

