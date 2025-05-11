import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (_route, _state) => {
  const auth = inject(AuthStateService);
  const router = inject(Router);

  return auth['oidcSecurityService'].isAuthenticated$.pipe(
    map(({ isAuthenticated }) => {
      if (isAuthenticated) {
        return true;
      } else {
        return router.createUrlTree(['/login']);
      }
    })
  );
};
