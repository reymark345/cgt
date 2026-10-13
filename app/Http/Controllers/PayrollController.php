<?php

namespace App\Http\Controllers;

use App\Jobs\ImportPayrollJob;
use App\Models\PayrollImport;
use App\Models\PayrollRecord;
use App\Support\PayrollSpreadsheetImporter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PayrollController extends Controller
{
    /**
     * Start payroll import.
     */
    public function import(Request $request, PayrollSpreadsheetImporter $importer): JsonResponse|RedirectResponse
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

            PayrollImport::ensureTablesExist();
            PayrollRecord::ensureTableExists();

            $importsDir = storage_path('app/imports');
            if (! is_dir($importsDir)) {
                @mkdir($importsDir, 0777, true);
            }

            $storageFilename = 'payroll_' . time() . '_' . Str::random(10) . '.' . $extension;
            $destinationPath = $importsDir . DIRECTORY_SEPARATOR . $storageFilename;

            $file->move($importsDir, $storageFilename);

            if (! file_exists($destinationPath)) {
                return $request->wantsJson() || $request->header('Accept') === 'application/json' || $request->ajax()
                    ? response()->json(['error' => 'Failed to save uploaded file on server disk.'], 500)
                    : redirect()->back()->with('error', 'Failed to save uploaded file on server disk.');
            }

            $estimatedTotal = $importer->estimateTotalRows($destinationPath, $extension);

            $importRecord = PayrollImport::create([
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

            try {
                ImportPayrollJob::dispatch($importRecord->id);
                $this->triggerBackgroundQueueWorker();
            } catch (\Throwable $e) {
                Log::warning('Could not dispatch ImportPayrollJob to queue: ' . $e->getMessage());
            }

            if ($request->wantsJson() || $request->header('Accept') === 'application/json' || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'importId' => $importRecord->id,
                    'filename' => $originalName,
                    'totalRows' => $estimatedTotal,
                    'message' => 'File uploaded successfully. Processing payroll records in queue/background.',
                ]);
            }

            return redirect()
                ->back()
                ->with('importId', $importRecord->id)
                ->with('message', "Import initiated for {$originalName} (ID #{$importRecord->id}). Processing in queue...");
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errorMsg = collect($e->errors())->flatten()->implode(', ') ?: $e->getMessage();
            Log::warning('Payroll import validation error: ' . $errorMsg);

            if ($request->wantsJson() || $request->header('Accept') === 'application/json' || $request->ajax()) {
                return response()->json([
                    'error' => $errorMsg,
                    'errors' => $e->errors(),
                ], 422);
            }

            return redirect()->back()->with('error', $errorMsg)->withErrors($e->errors());
        } catch (\Throwable $e) {
            Log::error('Payroll import submission error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);

            if ($request->wantsJson() || $request->header('Accept') === 'application/json' || $request->ajax()) {
                return response()->json(['error' => 'Import submission failed: ' . $e->getMessage()], 500);
            }

            return redirect()->back()->with('error', 'Import failed: ' . $e->getMessage());
        }
    }

    /**
     * Get live progress status of a payroll import job.
     */
    public function status(int $id): JsonResponse
    {
        PayrollImport::ensureTablesExist();

        $import = PayrollImport::find($id);

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
     * Process a batch chunk directly (acts as a browser worker pump if queue:work is not running).
     */
    public function processBatch(Request $request, int $id, PayrollSpreadsheetImporter $importer): JsonResponse
    {
        @ini_set('memory_limit', '1024M');
        @set_time_limit(120);

        PayrollImport::ensureTablesExist();
        PayrollRecord::ensureTableExists();

        $import = PayrollImport::find($id);

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
                [$chunkImported, $chunkUpdated] = ImportPayrollJob::processChunk($chunk);

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
                    EmvRecordController::clearMetricsCache();
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
                EmvRecordController::clearMetricsCache();
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
            Log::error('Batch processing error for payroll import #' . $import->id . ': ' . $e->getMessage());

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
     * Search and paginate payroll records dynamically with database indexing.
     */
    public function search(Request $request): JsonResponse
    {
        PayrollRecord::ensureTableExists();

        $q = trim((string) $request->input('q', ''));
        $page = max(1, (int) $request->input('page', 1));
        $perPage = min(100, max(5, (int) $request->input('per_page', $request->input('limit', 10))));
        $period = trim((string) $request->input('period', 'All'));
        $year = trim((string) $request->input('year', 'All'));
        $municipality = trim((string) $request->input('municipality', 'All'));
        $hhSet = trim((string) $request->input('hh_set', 'All'));
        $paymentMode = trim((string) $request->input('payment_mode', 'All'));
        $status = trim((string) $request->input('status', 'All'));
        $sortKey = trim((string) $request->input('sort_key', 'id'));
        $sortDirection = strtolower((string) $request->input('sort_direction', 'asc')) === 'desc' ? 'desc' : 'asc';

        $query = PayrollRecord::query();

        if ($q !== '') {
            $query->where(function ($builder) use ($q) {
                $builder->where('household_id', 'like', "%{$q}%")
                    ->orWhere('account_number', 'like', "%{$q}%")
                    ->orWhere('new_account_number', 'like', "%{$q}%")
                    ->orWhere('status', 'like', "%{$q}%")
                    ->orWhere('reason', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('first_name', 'like', "%{$q}%")
                    ->orWhere('middle_name', 'like', "%{$q}%")
                    ->orWhere('municipality', 'like', "%{$q}%")
                    ->orWhere('barangay', 'like', "%{$q}%")
                    ->orWhere('payroll_description', 'like', "%{$q}%");
            });
        }

        if ($period !== '' && strtolower($period) !== 'all') {
            $query->where('period', $period);
        }

        if ($year !== '' && strtolower($year) !== 'all') {
            $query->where('year', $year);
        }

        if ($municipality !== '' && strtolower($municipality) !== 'all') {
            $query->where('municipality', $municipality);
        }

        if ($hhSet !== '' && strtolower($hhSet) !== 'all') {
            $query->where('hh_set', $hhSet);
        }

        if ($status !== '' && strtolower($status) !== 'all') {
            $query->where('status', $status);
        }

        if ($paymentMode !== '' && strtolower($paymentMode) !== 'all') {
            $query->where(function ($b) use ($paymentMode) {
                $b->where('payment_mode_classification', $paymentMode)
                  ->orWhere('mode_of_payment', 'like', "%{$paymentMode}%");
            });
        }

        $allowedSortColumns = PayrollRecord::COLUMNS;
        $allowedSortColumns[] = 'id';
        if (! in_array($sortKey, $allowedSortColumns, true)) {
            $sortKey = 'id';
        }

        $hasFilters = ($q !== '' || (strtolower($period) !== 'all' && $period !== '') || (strtolower($year) !== 'all' && $year !== '') || (strtolower($municipality) !== 'all' && $municipality !== '') || (strtolower($hhSet) !== 'all' && $hhSet !== '') || (strtolower($status) !== 'all' && $status !== '') || (strtolower($paymentMode) !== 'all' && $paymentMode !== ''));

        $totalInDatabase = PayrollRecord::count();
        $totalFiltered = $hasFilters ? (clone $query)->count() : $totalInDatabase;

        $records = $query->orderBy($sortKey, $sortDirection)
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn (PayrollRecord $record) => $this->toFrontendRecord($record));

        $grossTotal = (float) PayrollRecord::sum('gross_amount');
        $netTotal = (float) PayrollRecord::sum('net_amount');

        return response()->json([
            'data' => $records,
            'total' => $totalFiltered,
            'db_total' => $totalInDatabase,
            'total_in_database' => $totalInDatabase,
            'gross_total' => $grossTotal,
            'net_total' => $netTotal,
            'current_page' => $page,
            'last_page' => $totalFiltered > 0 ? (int) ceil($totalFiltered / $perPage) : 1,
            'per_page' => $perPage,
        ]);
    }

    /**
     * Update status, reason, or new_account_number for a payroll record.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        PayrollRecord::ensureTableExists();

        $record = PayrollRecord::find($id);
        if (! $record) {
            return response()->json(['error' => 'Payroll record not found.'], 404);
        }

        $validated = $request->validate([
            'new_account_number' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:50'],
            'reason' => ['nullable', 'string'],
        ]);

        $targetStatus = $request->has('status')
            ? ($validated['status'] !== null ? trim((string) $validated['status']) : null)
            : $record->status;

        if ($targetStatus === 'Reject') {
            $reasonVal = $request->has('reason')
                ? ($validated['reason'] !== null ? trim((string) $validated['reason']) : '')
                : (string) ($record->reason ?? '');

            if ($reasonVal === '') {
                return response()->json([
                    'error' => 'Reason / Remarks is required when the status is Reject.',
                    'message' => 'Reason / Remarks is required when the status is Reject.',
                ], 422);
            }
        }

        $dataToUpdate = [];
        if ($request->has('new_account_number')) {
            $dataToUpdate['new_account_number'] = $validated['new_account_number'] !== null ? trim((string) $validated['new_account_number']) : null;
        }
        if ($request->has('status')) {
            $dataToUpdate['status'] = $targetStatus;
        }
        if ($request->has('reason')) {
            $dataToUpdate['reason'] = $validated['reason'] !== null ? trim((string) $validated['reason']) : null;
        }

        if (! empty($dataToUpdate)) {
            $record->update($dataToUpdate);
        }

        return response()->json([
            'success' => true,
            'message' => 'Payroll record updated successfully.',
            'data' => $this->toFrontendRecord($record->fresh()),
        ]);
    }

    /**
     * Export all payroll database records as CSV streamed directly from MySQL.
     */
    public function export(Request $request): StreamedResponse
    {
        @ini_set('memory_limit', '1024M');
        @set_time_limit(3600);

        PayrollRecord::ensureTableExists();

        $columns = PayrollRecord::COLUMNS;
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="payroll_all_columns_' . date('Y-m-d') . '.csv"',
            'Cache-Control' => 'no-store, no-cache',
        ];

        return response()->stream(function () use ($columns) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Header labels in uppercase
            $labels = array_map(fn ($c) => strtoupper(str_replace('_', ' ', $c)), $columns);
            fputcsv($handle, $labels);

            $query = PayrollRecord::query()->orderBy('id', 'asc');

            $query->chunk(2000, function ($records) use ($handle, $columns) {
                foreach ($records as $record) {
                    $row = [];
                    foreach ($columns as $col) {
                        $row[] = (string) ($record->{$col} ?? '');
                    }
                    fputcsv($handle, $row);
                }
                flush();
            });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Map PayrollRecord to JSON array for frontend.
     */
    public function toFrontendRecord(PayrollRecord $record): array
    {
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
    }

    /**
     * Trigger background worker asynchronously.
     */
    private function triggerBackgroundQueueWorker(): void
    {
        try {
            $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
            $artisan = base_path('artisan');

            if ($isWindows) {
                pclose(popen("start /B php \"{$artisan}\" queue:work --stop-when-empty --tries=1 > NUL 2>&1", 'r'));
            } else {
                exec("php \"{$artisan}\" queue:work --stop-when-empty --tries=1 > /dev/null 2>&1 &");
            }
        } catch (\Throwable $e) {
            Log::debug('Background queue worker launch skipped: ' . $e->getMessage());
        }
    }
}
