<?php

namespace Hungry\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\Guard;

class Admin
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
        if($this->auth->check() && $this->auth->user()->hasRole('admin')) {
          return $next($request);
        }
        return  redirect()->guest('auth/login');
    }
}