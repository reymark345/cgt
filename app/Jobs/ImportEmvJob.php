<?php

namespace App\Jobs;

use App\Models\EmvImport;
use App\Models\EmvRecord;
use App\Support\EmvSpreadsheetImporter;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ImportEmvJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 7200; // 2 hours max for large 330k+ datasets
    public int $tries = 1;

    public function __construct(public int $importId)
    {
    }

    public function handle(EmvSpreadsheetImporter $importer): void
    {
        @ini_set('memory_limit', '1024M');
        @set_time_limit(7200);

        EmvImport::ensureTablesExist();
        EmvRecord::ensureTableExists();

        $import = EmvImport::find($this->importId);
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
            // Estimate total rows if not already known
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

            // Stream rows starting from processed offset
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

                    // Check for cancellation
                    $fresh = EmvImport::find($import->id);
                    if ($fresh && $fresh->status === 'cancelled') {
                        return;
                    }
                }
            }

            // Process any remaining rows in final chunk
            if (! empty($chunk)) {
                [$cImported, $cUpdated] = self::processChunk($chunk);
                $imported += $cImported;
                $updated += $cUpdated;
                $processed += count($chunk);
            }

            $import->update([
                'status' => 'completed',
                'total_rows' => $processed,
                'processed_rows' => $processed,
                'imported_count' => $imported,
                'updated_count' => $updated,
                'percentage' => 100.0,
                'completed_at' => now(),
            ]);

            // Safely cleanup temporary file
            if (file_exists($filePath)) {
                @unlink($filePath);
            }
            $importer->cleanExtractDir($filePath);
        } catch (\Throwable $e) {
            Log::error('ImportEmvJob failed for import #' . $import->id . ': ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            $import->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Process a chunk of rows with high-speed indexed matching and bulk database operations.
     *
     * @param array<int, array<string, string|null>> $chunk
     * @return array{0: int, 1: int} [importedCount, updatedCount]
     */
    public static function processChunk(array $chunk): array
    {
        if (empty($chunk)) {
            return [0, 0];
        }

        $imported = 0;
        $updated = 0;
        $now = now()->toDateTimeString();

        DB::transaction(function () use ($chunk, $now, &$imported, &$updated) {
            // 1. Collect non-empty lbp_accounts and (hh_id + item_no) combos
            $chunkAccounts = [];
            $chunkHhAndItem = [];

            foreach ($chunk as $row) {
                $a = isset($row['lbp_account']) ? trim((string) $row['lbp_account']) : '';
                if ($a !== '') {
                    $chunkAccounts[] = $a;
                    // Also support variant with or without 'EMV' prefix
                    if (str_starts_with(strtoupper($a), 'EMV')) {
                        $chunkAccounts[] = substr($a, 3);
                    } else {
                        $chunkAccounts[] = 'EMV' . $a;
                    }
                }
                $h = isset($row['hh_id']) ? trim((string) $row['hh_id']) : '';
                $item = isset($row['item_no']) ? trim((string) $row['item_no']) : '';
                if ($h !== '' && $item !== '') {
                    $chunkHhAndItem[] = ['hh_id' => $h, 'item_no' => $item];
                }
            }

            // 2. Fetch existing records by lbp_account (Cash card uniquely identified by card account)
            $existingByAccount = [];
            if (! empty($chunkAccounts)) {
                $queryAccounts = array_values(array_unique($chunkAccounts));
                $records = EmvRecord::query()
                    ->whereIn('lbp_account', $queryAccounts)
                    ->orderBy('id', 'asc')
                    ->get(['id', 'hh_id', 'lbp_account']);

                foreach ($records as $record) {
                    $normKey = strtolower(trim((string) $record->lbp_account));
                    if (! isset($existingByAccount[$normKey])) {
                        $existingByAccount[$normKey] = $record->id;
                    }
                    if (str_starts_with($normKey, 'emv')) {
                        $stripped = substr($normKey, 3);
                        if (! isset($existingByAccount[$stripped])) {
                            $existingByAccount[$stripped] = $record->id;
                        }
                    } else {
                        $withEmv = 'emv' . $normKey;
                        if (! isset($existingByAccount[$withEmv])) {
                            $existingByAccount[$withEmv] = $record->id;
                        }
                    }
                }
            }

            // 3. For records lacking lbp_account, match on (hh_id + item_no)
            $existingByHhAndItem = [];
            if (! empty($chunkHhAndItem)) {
                $hhList = array_values(array_unique(array_column($chunkHhAndItem, 'hh_id')));
                $records = EmvRecord::query()
                    ->whereIn('hh_id', $hhList)
                    ->where(function ($q) {
                        $q->whereNull('lbp_account')->orWhere('lbp_account', '');
                    })
                    ->orderBy('id', 'asc')
                    ->get(['id', 'hh_id', 'item_no']);

                foreach ($records as $record) {
                    $normHh = strtolower(trim((string) $record->hh_id));
                    $itemKey = trim((string) $record->item_no);
                    $compKey = "{$normHh}__{$itemKey}";
                    if (! isset($existingByHhAndItem[$compKey])) {
                        $existingByHhAndItem[$compKey] = $record->id;
                    }
                }
            }

            $toInsert = [];

            // 4. Process each row. NOTE: A household (hh_id) may have multiple cash cards (separate lbp_account records).
            // We NEVER delete or overwrite another card just because the hh_id is the same.
            foreach ($chunk as $row) {
                $attributes = Arr::only($row, EmvSpreadsheetImporter::COLUMNS);

                foreach ($attributes as $k => $v) {
                    $attributes[$k] = $v !== null && $v !== '' ? trim((string) $v) : null;
                }

                foreach (EmvSpreadsheetImporter::DATE_COLUMNS as $dCol) {
                    if (isset($attributes[$dCol])) {
                        $attributes[$dCol] = EmvSpreadsheetImporter::normalizeDateValue($attributes[$dCol]);
                    }
                }

                $rawHhId = $attributes['hh_id'] ?? null;
                $rawAccount = $attributes['lbp_account'] ?? null;
                $rawItem = $attributes['item_no'] ?? null;

                $normHhId = $rawHhId !== null ? strtolower(trim((string) $rawHhId)) : null;
                $normAccount = $rawAccount !== null ? strtolower(trim((string) $rawAccount)) : null;

                $existingId = null;

                // Priority 1: Match by lbp_account
                if ($normAccount !== null && $normAccount !== '') {
                    $existingId = $existingByAccount[$normAccount] ?? null;
                    if ($existingId === null && str_starts_with($normAccount, 'emv')) {
                        $existingId = $existingByAccount[substr($normAccount, 3)] ?? null;
                    } elseif ($existingId === null) {
                        $existingId = $existingByAccount['emv' . $normAccount] ?? null;
                    }
                }

                // Priority 2: If no lbp_account in file row, match by hh_id + item_no
                if ($existingId === null && ($normAccount === null || $normAccount === '') && $normHhId !== null && $rawItem !== null) {
                    $compKey = "{$normHhId}__{$rawItem}";
                    $existingId = $existingByHhAndItem[$compKey] ?? null;
                }

                if ($existingId !== null && $existingId > 0) {
                    // UPDATE existing card record with latest details
                    $attributes['updated_at'] = $now;
                    EmvRecord::where('id', $existingId)->update($attributes);
                    $updated++;
                } else {
                    // NEW card record to insert (allows duplicate hh_id for households with multiple cards)
                    $attributes['created_at'] = $now;
                    $attributes['updated_at'] = $now;
                    $toInsert[] = $attributes;
                    $imported++;

                    // Register fake ID in local chunk map to prevent duplicates within this exact chunk
                    if ($normAccount !== null && $normAccount !== '') {
                        $existingByAccount[$normAccount] = -1;
                    }
                    if ($normHhId !== null && $rawItem !== null) {
                        $existingByHhAndItem["{$normHhId}__{$rawItem}"] = -1;
                    }
                }
            }

            // High-speed bulk insert for all new rows (chunked at 500)
            if (! empty($toInsert)) {
                foreach (array_chunk($toInsert, 500) as $insertSlice) {
                    EmvRecord::insert($insertSlice);
                }
            }
        });

        return [$imported, $updated];
    }
}

