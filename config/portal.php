<?php

return [
    'base_uri' => env('PORTAL_API_BASE_URI', 'https://caraga-portal.dswd.gov.ph/'),
    'api_key' => env('PORTAL_API_KEY'),
    'employee_search_path' => env('PORTAL_EMPLOYEE_SEARCH_PATH', '/api/employee/list/search/'),
    'verify_ssl' => env('PORTAL_VERIFY_SSL', true),
];
