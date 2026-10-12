<?php

namespace App\Http\Controllers;

use App\Models\HouseholdRequest;
use App\Models\Opening;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
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

        $validated['created_by'] = $this->resolveCurrentUserName($request);

        $record = Opening::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Opening record successfully created.',
            'data' => $record,
        ]);
    }

    /**
     * Display printable endorsement letter / account opening request form.
     */
    public function print(Request $request): Response
    {
        Opening::ensureTableExists();

        $query = Opening::query();

        if ($ids = $request->input('ids')) {
            $idList = is_array($ids) ? $ids : explode(',', (string) $ids);
            $query->whereIn('id', array_filter($idList));
        } elseif ($search = trim((string) $request->input('search', ''))) {
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

        $records = $query->orderBy('id', 'asc')->get();

        return Inertia::render('OpeningPrint', [
            'records' => $records,
            'defaultDate' => now()->format('F d, Y'),
            'search' => $request->input('search'),
            'dswdLogoUrl' => asset('images/dswd_caraga_logo.png'),
            'bagongPilipinasLogoUrl' => asset('images/bagong_pilipinas_logo.png'),
        ]);
    }

    /**
     * Remove / undo an opening record and clean up associated household request if present.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        Opening::ensureTableExists();

        $record = Opening::find($id);

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
                ->where('request_name', 'opening')
                ->latest('id')
                ->first()
                ?->delete();
        }

        $record->delete();

        return response()->json([
            'success' => true,
            'message' => $hhId
                ? "Opening record for Household {$hhId} has been undone and removed successfully."
                : 'Opening record has been undone and removed successfully.',
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

