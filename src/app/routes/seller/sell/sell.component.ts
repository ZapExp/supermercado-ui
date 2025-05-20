import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  inject,
  model,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import {
  Client,
  Product,
  SaleCartItem,
  CreateSalePayload,
  CreateSaleResponse,
  CreateSaleDetailPayload,
} from '../../../utils/types';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
  concatMap,
  toArray,
  from,
  startWith,
} from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-register-sale',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sell.component.html',
  styleUrl: './sell.component.css',
})
export class SellComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  clientSearchText = model('');
  private clientSearchText$: Observable<string> = toObservable(
    this.clientSearchText
  ).pipe(debounceTime(300), distinctUntilChanged(), startWith(''));
  allClients = signal<Client[]>([]);
  searchedClients = signal<Client[]>([]);
  isFetchingAllClients = signal(false);
  clientsErrorMessage = signal<string | null>(null);
  showClientSuggestions = signal(false);
  selectedClient = signal<Client | null>(null);

  productSearchText = model('');
  private productSearchText$: Observable<string> = toObservable(
    this.productSearchText
  ).pipe(debounceTime(300), distinctUntilChanged(), startWith(''));
  allProducts = signal<Product[]>([]);
  searchedProducts = signal<Product[]>([]);
  isFetchingAllProducts = signal(false);
  productSearchErrorMessage = signal<string | null>(null);
  showProductSuggestions = signal(false);

  cartItems: WritableSignal<SaleCartItem[]> = signal([]);
  saleTotal = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + item.subtotal, 0);
  });

  isRegisteringSale = signal(false);
  saleSuccessMessage = signal<string | null>(null);
  saleErrorMessage = signal<string | null>(null);

  constructor() {
    effect(
      () => {
        const items = this.cartItems();
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.fetchAllClientsOnce();
    this.fetchAllProductsOnce();

    this.clientSearchText$.subscribe((searchText) => {
      const lowerSearchText = searchText.toLowerCase().trim();
      if (lowerSearchText) {
        this.searchedClients.set(
          this.allClients().filter(
            (client) =>
              client.nombre.toLowerCase().includes(lowerSearchText) ||
              client.email?.toLowerCase().includes(lowerSearchText) ||
              client.telefono?.includes(lowerSearchText)
          )
        );
        if (this.searchedClients().length === 0 && !this.selectedClient()) {
          this.clientsErrorMessage.set(
            `No se encontraron clientes para "${searchText}".`
          );
        } else {
          this.clientsErrorMessage.set(null);
        }
      } else {
        this.searchedClients.set(this.allClients());
        this.clientsErrorMessage.set(null);
      }
      if (!this.selectedClient()) {
        this.showClientSuggestions.set(true);
      } else {
        this.showClientSuggestions.set(false);
      }
    });

    this.productSearchText$.subscribe((searchText) => {
      const lowerSearchText = searchText.toLowerCase().trim();
      if (lowerSearchText) {
        this.searchedProducts.set(
          this.allProducts().filter((product) =>
            product.nombre.toLowerCase().includes(lowerSearchText)
          )
        );
        if (this.searchedProducts().length === 0) {
          this.productSearchErrorMessage.set(
            `No se encontraron productos para "${searchText}".`
          );
        } else {
          this.productSearchErrorMessage.set(null);
        }
      } else {
        this.searchedProducts.set(this.allProducts());
        this.productSearchErrorMessage.set(null);
      }

      this.showProductSuggestions.set(true);
    });
  }

  fetchAllClientsOnce(): void {
    if (this.allClients().length > 0 || this.isFetchingAllClients()) {
      if (this.allClients().length > 0 && this.clientSearchText() === '') {
        this.searchedClients.set(this.allClients());
      }
      return;
    }
    this.isFetchingAllClients.set(true);
    this.clientsErrorMessage.set(null);
    this.http
      .get<Client[]>(`${this.apiUrl}/cliente`)
      .pipe(
        tap((data) => {
          const clientsData = data || [];
          this.allClients.set(clientsData);
          if (this.clientSearchText() === '') {
            this.searchedClients.set(clientsData);
          } else {
            this.filterClientsOnLoad(clientsData);
          }
          if (clientsData.length === 0)
            this.clientsErrorMessage.set('No hay clientes registrados.');
        }),
        catchError((err) => {
          this.handleClientFetchError(err);
          return of([]);
        }),
        finalize(() => this.isFetchingAllClients.set(false))
      )
      .subscribe();
  }
  private filterClientsOnLoad(clientsData: Client[]) {
    const lowerSearchText = this.clientSearchText().toLowerCase().trim();
    this.searchedClients.set(
      clientsData.filter(
        (client) =>
          client.nombre.toLowerCase().includes(lowerSearchText) ||
          client.email?.toLowerCase().includes(lowerSearchText) ||
          client.telefono?.includes(lowerSearchText)
      )
    );
  }
  private handleClientFetchError(err: any) {
    this.clientsErrorMessage.set('Error al cargar la lista de clientes.');
    this.allClients.set([]);
    this.searchedClients.set([]);
  }

  fetchAllProductsOnce(): void {
    if (this.allProducts().length > 0 || this.isFetchingAllProducts()) {
      if (this.allProducts().length > 0 && this.productSearchText() === '') {
        this.searchedProducts.set(this.allProducts());
      }
      return;
    }
    this.isFetchingAllProducts.set(true);
    this.productSearchErrorMessage.set(null);

    this.http
      .get<Product[]>(`${this.apiUrl}/producto`)
      .pipe(
        tap((data) => {
          const productsData = data || [];
          this.allProducts.set(productsData);

          if (this.productSearchText() === '') {
            this.searchedProducts.set(productsData);
          } else {
            this.filterProductsOnLoad(productsData);
          }
          if (productsData.length === 0) {
            this.productSearchErrorMessage.set(
              'No hay productos registrados en el sistema.'
            );
          }
        }),
        catchError((err) => {
          this.handleProductFetchError(err);
          return of([]);
        }),
        finalize(() => this.isFetchingAllProducts.set(false))
      )
      .subscribe();
  }
  private filterProductsOnLoad(productsData: Product[]) {
    const lowerSearchText = this.productSearchText().toLowerCase().trim();
    this.searchedProducts.set(
      productsData.filter((product) =>
        product.nombre.toLowerCase().includes(lowerSearchText)
      )
    );
  }
  private handleProductFetchError(err: any) {
    this.productSearchErrorMessage.set(
      'Error al cargar la lista de productos.'
    );
    this.allProducts.set([]);
    this.searchedProducts.set([]);
  }

  onClientSearchFocus(): void {
    if (this.allClients().length === 0 && !this.isFetchingAllClients())
      this.fetchAllClientsOnce();
    if (!this.selectedClient()) this.showClientSuggestions.set(true);
  }
  hideClientSuggestions(): void {
    setTimeout(() => this.showClientSuggestions.set(false), 200);
  }
  selectClient(client: Client): void {
    this.selectedClient.set(client);
    this.clientSearchText.set(client.nombre);
    this.showClientSuggestions.set(false);
    this.clientsErrorMessage.set(null);
  }
  clearSelectedClient(): void {
    this.selectedClient.set(null);
    this.clientSearchText.set('');
    this.searchedClients.set(this.allClients());
    this.showClientSuggestions.set(true);
    this.clientsErrorMessage.set(null);
  }

  onProductSearchFocus(): void {
    if (this.allProducts().length === 0 && !this.isFetchingAllProducts()) {
      this.fetchAllProductsOnce();
    }
    this.showProductSuggestions.set(true);
  }
  hideProductSuggestions(): void {
    setTimeout(() => this.showProductSuggestions.set(false), 300);
  }

  addProductToCart(product: Product): void {
    if (product.stock <= 0) {
      this.productSearchErrorMessage.set(
        `Producto "${product.nombre}" sin stock.`
      );
      this.productSearchText.set('');
      this.searchedProducts.set([]);
      this.showProductSuggestions.set(false);
      return;
    }
    this.cartItems.update((currentItems) => {
      const currentProductId =
        product.id === undefined ? Date.now() + Math.random() : product.id;
      const existingItemIndex = currentItems.findIndex(
        (item) => item.productId === currentProductId
      );
      if (existingItemIndex > -1) {
        const updatedItems = [...currentItems];
        const existingItem = updatedItems[existingItemIndex];
        if (existingItem.quantity < product.stock) {
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + 1,
            subtotal: (existingItem.quantity + 1) * existingItem.unitPrice,
          };
        }
        return updatedItems;
      } else {
        return [
          ...currentItems,
          {
            productId: currentProductId,
            productName: product.nombre,
            quantity: 1,
            unitPrice: product.precio,
            subtotal: product.precio,
            availableStock: product.stock,
          },
        ];
      }
    });
    this.productSearchText.set('');
    this.searchedProducts.set(this.allProducts());
    this.showProductSuggestions.set(false);
  }

  updateCartItemQuantity(productId: number, newQuantity: number): void {
    this.cartItems.update((items) =>
      items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: Math.max(1, Math.min(newQuantity, item.availableStock)),
              subtotal:
                Math.max(1, Math.min(newQuantity, item.availableStock)) *
                item.unitPrice,
            }
          : item
      )
    );
  }
  removeCartItem(productId: number): void {
    this.cartItems.update((items) =>
      items.filter((item) => item.productId !== productId)
    );
  }
  clearSale(): void {
    this.clearSelectedClient();
    this.cartItems.set([]);
    this.productSearchText.set('');
    this.searchedProducts.set(this.allProducts());
    this.saleSuccessMessage.set(null);
    this.saleErrorMessage.set(null);
    this.productSearchErrorMessage.set(null);
    this.clientsErrorMessage.set(null);
    this.showProductSuggestions.set(false);
    this.showClientSuggestions.set(false);
  }

  registerSale(): void {
    if (!this.selectedClient()) {
      this.saleErrorMessage.set('Por favor, selecciona un cliente.');
      return;
    }
    if (this.cartItems().length === 0) {
      this.saleErrorMessage.set('Por favor, añade productos al carrito.');
      return;
    }

    this.isRegisteringSale.set(true);
    this.saleSuccessMessage.set(null);
    this.saleErrorMessage.set(null);
    const salePayload: CreateSalePayload = {
      cliente_id: (this.selectedClient() as Client).id,
      total: this.saleTotal(),
    };

    this.http
      .post<CreateSaleResponse>(`${this.apiUrl}/venta`, salePayload)
      .pipe(
        switchMap((saleResponse: CreateSaleResponse) => {
          if (!saleResponse || !saleResponse.id)
            return throwError(
              () => new Error('Respuesta inválida al crear la venta.')
            );
          const detailPayloads: CreateSaleDetailPayload[] =
            this.cartItems().map((item) => ({
              venta_id: saleResponse.id,
              producto_id: item.productId,
              cantidad: item.quantity,
              subtotal: item.subtotal,
            }));
          if (detailPayloads.length === 0) return of(saleResponse);
          return from(detailPayloads).pipe(
            concatMap((payload) =>
              this.http.post(`${this.apiUrl}/detalleventa`, payload)
            ),
            toArray(),
            map(() => saleResponse)
          );
        }),
        tap((saleResponse) => {
          this.saleSuccessMessage.set(
            `Venta #${saleResponse.id} registrada. Total: ${
              typeof saleResponse.total === 'number'
                ? saleResponse.total.toFixed(2)
                : saleResponse.total
            }`
          );
          this.clearSale();
        }),
        catchError((error: HttpErrorResponse) => {
          const detail =
            error.error?.message ||
            error.error?.detail ||
            error.message ||
            'Error desconocido.';
          this.saleErrorMessage.set(`Error al registrar la venta: ${detail}`);
          return throwError(() => error);
        }),
        finalize(() => this.isRegisteringSale.set(false))
      )
      .subscribe();
  }

  getNumericValueFromEvent(event: Event): number {
    const target = event.target as HTMLInputElement;
    if (target && target.value != null) {
      const numericValue = Number(target.value);
      return isNaN(numericValue) ? 0 : numericValue;
    }
    return 0;
  }
}
