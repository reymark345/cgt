<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class Replacement extends Model
{
    protected $table = 'replacement';

    protected $guarded = ['id'];

    /**
     * Ensure the replacement table exists.
     */
    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('replacement')) {
            Schema::create('replacement', function (Blueprint $table) {
                $table->id();
                $table->string('item_no')->nullable()->index();
                $table->text('address')->nullable();
                $table->string('household_id_number')->nullable()->index();
                $table->string('name')->nullable();
                $table->string('card_number')->nullable()->index();
                $table->text('reason_of_request')->nullable();
                $table->string('status', 50)->default('Pending')->index();
                $table->text('remarks')->nullable();
                $table->string('created_by')->nullable();
                $table->timestamps();
            });
        }
    }
}

