<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class GranteeList extends Model
{
    protected $table = 'grantee_list';

    protected $guarded = ['id'];

    /**
     * Ensure the grantee_list table exists in the database.
     */
    public static function ensureTableExists(): void
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
        } else {
            // Ensure any missing columns are added automatically
            $existingColumns = Schema::getColumnListing('grantee_list');
            $allColumns = [
                'region', 'province', 'municipality', 'barangay', 'purok', 'district',
                'hh_id', 'entry_id', 'first_name', 'middle_name', 'last_name', 'ext_name',
                'maiden_name', 'contact_number', 'birthday', 'hh_grantee', 'current_age',
                'age', 'sex', 'old_client_status', 'client_status', 'date_tagged',
                'tagged_by', 'cs_category', 'member_status', 'relation_to_hh', 'hh_set',
                'registration_status', 'ip_label', 'ip_status', 'payment_mode', 'lbp_account',
                'date_of_enumeration', 'date_registered', 'date_registered_v2', 'family_id',
                'rel_to_fam_head', 'selected_family', 'final_l3_result',
            ];

            $missing = array_diff($allColumns, $existingColumns);
            if (! empty($missing)) {
                Schema::table('grantee_list', function (Blueprint $table) use ($missing) {
                    foreach ($missing as $col) {
                        $table->string($col)->nullable();
                    }
                });
            }

            // Ensure indexes on hh_id and entry_id exist for ultra-fast lookup
            try {
                Schema::table('grantee_list', function (Blueprint $table) {
                    $table->index('hh_id');
                });
            } catch (\Throwable $e) {
                // Index already exists
            }
            try {
                Schema::table('grantee_list', function (Blueprint $table) {
                    $table->index('entry_id');
                });
            } catch (\Throwable $e) {
                // Index already exists
            }
            try {
                Schema::table('grantee_list', function (Blueprint $table) {
                    $table->index('municipality');
                });
            } catch (\Throwable $e) {
                // Index already exists
            }
            try {
                Schema::table('grantee_list', function (Blueprint $table) {
                    $table->index('hh_set');
                });
            } catch (\Throwable $e) {
                // Index already exists
            }
            try {
                Schema::table('grantee_list', function (Blueprint $table) {
                    $table->index('client_status');
                });
            } catch (\Throwable $e) {
                // Index already exists
            }
        }
    }
}

