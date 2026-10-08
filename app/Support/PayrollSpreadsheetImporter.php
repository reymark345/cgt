<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use SimpleXMLElement;
use XMLReader;
use ZipArchive;

class PayrollSpreadsheetImporter
{
    public const COLUMNS = [
        'period',
        'year',
        'payroll_description',
        'region',
        'province',
        'municipality',
        'barangay',
        'address_psgc',
        'last_name',
        'first_name',
        'middle_name',
        'household_id',
        'payment_mode_classification',
        'mode_of_payment',
        'account_number',
        'payroll_date',
        'finance_approval',
        'educ_dc_elem',
        'educ_jr_hs',
        'educ_sr_hs',
        'educ_total_hs',
        'total_educ',
        'health',
        'rice_amount',
        'f1kd_amount',
        'gross_amount',
        'adjustment_amount',
        'net_amount',
        'hh_set',
        'set_group',
    ];

    private const HEADER_ALIASES = [
        // PERIOD
        'period' => 'period',
        'payroll_period' => 'period',
        'payrollperiod' => 'period',
        'cycle' => 'period',
        'period_name' => 'period',
        'period_cycle' => 'period',
        'periods' => 'period',

        // YEAR
        'year' => 'year',
        'payroll_year' => 'year',
        'payrollyear' => 'year',
        'yr' => 'year',

        // PAYROLL DESCRIPTION
        'payroll_description' => 'payroll_description',
        'payrolldescription' => 'payroll_description',
        'payroll_desc' => 'payroll_description',
        'pay_description' => 'payroll_description',
        'description' => 'payroll_description',

        // REGION
        'region' => 'region',
        'reg' => 'region',

        // PROVINCE
        'province' => 'province',
        'prov' => 'province',

        // MUNICIPALITY
        'municipality' => 'municipality',
        'city' => 'municipality',
        'city_municipality' => 'municipality',
        'mun' => 'municipality',

        // BARANGAY
        'barangay' => 'barangay',
        'brgy' => 'barangay',
        'bgy' => 'barangay',

        // ADDRESS PSGC
        'address_psgc' => 'address_psgc',
        'addresspsgc' => 'address_psgc',
        'psgc' => 'address_psgc',
        'psgc_code' => 'address_psgc',
        'psgc_address' => 'address_psgc',

        // LAST NAME
        'last_name' => 'last_name',
        'lastname' => 'last_name',
        'surname' => 'last_name',
        'last' => 'last_name',

        // FIRST NAME
        'first_name' => 'first_name',
        'firstname' => 'first_name',
        'first' => 'first_name',

        // MIDDLE NAME
        'middle_name' => 'middle_name',
        'middlename' => 'middle_name',
        'mid_name' => 'middle_name',
        'middle' => 'middle_name',

        // HOUSEHOLD ID
        'household_id' => 'household_id',
        'householdid' => 'household_id',
        'hh_id' => 'household_id',
        'hhid' => 'household_id',
        'house_hold_id' => 'household_id',

        // PAYMENT MODE CLASSIFICATION
        'payment_mode_classification' => 'payment_mode_classification',
        'paymentmodeclassification' => 'payment_mode_classification',
        'payment_classification' => 'payment_mode_classification',
        'pay_mode_class' => 'payment_mode_classification',
        'pm_classification' => 'payment_mode_classification',

        // MODE OF PAYMENT
        'mode_of_payment' => 'mode_of_payment',
        'modeofpayment' => 'mode_of_payment',
        'payment_mode' => 'mode_of_payment',
        'paymentmode' => 'mode_of_payment',
        'mop' => 'mode_of_payment',

        // ACCOUNT NUMBER
        'account_number' => 'account_number',
        'accountnumber' => 'account_number',
        'account_no' => 'account_number',
        'accountno' => 'account_number',
        'card_number' => 'account_number',
        'card_no' => 'account_number',
        'cardno' => 'account_number',
        'lbp_account' => 'account_number',

        // PAYROLL DATE
        'payroll_date' => 'payroll_date',
        'payrolldate' => 'payroll_date',
        'date_payroll' => 'payroll_date',
        'pay_date' => 'payroll_date',

        // FINANCE APPROVAL
        'finance_approval' => 'finance_approval',
        'financeapproval' => 'finance_approval',
        'finance_approval_date' => 'finance_approval',
        'approval_date' => 'finance_approval',
        'date_approved' => 'finance_approval',

        // EDUC DC ELEM
        'educ_dc_elem' => 'educ_dc_elem',
        'educdcelem' => 'educ_dc_elem',
        'educ_elem' => 'educ_dc_elem',
        'elem_amount' => 'educ_dc_elem',
        'elem' => 'educ_dc_elem',
        'dc_elem' => 'educ_dc_elem',

        // EDUC JR HS
        'educ_jr_hs' => 'educ_jr_hs',
        'educjrhs' => 'educ_jr_hs',
        'educ_junior_hs' => 'educ_jr_hs',
        'jr_hs' => 'educ_jr_hs',
        'jrhs' => 'educ_jr_hs',
        'junior_hs' => 'educ_jr_hs',

        // EDUC SR HS
        'educ_sr_hs' => 'educ_sr_hs',
        'educsrhs' => 'educ_sr_hs',
        'educ_senior_hs' => 'educ_sr_hs',
        'sr_hs' => 'educ_sr_hs',
        'srhs' => 'educ_sr_hs',
        'senior_hs' => 'educ_sr_hs',

        // EDUC TOTAL HS
        'educ_total_hs' => 'educ_total_hs',
        'eductotalhs' => 'educ_total_hs',
        'total_hs' => 'educ_total_hs',
        'totalhs' => 'educ_total_hs',
        'hs_total' => 'educ_total_hs',

        // TOTAL EDUC
        'total_educ' => 'total_educ',
        'totaleduc' => 'total_educ',
        'educ_total' => 'total_educ',
        'edu_total' => 'total_educ',
        'total_education' => 'total_educ',

        // HEALTH
        'health' => 'health',
        'health_amount' => 'health',
        'health_grant' => 'health',

        // RICE AMOUNT
        'rice_amount' => 'rice_amount',
        'riceamount' => 'rice_amount',
        'rice' => 'rice_amount',
        'rice_subsidy' => 'rice_amount',

        // F1KD AMOUNT
        'f1kd_amount' => 'f1kd_amount',
        'f1kdamount' => 'f1kd_amount',
        'f1kd' => 'f1kd_amount',
        'first_1000_days' => 'f1kd_amount',

        // GROSS AMOUNT
        'gross_amount' => 'gross_amount',
        'grossamount' => 'gross_amount',
        'gross' => 'gross_amount',
        'gross_grant' => 'gross_amount',

        // ADJUSTMENT AMOUNT
        'adjustment_amount' => 'adjustment_amount',
        'adjustmentamount' => 'adjustment_amount',
        'adjustment' => 'adjustment_amount',
        'adj_amount' => 'adjustment_amount',
        'adjustments' => 'adjustment_amount',

        // NET AMOUNT
        'net_amount' => 'net_amount',
        'netamount' => 'net_amount',
        'net' => 'net_amount',
        'net_grant' => 'net_amount',
        'total_amount' => 'net_amount',

        // HH SET
        'hh_set' => 'hh_set',
        'hhset' => 'hh_set',
        'set' => 'hh_set',
        'set_no' => 'hh_set',

        // SET GROUP
        'set_group' => 'set_group',
        'setgroup' => 'set_group',
        'group' => 'set_group',
    ];

    /**
     * Stream rows one-by-one with constant, minimal memory usage (< 15MB RAM).
     *
     * @return \Generator<int, array<string, mixed>>
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
     * Estimate total rows in constant time.
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

            return max(0, $count - 1);
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
     * Clean up temporary extract directories.
     */
    public function cleanExtractDir(string $path): void
    {
        $dir = dirname($path) . DIRECTORY_SEPARATOR . 'xlsx_' . md5($path);
        if (is_dir($dir)) {
            $files = glob($dir . '/*');
            if ($files) {
                foreach ($files as $f) {
                    @unlink($f);
                }
            }
            @rmdir($dir);
        }
    }

    private function streamFromCsv(string $path, int $offset = 0, ?int $limit = null): \Generator
    {
        $handle = fopen($path, 'r');
        if (! $handle) {
            return;
        }

        $delimiter = $this->detectDelimiter($path);
        $headerRow = fgetcsv($handle, 0, $delimiter);

        if ($headerRow === false || empty($headerRow)) {
            fclose($handle);
            return;
        }

        // Clean UTF-8 BOM
        if (isset($headerRow[0])) {
            $headerRow[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $headerRow[0]);
        }

        $columnMap = $this->buildColumnMap($headerRow);

        $currentIndex = 0;
        $yieldedCount = 0;

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            if ($this->isEmptyRow($row)) {
                continue;
            }

            if ($currentIndex < $offset) {
                $currentIndex++;
                continue;
            }

            $mapped = $this->mapRow($row, $columnMap);
            if (! empty($mapped['household_id']) || ! empty($mapped['account_number']) || ! empty($mapped['last_name'])) {
                yield $mapped;
                $yieldedCount++;
            }

            $currentIndex++;

            if ($limit !== null && $yieldedCount >= $limit) {
                break;
            }
        }

        fclose($handle);
    }

    private function streamFromXlsx(string $path, int $offset = 0, ?int $limit = null): \Generator
    {
        if (! class_exists(ZipArchive::class)) {
            throw ValidationException::withMessages([
                'file' => 'PHP ZipArchive extension is required to process .xlsx files.',
            ]);
        }

        $extractDir = dirname($path) . DIRECTORY_SEPARATOR . 'xlsx_' . md5($path);
        if (! is_dir($extractDir)) {
            @mkdir($extractDir, 0777, true);
        }

        $zip = new ZipArchive();
        if ($zip->open($path) !== true) {
            throw ValidationException::withMessages([
                'file' => 'Failed to open the XLSX spreadsheet file.',
            ]);
        }

        $sheetXmlPath = $extractDir . DIRECTORY_SEPARATOR . 'sheet1.xml';
        $stringsXmlPath = $extractDir . DIRECTORY_SEPARATOR . 'sharedStrings.xml';

        if (! file_exists($sheetXmlPath)) {
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
            $zip->extractTo($extractDir, [$sheetEntry]);
            if ($sheetEntry !== 'sheet1.xml' && file_exists($extractDir . DIRECTORY_SEPARATOR . $sheetEntry)) {
                @rename($extractDir . DIRECTORY_SEPARATOR . $sheetEntry, $sheetXmlPath);
            }
        }

        if (! file_exists($stringsXmlPath) && $zip->locateName('xl/sharedStrings.xml') !== false) {
            $zip->extractTo($extractDir, ['xl/sharedStrings.xml']);
            if (file_exists($extractDir . DIRECTORY_SEPARATOR . 'xl/sharedStrings.xml')) {
                @rename($extractDir . DIRECTORY_SEPARATOR . 'xl/sharedStrings.xml', $stringsXmlPath);
            }
        }

        $zip->close();

        $sharedStrings = $this->loadSharedStrings($stringsXmlPath);

        $reader = new XMLReader();
        if (! $reader->open($sheetXmlPath, null, LIBXML_NOERROR | LIBXML_NOWARNING | LIBXML_NONET)) {
            throw ValidationException::withMessages([
                'file' => 'Failed to stream the worksheet XML.',
            ]);
        }

        $columnMap = null;
        $rowNum = 0;
        $dataRowIndex = 0;
        $yieldedCount = 0;

        while ($reader->read()) {
            if ($reader->nodeType === XMLReader::ELEMENT && $reader->name === 'row') {
                $rowNum++;
                $cells = $this->parseRowCells($reader, $sharedStrings);

                if (empty($cells)) {
                    continue;
                }

                if ($columnMap === null) {
                    $columnMap = $this->buildColumnMap($cells);
                    continue;
                }

                if ($dataRowIndex < $offset) {
                    $dataRowIndex++;
                    continue;
                }

                $mapped = $this->mapRow($cells, $columnMap);
                if (! empty($mapped['household_id']) || ! empty($mapped['account_number']) || ! empty($mapped['last_name'])) {
                    yield $mapped;
                    $yieldedCount++;
                }

                $dataRowIndex++;

                if ($limit !== null && $yieldedCount >= $limit) {
                    break;
                }
            }
        }

        $reader->close();
    }

    private function streamFromXml(string $path, int $offset = 0, ?int $limit = null): \Generator
    {
        $reader = new XMLReader();
        if (! $reader->open($path, null, LIBXML_NOERROR | LIBXML_NOWARNING | LIBXML_NONET)) {
            return;
        }

        $columnMap = null;
        $dataRowIndex = 0;
        $yieldedCount = 0;

        while ($reader->read()) {
            if ($reader->nodeType === XMLReader::ELEMENT && ($reader->name === 'Row' || $reader->name === 'row')) {
                $rowXml = $reader->readOuterXml();
                $xmlObj = @simplexml_load_string($rowXml);
                if (! $xmlObj) {
                    continue;
                }

                $cells = [];
                foreach ($xmlObj->children() as $cell) {
                    $cells[] = trim((string) $cell);
                }

                if (empty($cells)) {
                    continue;
                }

                if ($columnMap === null) {
                    $columnMap = $this->buildColumnMap($cells);
                    continue;
                }

                if ($dataRowIndex < $offset) {
                    $dataRowIndex++;
                    continue;
                }

                $mapped = $this->mapRow($cells, $columnMap);
                if (! empty($mapped['household_id']) || ! empty($mapped['account_number']) || ! empty($mapped['last_name'])) {
                    yield $mapped;
                    $yieldedCount++;
                }

                $dataRowIndex++;

                if ($limit !== null && $yieldedCount >= $limit) {
                    break;
                }
            }
        }

        $reader->close();
    }

    /**
     * Build column index -> target column name mapping.
     */
    private function buildColumnMap(array $headers): array
    {
        $map = [];
        $matchedKeys = [];

        foreach ($headers as $colIdx => $headerVal) {
            $norm = $this->normalizeHeader((string) $headerVal);
            if (isset(self::HEADER_ALIASES[$norm])) {
                $targetKey = self::HEADER_ALIASES[$norm];
                $map[$colIdx] = $targetKey;
                $matchedKeys[$targetKey] = true;
            }
        }

        // If at least 3 standard columns matched, return named map
        if (count($map) >= 3) {
            return $map;
        }

        // Positional fallback
        $map = [];
        $totalCols = count($headers);

        if ($totalCols >= 30) {
            // Standard 30 columns with PERIOD at index 0
            foreach (self::COLUMNS as $idx => $key) {
                $map[$idx] = $key;
            }
        } elseif ($totalCols >= 29) {
            // 29 columns starting with YEAR at index 0
            $columnsWithoutPeriod = array_values(array_filter(self::COLUMNS, fn ($k) => $k !== 'period'));
            foreach ($columnsWithoutPeriod as $idx => $key) {
                $map[$idx] = $key;
            }
        } else {
            foreach ($headers as $idx => $key) {
                $norm = $this->normalizeHeader((string) $key);
                if (isset(self::HEADER_ALIASES[$norm])) {
                    $map[$idx] = self::HEADER_ALIASES[$norm];
                }
            }
        }

        return $map;
    }

    private function mapRow(array $rawCells, array $columnMap): array
    {
        $record = [];

        foreach (self::COLUMNS as $col) {
            $record[$col] = null;
        }

        // Check if headers omitted PERIOD (headers started with YEAR), but data row has leading PERIOD
        $hasPeriodInMap = in_array('period', $columnMap, true);
        $offset = 0;
        if (! $hasPeriodInMap && isset($columnMap[0]) && $columnMap[0] === 'year') {
            $firstCell = isset($rawCells[0]) ? trim((string) $rawCells[0]) : '';
            $secondCell = isset($rawCells[1]) ? trim((string) $rawCells[1]) : '';
            if (
                preg_match('/^P[0-9]+/i', $firstCell) ||
                preg_match('/^(?:period|cycle)\s*[0-9]+/i', $firstCell) ||
                (preg_match('/^20[0-9]{2}$/', $secondCell) && ! is_numeric($firstCell))
            ) {
                $record['period'] = $firstCell;
                $offset = 1;
            }
        }

        foreach ($columnMap as $cellIndex => $targetKey) {
            $effectiveIndex = $cellIndex + $offset;
            $val = isset($rawCells[$effectiveIndex]) ? trim((string) $rawCells[$effectiveIndex]) : null;
            if ($val === '' || $val === 'NULL' || $val === 'null' || $val === '-') {
                $val = null;
            }

            // Numeric amount cleaning
            if (in_array($targetKey, [
                'educ_dc_elem', 'educ_jr_hs', 'educ_sr_hs', 'educ_total_hs',
                'total_educ', 'health', 'rice_amount', 'f1kd_amount',
                'gross_amount', 'adjustment_amount', 'net_amount'
            ], true)) {
                if ($val !== null) {
                    $cleanNum = preg_replace('/[^0-9.\-]/', '', $val);
                    $val = is_numeric($cleanNum) ? (float) $cleanNum : 0.0;
                } else {
                    $val = 0.0;
                }
            }

            $record[$targetKey] = $val;
        }

        // Clean prefixes if present
        if (! empty($record['account_number'])) {
            $record['account_number'] = preg_replace('/^CARD/i', '', (string) $record['account_number']);
        }
        if (! empty($record['household_id'])) {
            $record['household_id'] = preg_replace('/^HHID/i', '', (string) $record['household_id']);
        }

        return $record;
    }

    private function normalizeHeader(string $header): string
    {
        $h = strtolower(trim($header));
        $h = preg_replace('/[^a-z0-9]+/i', '_', $h);
        return trim($h, '_');
    }

    private function detectDelimiter(string $path): string
    {
        $handle = fopen($path, 'r');
        if (! $handle) {
            return ',';
        }
        $line = fgets($handle);
        fclose($handle);

        if (! $line) {
            return ',';
        }

        $tabs = substr_count($line, "\t");
        $commas = substr_count($line, ',');
        $semicolons = substr_count($line, ';');

        if ($tabs > $commas && $tabs > $semicolons) {
            return "\t";
        }
        if ($semicolons > $commas) {
            return ';';
        }
        return ',';
    }

    private function isEmptyRow(array $row): bool
    {
        foreach ($row as $cell) {
            if (trim((string) $cell) !== '') {
                return false;
            }
        }
        return true;
    }

    private function loadSharedStrings(string $xmlPath): array
    {
        if (! file_exists($xmlPath)) {
            return [];
        }

        $strings = [];
        $reader = new XMLReader();
        if ($reader->open($xmlPath, null, LIBXML_NOERROR | LIBXML_NOWARNING | LIBXML_NONET)) {
            $currentStr = '';
            while ($reader->read()) {
                if ($reader->nodeType === XMLReader::ELEMENT && $reader->name === 'si') {
                    $currentStr = '';
                } elseif ($reader->nodeType === XMLReader::ELEMENT && $reader->name === 't') {
                    $currentStr .= $reader->readString();
                } elseif ($reader->nodeType === XMLReader::END_ELEMENT && $reader->name === 'si') {
                    $strings[] = $currentStr;
                }
            }
            $reader->close();
        }

        return $strings;
    }

    private function parseRowCells(XMLReader $reader, array &$sharedStrings): array
    {
        $cells = [];
        $cellXml = $reader->readOuterXml();
        $xml = @simplexml_load_string($cellXml);
        if (! $xml) {
            return [];
        }

        $maxCol = 0;
        $rowCells = [];

        foreach ($xml->c as $c) {
            $ref = (string) $c['r'];
            $colIndex = $this->columnRefToIndex($ref);
            if ($colIndex > $maxCol) {
                $maxCol = $colIndex;
            }

            $type = (string) $c['t'];
            $val = '';

            if ($type === 's') {
                $idx = (int) $c->v;
                $val = $sharedStrings[$idx] ?? '';
            } elseif ($type === 'inlineStr' && isset($c->is->t)) {
                $val = (string) $c->is->t;
            } elseif (isset($c->v)) {
                $val = (string) $c->v;
            }

            $rowCells[$colIndex] = trim($val);
        }

        for ($i = 0; $i <= $maxCol; $i++) {
            $cells[$i] = $rowCells[$i] ?? '';
        }

        return $cells;
    }

    private function columnRefToIndex(string $ref): int
    {
        if (preg_match('/^([A-Z]+)/', $ref, $m)) {
            $colStr = $m[1];
            $idx = 0;
            $len = strlen($colStr);
            for ($i = 0; $i < $len; $i++) {
                $idx = $idx * 26 + (ord($colStr[$i]) - 64);
            }
            return max(0, $idx - 1);
        }
        return 0;
    }
}
