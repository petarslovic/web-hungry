<?php

namespace Hungry\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\Guard;

class SuperAdmin
{
    public function __construct(Guard $auth) {
        $this->auth = $auth;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        if($this->auth->check() && $this->auth->user()->hasRole('super-admin')) {
          return $next($request);
        }

        if ($request->ajax()) {
          return response('Unauthorized.', 401);
        }
        
        return  redirect()->guest('auth/login');
    }
}
