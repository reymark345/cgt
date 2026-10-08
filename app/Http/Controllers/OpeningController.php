<?php

namespace App\Http\Controllers;

use App\Models\Opening;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OpeningController extends Controller
{
    /**
     * Search and paginate opening records.
     */
    public function search(Request $request): JsonResponse
    {
        Opening::ensureTableExists();

        $query = Opening::query();

        if ($search = trim((string) $request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('item_no', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('household_id_number', 'like', "%{$search}%")
                    ->orWhere('name_of_new_grantee', 'like', "%{$search}%")
                    ->orWhere('name_of_old_grantee', 'like', "%{$search}%")
                    ->orWhere('card_number_of_old', 'like', "%{$search}%")
                    ->orWhere('status_of_old_grantee', 'like', "%{$search}%");
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
     * Export opening records to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        Opening::ensureTableExists();

        $records = Opening::orderBy('id', 'asc')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="opening_records_'.date('Ymd_His').'.csv"',
        ];

        return response()->stream(function () use ($records) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Item No',
                'Address',
                'Household Id Number',
                'Name of New Grantee',
                'Name of Old Grantee',
                'Card Number of Old',
                'Status of Old Grantee',
                'Status',
                'Created At',
            ]);

            foreach ($records as $row) {
                fputcsv($handle, [
                    $row->item_no,
                    $row->address,
                    $row->household_id_number,
                    $row->name_of_new_grantee,
                    $row->name_of_old_grantee,
                    $row->card_number_of_old,
                    $row->status_of_old_grantee,
                    $row->status,
                    optional($row->created_at)->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Store a new opening record.
     */
    public function store(Request $request): JsonResponse
    {
        Opening::ensureTableExists();

        $validated = $request->validate([
            'item_no' => 'nullable|string',
            'address' => 'nullable|string',
            'household_id_number' => 'nullable|string',
            'name_of_new_grantee' => 'nullable|string',
            'name_of_old_grantee' => 'nullable|string',
            'card_number_of_old' => 'nullable|string',
            'status_of_old_grantee' => 'nullable|string',
            'status' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        if (empty($validated['item_no'])) {
            $validated['item_no'] = (string) ((Opening::max('id') ?? 0) + 1);
        }

        $user = auth()->user() ?? session('user');
        $validated['created_by'] = is_object($user) ? ($user->name ?? $user->username ?? 'Authorized User') : 'Authorized User';

        $record = Opening::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Opening record successfully created.',
            'data' => $record,
        ]);
    }
}

