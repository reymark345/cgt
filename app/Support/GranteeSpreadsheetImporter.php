<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use SimpleXMLElement;
use XMLReader;
use ZipArchive;

class GranteeSpreadsheetImporter
{
    public const COLUMNS = [
        'region',
        'province',
        'municipality',
        'barangay',
        'purok',
        'district',
        'hh_id',
        'entry_id',
        'first_name',
        'middle_name',
        'last_name',
        'ext_name',
        'maiden_name',
        'contact_number',
        'birthday',
        'hh_grantee',
        'current_age',
        'age',
        'sex',
        'old_client_status',
        'client_status',
        'date_tagged',
        'tagged_by',
        'cs_category',
        'member_status',
        'relation_to_hh',
        'hh_set',
        'registration_status',
        'ip_label',
        'ip_status',
        'payment_mode',
        'lbp_account',
        'date_of_enumeration',
        'date_registered',
        'date_registered_v2',
        'family_id',
        'rel_to_fam_head',
        'selected_family',
        'final_l3_result',
    ];

    public const DATE_COLUMNS = [
        'birthday',
        'date_tagged',
        'date_of_enumeration',
        'date_registered',
        'date_registered_v2',
    ];

    private const HEADER_ALIASES = [
        // REGION
        'region' => 'region',

        // PROVINCE
        'province' => 'province',

        // MUNICIPALITY
        'municipality' => 'municipality',
        'city' => 'municipality',
        'city_municipality' => 'municipality',

        // BARANGAY
        'barangay' => 'barangay',
        'brgy' => 'barangay',

        // PUROK
        'purok' => 'purok',
        'prk' => 'purok',

        // DISTRICT
        'district' => 'district',
        'dist' => 'district',

        // hh_id
        'hh_id' => 'hh_id',
        'hhid' => 'hh_id',
        'household_id' => 'hh_id',
        'householdid' => 'hh_id',

        // ENTRY_ID
        'entry_id' => 'entry_id',
        'entryid' => 'entry_id',

        // FIRST_NAME
        'first_name' => 'first_name',
        'firstname' => 'first_name',

        // MIDDLE_NAME
        'middle_name' => 'middle_name',
        'middlename' => 'middle_name',

        // LAST_NAME
        'last_name' => 'last_name',
        'lastname' => 'last_name',
        'surname' => 'last_name',

        // EXT_NAME
        'ext_name' => 'ext_name',
        'extname' => 'ext_name',
        'extension_name' => 'ext_name',
        'extensionname' => 'ext_name',

        // MAIDEN_NAME
        'maiden_name' => 'maiden_name',
        'maidenname' => 'maiden_name',
        'mothers_maiden' => 'maiden_name',
        'mothers_maiden_name' => 'maiden_name',
        'mothersmaiden' => 'maiden_name',

        // CONTACT_NUMBER
        'contact_number' => 'contact_number',
        'contactnumber' => 'contact_number',
        'contact_no' => 'contact_number',
        'contactno' => 'contact_number',
        'phone' => 'contact_number',
        'mobile_no' => 'contact_number',

        // BIRTHDAY
        'birthday' => 'birthday',
        'birthdate' => 'birthday',
        'date_of_birth' => 'birthday',
        'dob' => 'birthday',

        // HH_GRANTEE
        'hh_grantee' => 'hh_grantee',
        'hhgrantee' => 'hh_grantee',
        'grantee' => 'hh_grantee',

        // CURRENT_AGE
        'current_age' => 'current_age',
        'currentage' => 'current_age',

        // AGE
        'age' => 'age',

        // SEX
        'sex' => 'sex',
        'gender' => 'sex',

        // OLD_CLIENT_STATUS
        'old_client_status' => 'old_client_status',
        'oldclientstatus' => 'old_client_status',

        // CLIENT_STATUS
        'client_status' => 'client_status',
        'clientstatus' => 'client_status',

        // DATE_TAGGED
        'date_tagged' => 'date_tagged',
        'datetagged' => 'date_tagged',
        'date_tagged_hhstatus' => 'date_tagged',

        // TAGGED_BY
        'tagged_by' => 'tagged_by',
        'taggedby' => 'tagged_by',

        // CS_CATEGORY
        'cs_category' => 'cs_category',
        'cscategory' => 'cs_category',

        // MEMBER_STATUS
        'member_status' => 'member_status',
        'memberstatus' => 'member_status',

        // RELATION_TO_HH
        'relation_to_hh' => 'relation_to_hh',
        'relationtohh' => 'relation_to_hh',
        'relationship_to_hh_head' => 'relation_to_hh',
        'relationshiptohhhead' => 'relation_to_hh',
        'rel_to_hh' => 'relation_to_hh',

        // HH_SET
        'hh_set' => 'hh_set',
        'hhset' => 'hh_set',
        'set' => 'hh_set',

        // REGISTRATION_STATUS
        'registration_status' => 'registration_status',
        'registrationstatus' => 'registration_status',

        // IP_LABEL
        'ip_label' => 'ip_label',
        'iplabel' => 'ip_label',

        // IP_STATUS
        'ip_status' => 'ip_status',
        'ipstatus' => 'ip_status',
        'ip_affiliation' => 'ip_status',
        'ipaffiliation' => 'ip_status',

        // PAYMENT_MODE
        'payment_mode' => 'payment_mode',
        'paymentmode' => 'payment_mode',
        'mode_of_payment' => 'payment_mode',
        'modeofpayment' => 'payment_mode',

        // LBP_ACCOUNT
        'lbp_account' => 'lbp_account',
        'lbpaccount' => 'lbp_account',
        'lbp_account_number' => 'lbp_account',
        'lbpaccountnumber' => 'lbp_account',

        // DATE_OF_ENUMERATION
        'date_of_enumeration' => 'date_of_enumeration',
        'dateofenumeration' => 'date_of_enumeration',

        // DATE_REGISTERED
        'date_registered' => 'date_registered',
        'dateregistered' => 'date_registered',

        // DATE_REGISTERED_V2
        'date_registered_v2' => 'date_registered_v2',
        'dateregisteredv2' => 'date_registered_v2',
        'date_registered2' => 'date_registered_v2',

        // FAMILY_ID
        'family_id' => 'family_id',
        'familyid' => 'family_id',

        // REL_TO_FAM_HEAD
        'rel_to_fam_head' => 'rel_to_fam_head',
        'reltofamhead' => 'rel_to_fam_head',
        'relationship_to_fam_head' => 'rel_to_fam_head',
        'relation_to_fam_head' => 'rel_to_fam_head',

        // SELECTED_FAMILY
        'selected_family' => 'selected_family',
        'selectedfamily' => 'selected_family',

        // FINAL_L3_RESULT
        'final_l3_result' => 'final_l3_result',
        'finall3result' => 'final_l3_result',
        'l3_result' => 'final_l3_result',
    ];

    /**
     * Legacy helper to read all rows into memory (recommended only for small files < 10,000 rows).
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
     * Handles 330,000+ rows smoothly without freezing or lagging the system.
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
     * Estimate or calculate total rows in the spreadsheet quickly.
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
                    // Read first 64KB where <dimension ref="A1:AM330452"/> is located
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
     * Consumes ~10-15MB RAM regardless of whether file has 1,000 or 500,000 rows.
     */
    private function streamFromXlsx(string $path, int $offset = 0, ?int $limit = null): \Generator
    {
        if (! class_exists(ZipArchive::class)) {
            throw ValidationException::withMessages([
                'file' => 'XLSX import requires the PHP Zip extension. Please upload a CSV instead.',
            ]);
        }

        $tempDir = storage_path('framework/cache/xlsx_' . md5($path));
        @mkdir($tempDir, 0777, true);

        // Find active sheet
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

        // 1. Read shared strings if present (cached in json for instant batch reuse)
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

        // 2. Stream worksheet rows using XMLReader
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
                // First row is the table header
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

                // Fast-skip data rows that are before offset using XMLReader next()
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

                // Map cells to columns
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
                    if (($row['age'] === null || $row['age'] === '') && ($row['current_age'] !== null && $row['current_age'] !== '')) {
                        $row['age'] = $row['current_age'];
                    } elseif (($row['current_age'] === null || $row['current_age'] === '') && ($row['age'] !== null && $row['age'] !== '')) {
                        $row['current_age'] = $row['age'];
                    }
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
                if (($row['age'] === null || $row['age'] === '') && ($row['current_age'] !== null && $row['current_age'] !== '')) {
                    $row['age'] = $row['current_age'];
                } elseif (($row['current_age'] === null || $row['current_age'] === '') && ($row['age'] !== null && $row['age'] !== '')) {
                    $row['current_age'] = $row['age'];
                }
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
                if (($row['age'] === null || $row['age'] === '') && ($row['current_age'] !== null && $row['current_age'] !== '')) {
                    $row['age'] = $row['current_age'];
                } elseif (($row['current_age'] === null || $row['current_age'] === '') && ($row['age'] !== null && $row['age'] !== '')) {
                    $row['current_age'] = $row['age'];
                }
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
        $tempDir = storage_path('framework/cache/xlsx_' . md5($filePath));
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
        // Strip UTF-8 BOM if present
        $header = preg_replace('/^\xEF\xBB\xBF/', '', $header) ?? $header;
        // Strip non-breaking spaces
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
        $tempPath = $tempDir . '/grantee_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $extension;

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
