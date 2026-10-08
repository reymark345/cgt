<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSsoAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->has('sso_user_id')) {
            return redirect()
                ->route('login')
                ->with('error', 'Please sign in with SSO to continue.');
        }

        return $next($request);
    }
}
