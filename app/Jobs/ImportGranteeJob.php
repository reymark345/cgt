<?php

namespace App\Jobs;

use App\Models\GranteeImport;
use App\Models\GranteeList;
use App\Support\GranteeSpreadsheetImporter;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ImportGranteeJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 7200; // 2 hours max for large 330k datasets
    public int $tries = 1;

    public function __construct(public int $importId)
    {
    }

    public function handle(GranteeSpreadsheetImporter $importer): void
    {
        @ini_set('memory_limit', '1024M');
        @set_time_limit(7200);

        GranteeImport::ensureTablesExist();
        GranteeList::ensureTableExists();

        $import = GranteeImport::find($this->importId);
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
                    $fresh = GranteeImport::find($import->id);
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
            Log::error('ImportGranteeJob failed for import #' . $import->id . ': ' . $e->getMessage(), [
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
            // 1. Collect non-empty hh_ids and entry_ids
            $chunkHhIds = [];
            $chunkEntryIds = [];

            foreach ($chunk as $row) {
                $h = isset($row['hh_id']) ? trim((string) $row['hh_id']) : '';
                if ($h !== '') {
                    $chunkHhIds[] = $h;
                }
                $e = isset($row['entry_id']) ? trim((string) $row['entry_id']) : '';
                if ($e !== '') {
                    $chunkEntryIds[] = $e;
                }
            }

            // Build query variants for hh_ids (handles potential leading-zero variations from Excel)
            $hhQueryValues = [];
            foreach ($chunkHhIds as $h) {
                $hhQueryValues[] = $h;
                $unpadded = ltrim($h, '0');
                if ($unpadded !== '') {
                    $hhQueryValues[] = $unpadded;
                    $hhQueryValues[] = '0' . $unpadded;
                }
            }
            $hhQueryValues = array_values(array_unique($hhQueryValues));

            // 2. Fetch existing records by hh_id
            $existingByHhId = [];
            if (! empty($hhQueryValues)) {
                $records = GranteeList::query()
                    ->whereIn('hh_id', $hhQueryValues)
                    ->orderBy('id', 'asc')
                    ->get(['id', 'hh_id', 'entry_id']);

                foreach ($records as $record) {
                    $rawHh = trim((string) $record->hh_id);
                    $normKey = strtolower($rawHh);
                    $unpaddedKey = ltrim($normKey, '0');

                    if (! isset($existingByHhId[$normKey])) {
                        $existingByHhId[$normKey] = $record->id;
                        if ($unpaddedKey !== '') {
                            $existingByHhId[$unpaddedKey] = $record->id;
                            $existingByHhId['0' . $unpaddedKey] = $record->id;
                        }
                    } else {
                        // Clean duplicate if exists
                        if ($record->id !== $existingByHhId[$normKey]) {
                            GranteeList::where('id', $record->id)->delete();
                        }
                    }
                }
            }

            // 3. Fetch existing records by entry_id
            $existingByEntryId = [];
            if (! empty($chunkEntryIds)) {
                $records = GranteeList::query()
                    ->whereIn('entry_id', array_values(array_unique($chunkEntryIds)))
                    ->orderBy('id', 'asc')
                    ->get(['id', 'entry_id']);

                foreach ($records as $record) {
                    $normKey = strtolower(trim((string) $record->entry_id));
                    if (! isset($existingByEntryId[$normKey])) {
                        $existingByEntryId[$normKey] = $record->id;
                    }
                }
            }

            $toInsert = [];

            // 4. Process each row
            foreach ($chunk as $row) {
                $attributes = Arr::only($row, GranteeSpreadsheetImporter::COLUMNS);

                foreach ($attributes as $k => $v) {
                    $attributes[$k] = $v !== null && $v !== '' ? trim((string) $v) : null;
                }

                $rawHhId = $attributes['hh_id'] ?? null;
                $rawEntryId = $attributes['entry_id'] ?? null;

                $normHhId = $rawHhId !== null ? strtolower(trim((string) $rawHhId)) : null;
                $normEntryId = $rawEntryId !== null ? strtolower(trim((string) $rawEntryId)) : null;

                $existingId = null;
                if ($normHhId !== null) {
                    $unpadded = ltrim($normHhId, '0');
                    $existingId = $existingByHhId[$normHhId]
                        ?? ($unpadded !== '' ? ($existingByHhId[$unpadded] ?? ($existingByHhId['0' . $unpadded] ?? null)) : null);
                }

                if ($existingId === null && $normEntryId !== null) {
                    $existingId = $existingByEntryId[$normEntryId] ?? null;
                }

                if ($existingId !== null) {
                    // UPDATE existing grantee with latest uploaded spreadsheet details
                    $attributes['updated_at'] = $now;
                    GranteeList::where('id', $existingId)->update($attributes);
                    $updated++;
                } else {
                    // NEW grantee to insert
                    $attributes['created_at'] = $now;
                    $attributes['updated_at'] = $now;
                    $toInsert[] = $attributes;
                    $imported++;

                    // Register fake ID in local map to prevent intra-chunk duplicates
                    if ($normHhId !== null) {
                        $existingByHhId[$normHhId] = -1;
                    }
                    if ($normEntryId !== null) {
                        $existingByEntryId[$normEntryId] = -1;
                    }
                }
            }

            // High-speed bulk insert for all new rows (chunked at 500 to stay well within parameter limits)
            if (! empty($toInsert)) {
                foreach (array_chunk($toInsert, 500) as $insertSlice) {
                    GranteeList::insert($insertSlice);
                }
            }
        });

        return [$imported, $updated];
    }
}
