<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emv_database', function (Blueprint $table) {
            $table->id();
            $table->string('office')->default('BATCH 1')->index();
            $table->string('region')->nullable();
            $table->string('province')->nullable();
            $table->string('municipality')->nullable();
            $table->string('barangay')->nullable();
            $table->string('purok')->nullable();
            $table->text('address')->nullable();
            $table->string('hh_id')->nullable()->index();
            $table->string('entryid')->nullable()->index();
            $table->string('lastname')->nullable();
            $table->string('firstname')->nullable();
            $table->string('middlename')->nullable();
            $table->string('extensionname')->nullable();
            $table->string('birthday')->nullable();
            $table->unsignedInteger('age')->default(0);
            $table->string('clientstatus')->nullable();
            $table->string('member_status')->nullable();
            $table->string('registrationstatus')->nullable();
            $table->string('sex')->nullable();
            $table->string('relationship_to_hh_head')->nullable();
            $table->string('ipaffiliation')->nullable();
            $table->string('hh_set')->nullable();
            $table->string('group')->nullable();
            $table->string('mothers_maiden')->nullable();
            $table->string('date_of_enumeration')->nullable();
            $table->string('lbp_account_number')->nullable();
            $table->string('mode_of_payment')->nullable();
            $table->string('date_tagged_hhstatus')->nullable();
            $table->string('tagged_by')->nullable();
            $table->string('date_registered')->nullable();
            $table->string('reference')->nullable()->index();
            $table->string('type')->default('EMV');
            $table->string('status')->default('Pending')->index();
            $table->string('supplier')->nullable();
            $table->string('deliveryDate')->nullable();
            $table->string('transactionDate')->nullable();
            $table->decimal('amount', 15, 2)->default(0);
            $table->string('inventoryType')->nullable();
            $table->string('jevNo')->nullable();
            $table->string('jevDate')->nullable();
            $table->string('createdBy')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emv_database');
    }
};
