<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class TransferOfFund extends Model
{
    protected $table = 'transfer_of_fund';

    protected $guarded = ['id'];

    /**
     * Ensure the transfer_of_fund table exists.
     */
    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('transfer_of_fund')) {
            Schema::create('transfer_of_fund', function (Blueprint $table) {
                $table->id();
                $table->string('item_no')->nullable()->index();
                $table->text('address')->nullable();
                $table->string('household_id_number')->nullable()->index();
                $table->string('old_card_number')->nullable()->index();
                $table->string('old_cardholder_name')->nullable();
                $table->string('new_card_number')->nullable()->index();
                $table->string('new_cardholder_name')->nullable();
                $table->string('status', 50)->default('Pending')->index();
                $table->text('remarks')->nullable();
                $table->string('created_by')->nullable();
                $table->timestamps();
            });
        }
    }
}

