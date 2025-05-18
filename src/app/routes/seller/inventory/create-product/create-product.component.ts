// Предположим, что этот файл находится по пути: src/app/pages/seller/inventory/create-product/create-product.component.ts
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, model, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms'; // Import NgForm for template-driven form access
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment'; // Adjust path
import { catchError, finalize, tap, throwError, Observable, of } from 'rxjs';
import { Category, Product } from '../../../../utils/types'; // Adjust path

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-product.component.html',
  styleUrl: './create-product.component.css', // Create this empty file
})
export class CreateProductComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  // Form models
  public productName = model<string>('');
  public productDescription = model<string>('');
  public productPrice = model<number | null>(null);
  public productStock = model<number | null>(null);
  public selectedCategoryId = model<number | null>(null);

  // State signals
  public isLoading = signal(false);
  public isFetchingCategories = signal(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  public categories = signal<Category[]>([]);
  public categoriesError = signal<string | null>(null);

  ngOnInit(): void {
    this.fetchCategories();
  }

  fetchCategories(): void {
    this.isFetchingCategories.set(true);
    this.categoriesError.set(null);
    // Using /models/categoria to fetch categories for the dropdown
    this.http
      .get<Category[]>(`${this.apiUrl}/categoria`)
      .pipe(
        tap((data) => {
          this.categories.set(data || []);
          if (!data || data.length === 0) {
            this.categoriesError.set(
              'No hay categorías disponibles. Por favor, crea una categoría primero.'
            );
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('API Error fetching categories:', error);
          this.categoriesError.set(
            'Fallo al cargar las categorías. Inténtalo de nuevo.'
          );
          this.categories.set([]); // Ensure categories list is empty on error
          return of([]); // Return empty array to keep observable chain alive
        }),
        finalize(() => {
          this.isFetchingCategories.set(false);
        })
      )
      .subscribe();
  }

  submitForm(form: NgForm): void {
    // Pass the form instance
    if (form.invalid) {
      this.errorMessage.set(
        'Por favor, completa todos los campos requeridos correctamente.'
      );
      // Mark all fields as touched to show validation errors
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
      .post<any>(`${this.apiUrl}/producto`, payload)
      .pipe(
        tap((response) => {
          this.successMessage.set(
            `Producto "${payload.nombre}" creado con éxito.`
          );
          form.resetForm();
          this.productName.set('');
          this.productDescription.set('');
          this.productPrice.set(null);
          this.productStock.set(null);
          this.selectedCategoryId.set(null);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('API Error creating product:', error);
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
            `Fallo al crear el producto. Detalle: ${detail}`
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
