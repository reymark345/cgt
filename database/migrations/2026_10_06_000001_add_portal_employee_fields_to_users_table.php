<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('employee_id')->nullable()->after('sso_id');
            $table->string('id_number')->nullable()->after('employee_id');
            $table->string('first_name')->nullable()->after('name');
            $table->string('middle_name')->nullable()->after('first_name');
            $table->string('last_name')->nullable()->after('middle_name');
            $table->string('account_number')->nullable()->after('mobile_no');
            $table->string('position')->nullable()->after('account_number');
            $table->string('empstatus')->nullable()->after('position');
            $table->decimal('salary_rate', 12, 2)->nullable()->after('empstatus');
            $table->unsignedTinyInteger('salary_grade')->nullable()->after('salary_rate');
            $table->unsignedTinyInteger('step_inc')->nullable()->after('salary_grade');
            $table->string('item_number')->nullable()->after('step_inc');
            $table->string('project')->nullable()->after('item_number');
            $table->string('fundsource')->nullable()->after('project');
            $table->string('former_incumbent')->nullable()->after('fundsource');
            $table->date('date_vacated')->nullable()->after('former_incumbent');
            $table->string('division')->nullable()->after('date_vacated');
            $table->string('section')->nullable()->after('division');
            $table->string('area_of_assignment')->nullable()->after('section');
            $table->string('gender')->nullable()->after('area_of_assignment');
            $table->string('civil_status')->nullable()->after('gender');
            $table->date('birthdate')->nullable()->after('civil_status');
            $table->string('portal_status')->nullable()->after('avatar');
            $table->string('course')->nullable()->after('portal_status');
            $table->text('address')->nullable()->after('course');
            $table->string('official_email')->nullable()->after('address');
            $table->boolean('is_solo_parent')->default(false)->after('official_email');
            $table->text('solo_parent_details')->nullable()->after('is_solo_parent');
            $table->boolean('is_senior_citizen')->default(false)->after('solo_parent_details');
            $table->boolean('is_pwd')->default(false)->after('is_senior_citizen');
            $table->string('type_of_disability')->nullable()->after('is_pwd');
            $table->boolean('is_indigenous')->default(false)->after('type_of_disability');
            $table->string('type_of_indigenous_group')->nullable()->after('is_indigenous');
            $table->json('portal_profile')->nullable()->after('type_of_indigenous_group');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'employee_id',
                'id_number',
                'first_name',
                'middle_name',
                'last_name',
                'account_number',
                'position',
                'empstatus',
                'salary_rate',
                'salary_grade',
                'step_inc',
                'item_number',
                'project',
                'fundsource',
                'former_incumbent',
                'date_vacated',
                'division',
                'section',
                'area_of_assignment',
                'gender',
                'civil_status',
                'birthdate',
                'portal_status',
                'course',
                'address',
                'official_email',
                'is_solo_parent',
                'solo_parent_details',
                'is_senior_citizen',
                'is_pwd',
                'type_of_disability',
                'is_indigenous',
                'type_of_indigenous_group',
                'portal_profile',
            ]);
        });
    }
};
