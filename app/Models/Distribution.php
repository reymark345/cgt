<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class Distribution extends Model
{
    protected $table = 'distribution';

    protected $guarded = ['id'];

    /**
     * Ensure the distribution table exists.
     */
    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('distribution')) {
            Schema::create('distribution', function (Blueprint $table) {
                $table->id();
                $table->string('item_no')->nullable()->index();
                $table->text('address')->nullable();
                $table->string('household_id_number')->nullable()->index();
                $table->string('run_date')->nullable();
                $table->string('name')->nullable();
                $table->string('card_number')->nullable()->index();
                $table->string('schedule')->nullable();
                $table->string('status', 50)->default('Pending')->index();
                $table->text('remarks')->nullable();
                $table->string('created_by')->nullable();
                $table->timestamps();
            });
        }
    }
}

