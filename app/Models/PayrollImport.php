<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class PayrollImport extends Model
{
    protected $table = 'payroll_imports';

    protected $guarded = ['id'];

    protected $casts = [
        'total_rows' => 'integer',
        'processed_rows' => 'integer',
        'imported_count' => 'integer',
        'updated_count' => 'integer',
        'percentage' => 'float',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Ensure the payroll_imports and queue tables exist in the database.
     */
    public static function ensureTablesExist(): void
    {
        if (! Schema::hasTable('payroll_imports')) {
            Schema::create('payroll_imports', function (Blueprint $table) {
                $table->id();
                $table->string('filename');
                $table->string('file_path');
                $table->unsignedBigInteger('file_size')->default(0);
                $table->string('extension', 10)->default('xlsx');
                $table->string('status', 30)->default('pending')->index();
                $table->unsignedInteger('total_rows')->default(0);
                $table->unsignedInteger('processed_rows')->default(0);
                $table->unsignedInteger('imported_count')->default(0);
                $table->unsignedInteger('updated_count')->default(0);
                $table->float('percentage', 5, 2)->default(0.00);
                $table->text('error_message')->nullable();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('jobs')) {
            Schema::create('jobs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('queue')->index();
                $table->longText('payload');
                $table->unsignedTinyInteger('attempts');
                $table->unsignedInteger('reserved_at')->nullable();
                $table->unsignedInteger('available_at');
                $table->unsignedInteger('created_at');
            });
        }
    }
}

