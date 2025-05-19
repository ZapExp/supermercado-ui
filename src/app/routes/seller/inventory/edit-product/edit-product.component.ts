// Предположим, что этот файл находится по пути: src/app/pages/seller/inventory/edit-product/edit-product.component.ts
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, model, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment'; // Adjust path
import {
  catchError,
  finalize,
  tap,
  throwError,
  switchMap,
  forkJoin,
  of,
} from 'rxjs';
import { Category, Product } from '../../../../utils/types';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './edit-product.component.html',
  styleUrl: './edit-product.component.css',
})
export class EditProductComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private apiUrl = environment.apiUrl;

  public productId: number | null = null;

  // Form models
  public productName = model<string>('');
  public productDescription = model<string>('');
  public productPrice = model<number | null>(null);
  public productStock = model<number | null>(null);
  public selectedCategoryId = model<number | null>(null);

  // State signals
  public isLoading = signal(false);
  public isFetchingData = signal(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  public categories = signal<Category[]>([]);
  public categoriesError = signal<string | null>(null);
  public productNotFoundError = signal<boolean>(false);

  ngOnInit(): void {
    this.isFetchingData.set(true);
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) {
            this.errorMessage.set('ID de producto no encontrado en la URL.');
            this.productNotFoundError.set(true);
            this.isFetchingData.set(false);
            return throwError(() => new Error('ID de producto no encontrado'));
          }
          this.productId = +id;

          const productDetails$ = this.http.get<Product>(
            `${this.apiUrl}/producto/${this.productId}`
          );
          const categories$ = this.http.get<Category[]>(
            `${this.apiUrl}/categoria`
          );

          return forkJoin({
            product: productDetails$,
            categories: categories$,
          });
        }),
        tap(({ product, categories }) => {
          this.populateForm(product);
          this.categories.set(categories || []);
          if (!categories || categories.length === 0) {
            this.categoriesError.set(
              'No hay categorías disponibles. Por favor, crea una categoría primero.'
            );
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error(
            'API Error fetching product data or categories:',
            error
          );
          if (
            error.status === 404 &&
            error.url?.includes(`/producto/${this.productId}`)
          ) {
            this.errorMessage.set(
              `Producto con ID ${this.productId} no encontrado.`
            );
            this.productNotFoundError.set(true);
          } else if (error.url?.includes('/categoria')) {
            this.categoriesError.set('Fallo al cargar las categorías.');
            this.categories.set([]);
          } else {
            this.errorMessage.set(
              'Fallo al cargar los datos del producto. Por favor, inténtelo de nuevo.'
            );
          }
          return of(null);
        }),
        finalize(() => {
          this.isFetchingData.set(false);
        })
      )
      .subscribe();
  }

  private populateForm(product: Product): void {
    this.productName.set(product.nombre);
    this.productDescription.set(product.descripcion);
    this.productPrice.set(product.precio);
    this.productStock.set(product.stock);
    this.selectedCategoryId.set(product.categoria_id);
  }

  submitForm(form: NgForm): void {
    if (form.invalid || this.productId === null) {
      this.errorMessage.set(
        'Por favor, completa todos los campos requeridos correctamente.'
      );
      Object.values(form.controls).forEach((control) => {
        control.markAsTouched();
      });
      return;
    }

    if (this.selectedCategoryId() === null) {
      this.errorMessage.set(
        'Por favor, selecciona una categoría para el producto.'
      );
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload: Product = {
      nombre: this.productName(),
      descripcion: this.productDescription(),
      precio: this.productPrice() as number,
      stock: this.productStock() as number,
      categoria_id: this.selectedCategoryId() as number,
    };

    this.http
      .put<any>(`${this.apiUrl}/producto/${this.productId}`, payload)
      .pipe(
        tap(() => {
          this.successMessage.set(
            `Producto "${payload.nombre}" (ID: ${this.productId}) actualizado con éxito.`
          );
          setTimeout(() => {
            this.router.navigate(['/seller/inventory']);
          }, 2000);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('API Error updating product:', error);
          let detail = 'Error desconocido.';
          if (error.error) {
            if (typeof error.error === 'string') {
              detail = error.error;
            } else if (error.error.message) {
              detail = error.error.message;
            } else if (error.error.detail) {
              detail = error.error.detail;
            } else if (typeof error.error === 'object') {
              const errorMessages = Object.values(error.error).flat();
              if (errorMessages.length > 0) {
                detail = errorMessages.join(' ');
              } else {
                try {
                  detail = JSON.stringify(error.error);
                } catch (e) {
                  /* ignore */
                }
              }
            }
          } else {
            detail = error.message;
          }
          this.errorMessage.set(
            `Fallo al actualizar el producto. Detalle: ${detail}`
          );
          return throwError(() => error);
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe({
        error: () => {},
      });
  }
}
