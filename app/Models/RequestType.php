<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RequestType extends Model
{
    /**
     * Database table name as requested: 'request'.
     */
    protected $table = 'request';

    protected $guarded = ['id'];

    public const DEFAULT_REQUESTS = [
        ['name' => 'opening', 'label' => 'Opening', 'description' => 'Account opening and bank endorsement batch'],
        ['name' => 'distribution', 'label' => 'Distribution', 'description' => 'Payout distribution logistics and field issuance logs'],
        ['name' => 'otc-withdrawal', 'label' => 'OTC Withdrawal', 'description' => 'Over The Counter payout schedules and authorization'],
        ['name' => 'replacement', 'label' => 'Replacement', 'description' => 'Card replacement batch series and re-issuance'],
        ['name' => 'transfer-of-fund', 'label' => 'Transfer of Fund', 'description' => 'Transfer of Funds crediting batches and transmittals'],
        ['name' => 'force-pin', 'label' => 'Force PIN', 'description' => 'Card PIN reset and force authorization requests'],
        ['name' => 'locking', 'label' => 'Locking', 'description' => 'Card lock requests and frozen transactions'],
        ['name' => 'lifting', 'label' => 'Lifting', 'description' => 'Card restriction lifting and unfreeze clearance'],
    ];

    /**
     * Ensure table exists and has initial values.
     */
    public static function ensureTableExists(): void
    {
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

        $count = DB::table('request')->count();
        if ($count !== count(self::DEFAULT_REQUESTS)) {
            self::syncDefaultRequests();
        }
    }

    /**
     * Sync default requests to match target 8 items.
     */
    public static function syncDefaultRequests(): void
    {
        if (! Schema::hasTable('request')) {
            self::ensureTableExists();
            return;
        }

        DB::table('request')->truncate();
        $now = now();
        foreach (self::DEFAULT_REQUESTS as $item) {
            DB::table('request')->insert([
                'name' => $item['name'],
                'label' => $item['label'],
                'description' => $item['description'],
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}

