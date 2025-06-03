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
import { ReportComponent } from './routes/report/report.component';
import { ClientComponent } from './routes/seller/client/client.component';
import { CreateClientComponent } from './routes/seller/client/create-client/create-client.component';
import { EditClientComponent } from './routes/seller/client/edit-client/edit-client.component';
import { SupplierComponent } from './routes/seller/supplier/supplier.component';
import { CreateSupplierComponent } from './routes/seller/supplier/create-supplier/create-supplier.component';
import { EditSupplierComponent } from './routes/seller/supplier/edit-supplier/edit-supplier.component';
import { SgcComponent } from './routes/sgc/sgc.component';

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
          {
            path: 'sgc',
            component: SgcComponent,
          },
          {
            path: 'report',
            component: ReportComponent,
          },
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
          {
            path: 'client',
            component: ClientComponent,
          },
          {
            path: 'client/create-client',
            component: CreateClientComponent,
          },
          {
            path: 'client/edit-client/:id',
            component: EditClientComponent,
          },
          {
            path: 'supplier',
            component: SupplierComponent,
          },
          {
            path: 'supplier/create-supplier',
            component: CreateSupplierComponent,
          },
          {
            path: 'supplier/edit-supplier/:id',
            component: EditSupplierComponent,
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
