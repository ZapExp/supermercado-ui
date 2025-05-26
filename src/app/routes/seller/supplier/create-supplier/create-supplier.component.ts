import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, model, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment'; // Adjust path
import { catchError, finalize, tap, throwError } from 'rxjs';
import { Supplier } from '../../../../utils/types'; // Adjust path

@Component({
  selector: 'app-create-supplier',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-supplier.component.html',
  styleUrl: './create-supplier.component.css',
})
export class CreateSupplierComponent {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  public supplierName = model<string>('');
  public supplierContact = model<string>('');
  public supplierAddress = model<string>('');

  public isLoading = signal(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  submitForm(form: NgForm): void {
    if (form.invalid) {
      this.errorMessage.set(
        'Por favor, completa todos los campos requeridos correctamente.'
      );
      Object.values(form.controls).forEach((control) => {
        control.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload: Omit<Supplier, 'id'> = {
      nombre: this.supplierName(),
      contacto: this.supplierContact(),
      direccion: this.supplierAddress(),
    };

    this.http
      .post<Supplier>(`${this.apiUrl}/proveedor`, payload)
      .pipe(
        tap((response) => {
          this.successMessage.set(
            `Proveedor "${payload.nombre}" (ID: ${response.id}) creado con éxito.`
          );
          form.resetForm();
          this.supplierName.set('');
          this.supplierContact.set('');
          this.supplierAddress.set('');
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('API Error creating supplier:', error);
          let detail = 'Error desconocido.';
          if (error.error) {
            if (typeof error.error === 'string') {
              detail = error.error;
            } else if (error.error.message) {
              detail = error.error.message;
            } else if (error.error.detail) {
              detail = Array.isArray(error.error.detail)
                ? error.error.detail
                    .map((e: any) => e.msg || e.message || e)
                    .join(', ')
                : error.error.detail;
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
            `Fallo al crear el proveedor. Detalle: ${detail}`
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
