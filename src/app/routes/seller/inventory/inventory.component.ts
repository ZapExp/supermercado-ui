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
import { environment } from '../../../../environments/environment';
import type {
  Product,
  Category,
  ProductDisplay,
  ConfirmationResult,
} from '../../../utils/types';
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
  shareReplay,
} from 'rxjs';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog/confirmation-dialog.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ConfirmationDialogComponent,
    RouterLink,
    CurrencyPipe,
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  public isLoadingProducts = signal(false);
  public isLoadingCategories = signal(false);
  public isDeleting = signal(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);
  public categoriesErrorMessage = signal<string | null>(null);

  public productsWithCategories$!: Observable<ProductDisplay[]>;

  public searchText = model<string>('');
  private searchText$: Observable<string> = toObservable(this.searchText).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    startWith(this.searchText())
  );

  @ViewChild(ConfirmationDialogComponent)
  dialog!: ConfirmationDialogComponent<number>;

  private refreshProductsTrigger$ = new BehaviorSubject<void>(undefined);
  private categoriesData$: Observable<Category[]> | undefined;

  private deleteSubscription: Subscription | undefined;
  private mainDataSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.productsWithCategories$ = this.setupCombinedStream();

    this.mainDataSubscription = this.productsWithCategories$.subscribe({
      error: (err) => {
        console.error(
          'Error in main product/category stream subscription:',
          err
        );
        if (!this.errorMessage() && !this.categoriesErrorMessage()) {
          this.errorMessage.set('An unexpected error occurred.');
        }
      },
    });
  }

  private fetchAllProducts(): Observable<Product[]> {
    this.isLoadingProducts.set(true);
    this.errorMessage.set(null);

    return this.http.get<Product[]>(`${this.apiUrl}/producto`).pipe(
      map((response) => response || []),
      catchError((error: HttpErrorResponse) => {
        console.error('API Error fetching products:', error);
        this.errorMessage.set(
          'Fallo al cargar los productos. Por favor, inténtelo de nuevo.'
        );
        return of([]);
      }),
      finalize(() => {
        this.isLoadingProducts.set(false);
      })
    );
  }

  private fetchAllCategories(): Observable<Category[]> {
    if (!this.categoriesData$) {
      this.isLoadingCategories.set(true);
      this.categoriesErrorMessage.set(null);
      this.categoriesData$ = this.http
        .get<Category[]>(`${this.apiUrl}/categoria`)
        .pipe(
          map((response) => response || []),
          tap(() => this.isLoadingCategories.set(false)),
          catchError((error: HttpErrorResponse) => {
            console.error('API Error fetching categories:', error);
            this.categoriesErrorMessage.set('Fallo al cargar las categorías.');
            this.isLoadingCategories.set(false);
            return of([]);
          }),
          shareReplay(1)
        );
    }
    return this.categoriesData$;
  }

  private setupCombinedStream(): Observable<ProductDisplay[]> {
    const productsUnfiltered$ = this.refreshProductsTrigger$.pipe(
      switchMap(() => this.fetchAllProducts())
    );

    const categories$ = this.fetchAllCategories();

    return combineLatest([
      productsUnfiltered$,
      categories$,
      this.searchText$,
    ]).pipe(
      map(([products, categories, search]) => {
        const categoryMap = new Map<number, string>();
        categories.forEach((cat) => categoryMap.set(cat.id || 0, cat.nombre));

        let enrichedProducts: ProductDisplay[] = products.map((product) => ({
          ...product,
          categoria_nombre:
            categoryMap.get(product.categoria_id) || 'Desconocida',
        }));

        if (!search) {
          return enrichedProducts;
        }
        const lowerCaseSearch = search.toLowerCase();
        return enrichedProducts.filter(
          (product) =>
            product.nombre.toLowerCase().includes(lowerCaseSearch) ||
            product.descripcion.toLowerCase().includes(lowerCaseSearch) ||
            (product.categoria_nombre &&
              product.categoria_nombre.toLowerCase().includes(lowerCaseSearch))
        );
      }),
      catchError((err) => {
        console.error('Error in combined product/category stream:', err);
        this.errorMessage.set(
          'Ocurrió un error al procesar los datos de productos y categorías.'
        );
        return of([]);
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
    if (!result.confirmed || result.data === null) return;

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
        catchError((error: HttpErrorResponse) => {
          const detail =
            error.error?.detail ||
            error.error?.message ||
            error.message ||
            'Error desconocido.';
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
    this.mainDataSubscription?.unsubscribe();
    this.refreshProductsTrigger$.complete();
  }
}
