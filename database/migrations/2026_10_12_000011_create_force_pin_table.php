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
        if (! Schema::hasTable('force_pin')) {
            Schema::create('force_pin', function (Blueprint $table) {
                $table->id();
                $table->string('item_no')->nullable()->index();
                $table->text('address')->nullable();
                $table->string('household_id_number')->nullable()->index();
                $table->string('name')->nullable();
                $table->string('card_number')->nullable()->index();
                $table->string('status', 50)->default('Pending')->index();
                $table->text('remarks')->nullable();
                $table->string('created_by')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('force_pin');
    }
};

