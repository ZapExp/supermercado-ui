import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  inject,
  model,
  OnInit,
  signal,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  Observable,
  of,
  startWith,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';

import { environment } from '../../../../environments/environment'; // Adjust path
import { Supplier, ConfirmationResult } from '../../../utils/types'; // Adjust path
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog/confirmation-dialog.component'; // Adjust path

@Component({
  selector: 'app-supplier', // As per your request "SupplierComponent" for the list
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmationDialogComponent],
  templateUrl: './supplier.component.html',
  styleUrl: './supplier.component.css',
})
export class SupplierComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  public isLoading = signal(false);
  public isDeleting = signal(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  public suppliers$!: Observable<Supplier[]>;

  public searchText = model<string>('');
  private searchText$: Observable<string> = toObservable(this.searchText).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    startWith(this.searchText())
  );

  @ViewChild(ConfirmationDialogComponent)
  dialog!: ConfirmationDialogComponent<number>;

  private refreshSuppliersTrigger$ = new BehaviorSubject<void>(undefined);
  private deleteSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.suppliers$ = this.setupSupplierStream();
  }

  private fetchAllSuppliers(): Observable<Supplier[]> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    return this.http.get<Supplier[]>(`${this.apiUrl}/proveedor`).pipe(
      map((response) => response || []),
      catchError((error: HttpErrorResponse) => {
        console.error('API Error fetching suppliers:', error);
        this.errorMessage.set(
          'Fallo al cargar la lista de proveedores. Por favor, inténtelo de nuevo.'
        );
        return of([]);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  private setupSupplierStream(): Observable<Supplier[]> {
    const suppliersUnfiltered$ = this.refreshSuppliersTrigger$.pipe(
      switchMap(() => this.fetchAllSuppliers())
    );

    return combineLatest([suppliersUnfiltered$, this.searchText$]).pipe(
      map(([suppliers, search]) => {
        if (!search) return suppliers;
        const lowerCaseSearch = search.toLowerCase();
        return suppliers.filter(
          (supplier) =>
            supplier.nombre.toLowerCase().includes(lowerCaseSearch) ||
            supplier.contacto.toLowerCase().includes(lowerCaseSearch) ||
            supplier.direccion.toLowerCase().includes(lowerCaseSearch)
        );
      })
    );
  }

  openDeleteConfirmation(supplier: Supplier): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    const message = `¿Estás seguro de que deseas eliminar al proveedor "${supplier.nombre}" (ID: ${supplier.id})?`;
    this.dialog.message.set(message);
    this.dialog.title.set(`Confirmar eliminación de proveedor`);
    this.dialog.confirmButtonText.set('Sí, Eliminar');
    this.dialog.open(supplier.id);
  }

  handleDeleteConfirmation(result: ConfirmationResult<number>): void {
    if (!result.confirmed || result.data === null) return;

    const supplierIdToDelete = result.data;
    this.isDeleting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.deleteSubscription?.unsubscribe();
    this.deleteSubscription = this.http
      .delete(`${this.apiUrl}/proveedor/${supplierIdToDelete}`)
      .pipe(
        tap(() => {
          this.successMessage.set(
            `Proveedor ID ${supplierIdToDelete} eliminado con éxito.`
          );
          this.refreshSuppliersTrigger$.next();
          setTimeout(() => this.successMessage.set(null), 3000);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('API Error deleting supplier:', error);
          let detail = 'Error desconocido.';
          if (error.error?.detail) detail = error.error.detail;
          else if (error.message) detail = error.message;
          this.errorMessage.set(
            `Fallo al eliminar el proveedor ID ${supplierIdToDelete}. Detalle: ${detail}`
          );
          return of(null);
        }),
        finalize(() => {
          this.isDeleting.set(false);
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.deleteSubscription?.unsubscribe();
    this.refreshSuppliersTrigger$.complete();
  }
}
