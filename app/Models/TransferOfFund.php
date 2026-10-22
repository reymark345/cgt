<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class TransferOfFund extends Model
{
    protected $table = 'transfer_of_fund';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'household_request_id' => 'integer',
            'created_by' => 'integer',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function householdRequest(): BelongsTo
    {
        return $this->belongsTo(HouseholdRequest::class, 'household_request_id');
    }

    /**
     * Ensure the transfer_of_fund table exists.
     */
    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('transfer_of_fund')) {
            Schema::create('transfer_of_fund', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('household_request_id')->nullable()->index();
                $table->string('item_no')->nullable()->index();
                $table->text('address')->nullable();
                $table->string('household_id_number')->nullable()->index();
                $table->string('old_card_number')->nullable()->index();
                $table->string('old_cardholder_name')->nullable();
                $table->string('new_card_number')->nullable()->index();
                $table->string('new_cardholder_name')->nullable();
                $table->string('status', 50)->default('Pending')->index();
                $table->string('drn')->nullable()->index();
                $table->text('remarks')->nullable();
                $table->unsignedBigInteger('created_by')->nullable()->index();
                $table->timestamps();
            });
        } elseif (! Schema::hasColumn('transfer_of_fund', 'drn')) {
            Schema::table('transfer_of_fund', function (Blueprint $table) {
                $table->string('drn')->nullable()->index()->after('status');
            });
        }
    }
}
