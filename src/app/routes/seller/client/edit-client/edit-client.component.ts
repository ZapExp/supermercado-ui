import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, model, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { catchError, finalize, tap, of, throwError } from 'rxjs';
import { Client } from '../../../../utils/types';

@Component({
  selector: 'app-edit-client',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './edit-client.component.html',
  styleUrl: './edit-client.component.css',
})
export class EditClientComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private apiUrl = environment.apiUrl;

  public clientId: number | null = null;

  public clientName = model<string>('');
  public clientEmail = model<string>('');
  public clientTelefono = model<string>('');

  public isLoading = signal(false);
  public isFetchingClient = signal(false);

  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);
  public clientNotFoundError = signal<boolean>(false);

  ngOnInit(): void {
    this.resetMessages();
    this.clientNotFoundError.set(false);

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (!idParam || isNaN(+idParam)) {
        this.errorMessage.set(
          'ID de cliente inválido o no encontrado en la URL.'
        );
        this.clientNotFoundError.set(true);
        this.isFetchingClient.set(false);
        return;
      }
      this.clientId = +idParam;
      this.fetchClientDetails(this.clientId);
    });
  }

  private resetMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private fetchClientDetails(id: number): void {
    this.isFetchingClient.set(true);
    this.clientNotFoundError.set(false);
    this.resetMessages();

    this.http
      .get<Client>(`${this.apiUrl}/cliente/${id}`)
      .pipe(
        tap((client) => {
          if (client) {
            this.populateForm(client);
          } else {
            this.errorMessage.set(`Cliente con ID ${id} no encontrado.`);
            this.clientNotFoundError.set(true);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('API Error fetching client details:', error);
          if (error.status === 404) {
            this.errorMessage.set(`Cliente con ID ${id} no encontrado.`);
            this.clientNotFoundError.set(true);
          } else {
            this.errorMessage.set('Fallo al cargar los detalles del cliente.');
          }
          return of(null);
        }),
        finalize(() => {
          this.isFetchingClient.set(false);
        })
      )
      .subscribe();
  }

  private populateForm(client: Client): void {
    this.clientName.set(client.nombre);
    this.clientEmail.set(client.email);
    this.clientTelefono.set(client.telefono);
  }

  submitForm(form: NgForm): void {
    this.resetMessages();
    if (form.invalid) {
      this.errorMessage.set(
        'Por favor, completa todos los campos requeridos correctamente.'
      );
      Object.values(form.controls).forEach((control) =>
        control.markAsTouched()
      );
      return;
    }

    if (this.clientId === null) {
      this.errorMessage.set(
        'Error: ID de cliente no disponible para la actualización.'
      );
      return;
    }

    this.isLoading.set(true);

    const payload: Omit<Client, 'id'> = {
      nombre: this.clientName(),
      email: this.clientEmail(),
      telefono: this.clientTelefono(),
    };

    this.http
      .put<Client>(`${this.apiUrl}/cliente/${this.clientId}`, payload)
      .pipe(
        tap((updatedClient) => {
          this.successMessage.set(
            `Cliente "${updatedClient.nombre}" (ID: ${this.clientId}) actualizado con éxito.`
          );
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('API Error updating client:', error);
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
            `Fallo al actualizar el cliente. Detalle: ${detail}`
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
