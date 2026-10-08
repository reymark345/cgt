<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $fillable = [
        'sso_id',
        'employee_id',
        'id_number',
        'name',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'username',
        'contact_number',
        'mobile_no',
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
        'avatar',
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
        'mfa_enabled',
        'mfa_verified',
        'access_token',
        'refresh_token',
        'token_expires_at',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    protected function casts(): array
    {
        return [
            'mfa_enabled' => 'boolean',
            'mfa_verified' => 'boolean',
            'salary_rate' => 'decimal:2',
            'salary_grade' => 'integer',
            'step_inc' => 'integer',
            'date_vacated' => 'date',
            'birthdate' => 'date',
            'is_solo_parent' => 'boolean',
            'is_senior_citizen' => 'boolean',
            'is_pwd' => 'boolean',
            'is_indigenous' => 'boolean',
            'portal_profile' => 'array',
            'access_token' => 'encrypted',
            'refresh_token' => 'encrypted',
            'token_expires_at' => 'datetime',
        ];
    }
}
