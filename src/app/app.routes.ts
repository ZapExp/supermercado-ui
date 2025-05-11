import { Routes } from '@angular/router';
import { HomePageComponent } from './routes/home-page/home-page.component';
import { LoginComponent } from './routes/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'home', component: HomePageComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
];
