<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create table 'request' for dropdown options
        if (! Schema::hasTable('request')) {
            Schema::create('request', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique()->index();
                $table->string('label')->nullable();
                $table->text('description')->nullable();
                $table->string('status', 50)->default('active');
                $table->timestamps();
            });
        }

        // 2. Populate initial 12 request types if not present
        $defaultRequests = [
            ['name' => 'opening', 'label' => 'Opening', 'description' => 'Account opening and bank endorsement batch'],
            ['name' => 'matching', 'label' => 'Matching', 'description' => 'Cross-match cash cards with depository database'],
            ['name' => 'lock', 'label' => 'Lock', 'description' => 'Card lock requests and frozen transactions'],
            ['name' => 'lifting', 'label' => 'Lifting', 'description' => 'Card restriction lifting and unfreeze clearance'],
            ['name' => 'replacement-series', 'label' => 'Replacement series', 'description' => 'Card replacement batch series and re-issuance'],
            ['name' => 'otc', 'label' => 'Otc', 'description' => 'Over The Counter payout schedules and authorization'],
            ['name' => 'tof', 'label' => 'Tof', 'description' => 'Transfer of Funds crediting batches and transmittals'],
            ['name' => 'tof-branch', 'label' => 'Tof branch', 'description' => 'TOF branch routing and servicing assignments'],
            ['name' => 'perforation-series', 'label' => 'Perforaton series', 'description' => 'Decommissioned and perforated cards audit registry'],
            ['name' => 'closure', 'label' => 'Closure', 'description' => 'Account closures and settlement terminations'],
            ['name' => 'deactivation', 'label' => 'Deactivation', 'description' => 'Card deactivations and beneficiary status invalidations'],
            ['name' => 'distribution-series', 'label' => 'Distribution series', 'description' => 'Payout distribution logistics and field issuance logs'],
        ];

        $now = now();
        foreach ($defaultRequests as $item) {
            DB::table('request')->updateOrInsert(
                ['name' => $item['name']],
                [
                    'label' => $item['label'],
                    'description' => $item['description'],
                    'status' => 'active',
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );
        }

        // 3. Create table 'household_requests' to store submitted requests per household
        if (! Schema::hasTable('household_requests')) {
            Schema::create('household_requests', function (Blueprint $table) {
                $table->id();
                $table->string('hh_id')->index();
                $table->string('request_name')->index();
                $table->string('request_label')->nullable();
                $table->string('beneficiary_name')->nullable();
                $table->text('remarks')->nullable();
                $table->string('status', 50)->default('Pending')->index();
                $table->string('created_by')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('household_requests');
        Schema::dropIfExists('request');
    }
};

