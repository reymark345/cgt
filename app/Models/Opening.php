<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class Opening extends Model
{
    protected $table = 'opening';

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
     * Ensure the opening table exists.
     */
    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('opening')) {
            Schema::create('opening', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('household_request_id')->nullable()->index();
                $table->string('item_no')->nullable()->index();
                $table->text('address')->nullable();
                $table->string('household_id_number')->nullable()->index();
                $table->string('name_of_new_grantee')->nullable();
                $table->string('name_of_old_grantee')->nullable();
                $table->string('card_number_of_old')->nullable()->index();
                $table->string('status_of_old_grantee')->nullable();
                $table->string('status', 50)->default('Pending')->index();
                $table->string('drn')->nullable()->index();
                $table->text('remarks')->nullable();
                $table->unsignedBigInteger('created_by')->nullable()->index();
                $table->timestamps();
            });
        } elseif (! Schema::hasColumn('opening', 'drn')) {
            Schema::table('opening', function (Blueprint $table) {
                $table->string('drn')->nullable()->index()->after('status');
            });
        }
    }
}

