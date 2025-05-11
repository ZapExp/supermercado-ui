import { inject, Injectable, signal } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { UserData } from '../utils/types';

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  readonly userData = signal<UserData>({
    name: 'Cargado...',
    email: 'Cargado...',
    family_name: 'Cargado...',
    given_name: 'Cargado...',
  });
  readonly isAuthenticated = signal(false);

  constructor() {
    this.oidcSecurityService
      .checkAuth()
      .subscribe(({ isAuthenticated, userData }) => {
        this.isAuthenticated.set(isAuthenticated);
        if (!isAuthenticated) return;

        const data = userData as UserData;
        this.userData.set(data);
      });
  }

  login() {
    this.oidcSecurityService.authorize();
  }

  logout() {
    this.oidcSecurityService.logoff().subscribe((result) => {
      console.log('Logged out:', result);
    });
  }
}
