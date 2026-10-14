<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('audit_trail')) {
            Schema::create('audit_trail', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('user_name')->nullable()->index();
                $table->string('user_email')->nullable();
                $table->string('user_position')->nullable();
                $table->string('user_division')->nullable();
                $table->string('method', 16)->default('POST')->index();
                $table->string('module', 100)->nullable()->index();
                $table->string('action')->nullable()->index();
                $table->string('route_name')->nullable();
                $table->text('url')->nullable();
                $table->string('target_id')->nullable()->index();
                $table->longText('payload')->nullable();
                $table->integer('status_code')->nullable();
                $table->string('ip_address', 64)->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamps();

                $table->index('created_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_trail');
    }
};

