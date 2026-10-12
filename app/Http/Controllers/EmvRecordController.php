<?php

namespace App\Http\Controllers;

use App\Jobs\ImportEmvJob;
use App\Models\EmvImport;
use App\Models\EmvRecord;
use App\Models\GranteeList;
use App\Models\PayrollRecord;
use App\Models\User;
use App\Support\EmvSpreadsheetImporter;
use App\Support\GranteeSpreadsheetImporter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmvRecordController extends Controller
{
    /**
     * Dashboard view with initial data for EMV Database and Grantees.
     */
    public function dashboard(): Response
    {
        @ini_set('memory_limit', '1024M');

        EmvRecord::ensureTableExists();
        GranteeList::ensureTableExists();
        PayrollRecord::ensureTableExists();

        // Cached summary statistics (refreshed every 10 minutes for sub-1ms response)
        $dashboardMetrics = Cache::remember('dashboard_system_metrics_v3', 600, function () {
            $emvTotal = EmvRecord::count();
            $emvClaimed = EmvRecord::where('distribution_status', 'like', 'Claimed%')->count();
            $emvUnclaimed = max(0, $emvTotal - $emvClaimed);
            $emvRcct = EmvRecord::where('cct_type', 'like', '%RCCT%')->count();
            $emvMcct = EmvRecord::where('cct_type', 'like', '%MCCT%')->count();

            $granteeTotal = GranteeList::count();
            $granteeActive = GranteeList::where('client_status', 'like', '%Active%')->count();
            $granteeGraduated = GranteeList::where('client_status', 'like', '%Graduated%')->count();
            $granteeOther = max(0, $granteeTotal - $granteeActive - $granteeGraduated);

            $payrollTotal = PayrollRecord::count();
            $payrollGross = (float) PayrollRecord::sum('gross_amount');
            $payrollNet = (float) PayrollRecord::sum('net_amount');

            $topMunicipalities = DB::table('emv_database')
                ->select('municipality', DB::raw('count(*) as count'))
                ->whereNotNull('municipality')
                ->where('municipality', '!=', '')
                ->groupBy('municipality')
                ->orderByDesc('count')
                ->limit(8)
                ->get();

            return [
                'emv' => [
                    'total' => $emvTotal,
                    'claimed' => $emvClaimed,
                    'unclaimed' => $emvUnclaimed,
                    'rcct' => $emvRcct,
                    'mcct' => $emvMcct,
                    'claimedPercentage' => $emvTotal > 0 ? round(($emvClaimed / $emvTotal) * 100, 1) : 0,
                ],
                'grantee' => [
                    'total' => $granteeTotal,
                    'active' => $granteeActive,
                    'graduated' => $granteeGraduated,
                    'other' => $granteeOther,
                    'activePercentage' => $granteeTotal > 0 ? round(($granteeActive / $granteeTotal) * 100, 1) : 0,
                ],
                'payroll' => [
                    'total' => $payrollTotal,
                    'gross' => $payrollGross,
                    'net' => $payrollNet,
                    'withholdings' => max(0, $payrollGross - $payrollNet),
                    'period' => 'Period 4 (2026)',
                ],
                'topMunicipalities' => $topMunicipalities,
            ];
        });

        // Query live service requests
        $reqTotal = Schema::hasTable('household_requests') ? DB::table('household_requests')->count() : 0;
        $reqPending = Schema::hasTable('household_requests')
            ? DB::table('household_requests')->whereRaw('LOWER(status) = ?', ['pending'])->count()
            : 0;
        $dashboardMetrics['requests'] = [
            'total' => $reqTotal,
            'pending' => $reqPending,
        ];

        // Query live record counts across the 8 standard service request modules
        $moduleCounts = InquiryController::getModuleCounts();
        $dashboardMetrics['moduleCounts'] = $moduleCounts;

        // Query recent requests from household_requests
        $dashboardMetrics['recentRequests'] = Schema::hasTable('household_requests')
            ? DB::table('household_requests')
                ->orderByDesc('id')
                ->limit(8)
                ->get()
            : [];

        // Cache filter dropdown lists so page loads instantly
        $filters = Cache::remember('dashboard_filter_lists_v1', 1800, function () {
            return [
                'emvMunicipalities' => EmvRecord::select('municipality')->whereNotNull('municipality')->where('municipality', '!=', '')->distinct()->orderBy('municipality')->pluck('municipality'),
                'emvCctTypes' => EmvRecord::select('cct_type')->whereNotNull('cct_type')->where('cct_type', '!=', '')->distinct()->orderBy('cct_type')->pluck('cct_type'),
                'emvBranches' => EmvRecord::select('lbp_servicing_branch')->whereNotNull('lbp_servicing_branch')->where('lbp_servicing_branch', '!=', '')->distinct()->orderBy('lbp_servicing_branch')->pluck('lbp_servicing_branch'),
                'granteeMunicipalities' => GranteeList::select('municipality')->whereNotNull('municipality')->where('municipality', '!=', '')->distinct()->orderBy('municipality')->pluck('municipality'),
                'granteeHhSets' => GranteeList::select('hh_set')->whereNotNull('hh_set')->where('hh_set', '!=', '')->distinct()->orderBy('hh_set')->pluck('hh_set'),
                'granteePaymentModesCount' => GranteeList::select('payment_mode')->whereNotNull('payment_mode')->where('payment_mode', '!=', '')->distinct()->count(),
                'payrollMunicipalities' => PayrollRecord::select('municipality')->whereNotNull('municipality')->where('municipality', '!=', '')->distinct()->orderBy('municipality')->pluck('municipality'),
                'payrollPeriods' => PayrollRecord::select('period')->whereNotNull('period')->where('period', '!=', '')->distinct()->orderBy('period')->pluck('period'),
                'payrollYears' => PayrollRecord::select('year')->whereNotNull('year')->where('year', '!=', '')->distinct()->orderBy('year')->pluck('year'),
                'payrollHhSets' => PayrollRecord::select('hh_set')->whereNotNull('hh_set')->where('hh_set', '!=', '')->distinct()->orderBy('hh_set')->pluck('hh_set'),
            ];
        });

        $initialEmvRecords = EmvRecord::query()
            ->orderBy('id', 'asc')
            ->limit(12)
            ->get()
            ->map(fn (EmvRecord $record) => $this->toFrontendRecord($record));

        $payrollController = new PayrollController();
        $initialPayrollRecords = PayrollRecord::query()
            ->orderBy('id', 'asc')
            ->limit(10)
            ->get()
            ->map(fn (PayrollRecord $rec) => $payrollController->toFrontendRecord($rec));

        return Inertia::render('Home', [
            'dashboardMetrics' => $dashboardMetrics,
            'moduleCounts' => $moduleCounts,
            'emvRecords' => $initialEmvRecords,
            'emvTotalCount' => $dashboardMetrics['emv']['total'],
            'emvClaimedCount' => $dashboardMetrics['emv']['claimed'],
            'emvMunicipalities' => $filters['emvMunicipalities'],
            'emvCctTypes' => $filters['emvCctTypes'],
            'emvBranches' => $filters['emvBranches'],
            'grantees' => GranteeList::query()
                ->orderBy('id', 'asc')
                ->limit(10)
                ->get()
                ->map(fn (GranteeList $grantee) => $this->toFrontendGrantee($grantee)),
            'granteeTotalCount' => $dashboardMetrics['grantee']['total'],
            'granteeActiveCount' => $dashboardMetrics['grantee']['active'],
            'granteeMunicipalities' => $filters['granteeMunicipalities'],
            'granteeHhSets' => $filters['granteeHhSets'],
            'granteePaymentModesCount' => $filters['granteePaymentModesCount'],
            'payrollRecords' => $initialPayrollRecords,
            'payrollTotalCount' => $dashboardMetrics['payroll']['total'],
            'payrollGrossTotal' => $dashboardMetrics['payroll']['gross'],
            'payrollNetTotal' => $dashboardMetrics['payroll']['net'],
            'payrollMunicipalities' => $filters['payrollMunicipalities'],
            'payrollPeriods' => $filters['payrollPeriods'],
            'payrollYears' => $filters['payrollYears'],
            'payrollHhSets' => $filters['payrollHhSets'],
            'moduleCounts' => $moduleCounts,
            'users' => User::query()
                ->latest()
                ->get()
                ->map(fn (User $user) => $this->toFrontendUser($user)),
        ]);
    }

    /**
     * Search and paginate EMV records with sub-15ms database indexed queries.
     */
    public function search(Request $request): JsonResponse
    {
        EmvRecord::ensureTableExists();

        $q = trim((string) $request->input('q', $request->input('search', '')));
        $page = max(1, (int) $request->input('page', 1));
        $perPage = min(100, max(5, (int) $request->input('per_page', $request->input('limit', 10))));
        $status = trim((string) $request->input('status', $request->input('distribution_status', 'All')));
        $municipality = trim((string) $request->input('municipality', 'All'));
        $cctType = trim((string) $request->input('cct_type', 'All'));
        $sortKey = trim((string) $request->input('sort_key', 'id'));
        $sortDirection = strtolower((string) $request->input('sort_direction', 'asc')) === 'desc' ? 'desc' : 'asc';

        $query = EmvRecord::query();

        if ($q !== '') {
            $query->where(function ($builder) use ($q) {
                $builder->where('hh_id', 'like', "%{$q}%")
                    ->orWhere('lbp_account', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('first_name', 'like', "%{$q}%")
                    ->orWhere('mid_name', 'like', "%{$q}%")
                    ->orWhere('municipality', 'like', "%{$q}%")
                    ->orWhere('barangay', 'like', "%{$q}%")
                    ->orWhere('lbp_servicing_branch', 'like', "%{$q}%")
                    ->orWhere('item_no', 'like', "%{$q}%");
            });
        }

        if ($status !== '' && strtolower($status) !== 'all') {
            if (strtolower($status) === 'claimed') {
                $query->where('distribution_status', 'like', '%Claimed%');
            } elseif (strtolower($status) === 'unclaimed') {
                $query->where('distribution_status', 'like', '%Unclaimed%');
            } else {
                $query->where('distribution_status', $status);
            }
        }

        if ($municipality !== '' && strtolower($municipality) !== 'all') {
            $query->where('municipality', $municipality);
        }

        if ($cctType !== '' && strtolower($cctType) !== 'all') {
            $query->where('cct_type', $cctType);
        }

        $allowedSortColumns = EmvRecord::COLUMNS;
        $allowedSortColumns[] = 'id';
        if (! in_array($sortKey, $allowedSortColumns, true)) {
            $sortKey = 'id';
        }

        $hasFilters = ($q !== '' || (strtolower($status) !== 'all' && $status !== '') || (strtolower($municipality) !== 'all' && $municipality !== '') || (strtolower($cctType) !== 'all' && $cctType !== ''));

        $totalInDatabase = EmvRecord::count();
        $totalFiltered = $hasFilters ? (clone $query)->count() : $totalInDatabase;

        $records = $query->orderBy($sortKey, $sortDirection)
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn (EmvRecord $record) => $this->toFrontendRecord($record));

        return response()->json([
            'data' => $records,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $totalFiltered,
            'total_in_database' => $totalInDatabase,
            'claimed_count' => EmvRecord::where('distribution_status', 'like', '%Claimed%')->count(),
            'last_page' => max(1, (int) ceil($totalFiltered / $perPage)),
            'from' => $totalFiltered > 0 ? ($page - 1) * $perPage + 1 : 0,
            'to' => min($page * $perPage, $totalFiltered),
        ]);
    }

    /**
     * Start EMV spreadsheet import with live progress tracking and low RAM streaming.
     */
    public function import(Request $request, EmvSpreadsheetImporter $importer): JsonResponse|RedirectResponse
    {
        @ini_set('memory_limit', '1024M');
        @set_time_limit(600);

        try {
            $validated = $request->validate([
                'file' => ['required', 'file', 'max:524288'],
            ], [
                'file.max' => 'The uploaded file is too large (maximum allowed size is 512 MB).',
                'file.required' => 'Please select a file to import.',
            ]);

            $file = $validated['file'];
            $originalName = $file->getClientOriginalName();
            $extension = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'xlsx');
            $fileSize = $file->getSize() ?: 0;

            $allowedExtensions = ['csv', 'txt', 'xlsx', 'xls', 'xml'];
            if (! in_array($extension, $allowedExtensions, true)) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'file' => "The uploaded file format (.{$extension}) is not supported. Please upload a valid CSV, TXT, XLSX, XLS, or XML spreadsheet.",
                ]);
            }

            EmvImport::ensureTablesExist();
            EmvRecord::ensureTableExists();

            $importsDir = storage_path('app/imports');
            if (! is_dir($importsDir)) {
                @mkdir($importsDir, 0777, true);
            }

            $storageFilename = 'emv_' . time() . '_' . Str::random(10) . '.' . $extension;
            $destinationPath = $importsDir . DIRECTORY_SEPARATOR . $storageFilename;

            $file->move($importsDir, $storageFilename);

            if (! file_exists($destinationPath)) {
                return $request->wantsJson() || $request->header('Accept') === 'application/json' || $request->ajax()
                    ? response()->json(['error' => 'Failed to save uploaded file on server disk.'], 500)
                    : redirect()->back()->with('error', 'Failed to save uploaded file on server disk.');
            }

            // Estimate total rows in constant time
            $estimatedTotal = $importer->estimateTotalRows($destinationPath, $extension);

            // Create tracking record
            $importRecord = EmvImport::create([
                'filename' => $originalName,
                'file_path' => $destinationPath,
                'file_size' => $fileSize,
                'extension' => $extension,
                'status' => 'pending',
                'total_rows' => $estimatedTotal,
                'processed_rows' => 0,
                'imported_count' => 0,
                'updated_count' => 0,
                'percentage' => 0.00,
            ]);

            // Dispatch to Laravel queue
            try {
                ImportEmvJob::dispatch($importRecord->id);
                $this->triggerBackgroundQueueWorker();
            } catch (\Throwable $e) {
                Log::warning('Could not dispatch ImportEmvJob to queue: ' . $e->getMessage());
            }

            if ($request->wantsJson() || $request->header('Accept') === 'application/json' || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'importId' => $importRecord->id,
                    'filename' => $originalName,
                    'totalRows' => $estimatedTotal,
                    'message' => 'File uploaded successfully. Processing in queue/background.',
                ]);
            }

            return redirect()
                ->back()
                ->with('importId', $importRecord->id)
                ->with('message', "Import initiated for {$originalName} (ID #{$importRecord->id}). Processing in queue...");
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errorMsg = collect($e->errors())->flatten()->implode(', ') ?: $e->getMessage();
            Log::warning('EMV import validation error: ' . $errorMsg);

            if ($request->wantsJson() || $request->header('Accept') === 'application/json' || $request->ajax()) {
                return response()->json([
                    'error' => $errorMsg,
                    'errors' => $e->errors(),
                ], 422);
            }

            return redirect()->back()->with('error', $errorMsg)->withErrors($e->errors());
        } catch (\Throwable $e) {
            Log::error('EMV import submission error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);

            if ($request->wantsJson() || $request->header('Accept') === 'application/json' || $request->ajax()) {
                return response()->json(['error' => 'Import submission failed: ' . $e->getMessage()], 500);
            }

            return redirect()->back()->with('error', 'Import failed: ' . $e->getMessage());
        }
    }

    /**
     * Get live progress status of an import job.
     */
    public function status(int $id): JsonResponse
    {
        EmvImport::ensureTablesExist();

        $import = EmvImport::find($id);

        if (! $import) {
            return response()->json(['error' => 'Import job not found.'], 404);
        }

        return response()->json([
            'id' => $import->id,
            'filename' => $import->filename,
            'status' => $import->status,
            'total_rows' => $import->total_rows,
            'processed_rows' => $import->processed_rows,
            'imported_count' => $import->imported_count,
            'updated_count' => $import->updated_count,
            'percentage' => (float) $import->percentage,
            'error_message' => $import->error_message,
            'started_at' => optional($import->started_at)->toIso8601String(),
            'completed_at' => optional($import->completed_at)->toIso8601String(),
        ]);
    }

    /**
     * Process a batch chunk directly (browser worker pump if queue:work is not running).
     */
    public function processBatch(Request $request, int $id, EmvSpreadsheetImporter $importer): JsonResponse
    {
        @ini_set('memory_limit', '1024M');
        @set_time_limit(120);

        EmvImport::ensureTablesExist();
        EmvRecord::ensureTableExists();

        $import = EmvImport::find($id);

        if (! $import) {
            return response()->json(['error' => 'Import job not found.'], 404);
        }

        if ($import->status === 'completed') {
            return response()->json([
                'id' => $import->id,
                'status' => 'completed',
                'percentage' => 100.0,
                'processed_rows' => $import->processed_rows,
                'total_rows' => $import->total_rows,
                'imported_count' => $import->imported_count,
                'updated_count' => $import->updated_count,
            ]);
        }

        if (! file_exists($import->file_path)) {
            $import->update([
                'status' => 'failed',
                'error_message' => 'The import file does not exist on the server disk.',
            ]);

            return response()->json([
                'id' => $import->id,
                'status' => 'failed',
                'error_message' => 'File missing from server.',
            ], 400);
        }

        $import->update([
            'status' => 'processing',
            'started_at' => $import->started_at ?? now(),
        ]);

        $batchSize = 1000;
        $offset = $import->processed_rows;
        $chunk = [];

        try {
            foreach ($importer->streamNormalizedRows($import->file_path, $import->extension, $offset, $batchSize) as $row) {
                $chunk[] = $row;
            }

            $countInChunk = count($chunk);

            if ($countInChunk > 0) {
                [$chunkImported, $chunkUpdated] = ImportEmvJob::processChunk($chunk);

                $newProcessed = $import->processed_rows + $countInChunk;
                $newImported = $import->imported_count + $chunkImported;
                $newUpdated = $import->updated_count + $chunkUpdated;

                $total = max($import->total_rows, $newProcessed);
                $pct = $total > 0 ? min(99.5, round(($newProcessed / $total) * 100, 1)) : 0.0;

                $import->update([
                    'processed_rows' => $newProcessed,
                    'imported_count' => $newImported,
                    'updated_count' => $newUpdated,
                    'total_rows' => $total,
                    'percentage' => $pct,
                ]);

                if ($countInChunk < $batchSize) {
                    $import->update([
                        'status' => 'completed',
                        'total_rows' => $newProcessed,
                        'percentage' => 100.0,
                        'completed_at' => now(),
                    ]);

                    if (file_exists($import->file_path)) {
                        @unlink($import->file_path);
                    }
                    $importer->cleanExtractDir($import->file_path);
                }
            } else {
                $import->update([
                    'status' => 'completed',
                    'total_rows' => $import->processed_rows,
                    'percentage' => 100.0,
                    'completed_at' => now(),
                ]);

                if (file_exists($import->file_path)) {
                    @unlink($import->file_path);
                }
                $importer->cleanExtractDir($import->file_path);
            }

            $fresh = $import->fresh();

            return response()->json([
                'id' => $fresh->id,
                'status' => $fresh->status,
                'percentage' => (float) $fresh->percentage,
                'processed_rows' => $fresh->processed_rows,
                'total_rows' => $fresh->total_rows,
                'imported_count' => $fresh->imported_count,
                'updated_count' => $fresh->updated_count,
            ]);
        } catch (\Throwable $e) {
            Log::error('Batch processing error for EMV import #' . $import->id . ': ' . $e->getMessage());

            $import->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return response()->json([
                'id' => $import->id,
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Stream export of all EMV records with all 21 columns and UTF-8 BOM.
     */
    public function export(Request $request): StreamedResponse
    {
        @ini_set('memory_limit', '1024M');
        @set_time_limit(3600);
        EmvRecord::ensureTableExists();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="emv_database_all_21_columns_' . date('Y-m-d_His') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $columns = EmvRecord::COLUMNS;
        $headerLabels = [
            'item no.',
            'region',
            'province',
            'municipality',
            'barangay',
            'hh_id',
            'lbp_account',
            'run_date',
            'first_name',
            'mid_name',
            'last_name',
            'acct_description',
            'cct_type',
            'lbp_servicing_branch',
            'distribution_status',
            'date_claimed',
            'reason_why_unclaimed',
            'recommended_action',
            'action_taken',
            'date_acted',
            'agreed_distribution_date',
        ];

        return response()->stream(function () use ($columns, $headerLabels) {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF"); // UTF-8 BOM
            fputcsv($handle, $headerLabels);

            EmvRecord::query()->orderBy('id')->chunk(1000, function ($records) use ($handle, $columns) {
                foreach ($records as $record) {
                    $row = [];
                    foreach ($columns as $col) {
                        $row[] = (string) ($record->{$col} ?? '');
                    }
                    fputcsv($handle, $row);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Launch background queue worker process.
     */
    private function triggerBackgroundQueueWorker(): void
    {
        try {
            $artisan = base_path('artisan');
            $phpBinary = PHP_BINARY;
            if (! is_file($phpBinary) || str_contains($phpBinary, 'httpd') || str_contains($phpBinary, 'apache')) {
                $phpBinary = 'php';
            }

            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                $cmd = sprintf(
                    'start /B "" "%s" "%s" queue:work --stop-when-empty --memory=1024 --timeout=3600 > NUL 2>&1',
                    $phpBinary,
                    $artisan
                );
                pclose(popen($cmd, 'r'));
            } else {
                $cmd = sprintf(
                    '"%s" "%s" queue:work --stop-when-empty --memory=1024 --timeout=3600 > /dev/null 2>&1 &',
                    $phpBinary,
                    $artisan
                );
                @exec($cmd);
            }
        } catch (\Throwable $e) {
            Log::info('Background queue worker trigger skipped or failed: ' . $e->getMessage());
        }
    }

    /**
     * Convert an EmvRecord model instance to frontend array.
     *
     * @return array<string, mixed>
     */
    private function toFrontendRecord(EmvRecord $record): array
    {
        return [
            'id' => $record->id,
            'item_no' => (string) ($record->item_no ?? ''),
            'region' => (string) ($record->region ?? ''),
            'province' => (string) ($record->province ?? ''),
            'municipality' => (string) ($record->municipality ?? ''),
            'barangay' => (string) ($record->barangay ?? ''),
            'hh_id' => (string) ($record->hh_id ?? ''),
            'lbp_account' => (string) ($record->lbp_account ?? ''),
            'run_date' => (string) (EmvSpreadsheetImporter::normalizeDateValue($record->run_date) ?? ''),
            'first_name' => (string) ($record->first_name ?? ''),
            'mid_name' => (string) ($record->mid_name ?? ''),
            'last_name' => (string) ($record->last_name ?? ''),
            'acct_description' => (string) ($record->acct_description ?? ''),
            'cct_type' => (string) ($record->cct_type ?? ''),
            'lbp_servicing_branch' => (string) ($record->lbp_servicing_branch ?? ''),
            'distribution_status' => (string) ($record->distribution_status ?? ''),
            'date_claimed' => (string) (EmvSpreadsheetImporter::normalizeDateValue($record->date_claimed) ?? ''),
            'reason_why_unclaimed' => (string) ($record->reason_why_unclaimed ?? ''),
            'recommended_action' => (string) ($record->recommended_action ?? ''),
            'action_taken' => (string) ($record->action_taken ?? ''),
            'date_acted' => (string) (EmvSpreadsheetImporter::normalizeDateValue($record->date_acted) ?? ''),
            'agreed_distribution_date' => (string) (EmvSpreadsheetImporter::normalizeDateValue($record->agreed_distribution_date) ?? ''),
            'createdAt' => optional($record->created_at)->format('M d, Y'),
            'updatedAt' => optional($record->updated_at)->format('M d, Y'),
        ];
    }

    /**
     * Convert User model to frontend format.
     *
     * @return array<string, mixed>
     */
    private function toFrontendUser(User $user): array
    {
        return [
            'id' => $user->id,
            'employeeId' => $user->employee_id,
            'idNumber' => $user->id_number,
            'name' => $user->name,
            'email' => $user->email,
            'username' => $user->username,
            'avatar' => $user->avatar,
            'position' => $user->position,
            'employmentStatus' => $user->empstatus,
            'portalStatus' => $user->portal_status,
            'division' => $user->division,
            'section' => $user->section,
            'areaOfAssignment' => $user->area_of_assignment,
            'contactNumber' => $user->contact_number,
            'lastLogin' => optional($user->updated_at)->format('M d, Y h:i A'),
        ];
    }

    /**
     * Convert GranteeList model to frontend format.
     *
     * @return array<string, mixed>
     */
    private function toFrontendGrantee(GranteeList $grantee): array
    {
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
            'birthday' => (string) (GranteeSpreadsheetImporter::normalizeDateValue($grantee->birthday) ?? ''),
            'hh_grantee' => (string) ($grantee->hh_grantee ?? ''),
            'current_age' => (string) ($grantee->current_age ?? ''),
            'age' => (string) ($grantee->age ?? ''),
            'sex' => (string) ($grantee->sex ?? ''),
            'old_client_status' => (string) ($grantee->old_client_status ?? ''),
            'client_status' => (string) ($grantee->client_status ?? ''),
            'date_tagged' => (string) (GranteeSpreadsheetImporter::normalizeDateValue($grantee->date_tagged) ?? ''),
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
            'date_of_enumeration' => (string) (GranteeSpreadsheetImporter::normalizeDateValue($grantee->date_of_enumeration) ?? ''),
            'date_registered' => (string) (GranteeSpreadsheetImporter::normalizeDateValue($grantee->date_registered) ?? ''),
            'date_registered_v2' => (string) (GranteeSpreadsheetImporter::normalizeDateValue($grantee->date_registered_v2) ?? ''),
            'family_id' => (string) ($grantee->family_id ?? ''),
            'rel_to_fam_head' => (string) ($grantee->rel_to_fam_head ?? ''),
            'selected_family' => (string) ($grantee->selected_family ?? ''),
            'final_l3_result' => (string) ($grantee->final_l3_result ?? ''),
            'createdAt' => optional($grantee->created_at)->format('M d, Y'),
            'updatedAt' => optional($grantee->updated_at)->format('M d, Y'),
        ];
    }
}
