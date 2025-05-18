import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { catchError, finalize, tap, throwError } from 'rxjs';

// Interface for the POST request payload
interface CreateCategoryPayload {
  nombre: string;
}

@Component({
  selector: 'app-create-category',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-category.component.html',
  styleUrl: './create-category.component.css',
})
export class CreateCategoryComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  public categoryName = model<string>('');
  public isLoading = signal(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  submitForm(): void {
    const currentName = this.categoryName().trim();
    if (!currentName) {
      this.errorMessage.set('El nombre de la categoría no puede estar vacío.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload: CreateCategoryPayload = { nombre: currentName };
    this.http
      .post<any>(`${this.apiUrl}/categoria/`, payload)
      .pipe(
        tap((response) => {
          this.successMessage.set(
            `Categoría "${payload.nombre}" creada con éxito.`
          );
          this.categoryName.set('');
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('API Error creating category:', error);
          let detail = 'Error desconocido.';
          if (error.error) {
            if (typeof error.error === 'string') {
              detail = error.error;
            } else if (error.error.message) {
              detail = error.error.message;
            } else if (error.error.detail) {
              // Common in Django REST Framework
              detail = error.error.detail;
            } else if (
              Array.isArray(error.error) &&
              error.error.length > 0 &&
              error.error[0]?.msg
            ) {
              detail = error.error[0].msg;
            } else if (typeof error.error === 'object') {
              const errorKeys = Object.keys(error.error);
              if (
                errorKeys.length > 0 &&
                Array.isArray(error.error[errorKeys[0]]) &&
                error.error[errorKeys[0]].length > 0
              ) {
                detail = error.error[errorKeys[0]][0];
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
            `Fallo al crear la categoría. Detalle: ${detail}`
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
