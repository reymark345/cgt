<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use SimpleXMLElement;
use XMLReader;
use ZipArchive;

class EmvSpreadsheetImporter
{
    public const COLUMNS = [
        'item_no',
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

    public const DATE_COLUMNS = [
        'run_date',
        'date_claimed',
        'date_acted',
        'agreed_distribution_date',
    ];

    private const HEADER_ALIASES = [
        // item no.
        'item_no' => 'item_no',
        'itemno' => 'item_no',
        'item' => 'item_no',
        'no' => 'item_no',
        'item_number' => 'item_no',
        'itemnumber' => 'item_no',
        'item_num' => 'item_no',

        // region
        'region' => 'region',

        // province
        'province' => 'province',

        // municipality
        'municipality' => 'municipality',
        'city' => 'municipality',
        'city_municipality' => 'municipality',

        // barangay
        'barangay' => 'barangay',
        'brgy' => 'barangay',

        // hh_id
        'hh_id' => 'hh_id',
        'hhid' => 'hh_id',
        'household_id' => 'hh_id',
        'householdid' => 'hh_id',

        // lbp_account
        'lbp_account' => 'lbp_account',
        'lbpaccount' => 'lbp_account',
        'lbp_account_number' => 'lbp_account',
        'lbpaccountnumber' => 'lbp_account',
        'account_no' => 'lbp_account',
        'account_number' => 'lbp_account',
        'accountno' => 'lbp_account',
        'accountnumber' => 'lbp_account',
        'card_number' => 'lbp_account',
        'cardno' => 'lbp_account',

        // run_date
        'run_date' => 'run_date',
        'rundate' => 'run_date',
        'date_run' => 'run_date',
        'run' => 'run_date',

        // first_name
        'first_name' => 'first_name',
        'firstname' => 'first_name',
        'first' => 'first_name',

        // mid_name
        'mid_name' => 'mid_name',
        'midname' => 'mid_name',
        'middle_name' => 'mid_name',
        'middlename' => 'mid_name',
        'middle' => 'mid_name',

        // last_name
        'last_name' => 'last_name',
        'lastname' => 'last_name',
        'surname' => 'last_name',
        'last' => 'last_name',

        // acct_description
        'acct_description' => 'acct_description',
        'acctdescription' => 'acct_description',
        'acct_desc' => 'acct_description',
        'account_description' => 'acct_description',
        'accountdescription' => 'acct_description',
        'description' => 'acct_description',

        // cct_type
        'cct_type' => 'cct_type',
        'ccttype' => 'cct_type',
        'cct' => 'cct_type',
        'type' => 'cct_type',

        // lbp_servicing_branch
        'lbp_servicing_branch' => 'lbp_servicing_branch',
        'lbpservicingbranch' => 'lbp_servicing_branch',
        'servicing_branch' => 'lbp_servicing_branch',
        'servicingbranch' => 'lbp_servicing_branch',
        'lbp_branch' => 'lbp_servicing_branch',
        'branch' => 'lbp_servicing_branch',

        // distribution_status
        'distribution_status' => 'distribution_status',
        'distributionstatus' => 'distribution_status',
        'dist_status' => 'distribution_status',
        'status' => 'distribution_status',

        // date_claimed
        'date_claimed' => 'date_claimed',
        'dateclaimed' => 'date_claimed',
        'claimed_date' => 'date_claimed',

        // reason_why_unclaimed
        'reason_why_unclaimed' => 'reason_why_unclaimed',
        'reasonwhyunclaimed' => 'reason_why_unclaimed',
        'reason_unclaimed' => 'reason_why_unclaimed',
        'unclaimed_reason' => 'reason_why_unclaimed',
        'reason' => 'reason_why_unclaimed',

        // recommended_action
        'recommended_action' => 'recommended_action',
        'recommendedaction' => 'recommended_action',
        'recom_action' => 'recommended_action',
        'recommendation' => 'recommended_action',

        // action_taken
        'action_taken' => 'action_taken',
        'actiontaken' => 'action_taken',
        'action' => 'action_taken',

        // date_acted
        'date_acted' => 'date_acted',
        'dateacted' => 'date_acted',
        'acted_date' => 'date_acted',

        // agreed_distribution_date
        'agreed_distribution_date' => 'agreed_distribution_date',
        'agreeddistributiondate' => 'agreed_distribution_date',
        'agreed_date' => 'agreed_distribution_date',
        'distribution_date' => 'agreed_distribution_date',
        'agreed_dist_date' => 'agreed_distribution_date',
    ];

    /**
     * Helper to read rows into memory (recommended for smaller files).
     *
     * @return array<int, array<string, string|null>>
     */
    public function rows(UploadedFile $file): array
    {
        @ini_set('memory_limit', '1024M');
        @set_time_limit(600);

        $extension = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: '');
        $path = $this->resolveFilePath($file);

        if (! is_file($path) || filesize($path) === 0) {
            throw ValidationException::withMessages([
                'file' => 'The uploaded file appears to be empty (0 bytes). Please verify the file and try again.',
            ]);
        }

        try {
            $rows = [];
            foreach ($this->streamNormalizedRows($path, $extension) as $row) {
                $rows[] = $row;
            }

            return $rows;
        } finally {
            if (str_contains($path, 'temp_imports') && file_exists($path)) {
                @unlink($path);
            }
        }
    }

    /**
     * Stream rows one-by-one with constant, minimal memory usage (< 15MB RAM).
     *
     * @return \Generator<int, array<string, string|null>>
     */
    public function streamNormalizedRows(string $path, string $extension, int $offset = 0, ?int $limit = null): \Generator
    {
        @ini_set('memory_limit', '1024M');
        @set_time_limit(3600);

        $extension = strtolower(ltrim($extension, '.'));

        $generator = match ($extension) {
            'csv', 'txt' => $this->streamFromCsv($path, $offset, $limit),
            'xlsx' => $this->streamFromXlsx($path, $offset, $limit),
            'xls', 'xml' => $this->streamFromXml($path, $offset, $limit),
            default => throw ValidationException::withMessages([
                'file' => 'Please upload a CSV, XLSX, XLS, or XML spreadsheet.',
            ]),
        };

        foreach ($generator as $row) {
            yield $row;
        }
    }

    /**
     * Estimate total rows in the spreadsheet quickly without loading into RAM.
     */
    public function estimateTotalRows(string $path, string $extension): int
    {
        $extension = strtolower(ltrim($extension, '.'));

        if ($extension === 'csv' || $extension === 'txt') {
            $count = 0;
            $handle = fopen($path, 'r');
            if ($handle !== false) {
                while (! feof($handle)) {
                    $buffer = fread($handle, 1048576); // 1MB chunks
                    $count += substr_count($buffer, "\n");
                }
                fclose($handle);
            }

            return max(0, $count - 1); // Exclude header
        }

        if ($extension === 'xlsx' && class_exists(ZipArchive::class)) {
            $zip = new ZipArchive();
            if ($zip->open($path) === true) {
                $sheetEntry = 'xl/worksheets/sheet1.xml';
                if ($zip->locateName($sheetEntry) === false) {
                    for ($i = 0; $i < $zip->numFiles; $i++) {
                        $name = $zip->getNameIndex($i);
                        if (preg_match('#^xl/worksheets/sheet[0-9]+\.xml$#i', $name)) {
                            $sheetEntry = $name;
                            break;
                        }
                    }
                }

                $stream = $zip->getStream($sheetEntry);
                if ($stream !== false) {
                    $buffer = fread($stream, 65536);
                    fclose($stream);

                    if ($buffer && preg_match('/<dimension\s+ref="[A-Z]+[0-9]+:[A-Z]+([0-9]+)"/i', $buffer, $m)) {
                        $zip->close();
                        return max(0, ((int) $m[1]) - 1);
                    }
                }

                $zip->close();
            }
        }

        return 0;
    }

    /**
     * Streaming parser for XLSX using XMLReader.
     */
    private function streamFromXlsx(string $path, int $offset = 0, ?int $limit = null): \Generator
    {
        if (! class_exists(ZipArchive::class)) {
            throw ValidationException::withMessages([
                'file' => 'XLSX import requires the PHP Zip extension. Please upload a CSV instead.',
            ]);
        }

        $tempDir = storage_path('framework/cache/emv_xlsx_' . md5($path));
        @mkdir($tempDir, 0777, true);

        $sheetName = 'xl/worksheets/sheet1.xml';
        $sheetPath = $tempDir . '/' . $sheetName;

        if (! file_exists($sheetPath)) {
            $zip = new ZipArchive();
            if ($zip->open($path) !== true) {
                throw ValidationException::withMessages([
                    'file' => 'The XLSX file could not be opened. It may be corrupt or encrypted.',
                ]);
            }

            if ($zip->locateName($sheetName) === false) {
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $name = $zip->getNameIndex($i);
                    if (preg_match('#^xl/worksheets/sheet[0-9]+\.xml$#i', $name)) {
                        $sheetName = $name;
                        break;
                    }
                }
                $sheetPath = $tempDir . '/' . $sheetName;
            }

            $extractFiles = [$sheetName];
            if ($zip->locateName('xl/sharedStrings.xml') !== false) {
                $extractFiles[] = 'xl/sharedStrings.xml';
            }

            $zip->extractTo($tempDir, $extractFiles);
            $zip->close();
        }

        // Shared strings caching
        $sharedStrings = [];
        $sharedPath = $tempDir . '/xl/sharedStrings.xml';
        if (file_exists($sharedPath)) {
            $cacheFile = $tempDir . '/shared_strings.json';
            if (file_exists($cacheFile)) {
                $sharedStrings = json_decode((string) file_get_contents($cacheFile), true) ?: [];
            } else {
                $reader = new XMLReader();
                if ($reader->open($sharedPath)) {
                    $currentStr = null;
                    while ($reader->read()) {
                        if ($reader->nodeType === XMLReader::ELEMENT) {
                            if ($reader->name === 'si') {
                                $currentStr = '';
                            } elseif ($reader->name === 't' && $currentStr !== null) {
                                $currentStr .= $reader->readString();
                            }
                        } elseif ($reader->nodeType === XMLReader::END_ELEMENT && $reader->name === 'si') {
                            $sharedStrings[] = $currentStr ?? '';
                            $currentStr = null;
                        }
                    }
                    $reader->close();
                }
                @file_put_contents($cacheFile, json_encode($sharedStrings));
            }
        }

        if (! file_exists($sheetPath)) {
            return;
        }

        $reader = new XMLReader();
        if (! $reader->open($sheetPath)) {
            return;
        }

        $headers = null;
        $dataRowIndex = 0;
        $yieldedCount = 0;

        while ($reader->read()) {
            if ($reader->nodeType === XMLReader::ELEMENT && $reader->name === 'row') {
                if ($headers === null) {
                    $rowXml = $reader->readOuterXml();
                    $rowElement = @simplexml_load_string($rowXml);
                    if ($rowElement !== false) {
                        $cells = [];
                        foreach ($rowElement->c as $cell) {
                            $ref = (string) $cell['r'];
                            $colIdx = $this->columnIndex($ref);
                            $type = (string) $cell['t'];

                            $val = '';
                            if ($type === 's') {
                                $idx = (int) ($cell->v ?? 0);
                                $val = $sharedStrings[$idx] ?? '';
                            } else {
                                $val = (string) ($cell->v ?? '');
                            }
                            $cells[$colIdx] = trim($val);
                        }

                        if (! empty($cells)) {
                            $maxCol = max(array_keys($cells));
                            $fullRow = [];
                            for ($c = 0; $c <= $maxCol; $c++) {
                                $fullRow[$c] = $cells[$c] ?? '';
                            }
                            $headers = array_map(fn ($h) => $this->mapHeader((string) $h), $fullRow);
                        }
                    }
                    continue;
                }

                if ($dataRowIndex < $offset) {
                    while ($dataRowIndex < $offset && $reader->nodeType === XMLReader::ELEMENT && $reader->name === 'row') {
                        $dataRowIndex++;
                        if (! $reader->next('row')) {
                            break 2;
                        }
                    }
                }

                $rowXml = $reader->readOuterXml();
                $rowElement = @simplexml_load_string($rowXml);
                if ($rowElement === false) {
                    $dataRowIndex++;
                    continue;
                }

                $cells = [];
                foreach ($rowElement->c as $cell) {
                    $ref = (string) $cell['r'];
                    $colIdx = $this->columnIndex($ref);
                    $type = (string) $cell['t'];

                    $val = '';
                    if ($type === 's') {
                        $idx = (int) ($cell->v ?? 0);
                        $val = $sharedStrings[$idx] ?? '';
                    } elseif ($type === 'inlineStr') {
                        if (isset($cell->is->t)) {
                            $val = (string) $cell->is->t;
                        } elseif (isset($cell->is->r)) {
                            $txt = '';
                            foreach ($cell->is->r as $run) {
                                $txt .= (string) ($run->t ?? '');
                            }
                            $val = $txt;
                        }
                    } else {
                        $val = (string) ($cell->v ?? '');
                    }

                    $cells[$colIdx] = trim($val);
                }

                $dataRowIndex++;

                if (empty($cells)) {
                    continue;
                }

                $maxCol = max(array_keys($cells));
                $fullRow = [];
                for ($c = 0; $c <= $maxCol; $c++) {
                    $fullRow[$c] = $cells[$c] ?? '';
                }

                $row = array_fill_keys(self::COLUMNS, null);
                $hasData = false;

                foreach ($fullRow as $idx => $val) {
                    $col = $headers[$idx] ?? null;
                    if ($col !== null && $val !== '') {
                        if (in_array($col, self::DATE_COLUMNS, true)) {
                            $row[$col] = self::normalizeDateValue($val);
                        } else {
                            $row[$col] = $val;
                        }
                        $hasData = true;
                    }
                }

                if ($hasData) {
                    yield $row;
                    $yieldedCount++;

                    if ($limit !== null && $yieldedCount >= $limit) {
                        break;
                    }
                }
            }
        }

        $reader->close();
    }

    /**
     * Streaming parser for CSV / TXT files.
     */
    private function streamFromCsv(string $path, int $offset = 0, ?int $limit = null): \Generator
    {
        $handle = fopen($path, 'r');
        if ($handle === false) {
            return;
        }

        $delimiter = $this->detectDelimiter($handle);
        $headerRow = fgetcsv($handle, 0, $delimiter);

        if ($headerRow === false) {
            fclose($handle);
            return;
        }

        $headers = array_map(fn ($h) => $this->mapHeader((string) $h), $headerRow);

        $dataRowIndex = 0;
        $yieldedCount = 0;

        while (($rawRow = fgetcsv($handle, 0, $delimiter)) !== false) {
            if (empty($rawRow) || (count($rawRow) === 1 && $rawRow[0] === null)) {
                continue;
            }

            if ($dataRowIndex < $offset) {
                $dataRowIndex++;
                continue;
            }

            $dataRowIndex++;

            $row = array_fill_keys(self::COLUMNS, null);
            $hasData = false;

            foreach ($rawRow as $idx => $val) {
                $col = $headers[$idx] ?? null;
                if ($col !== null) {
                    $v = trim((string) $val);
                    if ($v !== '') {
                        if (in_array($col, self::DATE_COLUMNS, true)) {
                            $row[$col] = self::normalizeDateValue($v);
                        } else {
                            $row[$col] = $v;
                        }
                        $hasData = true;
                    }
                }
            }

            if ($hasData) {
                yield $row;
                $yieldedCount++;

                if ($limit !== null && $yieldedCount >= $limit) {
                    break;
                }
            }
        }

        fclose($handle);
    }

    /**
     * Streaming parser for XML / XLS Spreadsheet format.
     */
    private function streamFromXml(string $path, int $offset = 0, ?int $limit = null): \Generator
    {
        $xml = @simplexml_load_file($path);
        if (! $xml instanceof SimpleXMLElement) {
            throw ValidationException::withMessages(['file' => 'The spreadsheet XML file could not be parsed.']);
        }

        $xml->registerXPathNamespace('ss', 'urn:schemas-microsoft-com:office:spreadsheet');
        $rows = $xml->xpath('//ss:Worksheet[1]//ss:Table//ss:Row') ?: [];

        $headers = null;
        $dataRowIndex = 0;
        $yieldedCount = 0;

        foreach ($rows as $xmlRow) {
            $cells = [];
            foreach ($xmlRow->xpath('ss:Cell') ?: [] as $cell) {
                $data = $cell->xpath('ss:Data');
                $cells[] = isset($data[0]) ? trim((string) $data[0]) : '';
            }

            if (empty($cells)) {
                continue;
            }

            if ($headers === null) {
                $headers = array_map(fn ($h) => $this->mapHeader((string) $h), $cells);
                continue;
            }

            if ($dataRowIndex < $offset) {
                $dataRowIndex++;
                continue;
            }

            $dataRowIndex++;

            $row = array_fill_keys(self::COLUMNS, null);
            $hasData = false;

            foreach ($cells as $idx => $val) {
                $col = $headers[$idx] ?? null;
                if ($col !== null && $val !== '') {
                    if (in_array($col, self::DATE_COLUMNS, true)) {
                        $row[$col] = self::normalizeDateValue($val);
                    } else {
                        $row[$col] = $val;
                    }
                    $hasData = true;
                }
            }

            if ($hasData) {
                yield $row;
                $yieldedCount++;

                if ($limit !== null && $yieldedCount >= $limit) {
                    break;
                }
            }
        }
    }

    /**
     * Clean cached extracted directory for an XLSX file.
     */
    public function cleanExtractDir(string $filePath): void
    {
        $tempDir = storage_path('framework/cache/emv_xlsx_' . md5($filePath));
        $this->cleanTempDirectory($tempDir);
    }

    /**
     * Detect CSV delimiter (comma, tab, semicolon).
     *
     * @param resource $handle
     */
    private function detectDelimiter($handle): string
    {
        $firstLine = fgets($handle);
        rewind($handle);

        if ($firstLine === false) {
            return ',';
        }

        $tabCount = substr_count($firstLine, "\t");
        $commaCount = substr_count($firstLine, ',');
        $semiCount = substr_count($firstLine, ';');

        if ($tabCount > $commaCount && $tabCount > $semiCount) {
            return "\t";
        }

        if ($semiCount > $commaCount && $semiCount > $tabCount) {
            return ';';
        }

        return ',';
    }

    private function mapHeader(string $header): ?string
    {
        $header = preg_replace('/^\xEF\xBB\xBF/', '', $header) ?? $header;
        $header = str_replace(["\xc2\xa0", "\u{00a0}"], ' ', $header);
        $key = strtolower(trim($header));
        $key = str_replace(["'", '.', '/', '(', ')', '"', "\t", "\r", "\n"], '', $key);
        $key = preg_replace('/[\s\-]+/', '_', $key) ?: $key;

        $noUnderscores = str_replace('_', '', $key);

        return self::HEADER_ALIASES[$key]
            ?? self::HEADER_ALIASES[$noUnderscores]
            ?? (in_array($key, self::COLUMNS, true) ? $key : null);
    }

    private function columnIndex(string $reference): int
    {
        preg_match('/^[A-Z]+/', $reference, $matches);
        $letters = $matches[0] ?? 'A';
        $index = 0;

        foreach (str_split($letters) as $letter) {
            $index = $index * 26 + (ord($letter) - 64);
        }

        return $index - 1;
    }

    private function cleanTempDirectory(string $dir): void
    {
        if (! is_dir($dir)) {
            return;
        }

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($files as $fileinfo) {
            $todo = ($fileinfo->isDir() ? 'rmdir' : 'unlink');
            @$todo($fileinfo->getRealPath());
        }

        @rmdir($dir);
    }

    private function resolveFilePath(UploadedFile $file): string
    {
        $realPath = $file->getRealPath();
        if (! empty($realPath) && is_file($realPath) && is_readable($realPath)) {
            return $realPath;
        }

        $pathname = $file->getPathname();
        if (! empty($pathname) && is_file($pathname) && is_readable($pathname)) {
            return $pathname;
        }

        $tempDir = storage_path('framework/cache/temp_imports');
        if (! is_dir($tempDir)) {
            @mkdir($tempDir, 0777, true);
        }

        $extension = strtolower($file->getClientOriginalExtension() ?: 'xlsx');
        $tempPath = $tempDir . '/emv_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $extension;

        if (! empty($pathname) && @copy($pathname, $tempPath)) {
            return $tempPath;
        }

        try {
            $moved = $file->move($tempDir, basename($tempPath));
            if ($moved && is_file($moved->getPathname())) {
                return $moved->getPathname();
            }
        } catch (\Throwable) {
            // ignore
        }

        throw ValidationException::withMessages([
            'file' => 'Could not access the uploaded file on the server. Please verify file permissions or try CSV format.',
        ]);
    }

    /**
     * Normalize date string or Excel serial number into ISO format (YYYY-MM-DD).
     */
    public static function normalizeDateValue(?string $val): ?string
    {
        if ($val === null) {
            return null;
        }
        $val = trim($val);
        if ($val === '' || $val === '-' || $val === '—' || strtolower($val) === 'null' || strtolower($val) === 'n/a') {
            return null;
        }

        // Already YYYY-MM-DD
        if (preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})/', $val, $matches)) {
            return sprintf('%04d-%02d-%02d', (int) $matches[1], (int) $matches[2], (int) $matches[3]);
        }

        // Numeric Excel serial (e.g. 43207 or 43207.5)
        if (is_numeric($val) && ! str_contains($val, '-') && ! str_contains($val, '/')) {
            $num = (float) $val;
            if ($num >= 1 && $num <= 100000) {
                $days = (int) floor($num);
                $timestamp = ($days - 25569) * 86400;
                return gmdate('Y-m-d', $timestamp);
            }
        }

        // MM/DD/YYYY or DD/MM/YYYY
        if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/', $val, $matches)) {
            $first = (int) $matches[1];
            $second = (int) $matches[2];
            $year = (int) $matches[3];

            if ($first > 12 && $second <= 12) {
                // Must be DD/MM/YYYY
                return sprintf('%04d-%02d-%02d', $year, $second, $first);
            }
            // Default to MM/DD/YYYY
            return sprintf('%04d-%02d-%02d', $year, $first, $second);
        }

        // Fallback to strtotime if possible
        $ts = strtotime($val);
        if ($ts !== false && $ts > 0) {
            return gmdate('Y-m-d', $ts);
        }

        return $val;
    }
}
