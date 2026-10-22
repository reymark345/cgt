<?php

namespace App\Http\Controllers;

use App\Models\Distribution;
use App\Models\HouseholdRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DistributionController extends Controller
{
    /**
     * Search and paginate distribution records.
     */
    public function search(Request $request): JsonResponse
    {
        Distribution::ensureTableExists(); \App\Http\Controllers\InquiryController::resequenceTable('distribution');

        $query = Distribution::with('creator:id,name');

        if ($search = trim((string) $request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('item_no', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('household_id_number', 'like', "%{$search}%")
                    ->orWhere('run_date', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('card_number', 'like', "%{$search}%")
                    ->orWhere('schedule', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhere('drn', 'like', "%{$search}%")
                    ->orWhereHas('creator', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = max(5, min(100, (int) $request->input('per_page', 15)));
        $paginator = $query->orderBy('id', 'asc')->paginate($perPage);

        $items = collect($paginator->items())->map(function (Distribution $row) {
            $arr = $row->toArray();
            $arr['created_by_id'] = $row->created_by;
            $arr['created_by'] = $row->creator?->name ?? User::resolveUserNameById($row->created_by);

            return $arr;
        })->all();

        return response()->json([
            'success' => true,
            'data' => $items,
            'total' => $paginator->total(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
        ]);
    }

    /**
     * Export distribution records to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        Distribution::ensureTableExists(); \App\Http\Controllers\InquiryController::resequenceTable('distribution');

        $records = Distribution::with('creator:id,name')->orderBy('id', 'asc')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="distribution_records_'.date('Ymd_His').'.csv"',
        ];

        return response()->stream(function () use ($records) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Item No',
                'Address',
                'Household Id Number',
                'Run Date',
                'Name',
                'Card Number',
                'Schedule',
                'DRN',
                'Added By',
                'Status',
                'Created At',
            ]);

            foreach ($records as $row) {
                fputcsv($handle, [
                    $row->item_no,
                    $row->address,
                    $row->household_id_number,
                    $row->run_date,
                    $row->name,
                    $row->card_number,
                    $row->schedule,
                    $row->drn,
                    $row->creator?->name ?? User::resolveUserNameById($row->created_by),
                    $row->status,
                    optional($row->created_at)->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Store a new distribution record.
     */
    public function store(Request $request): JsonResponse
    {
        Distribution::ensureTableExists(); \App\Http\Controllers\InquiryController::resequenceTable('distribution');

        $validated = $request->validate([
            'item_no' => 'nullable|string',
            'address' => 'nullable|string',
            'household_id_number' => 'nullable|string',
            'run_date' => 'nullable|string',
            'name' => 'nullable|string',
            'card_number' => 'nullable|string',
            'schedule' => 'nullable|string',
            'status' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        if (empty($validated['item_no'])) {
            $validated['item_no'] = (string) (Distribution::count() + 1);
        }

        $validated['created_by'] = User::resolveCurrentUserId($request);

        $record = Distribution::create($validated);
        $record->load('creator:id,name');
        $data = $record->toArray();
        $data['created_by_id'] = $record->created_by;
        $data['created_by'] = $record->creator?->name ?? User::resolveUserNameById($record->created_by);

        return response()->json([
            'success' => true,
            'message' => 'Distribution record successfully created.',
            'data' => $data,
        ]);
    }

    /**
     * Display printable endorsement letter / schedule and card distribution form.
     */
    public function print(Request $request): Response
    {
        Distribution::ensureTableExists(); \App\Http\Controllers\InquiryController::resequenceTable('distribution');

        $query = Distribution::query();

        if ($ids = $request->input('ids')) {
            $idList = is_array($ids) ? $ids : explode(',', (string) $ids);
            $query->whereIn('id', array_filter($idList));
        } elseif ($search = trim((string) $request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('item_no', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('household_id_number', 'like', "%{$search}%")
                    ->orWhere('run_date', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('card_number', 'like', "%{$search}%")
                    ->orWhere('schedule', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%");
            });
        }

        $records = $query->orderBy('id', 'asc')->get();

        return Inertia::render('DistributionPrint', [
            'records' => \App\Models\LbpBranchDirectory::resolveRecordsForPrint($records),
            'branchDirectories' => \App\Models\LbpBranchDirectory::getAllForPrint(),
            'defaultDate' => now()->format('F d, Y'),
            'search' => $request->input('search'),
            'dswdLogoUrl' => asset('images/dswd_caraga_logo.png'),
            'bagongPilipinasLogoUrl' => asset('images/bagong_pilipinas_logo.png'),
        ]);
    }

    /**
     * Remove / undo a distribution record and clean up associated household request if present.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        Distribution::ensureTableExists(); \App\Http\Controllers\InquiryController::resequenceTable('distribution');

        $record = Distribution::find($id);

        if (! $record) {
            return response()->json([
                'success' => false,
                'message' => 'Record not found or already removed.',
            ], 404);
        }

        $hhId = $record->household_id_number;
        $hhRequestId = $record->household_request_id;

        $record->delete();

        HouseholdRequest::ensureTableExists();
        if (! empty($hhRequestId)) {
            HouseholdRequest::where('id', $hhRequestId)->delete();
        } elseif (! empty($hhId)) {
            HouseholdRequest::where('hh_id', $hhId)
                ->where('request_name', 'distribution')
                ->latest('id')
                ->first()
                ?->delete();
        }

        return response()->json([
            'success' => true,
            'message' => $hhId
                ? "Distribution record for Household {$hhId} has been undone and removed successfully."
                : 'Distribution record has been undone and removed successfully.',
            'id' => $id,
            'module_counts' => \App\Http\Controllers\InquiryController::getModuleCounts(),
        ]);
    }
}

