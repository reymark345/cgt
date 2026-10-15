<?php

namespace App\Http\Controllers;

use App\Models\LbpBranchDirectory;
use App\Models\LbpCoveredMunicipality;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        $validated = $request->validate([
            'id' => ['nullable', 'integer'],
            'province' => ['required', 'string', 'max:255'],
            'municipality' => ['required', 'string', 'max:255'],
            'covered_lbp_branch' => ['required', 'string', 'max:255'],
        ]);

        if (! empty($validated['id'])) {
            $record = LbpCoveredMunicipality::findOrFail($validated['id']);
            $record->update([
                'province' => trim($validated['province']),
                'municipality' => trim($validated['municipality']),
                'covered_lbp_branch' => trim($validated['covered_lbp_branch']),
            ]);
            $message = 'Covered Municipality updated successfully.';
        } else {
            $record = LbpCoveredMunicipality::create([
                'province' => trim($validated['province']),
                'municipality' => trim($validated['municipality']),
                'covered_lbp_branch' => trim($validated['covered_lbp_branch']),
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
}

