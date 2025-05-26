import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, model, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment'; // Adjust path
import { catchError, finalize, tap, of, throwError } from 'rxjs';
import { Supplier } from '../../../../utils/types'; // Adjust path

@Component({
  selector: 'app-edit-supplier',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './edit-supplier.component.html',
  styleUrl: './edit-supplier.component.css',
})
export class EditSupplierComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private apiUrl = environment.apiUrl;

  public supplierId: number | null = null;

  public supplierName = model<string>('');
  public supplierContact = model<string>('');
  public supplierAddress = model<string>('');

  public isLoading = signal(false);
  public isFetchingSupplier = signal(false);

  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);
  public supplierNotFoundError = signal<boolean>(false);

  ngOnInit(): void {
    this.resetMessages();
    this.supplierNotFoundError.set(false);

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (!idParam || isNaN(+idParam)) {
        this.errorMessage.set(
          'ID de proveedor inválido o no encontrado en la URL.'
        );
        this.supplierNotFoundError.set(true);
        return;
      }
      this.supplierId = +idParam;
      this.fetchSupplierDetails(this.supplierId);
    });
  }

  private resetMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private fetchSupplierDetails(id: number): void {
    this.isFetchingSupplier.set(true);
    this.supplierNotFoundError.set(false);
    this.resetMessages();

    this.http
      .get<Supplier>(`${this.apiUrl}/proveedor/${id}`)
      .pipe(
        tap((supplier) => {
          if (supplier) {
            this.populateForm(supplier);
          } else {
            this.errorMessage.set(`Proveedor con ID ${id} no encontrado.`);
            this.supplierNotFoundError.set(true);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('API Error fetching supplier details:', error);
          if (error.status === 404) {
            this.errorMessage.set(`Proveedor con ID ${id} no encontrado.`);
            this.supplierNotFoundError.set(true);
          } else {
            this.errorMessage.set(
              'Fallo al cargar los detalles del proveedor.'
            );
          }
          return of(null);
        }),
        finalize(() => {
          this.isFetchingSupplier.set(false);
        })
      )
      .subscribe();
  }

  private populateForm(supplier: Supplier): void {
    this.supplierName.set(supplier.nombre);
    this.supplierContact.set(supplier.contacto);
    this.supplierAddress.set(supplier.direccion);
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
    if (this.supplierId === null) {
      this.errorMessage.set(
        'Error: ID de proveedor no disponible para la actualización.'
      );
      return;
    }

    this.isLoading.set(true);
    const payload: Omit<Supplier, 'id'> = {
      nombre: this.supplierName(),
      contacto: this.supplierContact(),
      direccion: this.supplierAddress(),
    };

    this.http
      .put<Supplier>(`${this.apiUrl}/proveedor/${this.supplierId}`, payload)
      .pipe(
        tap((updatedSupplier) => {
          this.successMessage.set(
            `Proveedor "${updatedSupplier.nombre}" (ID: ${this.supplierId}) actualizado con éxito.`
          );
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('API Error updating supplier:', error);
          let detail = 'Error desconocido.';
          if (error.error) {
            if (typeof error.error === 'string') detail = error.error;
            else if (error.error.message) detail = error.error.message;
            else if (error.error.detail) {
              detail = Array.isArray(error.error.detail)
                ? error.error.detail
                    .map((e: any) => e.msg || e.message || e)
                    .join(', ')
                : error.error.detail;
            } else if (typeof error.error === 'object') {
              const errorMessages = Object.values(error.error).flat();
              if (errorMessages.length > 0) detail = errorMessages.join(' ');
              else {
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
            `Fallo al actualizar el proveedor. Detalle: ${detail}`
          );
          return throwError(() => error);
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe({ error: () => {} });
  }
}
