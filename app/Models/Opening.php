<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class Opening extends Model
{
    protected $table = 'opening';

    protected $guarded = ['id'];

    /**
     * Ensure the opening table exists.
     */
    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('opening')) {
            Schema::create('opening', function (Blueprint $table) {
                $table->id();
                $table->string('item_no')->nullable()->index();
                $table->text('address')->nullable();
                $table->string('household_id_number')->nullable()->index();
                $table->string('name_of_new_grantee')->nullable();
                $table->string('name_of_old_grantee')->nullable();
                $table->string('card_number_of_old')->nullable()->index();
                $table->string('status_of_old_grantee')->nullable();
                $table->string('status', 50)->default('Pending')->index();
                $table->text('remarks')->nullable();
                $table->string('created_by')->nullable();
                $table->timestamps();
            });
        }
    }
}

