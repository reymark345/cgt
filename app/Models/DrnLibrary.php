<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class DrnLibrary extends Model
{
    use HasFactory;

    protected $table = 'drn_libraries';

    protected $fillable = [
        'drn',
        'request_type',
        'added_by',
        'date_added',
    ];

    /**
     * Ensure the drn_libraries table exists.
     */
    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('drn_libraries')) {
            Schema::create('drn_libraries', function (Blueprint $table) {
                $table->id();
                $table->string('drn')->index();
                $table->string('request_type')->nullable()->index();
                $table->string('added_by')->nullable();
                $table->string('date_added')->nullable();
                $table->timestamps();
            });
        }
    }
}

