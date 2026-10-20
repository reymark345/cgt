<?php

namespace App\Http\Controllers;

use App\Models\AuditTrail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditTrailController extends Controller
{
    /**
     * Search, filter, and paginate POST audit trail records.
     */
    public function search(Request $request): JsonResponse
    {
        AuditTrail::ensureTableExists();

        $q = trim((string) $request->input('q', ''));
        $module = trim((string) $request->input('module', 'ALL'));
        $user = trim((string) $request->input('user', 'ALL'));
        $page = max(1, (int) $request->input('page', 1));
        $perPage = min(200, max(5, (int) $request->input('per_page', 15)));
        $sortKey = trim((string) $request->input('sort_key', 'id'));
        $sortDirection = strtolower((string) $request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSortColumns = [
            'id',
            'created_at',
            'user_name',
            'module',
            'action',
            'target_id',
            'url',
            'status_code',
            'ip_address',
        ];
        if (! in_array($sortKey, $allowedSortColumns, true)) {
            $sortKey = 'id';
        }

        $baseQuery = AuditTrail::query()
            ->where('method', 'POST')
            ->where('url', '!=', '/sso/logout')
            ->where('action', '!=', 'Signed Out of Portal (SSO)');

        $query = clone $baseQuery;

        if ($q !== '') {
            $query->where(function ($builder) use ($q) {
                $builder->where('user_name', 'like', "%{$q}%")
                    ->orWhere('user_email', 'like', "%{$q}%")
                    ->orWhere('module', 'like', "%{$q}%")
                    ->orWhere('action', 'like', "%{$q}%")
                    ->orWhere('target_id', 'like', "%{$q}%")
                    ->orWhere('url', 'like', "%{$q}%")
                    ->orWhere('ip_address', 'like', "%{$q}%");
            });
        }

        if ($module !== '' && strtoupper($module) !== 'ALL') {
            $query->where('module', $module);
        }

        if ($user !== '' && strtoupper($user) !== 'ALL') {
            $query->where('user_name', $user);
        }

        $totalInDb = (clone $baseQuery)->count();
        $todayCount = (clone $baseQuery)
            ->whereDate('created_at', now()->toDateString())
            ->count();

        $filteredTotal = (clone $query)->count();
        $lastPage = max(1, (int) ceil($filteredTotal / $perPage));
        $currentPage = min($page, $lastPage);

        $records = $query
            ->orderBy($sortKey, $sortDirection)
            ->offset(($currentPage - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn (AuditTrail $item) => $this->toFrontendRecord($item));

        $modules = (clone $baseQuery)
            ->whereNotNull('module')
            ->where('module', '!=', '')
            ->distinct()
            ->orderBy('module')
            ->pluck('module')
            ->values();

        $users = (clone $baseQuery)
            ->whereNotNull('user_name')
            ->where('user_name', '!=', '')
            ->distinct()
            ->orderBy('user_name')
            ->pluck('user_name')
            ->values();

        return response()->json([
            'success' => true,
            'data' => $records,
            'meta' => [
                'current_page' => $currentPage,
                'last_page' => $lastPage,
                'per_page' => $perPage,
                'total' => $filteredTotal,
                'total_in_db' => $totalInDb,
                'today_count' => $todayCount,
            ],
            'filters' => [
                'modules' => $modules,
                'users' => $users,
            ],
        ]);
    }

    /**
     * Export POST audit trail records to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        AuditTrail::ensureTableExists();

        $q = trim((string) $request->input('q', ''));
        $module = trim((string) $request->input('module', 'ALL'));
        $user = trim((string) $request->input('user', 'ALL'));

        $query = AuditTrail::query()
            ->where('method', 'POST')
            ->where('url', '!=', '/sso/logout')
            ->where('action', '!=', 'Signed Out of Portal (SSO)');

        if ($q !== '') {
            $query->where(function ($builder) use ($q) {
                $builder->where('user_name', 'like', "%{$q}%")
                    ->orWhere('user_email', 'like', "%{$q}%")
                    ->orWhere('module', 'like', "%{$q}%")
                    ->orWhere('action', 'like', "%{$q}%")
                    ->orWhere('target_id', 'like', "%{$q}%")
                    ->orWhere('url', 'like', "%{$q}%")
                    ->orWhere('ip_address', 'like', "%{$q}%");
            });
        }

        if ($module !== '' && strtoupper($module) !== 'ALL') {
            $query->where('module', $module);
        }

        if ($user !== '' && strtoupper($user) !== 'ALL') {
            $query->where('user_name', $user);
        }

        $filename = 'audit_trail_post_logs_'.now()->format('Y-m-d_His').'.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'ID',
                'Timestamp',
                'User Name',
                'User Email',
                'Position',
                'Division',
                'Method',
                'Module',
                'Action',
                'Target / HH ID',
                'URL Endpoint',
                'Status Code',
                'IP Address',
                'Payload JSON',
            ]);

            $query->orderByDesc('id')->chunk(500, function ($rows) use ($handle) {
                foreach ($rows as $row) {
                    fputcsv($handle, [
                        $row->id,
                        optional($row->created_at)->format('Y-m-d H:i:s'),
                        $row->user_name,
                        $row->user_email,
                        $row->user_position,
                        $row->user_division,
                        $row->method,
                        $row->module,
                        $row->action,
                        $row->target_id,
                        $row->url,
                        $row->status_code,
                        $row->ip_address,
                        is_array($row->payload) ? json_encode($row->payload) : (string) $row->payload,
                    ]);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Format an AuditTrail record for frontend consumption.
     */
    public function toFrontendRecord(AuditTrail $log): array
    {
        return [
            'id' => $log->id,
            'user_id' => $log->user_id,
            'user_name' => $log->user_name ?? 'System / Guest',
            'user_email' => $log->user_email ?? '',
            'user_position' => $log->user_position ?? '',
            'user_division' => $log->user_division ?? '',
            'method' => $log->method ?? 'POST',
            'module' => $log->module ?? 'System',
            'action' => $log->action ?? 'Submitted POST Request',
            'route_name' => $log->route_name ?? '',
            'url' => $log->url ?? '',
            'target_id' => $log->target_id ?? '',
            'payload' => $log->payload ?? [],
            'status_code' => $log->status_code ?? 200,
            'ip_address' => $log->ip_address ?? '',
            'user_agent' => $log->user_agent ?? '',
            'created_at' => optional($log->created_at)->format('Y-m-d H:i:s') ?? '',
            'created_at_human' => optional($log->created_at)->diffForHumans() ?? '',
        ];
    }
}

