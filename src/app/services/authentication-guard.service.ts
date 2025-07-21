import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { OpenIdService } from './open-id-service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationGuardService {
  private readonly _openIdService = inject(OpenIdService);


  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this._openIdService.isLoggedIn()) {
      return true;
    } else {
      // try and redirect back to the same location after authentication
      this._openIdService.startAuthentication(decodeURI(state.url));
      return false;
    }
  }
}

export const AuthenticationGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  return inject(AuthenticationGuardService).canActivate(next, state);
}
