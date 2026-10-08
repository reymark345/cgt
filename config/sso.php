<?php

return [
    'base_url' => env('SSO_BASE_URL', 'https://caraga-connect.dswd.gov.ph'),
    'client_id' => env('CC_OAUTH_CLIENT_ID', env('SSO_CLIENT_ID')),
    'client_secret' => env('CC_OAUTH_SECRET', env('SSO_CLIENT_SECRET')),
    'redirect_uri' => env('CC_OAUTH_REDIRECT_URI', env('SSO_REDIRECT_URI', env('APP_URL').'/login-sso/callback')),
    'scopes' => env('CC_OAUTH_SCOPES', env('SSO_SCOPES', '')),
    'authorize_url' => env('CC_OAUTH_AUTHORIZE_URL', env('SSO_AUTHORIZE_URL')),
    'token_url' => env('CC_OAUTH_TOKEN_URL', env('SSO_TOKEN_URL')),
    'user_url' => env('CC_OAUTH_USERINFO_URL', env('SSO_USER_URL')),
    'authorize_path' => env('SSO_AUTHORIZE_PATH', '/oauth/authorize'),
    'token_path' => env('SSO_TOKEN_PATH', '/oauth/token'),
    'user_path' => env('SSO_USER_PATH', '/api/user'),
    'logout_path' => env('SSO_LOGOUT_PATH', '/api/sso/logout'),
    'verify_ssl' => env('SSO_VERIFY_SSL', true),
];
