<?php

namespace App\Http\Controllers;

use App\Models\HouseholdRequest;
use App\Models\Locking;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LockingController extends Controller
{
    /**
     * Search and paginate locking records.
     */
    public function search(Request $request): JsonResponse
    {
        Locking::ensureTableExists();

        $query = Locking::with('creator:id,name');

        if ($search = trim((string) $request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('item_no', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('household_id_number', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('card_number', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhereHas('creator', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = max(5, min(100, (int) $request->input('per_page', 15)));
        $paginator = $query->orderBy('id', 'desc')->paginate($perPage);

        $items = collect($paginator->items())->map(function (Locking $row) {
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
     * Export locking records to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        Locking::ensureTableExists();

        $records = Locking::with('creator:id,name')->orderBy('id', 'asc')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="locking_records_'.date('Ymd_His').'.csv"',
        ];

        return response()->stream(function () use ($records) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Item No',
                'Address',
                'Household Id Number',
                'Name',
                'Card Number',
                'Added By',
                'Status',
                'Remarks',
                'Created At',
            ]);

            foreach ($records as $row) {
                fputcsv($handle, [
                    $row->item_no,
                    $row->address,
                    $row->household_id_number,
                    $row->name,
                    $row->card_number,
                    $row->creator?->name ?? User::resolveUserNameById($row->created_by),
                    $row->status,
                    $row->remarks,
                    optional($row->created_at)->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Store a new locking record.
     */
    public function store(Request $request): JsonResponse
    {
        Locking::ensureTableExists();

        $validated = $request->validate([
            'item_no' => 'nullable|string',
            'address' => 'nullable|string',
            'household_id_number' => 'nullable|string',
            'name' => 'nullable|string',
            'card_number' => 'nullable|string',
            'status' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        if (empty($validated['item_no'])) {
            $validated['item_no'] = (string) ((Locking::max('id') ?? 0) + 1);
        }

        $validated['created_by'] = User::resolveCurrentUserId($request);

        $record = Locking::create($validated);
        $record->load('creator:id,name');
        $data = $record->toArray();
        $data['created_by_id'] = $record->created_by;
        $data['created_by'] = $record->creator?->name ?? User::resolveUserNameById($record->created_by);

        return response()->json([
            'success' => true,
            'message' => 'Locking record successfully created.',
            'data' => $data,
        ]);
    }

    /**
     * Display printable endorsement letter / Locking request form.
     */
    public function print(Request $request): Response
    {
        Locking::ensureTableExists();

        $query = Locking::query();

        if ($ids = $request->input('ids')) {
            $idList = is_array($ids) ? $ids : explode(',', (string) $ids);
            $query->whereIn('id', array_filter($idList));
        } elseif ($search = trim((string) $request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('item_no', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('household_id_number', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('card_number', 'like', "%{$search}%");
            });
        }

        $records = $query->orderBy('id', 'asc')->get();

        return Inertia::render('LockingPrint', [
            'records' => $records,
            'defaultDate' => now()->format('F d, Y'),
            'search' => $request->input('search'),
            'dswdLogoUrl' => asset('images/dswd_caraga_logo.png'),
            'bagongPilipinasLogoUrl' => asset('images/bagong_pilipinas_logo.png'),
        ]);
    }

    /**
     * Remove / undo a locking record and clean up associated household request if present.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        Locking::ensureTableExists();

        $record = Locking::find($id);

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
                ->whereIn('request_name', ['locking', 'lock', 'card-locking', 'card_locking', 'card locking'])
                ->latest('id')
                ->first()
                ?->delete();
        }

        return response()->json([
            'success' => true,
            'message' => $hhId
                ? "Locking record for Household {$hhId} has been undone and removed successfully."
                : 'Locking record has been undone and removed successfully.',
            'id' => $id,
            'module_counts' => \App\Http\Controllers\InquiryController::getModuleCounts(),
        ]);
    }
}

