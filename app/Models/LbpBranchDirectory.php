<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class LbpBranchDirectory extends Model
{
    use HasFactory;

    protected $table = 'lbp_branch_directories';

    protected $fillable = [
        'branch',
        'addressee_name',
        'addressee_position',
        'addressee_branch',
        'address_1',
        'address_2',
    ];

    /**
     * Ensure the lbp_branch_directories table exists and is seeded with default LBP branch directory records.
     */
    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('lbp_branch_directories')) {
            Schema::create('lbp_branch_directories', function (Blueprint $table) {
                $table->id();
                $table->string('branch')->index();
                $table->string('addressee_name')->nullable();
                $table->string('addressee_position')->nullable();
                $table->string('addressee_branch')->nullable();
                $table->string('address_1')->nullable();
                $table->string('address_2')->nullable();
                $table->timestamps();
            });
        }

        if (static::query()->count() === 0) {
            static::seedDefaults();
        }
    }

    /**
     * Seed default Caraga LBP Branch Directory records matching the official directory table.
     */
    public static function seedDefaults(): void
    {
        $now = now();
        $rows = [
            [
                'branch' => 'Butuan',
                'addressee_name' => 'MS. EMELITA I. ESCALANTE',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Butuan Branch',
                'address_1' => 'Ong Hoc Building, Montilla Blvd. Cor. P. Burgoz St.,',
                'address_2' => 'Butuan City',
            ],
            [
                'branch' => 'Butuan - E. Luna',
                'addressee_name' => 'MR. CARLITO L. DAING',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Butuan - E. Luna Branch',
                'address_1' => 'Ground Floor, Saint Joseph Parish Hall, E. Luna Street, Sikatuna,',
                'address_2' => 'Butuan City',
            ],
            [
                'branch' => 'Cabadbaran',
                'addressee_name' => 'MS. RUBY M. CULTURA',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Cabadbaran Branch',
                'address_1' => 'Chang Building Atega Cor. Asis Streets,',
                'address_2' => 'Cabadbaran City',
            ],
            [
                'branch' => 'Bayugan',
                'addressee_name' => 'MS. MARY JOY A. TORCENDE',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Bayugan Branch',
                'address_1' => 'Dy Building, National Highway, Brgy. Taglatawan,',
                'address_2' => 'Bayugan City',
            ],
            [
                'branch' => 'San Francisco',
                'addressee_name' => 'MS. JULIET T. ARIÑO',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - San Francisco Branch',
                'address_1' => 'San Francisco Public Market Mall, Center Island Street,',
                'address_2' => 'San Francisco, Agusan Del Sur',
            ],
            [
                'branch' => 'Bunawan',
                'addressee_name' => 'MR. ADRIAN LLOYD O. TAN',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Bunawan Branch',
                'address_1' => 'Municipal Compound, Purok 4, Brgy. San Teodoro,',
                'address_2' => 'Bunawan, Agusan Del Sur',
            ],
            [
                'branch' => 'Dinagat Islands',
                'addressee_name' => 'MS. MARIA CELESTE F. ADVINCULA',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Dinagat Branch',
                'address_1' => 'R.R. Buray Ave. Cor H.Tovar St. Poblacion,',
                'address_2' => 'San Jose, Dinagat Islands',
            ],
            [
                'branch' => 'Surigao',
                'addressee_name' => 'MS. ABIGAIL A. MALUBAG',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Surigao Branch',
                'address_1' => 'Surigao City Hall Compound, Borromeo Street,',
                'address_2' => 'Surigao City',
            ],
            [
                'branch' => 'Surigao - Luna',
                'addressee_name' => 'MR. CHARLITO D. ARQUION',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Surigao - Luna Branch',
                'address_1' => 'Parkway Building, Brgy. Luna,',
                'address_2' => 'Surigao City',
            ],
            [
                'branch' => 'Claver',
                'addressee_name' => 'MR. RENEBOY L. BONITA',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Claver Branch',
                'address_1' => 'National Highway, Barangay Ladgaron,',
                'address_2' => 'Claver, Surigao Del Norte',
            ],
            [
                'branch' => 'Bislig',
                'addressee_name' => 'MS. CONCEPCION ROXAN U. DIADULA',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Bislig Branch',
                'address_1' => 'Landbank Building F. Clar Street, Mangagoy,',
                'address_2' => 'Bislig City',
            ],
            [
                'branch' => 'Tandag',
                'addressee_name' => 'MS. ELVIRA C. TAN',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Tandag Branch',
                'address_1' => 'Bautista Building, Donasco Street,',
                'address_2' => 'Tandag City',
            ],
        ];

        $insertData = array_map(fn ($row) => array_merge($row, [
            'created_at' => $now,
            'updated_at' => $now,
        ]), $rows);

        static::query()->insert($insertData);
    }

    /**
     * Derive a formal salutation (e.g. "Ms. Escalante", "Mr. Daing") from an addressee name.
     */
    public static function deriveSalutation(?string $addresseeName): string
    {
        $raw = trim((string) $addresseeName);
        if ($raw === '') {
            return 'Ma\'am/Sir';
        }

        $tokens = preg_split('/\s+/u', $raw, -1, PREG_SPLIT_NO_EMPTY);
        if (! $tokens || count($tokens) === 0) {
            return 'Ma\'am/Sir';
        }

        $prefixMap = [
            'MS' => 'Ms.',
            'MS.' => 'Ms.',
            'MR' => 'Mr.',
            'MR.' => 'Mr.',
            'MRS' => 'Mrs.',
            'MRS.' => 'Mrs.',
            'DR' => 'Dr.',
            'DR.' => 'Dr.',
            'ATTY' => 'Atty.',
            'ATTY.' => 'Atty.',
            'ENGR' => 'Engr.',
            'ENGR.' => 'Engr.',
            'HON' => 'Hon.',
            'HON.' => 'Hon.',
        ];

        $firstUpper = mb_strtoupper($tokens[0], 'UTF-8');
        $prefix = $prefixMap[$firstUpper] ?? '';

        $suffixes = ['JR', 'JR.', 'SR', 'SR.', 'II', 'III', 'IV', 'V'];
        $lastIdx = count($tokens) - 1;
        while ($lastIdx > 0 && in_array(mb_strtoupper(rtrim($tokens[$lastIdx], '.,'), 'UTF-8'), $suffixes, true)) {
            $lastIdx--;
        }

        $surnameRaw = trim($tokens[$lastIdx], " \t\n\r\0\x0B.,");
        $surname = mb_convert_case(mb_strtolower($surnameRaw, 'UTF-8'), MB_CASE_TITLE, 'UTF-8');

        return trim(($prefix !== '' ? $prefix.' ' : '').$surname);
    }

    /**
     * Normalize a place name for resilient matching.
     */
    protected static function normalizePlaceName(?string $value): string
    {
        $upper = mb_strtoupper(trim((string) $value), 'UTF-8');
        $upper = preg_replace('/\s+/u', ' ', $upper) ?? $upper;

        return trim($upper);
    }

    /**
     * Expand municipality aliases so variations like "BAYUGAN CITY" match "CITY OF BAYUGAN".
     *
     * @return array<int, string>
     */
    protected static function getMunicipalityAliases(string $muni): array
    {
        $norm = static::normalizePlaceName($muni);
        $candidates = [$norm];

        // Strip parenthetical suffix e.g. "SAN FRANCISCO (ANAO-AON)" -> "SAN FRANCISCO"
        $withoutParen = trim((string) preg_replace('/\s*\(.*?\)\s*/u', ' ', $norm));
        if ($withoutParen !== '' && $withoutParen !== $norm) {
            $candidates[] = $withoutParen;
        }

        if (str_starts_with($norm, 'CITY OF ')) {
            $cityCore = trim(substr($norm, strlen('CITY OF ')));
            if ($cityCore !== '') {
                $candidates[] = $cityCore.' CITY';
                $candidates[] = $cityCore;
            }
        }

        if (str_ends_with($norm, ' CITY')) {
            $cityCore = trim(substr($norm, 0, -strlen(' CITY')));
            if ($cityCore !== '') {
                $candidates[] = 'CITY OF '.$cityCore;
                $candidates[] = $cityCore;
            }
        }

        $specialAliases = [
            'REMEDIOS T. ROMUALDEZ' => ['R.T. ROMUALDEZ', 'RT ROMUALDEZ', 'RTR'],
            'SANTA JOSEFA' => ['STA. JOSEFA', 'STA JOSEFA'],
            'SANTA MONICA (SAPAO)' => ['SANTA MONICA', 'STA. MONICA', 'STA MONICA', 'SAPAO'],
            'GENERAL LUNA' => ['GEN. LUNA', 'GEN LUNA'],
            'SAN JOSE (DINAGAT)' => ['SAN JOSE'],
            'LIBJO (ALBOR)' => ['LIBJO', 'ALBOR'],
            'CAGDIANAO' => ['CAGDIANAO'],
        ];

        foreach ($specialAliases as $canonical => $aliases) {
            if ($norm === $canonical || in_array($norm, $aliases, true)) {
                $candidates[] = $canonical;
                foreach ($aliases as $alias) {
                    $candidates[] = $alias;
                }
            }
        }

        return array_values(array_unique(array_filter($candidates)));
    }

    /**
     * Return all LBP Branch Directory rows formatted for print pages.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function getAllForPrint(): array
    {
        static::ensureTableExists();
        LbpCoveredMunicipality::ensureTableExists();

        return static::query()
            ->orderBy('id', 'asc')
            ->get()
            ->map(function (self $branch) {
                return [
                    'id' => $branch->id,
                    'branch' => (string) ($branch->branch ?? ''),
                    'addressee_name' => (string) ($branch->addressee_name ?? ''),
                    'addressee_position' => (string) ($branch->addressee_position ?? 'Branch Head'),
                    'addressee_branch' => (string) ($branch->addressee_branch ?? ''),
                    'address_1' => (string) ($branch->address_1 ?? ''),
                    'address_2' => (string) ($branch->address_2 ?? ''),
                    'salutation' => static::deriveSalutation($branch->addressee_name),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Resolve each request record's address/household to its covered municipality and LBP Branch Directory entry.
     *
     * @param  iterable<int, mixed>  $records
     * @return array<int, array<string, mixed>>
     */
    public static function resolveRecordsForPrint(iterable $records): array
    {
        static::ensureTableExists();
        LbpCoveredMunicipality::ensureTableExists();

        $branches = static::getAllForPrint();
        $branchesById = [];
        $branchesByKey = [];
        foreach ($branches as $b) {
            $branchesById[(int) $b['id']] = $b;
            $branchesByKey[static::normalizePlaceName($b['branch'])] = $b;
        }

        // Alias mapping for branch names in covered municipalities
        if (isset($branchesByKey['SURIGAO - LUNA']) && ! isset($branchesByKey['SURIGAO - SAN NICOLAS'])) {
            $branchesByKey['SURIGAO - SAN NICOLAS'] = $branchesByKey['SURIGAO - LUNA'];
        }
        if (isset($branchesByKey['SURIGAO - SAN NICOLAS']) && ! isset($branchesByKey['SURIGAO - LUNA'])) {
            $branchesByKey['SURIGAO - LUNA'] = $branchesByKey['SURIGAO - SAN NICOLAS'];
        }

        $defaultBranch = $branchesByKey['BUTUAN'] ?? ($branches[0] ?? [
            'id' => 0,
            'branch' => 'Butuan',
            'addressee_name' => 'MS. EMELITA I. ESCALANTE',
            'addressee_position' => 'Branch Head',
            'addressee_branch' => 'Land Bank of the Philippines - Butuan Branch',
            'address_1' => 'Ong Hoc Building, Montilla Blvd. Cor. P. Burgoz St.,',
            'address_2' => 'Butuan City',
            'salutation' => 'Ms. Escalante',
        ]);

        $coveredMunicipalities = LbpCoveredMunicipality::query()
            ->orderBy('id', 'asc')
            ->get();

        // Build lookup structures for covered municipalities
        $muniRows = [];
        foreach ($coveredMunicipalities as $cm) {
            $muniNorm = static::normalizePlaceName($cm->municipality);
            $provNorm = static::normalizePlaceName($cm->province);
            $aliases = static::getMunicipalityAliases($muniNorm);

            $resolvedBranch = null;
            if ($cm->lbp_branch_id && isset($branchesById[(int) $cm->lbp_branch_id])) {
                $resolvedBranch = $branchesById[(int) $cm->lbp_branch_id];
            } else {
                $bKey = static::normalizePlaceName($cm->covered_lbp_branch);
                if (isset($branchesByKey[$bKey])) {
                    $resolvedBranch = $branchesByKey[$bKey];
                }
            }

            $muniRows[] = [
                'municipality' => $muniNorm,
                'province' => $provNorm,
                'aliases' => $aliases,
                'covered_lbp_branch' => (string) ($cm->covered_lbp_branch ?? ''),
                'branch_directory' => $resolvedBranch ?? $defaultBranch,
            ];
        }

        $recordsArray = [];
        $hhids = [];
        foreach ($records as $rec) {
            $arr = is_array($rec) ? $rec : (method_exists($rec, 'toArray') ? $rec->toArray() : (array) $rec);
            $recordsArray[] = $arr;
            $hhid = trim((string) ($arr['household_id_number'] ?? ''));
            if ($hhid !== '') {
                $hhids[] = $hhid;
            }
        }

        // Fallback household lookup from GranteeList / EmvRecord if address is missing municipality
        $hhLocationMap = [];
        $uniqueHhids = array_values(array_unique($hhids));
        if (count($uniqueHhids) > 0) {
            try {
                if (Schema::hasTable('grantee_lists')) {
                    $grantees = GranteeList::query()
                        ->whereIn('household_id_number', $uniqueHhids)
                        ->get(['household_id_number', 'municipality', 'province']);
                    foreach ($grantees as $g) {
                        $key = trim((string) $g->household_id_number);
                        if ($key !== '' && ! empty($g->municipality)) {
                            $hhLocationMap[$key] = [
                                'municipality' => (string) $g->municipality,
                                'province' => (string) ($g->province ?? ''),
                            ];
                        }
                    }
                }
                if (Schema::hasTable('emv_records')) {
                    $emvs = EmvRecord::query()
                        ->whereIn('household_id_number', $uniqueHhids)
                        ->get(['household_id_number', 'municipality', 'province']);
                    foreach ($emvs as $e) {
                        $key = trim((string) $e->household_id_number);
                        if ($key !== '' && ! isset($hhLocationMap[$key]) && ! empty($e->municipality)) {
                            $hhLocationMap[$key] = [
                                'municipality' => (string) $e->municipality,
                                'province' => (string) ($e->province ?? ''),
                            ];
                        }
                    }
                }
            } catch (\Throwable $e) {
                // Ignore fallback errors
            }
        }

        foreach ($recordsArray as &$item) {
            $addressRaw = (string) ($item['address'] ?? '');
            $addressUpper = static::normalizePlaceName($addressRaw);
            $segments = array_values(array_filter(array_map(
                fn ($seg) => static::normalizePlaceName($seg),
                explode(',', $addressRaw)
            )));

            $hhid = trim((string) ($item['household_id_number'] ?? ''));
            $fallbackLoc = $hhLocationMap[$hhid] ?? null;

            $matchedRow = null;

            // 1. Exact segment match on municipality (+ province check if multiple municipalities share a name)
            $segmentCandidates = [];
            foreach ($muniRows as $mRow) {
                foreach ($segments as $seg) {
                    if (in_array($seg, $mRow['aliases'], true)) {
                        $provinceMatches = $mRow['province'] !== '' && (
                            in_array($mRow['province'], $segments, true) ||
                            str_contains($addressUpper, $mRow['province'])
                        );
                        $segmentCandidates[] = [
                            'row' => $mRow,
                            'province_match' => $provinceMatches,
                            'alias_len' => strlen($seg),
                        ];
                    }
                }
            }

            if (count($segmentCandidates) > 0) {
                usort($segmentCandidates, function ($a, $b) {
                    if ($a['province_match'] !== $b['province_match']) {
                        return $b['province_match'] <=> $a['province_match'];
                    }

                    return $b['alias_len'] <=> $a['alias_len'];
                });
                $matchedRow = $segmentCandidates[0]['row'];
            }

            // 2. Fallback to substring match in full address string
            if (! $matchedRow && $addressUpper !== '') {
                $substringCandidates = [];
                foreach ($muniRows as $mRow) {
                    foreach ($mRow['aliases'] as $alias) {
                        if ($alias !== '' && preg_match('/(^|[\s,])'.preg_quote($alias, '/').'($|[\s,])/u', $addressUpper)) {
                            $provinceMatches = $mRow['province'] !== '' && str_contains($addressUpper, $mRow['province']);
                            $substringCandidates[] = [
                                'row' => $mRow,
                                'province_match' => $provinceMatches,
                                'alias_len' => strlen($alias),
                            ];
                        }
                    }
                }

                if (count($substringCandidates) > 0) {
                    usort($substringCandidates, function ($a, $b) {
                        if ($a['province_match'] !== $b['province_match']) {
                            return $b['province_match'] <=> $a['province_match'];
                        }

                        return $b['alias_len'] <=> $a['alias_len'];
                    });
                    $matchedRow = $substringCandidates[0]['row'];
                }
            }

            // 3. Fallback to household lookup (GranteeList / EmvRecord)
            if (! $matchedRow && $fallbackLoc) {
                $fbMuni = static::normalizePlaceName($fallbackLoc['municipality']);
                $fbProv = static::normalizePlaceName($fallbackLoc['province']);
                foreach ($muniRows as $mRow) {
                    if (in_array($fbMuni, $mRow['aliases'], true)) {
                        if ($fbProv === '' || $mRow['province'] === $fbProv || str_contains($fbProv, $mRow['province'])) {
                            $matchedRow = $mRow;
                            break;
                        }
                    }
                }
            }

            $resolvedBranchDir = $matchedRow ? $matchedRow['branch_directory'] : $defaultBranch;
            $resolvedMuniKey = $matchedRow
                ? ($matchedRow['municipality'].($matchedRow['province'] ? ', '.$matchedRow['province'] : ''))
                : ($addressUpper !== '' ? $addressUpper : 'DEFAULT');

            $item['resolved_municipality'] = $resolvedMuniKey;
            $item['resolved_branch'] = (string) ($resolvedBranchDir['branch'] ?? 'Butuan');
            $item['branch_directory'] = $resolvedBranchDir;
        }
        unset($item);

        return $recordsArray;
    }
}

