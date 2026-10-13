<?php

namespace App\Jobs;

use App\Models\PayrollImport;
use App\Models\PayrollRecord;
use App\Support\PayrollSpreadsheetImporter;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ImportPayrollJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 7200; // 2 hours max
    public int $tries = 1;

    public function __construct(public int $importId)
    {
    }

    public function handle(PayrollSpreadsheetImporter $importer): void
    {
        @ini_set('memory_limit', '1024M');
        @set_time_limit(7200);

        PayrollImport::ensureTablesExist();
        PayrollRecord::ensureTableExists();

        $import = PayrollImport::find($this->importId);
        if (! $import || $import->status === 'cancelled') {
            return;
        }

        $import->update([
            'status' => 'processing',
            'started_at' => now(),
            'error_message' => null,
        ]);

        $filePath = $import->file_path;
        if (! file_exists($filePath)) {
            $import->update([
                'status' => 'failed',
                'error_message' => 'The uploaded file was not found on the server disk.',
            ]);
            return;
        }

        try {
            if ($import->total_rows === 0) {
                $estimatedTotal = $importer->estimateTotalRows($filePath, $import->extension);
                if ($estimatedTotal > 0) {
                    $import->update(['total_rows' => $estimatedTotal]);
                }
            } else {
                $estimatedTotal = $import->total_rows;
            }

            $imported = $import->imported_count;
            $updated = $import->updated_count;
            $processed = $import->processed_rows;
            $chunk = [];
            $chunkSize = 1000;

            foreach ($importer->streamNormalizedRows($filePath, $import->extension, $processed) as $row) {
                $chunk[] = $row;

                if (count($chunk) >= $chunkSize) {
                    [$cImported, $cUpdated] = self::processChunk($chunk);
                    $imported += $cImported;
                    $updated += $cUpdated;
                    $processed += count($chunk);
                    $chunk = [];

                    $pct = $estimatedTotal > 0
                        ? min(99.0, round(($processed / $estimatedTotal) * 100, 1))
                        : 0.0;

                    $import->update([
                        'processed_rows' => $processed,
                        'imported_count' => $imported,
                        'updated_count' => $updated,
                        'percentage' => $pct,
                    ]);

                    $fresh = PayrollImport::find($import->id);
                    if ($fresh && $fresh->status === 'cancelled') {
                        return;
                    }
                }
            }

            // Process any remaining rows
            if (! empty($chunk)) {
                [$cImported, $cUpdated] = self::processChunk($chunk);
                $imported += $cImported;
                $updated += $cUpdated;
                $processed += count($chunk);
            }

            $import->update([
                'status' => 'completed',
                'processed_rows' => $processed,
                'imported_count' => $imported,
                'updated_count' => $updated,
                'total_rows' => max($import->total_rows, $processed),
                'percentage' => 100.0,
                'completed_at' => now(),
            ]);

            if (file_exists($filePath)) {
                @unlink($filePath);
            }
            $importer->cleanExtractDir($filePath);
            \App\Http\Controllers\EmvRecordController::clearMetricsCache();
        } catch (\Throwable $e) {
            Log::error("ImportPayrollJob failed on ID {$import->id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            $import->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Process a chunk of rows with smart matching and bulk insertion.
     *
     * @param array<int, array<string, mixed>> $chunk
     * @return array{0: int, 1: int} [importedCount, updatedCount]
     */
    public static function processChunk(array $chunk): array
    {
        if (empty($chunk)) {
            return [0, 0];
        }

        $imported = 0;
        $updated = 0;

        DB::beginTransaction();

        try {
            // 1. Collect account numbers and household IDs in this chunk
            $chunkAccounts = [];
            $chunkHhIds = [];

            foreach ($chunk as $row) {
                $acc = isset($row['account_number']) ? trim((string) $row['account_number']) : '';
                if ($acc !== '') {
                    $chunkAccounts[] = $acc;
                }
                $hh = isset($row['household_id']) ? trim((string) $row['household_id']) : '';
                if ($hh !== '') {
                    $chunkHhIds[] = $hh;
                }
            }

            // 2. Fetch existing records by account_number
            $existingByAccount = [];
            if (! empty($chunkAccounts)) {
                $queryAccounts = array_values(array_unique($chunkAccounts));
                $records = PayrollRecord::query()
                    ->whereIn('account_number', $queryAccounts)
                    ->get(['id', 'account_number', 'period', 'year']);

                foreach ($records as $record) {
                    $normAcc = strtolower(trim((string) $record->account_number));
                    $normPeriod = strtolower(trim((string) $record->period));
                    $normYear = strtolower(trim((string) $record->year));
                    $key = "{$normAcc}|{$normPeriod}|{$normYear}";
                    if (! isset($existingByAccount[$key])) {
                        $existingByAccount[$key] = $record->id;
                    }
                }
            }

            // 3. Fetch existing records by household_id
            $existingByHhId = [];
            if (! empty($chunkHhIds)) {
                $queryHhIds = array_values(array_unique($chunkHhIds));
                $records = PayrollRecord::query()
                    ->whereIn('household_id', $queryHhIds)
                    ->get(['id', 'household_id', 'period', 'year', 'payroll_description']);

                foreach ($records as $record) {
                    $normHh = strtolower(trim((string) $record->household_id));
                    $normPeriod = strtolower(trim((string) $record->period));
                    $normYear = strtolower(trim((string) $record->year));
                    $normDesc = strtolower(trim((string) $record->payroll_description));
                    $key = "{$normHh}|{$normPeriod}|{$normYear}|{$normDesc}";
                    if (! isset($existingByHhId[$key])) {
                        $existingByHhId[$key] = $record->id;
                    }
                }
            }

            $toInsert = [];
            $now = now();

            foreach ($chunk as $row) {
                $attributes = Arr::only($row, PayrollSpreadsheetImporter::COLUMNS);

                $acc = isset($attributes['account_number']) ? strtolower(trim((string) $attributes['account_number'])) : '';
                $hh = isset($attributes['household_id']) ? strtolower(trim((string) $attributes['household_id'])) : '';
                $period = isset($attributes['period']) ? strtolower(trim((string) $attributes['period'])) : '';
                $year = isset($attributes['year']) ? strtolower(trim((string) $attributes['year'])) : '';
                $desc = isset($attributes['payroll_description']) ? strtolower(trim((string) $attributes['payroll_description'])) : '';

                $existingId = null;

                if ($acc !== '') {
                    $accKey = "{$acc}|{$period}|{$year}";
                    $existingId = $existingByAccount[$accKey] ?? null;
                }

                if ($existingId === null && $hh !== '') {
                    $hhKey = "{$hh}|{$period}|{$year}|{$desc}";
                    $existingId = $existingByHhId[$hhKey] ?? null;
                }

                if ($existingId !== null) {
                    // Update existing row
                    $attributes['updated_at'] = $now;
                    PayrollRecord::where('id', $existingId)->update($attributes);
                    $updated++;
                } else {
                    // Prepare new row for bulk insert
                    $attributes['created_at'] = $now;
                    $attributes['updated_at'] = $now;
                    $toInsert[] = $attributes;
                    $imported++;

                    // Register in lookup cache so duplicate rows within the same chunk update rather than duplicate
                    if ($acc !== '') {
                        $accKey = "{$acc}|{$period}|{$year}";
                        $existingByAccount[$accKey] = -1;
                    }
                    if ($hh !== '') {
                        $hhKey = "{$hh}|{$period}|{$year}|{$desc}";
                        $existingByHhId[$hhKey] = -1;
                    }
                }
            }

            // Bulk insert new records in batches of 250
            if (! empty($toInsert)) {
                foreach (array_chunk($toInsert, 250) as $batch) {
                    PayrollRecord::insert($batch);
                }
            }

            DB::commit();

            return [$imported, $updated];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Payroll processChunk error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            throw $e;
        }
    }
}

