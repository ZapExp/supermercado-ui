import { PassedInitialConfig, LogLevel } from 'angular-auth-oidc-client';
import { environment } from '../environments/environment';

export const authConfig: PassedInitialConfig = {
  config: {
    authority: environment.authUrl,
    redirectUrl: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    clientId: environment.authClient,
    scope: 'openid profile email offline_access',
    responseType: 'code',
    silentRenew: true,
    useRefreshToken: true,
    logLevel: LogLevel.Warn,
    secureRoutes: [environment.apiUrl],
  },
};
