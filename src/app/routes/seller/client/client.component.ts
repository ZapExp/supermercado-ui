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

import { environment } from '../../../../environments/environment';
import { Client } from '../../../utils/types';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationResult } from '../../../utils/types';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmationDialogComponent],
  templateUrl: './client.component.html',
  styleUrl: './client.component.css',
})
export class ClientComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  public isLoading = signal(false);
  public isDeleting = signal(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  public clients$!: Observable<Client[]>;

  public searchText = model<string>('');
  private searchText$: Observable<string> = toObservable(this.searchText).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    startWith(this.searchText())
  );

  @ViewChild(ConfirmationDialogComponent)
  dialog!: ConfirmationDialogComponent<number>;

  private refreshClientsTrigger$ = new BehaviorSubject<void>(undefined);
  private deleteSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.clients$ = this.setupClientStream();
  }

  private fetchAllClients(): Observable<Client[]> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.get<Client[]>(`${this.apiUrl}/cliente`).pipe(
      map((response) => response || []),
      catchError((error: HttpErrorResponse) => {
        console.error('API Error fetching clients:', error);
        this.errorMessage.set(
          'Fallo al cargar la lista de clientes. Por favor, inténtelo de nuevo.'
        );
        return of([]);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  private setupClientStream(): Observable<Client[]> {
    const clientsUnfiltered$ = this.refreshClientsTrigger$.pipe(
      switchMap(() => this.fetchAllClients())
    );

    return combineLatest([clientsUnfiltered$, this.searchText$]).pipe(
      map(([clients, search]) => {
        if (!search) {
          return clients;
        }
        const lowerCaseSearch = search.toLowerCase();
        return clients.filter(
          (client) =>
            client.nombre.toLowerCase().includes(lowerCaseSearch) ||
            client.email.toLowerCase().includes(lowerCaseSearch) ||
            client.telefono.toLowerCase().includes(lowerCaseSearch)
        );
      })
    );
  }

  openDeleteConfirmation(client: Client): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const message = `¿Estás seguro de que deseas eliminar al cliente "${client.nombre}" (ID: ${client.id})?`;
    this.dialog.message.set(message);
    this.dialog.title.set(`Confirmar eliminación de cliente`);
    this.dialog.confirmButtonText.set('Sí, Eliminar');
    this.dialog.open(client.id);
  }

  handleDeleteConfirmation(result: ConfirmationResult<number>): void {
    if (!result.confirmed || result.data === null) {
      return;
    }

    const clientIdToDelete = result.data;
    this.isDeleting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.deleteSubscription?.unsubscribe();

    this.deleteSubscription = this.http
      .delete(`${this.apiUrl}/cliente/${clientIdToDelete}`)
      .pipe(
        tap(() => {
          this.successMessage.set(
            `Cliente ID ${clientIdToDelete} eliminado con éxito.`
          );
          this.refreshClientsTrigger$.next();
          setTimeout(() => this.successMessage.set(null), 3000);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('API Error deleting client:', error);
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
            }
          } else {
            detail = error.message;
          }
          this.errorMessage.set(
            `Fallo al eliminar el cliente ID ${clientIdToDelete}. Detalle: ${detail}`
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
    this.refreshClientsTrigger$.complete();
  }
}
