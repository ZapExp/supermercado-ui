import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, model, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { catchError, finalize, tap, throwError, of } from 'rxjs';
import { Category } from '../../../../utils/types';

@Component({
  selector: 'app-edit-category',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './edit-category.component.html',
  styleUrl: './edit-category.component.css',
})
export class EditCategoryComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private apiUrl = environment.apiUrl;

  public categoryId: number | null = null;

  public categoryName = model<string>('');

  public isLoading = signal(false);
  public isFetchingData = signal(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);
  public categoryNotFoundError = signal<boolean>(false);

  ngOnInit(): void {
    this.isFetchingData.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.categoryNotFoundError.set(false);

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (!idParam) {
        this.errorMessage.set('ID de categoría no encontrado en la URL.');
        this.categoryNotFoundError.set(true);
        this.isFetchingData.set(false);
        return;
      }
      this.categoryId = +idParam;
      this.fetchCategoryDetails(this.categoryId);
    });
  }

  private fetchCategoryDetails(id: number): void {
    this.isFetchingData.set(true);
    this.categoryNotFoundError.set(false);
    this.errorMessage.set(null);

    this.http
      .get<Category>(`${this.apiUrl}/categoria/${id}`)
      .pipe(
        tap((category) => {
          this.categoryName.set(category.nombre);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('API Error fetching category details:', error);
          if (error.status === 404) {
            this.errorMessage.set(`Categoría con ID ${id} no encontrada.`);
            this.categoryNotFoundError.set(true);
          } else {
            this.errorMessage.set(
              'Fallo al cargar los detalles de la categoría.'
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

  submitForm(form: NgForm): void {
    const currentName = this.categoryName().trim();
    if (form.invalid || !currentName) {
      this.errorMessage.set(
        'El nombre de la categoría no puede estar vacío y debe ser válido.'
      );
      Object.values(form.controls).forEach((control) =>
        control.markAsTouched()
      );
      return;
    }
    if (this.categoryId === null) {
      this.errorMessage.set(
        'Error: ID de categoría no disponible para la actualización.'
      );
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload: Omit<Category, 'id'> = {
      nombre: currentName,
    };

    this.http
      .put<any>(`${this.apiUrl}/categoria/${this.categoryId}`, payload)
      .pipe(
        tap(() => {
          this.successMessage.set(
            `Categoría "${payload.nombre}" (ID: ${this.categoryId}) actualizada con éxito.`
          );
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('API Error updating category:', error);
          let detail = 'Error desconocido.';
          if (error.error) {
            if (typeof error.error === 'string') {
              detail = error.error;
            } else if (error.error.message) {
              detail = error.error.message;
            } else if (error.error.detail) {
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
            `Fallo al actualizar la categoría. Detalle: ${detail}`
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
