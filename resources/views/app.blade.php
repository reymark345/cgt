<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title inertia>{{ config('app.name', 'GRANTS') }}</title>
        <link rel="icon" type="image/png" href="{{ asset('images/grants_logo_light.png') }}?v=2">
        <link rel="shortcut icon" type="image/png" href="{{ asset('images/grants_logo_light.png') }}?v=2">
        <link rel="apple-touch-icon" href="{{ asset('images/grants_logo_light.png') }}?v=2">
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body>
        @inertia
    </body>
</html>
