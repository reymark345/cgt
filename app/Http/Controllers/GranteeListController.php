<?php

namespace App\Http\Controllers;

use App\Jobs\ImportGranteeJob;
use App\Models\GranteeImport;
use App\Models\GranteeList;
use App\Support\GranteeSpreadsheetImporter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class GranteeListController extends Controller
{
    /**
     * Start grantee import.
     * Queues the import for asynchronous processing and tracks live progress.
     */
    public function import(Request $request, GranteeSpreadsheetImporter $importer): JsonResponse|RedirectResponse
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

            GranteeImport::ensureTablesExist();
            GranteeList::ensureTableExists();

            // Store file in persistent imports directory
            $importsDir = storage_path('app/imports');
            if (! is_dir($importsDir)) {
                @mkdir($importsDir, 0777, true);
            }

            $storageFilename = 'grantee_' . time() . '_' . Str::random(10) . '.' . $extension;
            $destinationPath = $importsDir . DIRECTORY_SEPARATOR . $storageFilename;

            // Move uploaded file
            $file->move($importsDir, $storageFilename);

            if (! file_exists($destinationPath)) {
                return $request->wantsJson() || $request->header('Accept') === 'application/json' || $request->ajax()
                    ? response()->json(['error' => 'Failed to save uploaded file on server disk.'], 500)
                    : redirect()->back()->with('error', 'Failed to save uploaded file on server disk.');
            }

            // Estimate total rows in constant time
            $estimatedTotal = $importer->estimateTotalRows($destinationPath, $extension);

            // Create tracking record
            $importRecord = GranteeImport::create([
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
                ImportGranteeJob::dispatch($importRecord->id);
                $this->triggerBackgroundQueueWorker();
            } catch (\Throwable $e) {
                Log::warning('Could not dispatch ImportGranteeJob to queue: ' . $e->getMessage());
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
            Log::warning('Grantee import validation error: ' . $errorMsg);

            if ($request->wantsJson() || $request->header('Accept') === 'application/json' || $request->ajax()) {
                return response()->json([
                    'error' => $errorMsg,
                    'errors' => $e->errors(),
                ], 422);
            }

            return redirect()->back()->with('error', $errorMsg)->withErrors($e->errors());
        } catch (\Throwable $e) {
            Log::error('Grantee import submission error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);

            if ($request->wantsJson() || $request->header('Accept') === 'application/json' || $request->ajax()) {
                return response()->json(['error' => 'Import submission failed: ' . $e->getMessage()], 500);
            }

            return redirect()
                ->back()
                ->with('error', 'Import failed: ' . $e->getMessage());
        }
    }

    /**
     * Get live progress status of an import job.
     */
    public function status(int $id): JsonResponse
    {
        GranteeImport::ensureTablesExist();

        $import = GranteeImport::find($id);

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
     * Processes 1,000 rows in ~100ms with constant low memory (< 15MB).
     */
    public function processBatch(Request $request, int $id, GranteeSpreadsheetImporter $importer): JsonResponse
    {
        @ini_set('memory_limit', '1024M');
        @set_time_limit(120);

        GranteeImport::ensureTablesExist();
        GranteeList::ensureTableExists();

        $import = GranteeImport::find($id);

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
                [$chunkImported, $chunkUpdated] = ImportGranteeJob::processChunk($chunk);

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

                // If chunk was smaller than requested batch size, we reached EOF
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
                // Reached end of file
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
            Log::error('Batch processing error for import #' . $import->id . ': ' . $e->getMessage());

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
     * Search and paginate grantees dynamically with database indexing (supports 335k+ records smoothly).
     */
    public function search(Request $request): JsonResponse
    {
        GranteeList::ensureTableExists();

        $q = trim((string) $request->input('q', ''));
        $page = max(1, (int) $request->input('page', 1));
        $perPage = min(100, max(5, (int) $request->input('per_page', $request->input('limit', 10))));
        $status = trim((string) $request->input('status', 'All'));
        $municipality = trim((string) $request->input('municipality', 'All'));
        $hhSet = trim((string) $request->input('hh_set', 'All'));
        $sortKey = trim((string) $request->input('sort_key', 'id'));
        $sortDirection = strtolower((string) $request->input('sort_direction', 'asc')) === 'desc' ? 'desc' : 'asc';

        $query = GranteeList::query();

        if ($q !== '') {
            $query->where(function ($builder) use ($q) {
                $builder->where('hh_id', 'like', "%{$q}%")
                    ->orWhere('entry_id', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('first_name', 'like', "%{$q}%")
                    ->orWhere('middle_name', 'like', "%{$q}%")
                    ->orWhere('municipality', 'like', "%{$q}%")
                    ->orWhere('barangay', 'like', "%{$q}%")
                    ->orWhere('lbp_account', 'like', "%{$q}%");
            });
        }

        if ($status !== '' && strtolower($status) !== 'all') {
            if (strtolower($status) === 'active') {
                $query->where('client_status', 'like', '%Active%');
            } elseif (strtolower($status) === 'inactive') {
                $query->where('client_status', 'not like', '%Active%');
            } else {
                $query->where('client_status', $status);
            }
        }

        if ($municipality !== '' && strtolower($municipality) !== 'all') {
            $query->where('municipality', $municipality);
        }

        if ($hhSet !== '' && strtolower($hhSet) !== 'all') {
            $query->where('hh_set', $hhSet);
        }

        $allowedSortColumns = GranteeSpreadsheetImporter::COLUMNS;
        $allowedSortColumns[] = 'id';
        if (! in_array($sortKey, $allowedSortColumns, true)) {
            $sortKey = 'id';
        }

        $hasFilters = ($q !== '' || (strtolower($status) !== 'all' && $status !== '') || (strtolower($municipality) !== 'all' && $municipality !== '') || (strtolower($hhSet) !== 'all' && $hhSet !== ''));

        $totalInDatabase = GranteeList::count();
        $totalFiltered = $hasFilters ? (clone $query)->count() : $totalInDatabase;

        $records = $query->orderBy($sortKey, $sortDirection)
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(function ($grantee) {
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
            });

        return response()->json([
            'data' => $records,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $totalFiltered,
            'total_in_database' => $totalInDatabase,
            'last_page' => max(1, (int) ceil($totalFiltered / $perPage)),
            'from' => $totalFiltered > 0 ? ($page - 1) * $perPage + 1 : 0,
            'to' => min($page * $perPage, $totalFiltered),
        ]);
    }

    /**
     * Stream export of all grantee_list records with all 39 reference columns.
     */
    public function export(Request $request): StreamedResponse
    {
        @ini_set('memory_limit', '1024M');
        @set_time_limit(3600);
        GranteeList::ensureTableExists();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="grantee_list_all_39_columns_' . date('Y-m-d_His') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $columns = GranteeSpreadsheetImporter::COLUMNS;
        $headerLabels = [
            'REGION', 'PROVINCE', 'MUNICIPALITY', 'BARANGAY', 'PUROK', 'DISTRICT',
            'hh_id', 'ENTRY_ID', 'FIRST_NAME', 'MIDDLE_NAME', 'LAST_NAME', 'EXT_NAME',
            'MAIDEN_NAME', 'CONTACT_NUMBER', 'BIRTHDAY', 'HH_GRANTEE', 'CURRENT_AGE',
            'AGE', 'SEX', 'OLD_CLIENT_STATUS', 'CLIENT_STATUS', 'DATE_TAGGED',
            'TAGGED_BY', 'CS_CATEGORY', 'MEMBER_STATUS', 'RELATION_TO_HH', 'HH_SET',
            'REGISTRATION_STATUS', 'IP_LABEL', 'IP_STATUS', 'PAYMENT_MODE', 'LBP_ACCOUNT',
            'DATE_OF_ENUMERATION', 'DATE_REGISTERED', 'DATE_REGISTERED_V2', 'FAMILY_ID',
            'REL_TO_FAM_HEAD', 'SELECTED_FAMILY', 'FINAL_L3_RESULT',
        ];

        return response()->stream(function () use ($columns, $headerLabels) {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $headerLabels);

            GranteeList::query()->orderBy('id')->chunk(1000, function ($grantees) use ($handle, $columns) {
                foreach ($grantees as $grantee) {
                    $row = [];
                    foreach ($columns as $col) {
                        $row[] = (string) ($grantee->{$col} ?? '');
                    }
                    fputcsv($handle, $row);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Launch background queue worker process (Windows start /B or background shell).
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
}
