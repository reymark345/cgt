<?php

namespace App\Http\Controllers;

use App\Models\HouseholdRequest;
use App\Models\TransferOfFund;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransferOfFundController extends Controller
{
    /**
     * Search and paginate transfer of fund records.
     */
    public function search(Request $request): JsonResponse
    {
        TransferOfFund::ensureTableExists();

        $query = TransferOfFund::query();

        if ($search = trim((string) $request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('item_no', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('household_id_number', 'like', "%{$search}%")
                    ->orWhere('old_card_number', 'like', "%{$search}%")
                    ->orWhere('old_cardholder_name', 'like', "%{$search}%")
                    ->orWhere('new_card_number', 'like', "%{$search}%")
                    ->orWhere('new_cardholder_name', 'like', "%{$search}%");
            });
        }

        $perPage = max(5, min(100, (int) $request->input('per_page', 15)));
        $paginator = $query->orderBy('id', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $paginator->items(),
            'total' => $paginator->total(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
        ]);
    }

    /**
     * Export transfer of fund records to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        TransferOfFund::ensureTableExists();

        $records = TransferOfFund::orderBy('id', 'asc')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="transfer_of_fund_records_'.date('Ymd_His').'.csv"',
        ];

        return response()->stream(function () use ($records) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Item No',
                'Address',
                'Household Id Number',
                'Old Card Number',
                'Old Cardholder Name',
                'New Card Number',
                'New Cardholder Name',
                'Status',
                'Remarks',
                'Created At',
            ]);

            foreach ($records as $row) {
                fputcsv($handle, [
                    $row->item_no,
                    $row->address,
                    $row->household_id_number,
                    $row->old_card_number,
                    $row->old_cardholder_name,
                    $row->new_card_number,
                    $row->new_cardholder_name,
                    $row->status,
                    $row->remarks,
                    optional($row->created_at)->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Store a new transfer of fund record.
     */
    public function store(Request $request): JsonResponse
    {
        TransferOfFund::ensureTableExists();

        $validated = $request->validate([
            'item_no' => 'nullable|string',
            'address' => 'nullable|string',
            'household_id_number' => 'nullable|string',
            'old_card_number' => 'nullable|string',
            'old_cardholder_name' => 'nullable|string',
            'new_card_number' => 'nullable|string',
            'new_cardholder_name' => 'nullable|string',
            'status' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        if (empty($validated['item_no'])) {
            $validated['item_no'] = (string) ((TransferOfFund::max('id') ?? 0) + 1);
        }

        $validated['created_by'] = $this->resolveCurrentUserName($request);

        $record = TransferOfFund::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Transfer of Fund record successfully created.',
            'data' => $record,
        ]);
    }

    /**
     * Display printable endorsement letter / transfer of fund request form.
     */
    public function print(Request $request): Response
    {
        TransferOfFund::ensureTableExists();

        $query = TransferOfFund::query();

        if ($ids = $request->input('ids')) {
            $idList = is_array($ids) ? $ids : explode(',', (string) $ids);
            $query->whereIn('id', array_filter($idList));
        } elseif ($search = trim((string) $request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('item_no', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('household_id_number', 'like', "%{$search}%")
                    ->orWhere('old_card_number', 'like', "%{$search}%")
                    ->orWhere('old_cardholder_name', 'like', "%{$search}%")
                    ->orWhere('new_card_number', 'like', "%{$search}%")
                    ->orWhere('new_cardholder_name', 'like', "%{$search}%");
            });
        }

        $records = $query->orderBy('id', 'asc')->get();

        return Inertia::render('TransferOfFundPrint', [
            'records' => $records,
            'defaultDate' => now()->format('F d, Y'),
            'search' => $request->input('search'),
            'dswdLogoUrl' => asset('images/dswd_caraga_logo.png'),
            'bagongPilipinasLogoUrl' => asset('images/bagong_pilipinas_logo.png'),
        ]);
    }

    /**
     * Remove / undo a transfer of fund record and clean up associated household request if present.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        TransferOfFund::ensureTableExists();

        $record = TransferOfFund::find($id);

        if (! $record) {
            return response()->json([
                'success' => false,
                'message' => 'Record not found or already removed.',
            ], 404);
        }

        $hhId = $record->household_id_number;

        // If this was added via Inquiry request, also clean up the corresponding household request
        if (! empty($hhId)) {
            HouseholdRequest::ensureTableExists();
            HouseholdRequest::where('hh_id', $hhId)
                ->whereIn('request_name', ['transfer-of-fund', 'tof', 'transfer_of_fund'])
                ->latest('id')
                ->first()
                ?->delete();
        }

        $record->delete();

        return response()->json([
            'success' => true,
            'message' => $hhId
                ? "Transfer of Fund record for Household {$hhId} has been undone and removed successfully."
                : 'Transfer of Fund record has been undone and removed successfully.',
            'id' => $id,
            'module_counts' => \App\Http\Controllers\InquiryController::getModuleCounts(),
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
}

