<?php

namespace App\Http\Controllers;

use App\Models\DrnLibrary;
use App\Models\LbpBranchDirectory;
use App\Models\LbpCoveredMunicipality;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use ZipArchive;

class LibraryDirectoryController extends Controller
{
    /**
     * Return all LBP Branch Covered Municipalities and LBP Branch Directory records.
     */
    public function index(Request $request): JsonResponse
    {
        LbpCoveredMunicipality::ensureTableExists();
        LbpBranchDirectory::ensureTableExists();

        $coveredMunicipalities = LbpCoveredMunicipality::query()
            ->orderBy('province')
            ->orderBy('municipality')
            ->get();

        $branchDirectories = LbpBranchDirectory::query()
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'covered_municipalities' => $coveredMunicipalities,
            'branch_directories' => $branchDirectories,
        ]);
    }

    /**
     * Create or update a LBP Branch Covered Municipality record.
     */
    public function storeMunicipality(Request $request): JsonResponse
    {
        LbpCoveredMunicipality::ensureTableExists();
        LbpBranchDirectory::ensureTableExists();

        $validated = $request->validate([
            'id' => ['nullable', 'integer'],
            'province' => ['required', 'string', 'max:255'],
            'municipality' => ['required', 'string', 'max:255'],
            'lbp_branch_id' => ['nullable', 'integer'],
            'covered_lbp_branch' => ['required', 'string', 'max:255'],
        ]);

        $branchName = trim($validated['covered_lbp_branch']);
        $branchId = ! empty($validated['lbp_branch_id'])
            ? (int) $validated['lbp_branch_id']
            : LbpBranchDirectory::whereRaw('LOWER(TRIM(branch)) = ?', [mb_strtolower($branchName)])->value('id');

        if (! $branchId && str_contains(mb_strtolower($branchName), 'surigao')) {
            $branchId = LbpBranchDirectory::whereRaw('LOWER(TRIM(branch)) = ?', ['surigao - luna'])->value('id');
        }

        if (! empty($validated['id'])) {
            $record = LbpCoveredMunicipality::findOrFail($validated['id']);
            $record->update([
                'province' => trim($validated['province']),
                'municipality' => trim($validated['municipality']),
                'lbp_branch_id' => $branchId ? (int) $branchId : null,
                'covered_lbp_branch' => $branchName,
            ]);
            $message = 'Covered Municipality updated successfully.';
        } else {
            $record = LbpCoveredMunicipality::create([
                'province' => trim($validated['province']),
                'municipality' => trim($validated['municipality']),
                'lbp_branch_id' => $branchId ? (int) $branchId : null,
                'covered_lbp_branch' => $branchName,
            ]);
            $message = 'Covered Municipality added successfully.';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'record' => $record,
        ]);
    }

    /**
     * Delete a LBP Branch Covered Municipality record.
     */
    public function destroyMunicipality(Request $request, int $id): JsonResponse
    {
        LbpCoveredMunicipality::ensureTableExists();

        $record = LbpCoveredMunicipality::findOrFail($id);
        $record->delete();

        return response()->json([
            'success' => true,
            'message' => 'Covered Municipality removed successfully.',
        ]);
    }

    /**
     * Create or update a LBP Branch Directory record.
     */
    public function storeBranch(Request $request): JsonResponse
    {
        LbpBranchDirectory::ensureTableExists();

        $validated = $request->validate([
            'id' => ['nullable', 'integer'],
            'branch' => ['required', 'string', 'max:255'],
            'addressee_name' => ['nullable', 'string', 'max:255'],
            'addressee_position' => ['nullable', 'string', 'max:255'],
            'addressee_branch' => ['nullable', 'string', 'max:255'],
            'address_1' => ['nullable', 'string', 'max:500'],
            'address_2' => ['nullable', 'string', 'max:255'],
        ]);

        $payload = [
            'branch' => trim($validated['branch']),
            'addressee_name' => isset($validated['addressee_name']) ? trim($validated['addressee_name']) : '',
            'addressee_position' => isset($validated['addressee_position']) ? trim($validated['addressee_position']) : '',
            'addressee_branch' => isset($validated['addressee_branch']) ? trim($validated['addressee_branch']) : '',
            'address_1' => isset($validated['address_1']) ? trim($validated['address_1']) : '',
            'address_2' => isset($validated['address_2']) ? trim($validated['address_2']) : '',
        ];

        if (! empty($validated['id'])) {
            $record = LbpBranchDirectory::findOrFail($validated['id']);
            $record->update($payload);
            $message = 'LBP Branch Directory updated successfully.';
        } else {
            $record = LbpBranchDirectory::create($payload);
            $message = 'LBP Branch Directory added successfully.';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'record' => $record,
        ]);
    }

    /**
     * Delete a LBP Branch Directory record.
     */
    public function destroyBranch(Request $request, int $id): JsonResponse
    {
        LbpBranchDirectory::ensureTableExists();

        $record = LbpBranchDirectory::findOrFail($id);
        $record->delete();

        return response()->json([
            'success' => true,
            'message' => 'LBP Branch Directory removed successfully.',
        ]);
    }

    /**
     * Resolve the currently logged-in user's display name from SSO session or Auth guard.
     */
    protected function resolveLoggedInUserName(Request $request): string
    {
        $ssoUserId = $request->session()->get('sso_user_id');
        $user = $ssoUserId ? User::find($ssoUserId) : ($request->user() ?? Auth::user());

        if ($user) {
            $name = trim((string) ($user->name ?? ''));
            if ($name !== '') {
                return $name;
            }
            $username = trim((string) ($user->username ?? ''));
            if ($username !== '') {
                return $username;
            }
            $email = trim((string) ($user->email ?? ''));
            if ($email !== '') {
                return $email;
            }
        }

        return 'Authenticated User';
    }

    /**
     * Check whether the currently logged-in user is an Administrator.
     */
    protected function isCurrentUserAdmin(Request $request): bool
    {
        $ssoUserId = $request->session()->get('sso_user_id');
        $user = $ssoUserId ? User::find($ssoUserId) : ($request->user() ?? Auth::user());

        return $user ? $user->isAdmin() : false;
    }

    /**
     * Ensure the global print_form_settings table exists.
     */
    public static function ensurePrintSettingsTableExists(): void
    {
        if (! \Illuminate\Support\Facades\Schema::hasTable('print_form_settings')) {
            \Illuminate\Support\Facades\Schema::create('print_form_settings', function (\Illuminate\Database\Schema\Blueprint $table) {
                $table->id();
                $table->string('second_copy_ref_prefix')->default('JSP/CDC/mjso/');
                $table->string('updated_by')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Return the globally configured 2nd copy signatory reference prefix (defaults to "JSP/CDC/mjso/").
     */
    public static function getSecondCopyRefPrefix(): string
    {
        try {
            static::ensurePrintSettingsTableExists();
            $row = \Illuminate\Support\Facades\DB::table('print_form_settings')->where('id', 1)->first();
            if ($row && isset($row->second_copy_ref_prefix) && trim((string) $row->second_copy_ref_prefix) !== '') {
                return (string) $row->second_copy_ref_prefix;
            }
        } catch (\Throwable) {
            // Fallback to default if database is not yet ready
        }

        return 'JSP/CDC/mjso/';
    }

    /**
     * Return the current count of available (unassigned) DRN records in drn_libraries.
     */
    public static function getAvailableDrnCount(): int
    {
        try {
            DrnLibrary::ensureTableExists();

            return DrnLibrary::query()
                ->where(function ($q) {
                    $q->whereNull('request_type')
                        ->orWhereRaw("TRIM(COALESCE(request_type, '')) = ''");
                })
                ->count();
        } catch (\Throwable) {
            return 0;
        }
    }

    /**
     * Update the global 2nd copy signatory reference prefix (Admin only).
     */
    public function updateSecondCopyRefPrefix(Request $request): JsonResponse
    {
        if (! $this->isCurrentUserAdmin($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can update the global form reference prefix.',
            ], 403);
        }

        static::ensurePrintSettingsTableExists();

        $rawPrefix = trim((string) $request->input('second_copy_ref_prefix', ''));
        $prefix = $rawPrefix !== '' ? $rawPrefix : 'JSP/CDC/mjso/';
        $updatedBy = $this->resolveLoggedInUserName($request);

        $existing = \Illuminate\Support\Facades\DB::table('print_form_settings')->where('id', 1)->first();
        if ($existing) {
            \Illuminate\Support\Facades\DB::table('print_form_settings')->where('id', 1)->update([
                'second_copy_ref_prefix' => $prefix,
                'updated_by' => $updatedBy,
                'updated_at' => now(),
            ]);
        } else {
            \Illuminate\Support\Facades\DB::table('print_form_settings')->insert([
                'id' => 1,
                'second_copy_ref_prefix' => $prefix,
                'updated_by' => $updatedBy,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'second_copy_ref_prefix' => $prefix,
            'message' => 'Global form reference prefix updated for all request pages.',
        ]);
    }

    /**
     * Return all DRN library records.
     */
    public function drnIndex(Request $request): JsonResponse
    {
        DrnLibrary::ensureTableExists();

        $records = DrnLibrary::query()
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'records' => $records,
            'available_drn_count' => static::getAvailableDrnCount(),
            'current_user_name' => $this->resolveLoggedInUserName($request),
            'is_admin' => $this->isCurrentUserAdmin($request),
            'second_copy_ref_prefix' => static::getSecondCopyRefPrefix(),
        ]);
    }

    /**
     * Create or update a DRN library record.
     */
    public function storeDrn(Request $request): JsonResponse
    {
        DrnLibrary::ensureTableExists();

        $validated = $request->validate([
            'id' => ['nullable', 'integer'],
            'drn' => ['required', 'string', 'max:255'],
            'request_type' => ['nullable', 'string', 'max:255'],
        ]);

        $loggedInUser = $this->resolveLoggedInUserName($request);
        $todayDate = now()->format('Y-m-d');
        $cleanDrn = trim($validated['drn']);

        if ($cleanDrn === '') {
            return response()->json([
                'success' => false,
                'message' => 'DRN is required.',
            ], 422);
        }

        $duplicateQuery = DrnLibrary::query()
            ->whereRaw('LOWER(TRIM(drn)) = ?', [strtolower($cleanDrn)]);

        if (! empty($validated['id'])) {
            $duplicateQuery->where('id', '!=', (int) $validated['id']);
        }

        if ($duplicateQuery->exists()) {
            return response()->json([
                'success' => false,
                'message' => "DRN \"{$cleanDrn}\" already exists. Duplicate DRN is not allowed.",
            ], 422);
        }

        if (! empty($validated['id'])) {
            if (! $this->isCurrentUserAdmin($request)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only administrators can edit DRN records.',
                ], 403);
            }

            $record = DrnLibrary::findOrFail($validated['id']);
            $existingAddedBy = trim((string) ($record->added_by ?? ''));
            $record->update([
                'drn' => $cleanDrn,
                'request_type' => isset($validated['request_type'])
                    ? trim((string) $validated['request_type'])
                    : (string) ($record->request_type ?? ''),
                'added_by' => ($existingAddedBy === '' || $existingAddedBy === 'System User')
                    ? $loggedInUser
                    : $existingAddedBy,
                'date_added' => trim((string) ($record->date_added ?? '')) ?: $todayDate,
            ]);
            $message = 'DRN record updated successfully.';
        } else {
            $record = DrnLibrary::create([
                'drn' => $cleanDrn,
                'request_type' => '',
                'added_by' => $loggedInUser,
                'date_added' => $todayDate,
            ]);
            $message = 'DRN record added successfully.';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'record' => $record,
            'available_drn_count' => static::getAvailableDrnCount(),
        ]);
    }

    /**
     * Delete a DRN library record.
     */
    public function destroyDrn(Request $request, int $id): JsonResponse
    {
        if (! $this->isCurrentUserAdmin($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can delete DRN records.',
            ], 403);
        }

        DrnLibrary::ensureTableExists();

        $record = DrnLibrary::findOrFail($id);
        $record->delete();

        return response()->json([
            'success' => true,
            'message' => 'DRN record removed successfully.',
            'available_drn_count' => static::getAvailableDrnCount(),
        ]);
    }

    /**
     * Validate and assign available DRN(s) for a Request module print preview.
     * Each generated branch form requires 1 unassigned DRN from drn_libraries.
     * If available DRNs are insufficient, returns 422 with "DRN is not enough please add more DRN".
     */
    public function assignDrnForPrint(Request $request): JsonResponse
    {
        DrnLibrary::ensureTableExists();
        LbpBranchDirectory::ensureTableExists();

        $validated = $request->validate([
            'module' => ['required', 'string'],
            'ids' => ['nullable'],
        ]);

        $moduleMap = [
            'opening' => [
                'model' => \App\Models\Opening::class,
                'label' => 'Opening',
                'print_path' => '/opening/print',
            ],
            'distribution' => [
                'model' => \App\Models\Distribution::class,
                'label' => 'Distribution',
                'print_path' => '/distribution/print',
            ],
            'otc-withdrawal' => [
                'model' => \App\Models\OtcWithdrawal::class,
                'label' => 'OTC Withdrawal',
                'print_path' => '/otc-withdrawal/print',
            ],
            'replacement' => [
                'model' => \App\Models\Replacement::class,
                'label' => 'Replacement',
                'print_path' => '/replacement/print',
            ],
            'transfer-of-fund' => [
                'model' => \App\Models\TransferOfFund::class,
                'label' => 'Transfer of Fund',
                'print_path' => '/transfer-of-fund/print',
            ],
            'force-pin' => [
                'model' => \App\Models\ForcePin::class,
                'label' => 'Force PIN',
                'print_path' => '/force-pin/print',
            ],
            'locking' => [
                'model' => \App\Models\Locking::class,
                'label' => 'Locking',
                'print_path' => '/locking/print',
            ],
            'lifting' => [
                'model' => \App\Models\Lifting::class,
                'label' => 'Lifting',
                'print_path' => '/lifting/print',
            ],
        ];

        $moduleKey = strtolower(trim((string) $validated['module']));
        if (! isset($moduleMap[$moduleKey])) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid request module.',
            ], 422);
        }

        $moduleInfo = $moduleMap[$moduleKey];
        $modelClass = $moduleInfo['model'];
        if (method_exists($modelClass, 'ensureTableExists')) {
            $modelClass::ensureTableExists();
        }

        $rawIds = $validated['ids'] ?? [];
        $idList = is_array($rawIds) ? $rawIds : explode(',', (string) $rawIds);
        $cleanIds = array_values(array_filter(array_map('intval', $idList)));

        $query = $modelClass::query();
        if (! empty($cleanIds)) {
            $query->whereIn('id', $cleanIds);
        }
        $records = $query->orderBy('id', 'asc')->get();

        $resolvedRecords = LbpBranchDirectory::resolveRecordsForPrint($records);
        $branchGroups = [];
        foreach ($resolvedRecords as $rec) {
            $branch = strtoupper(trim((string) ($rec['resolved_branch'] ?? ($rec['branch_directory']['branch'] ?? 'SAN FRANCISCO'))));
            if ($branch === '') {
                $branch = 'SAN FRANCISCO';
            }
            if (! isset($branchGroups[$branch])) {
                $branchGroups[$branch] = [
                    'record_ids' => [],
                    'existing_drn' => '',
                ];
            }
            if (! empty($rec['id'])) {
                $branchGroups[$branch]['record_ids'][] = (int) $rec['id'];
            }
            $recDrn = trim((string) ($rec['drn'] ?? ''));
            if ($recDrn !== '' && $branchGroups[$branch]['existing_drn'] === '') {
                $branchGroups[$branch]['existing_drn'] = $recDrn;
            }
        }

        if (empty($branchGroups)) {
            $branchGroups['DEFAULT'] = [
                'record_ids' => [],
                'existing_drn' => '',
            ];
        }

        $formsCount = count($branchGroups);
        $unassignedBranchKeys = [];
        foreach ($branchGroups as $bKey => $group) {
            if ($group['existing_drn'] === '') {
                $unassignedBranchKeys[] = $bKey;
            }
        }
        $neededNewDrnsCount = count($unassignedBranchKeys);

        return \Illuminate\Support\Facades\DB::transaction(function () use (
            $branchGroups,
            $neededNewDrnsCount,
            $formsCount,
            $moduleInfo,
            $modelClass,
            $cleanIds
        ) {
            $availableDrns = collect();

            if ($neededNewDrnsCount > 0) {
                $availableDrns = DrnLibrary::query()
                    ->where(function ($q) {
                        $q->whereNull('request_type')
                            ->orWhereRaw("TRIM(COALESCE(request_type, '')) = ''");
                    })
                    ->orderBy('id', 'asc')
                    ->lockForUpdate()
                    ->limit($neededNewDrnsCount)
                    ->get();

                if ($availableDrns->count() < $neededNewDrnsCount) {
                    return response()->json([
                        'success' => false,
                        'available_drn_count' => $availableDrns->count(),
                        'message' => 'DRN is not enough please add more DRN',
                    ], 422);
                }
            }

            $assignedDrnStrings = [];
            $newDrnIdx = 0;

            foreach ($branchGroups as $group) {
                if ($group['existing_drn'] !== '') {
                    $drnStr = $group['existing_drn'];
                    if (! empty($group['record_ids'])) {
                        $modelClass::query()
                            ->whereIn('id', $group['record_ids'])
                            ->where(function ($q) {
                                $q->whereNull('drn')
                                    ->orWhereRaw("TRIM(COALESCE(drn, '')) = ''");
                            })
                            ->update(['drn' => $drnStr]);
                    }
                    $assignedDrnStrings[] = $drnStr;
                } else {
                    $drnRecord = $availableDrns[$newDrnIdx++];
                    $drnStr = trim((string) $drnRecord->drn);
                    $drnRecord->update([
                        'request_type' => $moduleInfo['label'],
                    ]);
                    if (! empty($group['record_ids'])) {
                        $modelClass::query()
                            ->whereIn('id', $group['record_ids'])
                            ->update(['drn' => $drnStr]);
                    }
                    $assignedDrnStrings[] = $drnStr;
                }
            }

            $queryParams = [];
            if (! empty($cleanIds)) {
                $queryParams['ids'] = implode(',', $cleanIds);
            }
            $queryParams['drns'] = implode(',', $assignedDrnStrings);

            return response()->json([
                'success' => true,
                'drns' => $assignedDrnStrings,
                'forms_count' => $formsCount,
                'newly_assigned_count' => $neededNewDrnsCount,
                'available_drn_count' => static::getAvailableDrnCount(),
                'request_type' => $moduleInfo['label'],
                'print_url' => $moduleInfo['print_path'].'?'.http_build_query($queryParams),
            ]);
        });
    }

    /**
     * Import DRN library records from an Excel (.xlsx, .xls) or CSV (.csv, .txt) file.
     * Added By is always set to the currently logged-in user performing the import.
     */
    public function importDrn(Request $request): JsonResponse
    {
        DrnLibrary::ensureTableExists();

        $file = $request->file('file');
        $fileBase64 = (string) $request->input('file_base64', '');
        $fileName = (string) $request->input('file_name', '');

        if (! $file && $fileBase64 === '') {
            return response()->json([
                'success' => false,
                'message' => 'Please select an Excel or CSV file to import.',
            ], 422);
        }

        $ext = '';
        if ($file) {
            $ext = strtolower((string) ($file->getClientOriginalExtension() ?: $file->guessExtension() ?: ''));
        }
        if ($ext === '' && $fileName !== '') {
            $ext = strtolower((string) pathinfo($fileName, PATHINFO_EXTENSION));
        }
        if ($ext === '') {
            $ext = 'csv';
        }

        $tempDir = storage_path('framework/cache/temp_imports');
        if (! is_dir($tempDir)) {
            @mkdir($tempDir, 0777, true);
        }

        $tempFilePath = $tempDir.DIRECTORY_SEPARATOR.'drn_import_'.time().'_'.bin2hex(random_bytes(6)).'.'.$ext;
        $resolvedPath = null;

        try {
            if ($file) {
                $realPath = $file->getRealPath();
                $pathname = $file->getPathname();

                if (! empty($realPath) && @copy($realPath, $tempFilePath) && filesize($tempFilePath) > 0) {
                    $resolvedPath = $tempFilePath;
                } elseif (! empty($pathname) && @copy($pathname, $tempFilePath) && filesize($tempFilePath) > 0) {
                    $resolvedPath = $tempFilePath;
                } elseif (! empty($pathname) && @move_uploaded_file($pathname, $tempFilePath) && filesize($tempFilePath) > 0) {
                    $resolvedPath = $tempFilePath;
                } else {
                    try {
                        $moved = $file->move($tempDir, basename($tempFilePath));
                        if ($moved && file_exists($tempFilePath) && filesize($tempFilePath) > 0) {
                            $resolvedPath = $tempFilePath;
                        }
                    } catch (\Throwable) {
                        // Ignore move exception and fall back to base64 payload if present
                    }
                }
            }

            if ((! $resolvedPath || ! file_exists($resolvedPath)) && $fileBase64 !== '') {
                $cleanBase64 = preg_replace('#^data:[^;]+;base64,#i', '', $fileBase64) ?? $fileBase64;
                $decoded = base64_decode($cleanBase64, true);
                if ($decoded !== false && strlen($decoded) > 0) {
                    @file_put_contents($tempFilePath, $decoded);
                    if (file_exists($tempFilePath) && filesize($tempFilePath) > 0) {
                        $resolvedPath = $tempFilePath;
                    }
                }
            }

            if (! $resolvedPath || ! file_exists($resolvedPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Uploaded file could not be read on the server.',
                ], 422);
            }

            $fh = @fopen($resolvedPath, 'rb');
            $magic = $fh ? (string) fread($fh, 8) : '';
            if ($fh) {
                fclose($fh);
            }

            if (str_starts_with($magic, "PK\x03\x04")) {
                $rawRows = $this->parseXlsxRows($resolvedPath);
            } elseif ($ext === 'xlsx') {
                // Might be CSV saved with .xlsx extension or actual xlsx
                try {
                    $rawRows = $this->parseXlsxRows($resolvedPath);
                } catch (\Throwable) {
                    $rawRows = $this->parseCsvRows($resolvedPath);
                }
            } else {
                $rawRows = $this->parseCsvRows($resolvedPath);
            }
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to parse spreadsheet: '.$e->getMessage(),
            ], 422);
        } finally {
            if (file_exists($tempFilePath)) {
                @unlink($tempFilePath);
            }
        }

        if (count($rawRows) === 0) {
            return response()->json([
                'success' => false,
                'message' => 'The uploaded file is empty.',
            ], 422);
        }

        $loggedInUser = $this->resolveLoggedInUserName($request);
        $defaultDateAdded = now()->format('Y-m-d');

        // Remove any leading completely empty rows
        while (count($rawRows) > 0) {
            $firstCandidate = array_map(fn ($v) => trim((string) $v), $rawRows[0]);
            $nonEmpty = array_filter($firstCandidate, fn ($v) => $v !== '');
            if (count($nonEmpty) === 0) {
                array_shift($rawRows);
            } else {
                break;
            }
        }

        if (count($rawRows) === 0) {
            return response()->json([
                'success' => false,
                'message' => 'The uploaded file is empty.',
            ], 422);
        }

        // Detect header row vs data row (only read the DRN column)
        $firstRow = array_map(fn ($v) => trim((string) $v), $rawRows[0]);
        $drnColIdx = 0;

        // Default to the first non-empty column index in case column A is blank
        foreach ($firstRow as $idx => $cellValue) {
            if ($cellValue !== '') {
                $drnColIdx = $idx;
                break;
            }
        }

        $hasHeader = false;
        foreach ($firstRow as $idx => $cellValue) {
            $norm = preg_replace('/[^a-z0-9]/', '', strtolower($cellValue)) ?? '';
            if (in_array($norm, ['drn', 'drnno', 'drnnumber', 'documentreferencenumber', 'documentreference'], true)) {
                $drnColIdx = $idx;
                $hasHeader = true;
                break;
            }
        }

        if ($hasHeader) {
            array_shift($rawRows);
        }

        $now = now();
        $toInsert = [];
        $importedCount = 0;
        $skippedDuplicatesCount = 0;

        $existingDrnKeys = [];
        foreach (DrnLibrary::query()->pluck('drn') as $existingDrn) {
            $normKey = strtolower(trim((string) $existingDrn));
            if ($normKey !== '') {
                $existingDrnKeys[$normKey] = true;
            }
        }

        foreach ($rawRows as $row) {
            if (! is_array($row)) {
                continue;
            }
            $drnVal = trim((string) ($row[$drnColIdx] ?? ''));
            if ($drnVal === '') {
                // Fallback: check if another column has the DRN value in a single-column row
                foreach ($row as $cellVal) {
                    $trimmed = trim((string) $cellVal);
                    if ($trimmed !== '') {
                        $drnVal = $trimmed;
                        break;
                    }
                }
            }

            // Skip completely blank rows or repeated header rows
            if ($drnVal === '' || strtolower($drnVal) === 'drn') {
                continue;
            }

            $normDrnKey = strtolower($drnVal);
            if (isset($existingDrnKeys[$normDrnKey])) {
                $skippedDuplicatesCount++;
                continue;
            }
            $existingDrnKeys[$normDrnKey] = true;

            $toInsert[] = [
                'drn' => $drnVal,
                'request_type' => '',
                'added_by' => $loggedInUser,
                'date_added' => $defaultDateAdded,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $importedCount++;
        }

        if ($importedCount === 0) {
            if ($skippedDuplicatesCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => $skippedDuplicatesCount === 1
                        ? 'The DRN in the uploaded file already exists. Duplicate DRN is not allowed.'
                        : "All {$skippedDuplicatesCount} DRNs in the uploaded file already exist. Duplicate DRNs are not allowed.",
                ], 422);
            }

            return response()->json([
                'success' => false,
                'message' => 'No valid DRN rows found in the uploaded file.',
            ], 422);
        }

        foreach (array_chunk($toInsert, 500) as $chunk) {
            DrnLibrary::query()->insert($chunk);
        }

        $records = DrnLibrary::query()
            ->orderByDesc('id')
            ->get();

        $msg = "Successfully imported {$importedCount} DRN ".($importedCount === 1 ? 'record' : 'records').'.';
        if ($skippedDuplicatesCount > 0) {
            $msg .= " Skipped {$skippedDuplicatesCount} duplicate ".($skippedDuplicatesCount === 1 ? 'DRN' : 'DRNs').'.';
        }

        return response()->json([
            'success' => true,
            'message' => $msg,
            'imported_count' => $importedCount,
            'skipped_duplicates_count' => $skippedDuplicatesCount,
            'available_drn_count' => static::getAvailableDrnCount(),
            'records' => $records,
        ]);
    }

    /**
     * Parse rows from a .csv or .txt file.
     *
     * @return array<int, array<int, string>>
     */
    protected function parseCsvRows(string $filePath): array
    {
        $content = @file_get_contents($filePath);
        if ($content === false || trim($content) === '') {
            return [];
        }

        // Strip UTF-8 / UTF-16 BOM if present
        if (str_starts_with($content, "\xEF\xBB\xBF")) {
            $content = substr($content, 3);
        } elseif (str_starts_with($content, "\xFF\xFE")) {
            $content = mb_convert_encoding(substr($content, 2), 'UTF-8', 'UTF-16LE');
        } elseif (str_starts_with($content, "\xFE\xFF")) {
            $content = mb_convert_encoding(substr($content, 2), 'UTF-8', 'UTF-16BE');
        }

        $lines = preg_split('/\r\n|\r|\n/', $content) ?: [];
        if (count($lines) === 0) {
            return [];
        }

        $firstLine = '';
        foreach ($lines as $line) {
            if (trim($line) !== '') {
                $firstLine = $line;
                break;
            }
        }

        $delimiter = ',';
        if ($firstLine !== '') {
            $commaCount = substr_count($firstLine, ',');
            $semicolonCount = substr_count($firstLine, ';');
            $tabCount = substr_count($firstLine, "\t");
            if ($tabCount > $commaCount && $tabCount >= $semicolonCount) {
                $delimiter = "\t";
            } elseif ($semicolonCount > $commaCount) {
                $delimiter = ';';
            }
        }

        $rows = [];
        foreach ($lines as $line) {
            if (trim($line) === '') {
                continue;
            }
            $data = str_getcsv($line, $delimiter);
            $rows[] = array_map(fn ($v) => trim((string) ($v ?? '')), $data);
        }

        return $rows;
    }

    /**
     * Parse rows from the first worksheet of an .xlsx file (namespace-safe).
     *
     * @return array<int, array<int, string>>
     */
    protected function parseXlsxRows(string $filePath): array
    {
        $zip = new ZipArchive;
        if ($zip->open($filePath) !== true) {
            throw new \RuntimeException('Unable to open .xlsx archive.');
        }

        $sharedStrings = [];
        $sharedXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($sharedXml === false) {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = $zip->getNameIndex($i);
                if ($name && strtolower($name) === 'xl/sharedstrings.xml') {
                    $sharedXml = $zip->getFromName($name);
                    break;
                }
            }
        }

        if ($sharedXml !== false) {
            // Strip default and prefixed namespaces for reliable SimpleXML traversal
            $cleanSharedXml = preg_replace('/<(\/?)[a-zA-Z0-9_]+:/', '<$1', $sharedXml) ?? $sharedXml;
            $cleanSharedXml = preg_replace('/\sxmlns(:[a-zA-Z0-9_]+)?="[^"]*"/', '', $cleanSharedXml) ?? $cleanSharedXml;
            $sx = @simplexml_load_string($cleanSharedXml);
            if ($sx !== false && isset($sx->si)) {
                foreach ($sx->si as $si) {
                    if (isset($si->t)) {
                        $sharedStrings[] = (string) $si->t;
                    } elseif (isset($si->r)) {
                        $parts = [];
                        foreach ($si->r as $run) {
                            $parts[] = (string) ($run->t ?? '');
                        }
                        $sharedStrings[] = implode('', $parts);
                    } else {
                        $sharedStrings[] = '';
                    }
                }
            }
        }

        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        if ($sheetXml === false) {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = $zip->getNameIndex($i);
                if ($name && preg_match('#^xl/worksheets/sheet\d+\.xml$#i', $name)) {
                    $sheetXml = $zip->getFromName($name);
                    break;
                }
            }
        }
        $zip->close();

        if ($sheetXml === false) {
            throw new \RuntimeException('No worksheet found inside .xlsx file.');
        }

        $cleanSheetXml = preg_replace('/<(\/?)[a-zA-Z0-9_]+:/', '<$1', $sheetXml) ?? $sheetXml;
        $cleanSheetXml = preg_replace('/\sxmlns(:[a-zA-Z0-9_]+)?="[^"]*"/', '', $cleanSheetXml) ?? $cleanSheetXml;

        $xml = @simplexml_load_string($cleanSheetXml);
        if ($xml === false || ! isset($xml->sheetData->row)) {
            return [];
        }

        $rows = [];
        foreach ($xml->sheetData->row as $rowNode) {
            $rowArray = [];
            $maxColIdx = -1;

            foreach ($rowNode->c as $cell) {
                $ref = (string) ($cell['r'] ?? '');
                $type = (string) ($cell['t'] ?? '');
                $colLetters = preg_replace('/[^A-Z]/i', '', $ref) ?? '';
                $colIdx = $colLetters !== '' ? $this->columnLettersToIndex($colLetters) : ($maxColIdx + 1);
                if ($colIdx > $maxColIdx) {
                    $maxColIdx = $colIdx;
                }

                $val = '';
                if ($type === 's') {
                    $ssIdx = (int) ($cell->v ?? 0);
                    $val = $sharedStrings[$ssIdx] ?? '';
                } elseif ($type === 'inlineStr') {
                    if (isset($cell->is->t)) {
                        $val = (string) $cell->is->t;
                    } elseif (isset($cell->is->r)) {
                        $parts = [];
                        foreach ($cell->is->r as $run) {
                            $parts[] = (string) ($run->t ?? '');
                        }
                        $val = implode('', $parts);
                    }
                } elseif ($type === 'str') {
                    $val = (string) ($cell->v ?? '');
                } else {
                    $val = (string) ($cell->v ?? '');
                }

                $rowArray[$colIdx] = trim($val);
            }

            if ($maxColIdx >= 0) {
                $denseRow = [];
                for ($i = 0; $i <= $maxColIdx; $i++) {
                    $denseRow[$i] = $rowArray[$i] ?? '';
                }
                $rows[] = $denseRow;
            }
        }

        return $rows;
    }

    /**
     * Convert Excel column letters (A, B, ..., AA) to 0-based column index.
     */
    protected function columnLettersToIndex(string $letters): int
    {
        $letters = strtoupper($letters);
        $len = strlen($letters);
        $index = 0;
        for ($i = 0; $i < $len; $i++) {
            $index = $index * 26 + (ord($letters[$i]) - ord('A') + 1);
        }

        return max(0, $index - 1);
    }

    /**
     * Normalize a spreadsheet date string or Excel serial number into YYYY-MM-DD (or keep original readable date).
     */
    protected function normalizeSpreadsheetDate(string $raw, string $default): string
    {
        $trimmed = trim($raw);
        if ($trimmed === '') {
            return $default;
        }

        // Check if Excel numeric date serial (e.g. 45200)
        if (is_numeric($trimmed)) {
            $num = (float) $trimmed;
            if ($num > 25569 && $num < 80000) {
                $unix = (int) round(($num - 25569) * 86400);

                return gmdate('Y-m-d', $unix);
            }
        }

        $ts = strtotime($trimmed);
        if ($ts !== false && $ts > 0) {
            return date('Y-m-d', $ts);
        }

        return $trimmed;
    }
}

