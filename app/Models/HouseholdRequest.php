<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class HouseholdRequest extends Model
{
    protected $table = 'household_requests';

    protected $guarded = ['id'];

    /**
     * Ensure the household_requests table exists.
     */
    public static function ensureTableExists(): void
    {
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
}

