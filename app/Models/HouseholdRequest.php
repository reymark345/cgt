<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class HouseholdRequest extends Model
{
    protected $table = 'household_requests';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'request_id' => 'integer',
            'created_by' => 'integer',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function requestType(): BelongsTo
    {
        return $this->belongsTo(RequestType::class, 'request_id');
    }

    /**
     * Ensure the household_requests table exists.
     */
    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('household_requests')) {
            Schema::create('household_requests', function (Blueprint $table) {
                $table->id();
                $table->string('hh_id')->index();
                $table->unsignedBigInteger('request_id')->nullable()->index();
                $table->string('request_name')->index();
                $table->string('request_label')->nullable();
                $table->string('beneficiary_name')->nullable();
                $table->text('remarks')->nullable();
                $table->string('status', 50)->default('Pending')->index();
                $table->unsignedBigInteger('created_by')->nullable()->index();
                $table->timestamps();
            });
        }
    }
}

