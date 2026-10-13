<?php

namespace App\Http\Controllers;

use App\Models\HouseholdRequest;
use App\Models\Lifting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LiftingController extends Controller
{
    /**
     * Search and paginate lifting records.
     */
    public function search(Request $request): JsonResponse
    {
        Lifting::ensureTableExists();

        $query = Lifting::query();

        if ($search = trim((string) $request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('item_no', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('household_id_number', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('card_number', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%");
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
     * Export lifting records to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        Lifting::ensureTableExists();

        $records = Lifting::orderBy('id', 'asc')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="lifting_records_'.date('Ymd_His').'.csv"',
        ];

        return response()->stream(function () use ($records) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Item No',
                'Address',
                'Household Id Number',
                'Name',
                'Card Number',
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
                    $row->status,
                    $row->remarks,
                    optional($row->created_at)->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Store a new lifting record.
     */
    public function store(Request $request): JsonResponse
    {
        Lifting::ensureTableExists();

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
            $validated['item_no'] = (string) ((Lifting::max('id') ?? 0) + 1);
        }

        $validated['created_by'] = $this->resolveCurrentUserName($request);

        $record = Lifting::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Lifting record successfully created.',
            'data' => $record,
        ]);
    }

    /**
     * Display printable endorsement letter / Lifting request form.
     */
    public function print(Request $request): Response
    {
        Lifting::ensureTableExists();

        $query = Lifting::query();

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

        return Inertia::render('LiftingPrint', [
            'records' => $records,
            'defaultDate' => now()->format('F d, Y'),
            'search' => $request->input('search'),
            'dswdLogoUrl' => asset('images/dswd_caraga_logo.png'),
            'bagongPilipinasLogoUrl' => asset('images/bagong_pilipinas_logo.png'),
        ]);
    }

    /**
     * Remove / undo a lifting record and clean up associated household request if present.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        Lifting::ensureTableExists();

        $record = Lifting::find($id);

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
                ->whereIn('request_name', ['lifting', 'lift', 'card-lifting', 'card_lifting', 'card lifting', 'unfreeze'])
                ->latest('id')
                ->first()
                ?->delete();
        }

        $record->delete();

        return response()->json([
            'success' => true,
            'message' => $hhId
                ? "Lifting record for Household {$hhId} has been undone and removed successfully."
                : 'Lifting record has been undone and removed successfully.',
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

