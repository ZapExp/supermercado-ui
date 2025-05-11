import { Routes } from '@angular/router';
import { HomePageComponent } from './routes/home-page/home-page.component';
import { LoginComponent } from './routes/login/login.component';
import { authGuard } from './guards/auth.guard';
import { SellerComponent } from './routes/seller/seller.component';
import { SellComponent } from './routes/seller/sell/sell.component';
import { NotFoundComponent } from './routes/error/not-found/not-found.component';
import { InventoryComponent } from './routes/seller/inventory/inventory.component';

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
      {
        path: 'seller',
        component: SellerComponent, // inner layout
        children: [
          { path: 'sell', component: SellComponent },
          { path: 'inventory', component: InventoryComponent },
        ],
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
