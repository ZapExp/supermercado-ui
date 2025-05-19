import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, model, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { catchError, finalize, tap, of, throwError } from 'rxjs';
import { Product, Category } from '../../../../utils/types';

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

  public productName = model<string>('');
  public productDescription = model<string>('');
  public productPrice = model<number | null>(null);
  public productStock = model<number | null>(null);
  public selectedCategoryId = model<number | null>(null);

  public isLoading = signal(false);
  public isFetchingProduct = signal(false);
  public isFetchingCategories = signal(false);

  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  public categories = signal<Category[]>([]);
  public categoriesErrorMessage = signal<string | null>(null);
  public productNotFoundError = signal<boolean>(false);

  ngOnInit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.productNotFoundError.set(false);
    this.categoriesErrorMessage.set(null);
    this.categories.set([]);

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (!idParam) {
        this.errorMessage.set('ID de producto no encontrado en la URL.');
        this.productNotFoundError.set(true);
        this.isFetchingProduct.set(false);
        this.isFetchingCategories.set(false);
        return;
      }
      this.productId = +idParam;

      this.fetchProductDetails(this.productId);

      this.fetchCategoriesList();
    });
  }

  private fetchProductDetails(id: number): void {
    this.isFetchingProduct.set(true);
    this.productNotFoundError.set(false);
    this.errorMessage.set(null);

    this.http
      .get<Product>(`${this.apiUrl}/producto/${id}`)
      .pipe(
        tap((product) => {
          this.populateForm(product);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('API Error fetching product details:', error);
          if (error.status === 404) {
            this.errorMessage.set(`Producto con ID ${id} no encontrado.`);
            this.productNotFoundError.set(true);
          } else {
            this.errorMessage.set('Fallo al cargar los detalles del producto.');
          }
          return of(null);
        }),
        finalize(() => {
          this.isFetchingProduct.set(false);
        })
      )
      .subscribe();
  }

  fetchCategoriesList(): void {
    this.isFetchingCategories.set(true);
    this.categoriesErrorMessage.set(null);
    this.categories.set([]);

    this.http
      .get<Category[]>(`${this.apiUrl}/categoria`)
      .pipe(
        tap((data) => {
          this.categories.set(data || []);
          if (!data || data.length === 0) {
            this.categoriesErrorMessage.set(
              'No hay categorías disponibles. Por favor, crea una categoría primero.'
            );
          }
        }),
        catchError((error: HttpErrorResponse) => {
          this.categoriesErrorMessage.set(
            'Fallo al cargar la lista de categorías.'
          );
          this.categories.set([]);
          return of(null);
        }),
        finalize(() => {
          this.isFetchingCategories.set(false);
        })
      )
      .subscribe();
  }

  private populateForm(product: Product): void {
    this.productName.set(product.nombre);
    this.productDescription.set(product.descripcion);
    this.productPrice.set(product.precio);
    this.productStock.set(product.stock);

    if (product.categoria_id) {
      this.selectedCategoryId.set(product.categoria_id);
    }
  }

  submitForm(form: NgForm): void {
    if (form.invalid) {
      this.errorMessage.set(
        'Por favor, completa todos los campos requeridos correctamente.'
      );
      Object.values(form.controls).forEach((control) =>
        control.markAsTouched()
      );
      return;
    }
    if (this.selectedCategoryId() === null) {
      this.errorMessage.set(
        'Por favor, selecciona una categoría para el producto.'
      );
      return;
    }
    if (this.productId === null) {
      this.errorMessage.set(
        'Error: ID de producto no disponible para la actualización.'
      );
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload: Product = {
      id: this.productId,
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
                } catch (e) {}
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
