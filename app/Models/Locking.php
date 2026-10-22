<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class Locking extends Model
{
    protected $table = 'locking';

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
     * Ensure the locking table exists.
     */
    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('locking')) {
            Schema::create('locking', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('household_request_id')->nullable()->index();
                $table->string('item_no')->nullable()->index();
                $table->text('address')->nullable();
                $table->string('household_id_number')->nullable()->index();
                $table->string('name')->nullable();
                $table->string('card_number')->nullable()->index();
                $table->string('status', 50)->default('Pending')->index();
                $table->string('drn')->nullable()->index();
                $table->text('remarks')->nullable();
                $table->unsignedBigInteger('created_by')->nullable()->index();
                $table->timestamps();
            });
        } elseif (! Schema::hasColumn('locking', 'drn')) {
            Schema::table('locking', function (Blueprint $table) {
                $table->string('drn')->nullable()->index()->after('status');
            });
        }
    }
}
