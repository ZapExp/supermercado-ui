import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, model, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { catchError, finalize, tap, throwError } from 'rxjs';
import { Client } from '../../../../utils/types';

@Component({
  selector: 'app-create-client',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-client.component.html',
  styleUrl: './create-client.component.css',
})
export class CreateClientComponent {
  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl;

  public clientName = model<string>('');
  public clientEmail = model<string>('');
  public clientTelefono = model<string>('');

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

    const payload: Omit<Client, 'id'> = {
      nombre: this.clientName(),
      email: this.clientEmail(),
      telefono: this.clientTelefono(),
    };

    this.http
      .post<Client>(`${this.apiUrl}/cliente`, payload)
      .pipe(
        tap((response) => {
          this.successMessage.set(
            `Cliente "${payload.nombre}" (ID: ${response.id}) creado con éxito.`
          );
          form.resetForm();

          this.clientName.set('');
          this.clientEmail.set('');
          this.clientTelefono.set('');
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('API Error creating client:', error);
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
                  /* Ignore stringify error */
                }
              }
            }
          } else {
            detail = error.message;
          }
          this.errorMessage.set(
            `Fallo al crear el cliente. Detalle: ${detail}`
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
