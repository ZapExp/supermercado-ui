import { Routes } from '@angular/router';
import { HomePageComponent } from './routes/home-page/home-page.component';
import { LoginComponent } from './routes/login/login.component';
import { authGuard } from './guards/auth.guard';
import { SellerComponent } from './routes/seller/seller.component';
import { SellComponent } from './routes/seller/sell/sell.component';
import { NotFoundComponent } from './routes/error/not-found/not-found.component';
import { InventoryComponent } from './routes/seller/inventory/inventory.component';
import { CreateProductComponent } from './routes/seller/inventory/create-product/create-product.component';
import { CategoryComponent } from './routes/seller/category/category.component';
import { CreateCategoryComponent } from './routes/seller/category/create-category/create-category.component';
import { EditProductComponent } from './routes/seller/inventory/edit-product/edit-product.component';
import { EditCategoryComponent } from './routes/seller/category/edit-category/edit-category.component';

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
        component: SellerComponent,
        children: [
          { path: 'sell', component: SellComponent },
          {
            path: 'inventory',
            component: InventoryComponent,
          },
          {
            path: 'inventory/create-product',
            component: CreateProductComponent,
          },
          {
            path: 'inventory/edit-product/:id',
            component: EditProductComponent,
          },
          {
            path: 'category',
            component: CategoryComponent,
          },
          {
            path: 'category/create-category',
            component: CreateCategoryComponent,
          },
          {
            path: 'category/edit-category/:id',
            component: EditCategoryComponent,
          },
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
