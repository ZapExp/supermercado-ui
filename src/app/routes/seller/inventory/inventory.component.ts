import { HttpClient } from '@angular/common/http';
import {
  Component,
  inject,
  model,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { environment } from '../../../../environments/environment';
import type { Product, ProductRaw } from '../../../utils/types';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  Observable,
  of,
  startWith,
  tap,
  switchMap,
  BehaviorSubject,
  Subscription,
} from 'rxjs';
import { processProduct } from '../../../utils/processData';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationResult } from '../../../utils/types';

@Component({
  selector: 'app-inventory',
  standalone: true, // Assuming standalone based on your imports structure
  imports: [CommonModule, FormsModule, ConfirmationDialogComponent],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  public isLoading = signal(false);
  public isDeleting = signal(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  public products$!: Observable<Product[]>;

  public searchText = model<string>('');
  private searchText$: Observable<string> = toObservable(this.searchText).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    startWith(this.searchText())
  );

  @ViewChild(ConfirmationDialogComponent)
  dialog!: ConfirmationDialogComponent<number>;

  // Trigger for refreshing the product list
  private refreshProductsTrigger$ = new BehaviorSubject<void>(undefined);

  private deleteSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.products$ = this.setupProductStream();
  }

  // Fetches all products from the API
  private fetchAllProducts(): Observable<Product[]> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    return this.http.get<ProductRaw[]>(`${this.apiUrl}/producto`).pipe(
      map((response) => {
        if (response) {
          return response.map(processProduct);
        }
        return [];
      }),
      catchError((error) => {
        console.error('API Error fetching products:', error);
        this.errorMessage.set(
          'Failed to fetch product data. Please try again.'
        );
        return of([]); // Return empty array so stream doesn't break
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  private setupProductStream(): Observable<Product[]> {
    const productsUnfiltered$ = this.refreshProductsTrigger$.pipe(
      switchMap(() => this.fetchAllProducts())
    );

    return combineLatest([productsUnfiltered$, this.searchText$]).pipe(
      map(([products, search]) => {
        if (!search) {
          return products;
        }
        const lowerCaseSearch = search.toLowerCase();
        return products.filter((product) =>
          product.name.toLowerCase().includes(lowerCaseSearch)
        );
      })
    );
  }

  openDeleteConfirmation(id: number, name: string): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const message = `¿Estás seguro de que deseas eliminar el producto "${name}" (ID: ${id})?`;
    this.dialog.message.set(message);
    this.dialog.title.set(`Confirmar eliminación`);
    this.dialog.confirmButtonText.set('Sí, Eliminar');
    this.dialog.open(id);
  }

  handleDeleteConfirmation(result: ConfirmationResult<number>): void {
    if (!result.confirmed || result.data === null) {
      return;
    }

    const productIdToDelete = result.data;
    this.isDeleting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.deleteSubscription?.unsubscribe();

    this.deleteSubscription = this.http
      .delete(`${this.apiUrl}/producto/${productIdToDelete}`)
      .pipe(
        tap(() => {
          this.successMessage.set(
            `Producto ID ${productIdToDelete} eliminado con éxito.`
          );
          this.refreshProductsTrigger$.next();
          setTimeout(() => this.successMessage.set(null), 3000);
        }),
        catchError((error) => {
          const detail =
            error.error?.message || error.message || 'Error desconocido.';
          this.errorMessage.set(
            `Fallo al eliminar el producto ID ${productIdToDelete}. Detalle: ${detail}`
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
  }
}
