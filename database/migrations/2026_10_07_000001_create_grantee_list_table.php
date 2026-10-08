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
        if (! Schema::hasTable('grantee_list')) {
            Schema::create('grantee_list', function (Blueprint $table) {
            $table->id();
            $table->string('region')->nullable();
            $table->string('province')->nullable();
            $table->string('municipality')->nullable();
            $table->string('barangay')->nullable();
            $table->string('purok')->nullable();
            $table->string('district')->nullable();
            $table->string('hh_id')->nullable()->index();
            $table->string('entry_id')->nullable()->index();
            $table->string('first_name')->nullable();
            $table->string('middle_name')->nullable();
            $table->string('last_name')->nullable()->index();
            $table->string('ext_name')->nullable();
            $table->string('maiden_name')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('birthday')->nullable();
            $table->string('hh_grantee')->nullable();
            $table->string('current_age')->nullable();
            $table->string('age')->nullable();
            $table->string('sex')->nullable();
            $table->string('old_client_status')->nullable();
            $table->string('client_status')->nullable();
            $table->string('date_tagged')->nullable();
            $table->string('tagged_by')->nullable();
            $table->string('cs_category')->nullable();
            $table->string('member_status')->nullable();
            $table->string('relation_to_hh')->nullable();
            $table->string('hh_set')->nullable();
            $table->string('registration_status')->nullable();
            $table->string('ip_label')->nullable();
            $table->string('ip_status')->nullable();
            $table->string('payment_mode')->nullable();
            $table->string('lbp_account')->nullable();
            $table->string('date_of_enumeration')->nullable();
            $table->string('date_registered')->nullable();
            $table->string('date_registered_v2')->nullable();
            $table->string('family_id')->nullable();
            $table->string('rel_to_fam_head')->nullable();
            $table->string('selected_family')->nullable();
            $table->string('final_l3_result')->nullable();
            $table->timestamps();
        });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grantee_list');
    }
};

