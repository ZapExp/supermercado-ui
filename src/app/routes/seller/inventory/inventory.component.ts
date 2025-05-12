import { HttpClient } from '@angular/common/http';
import { Component, inject, model, OnInit, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import type { Product, ProductRaw } from '../../../utils/types';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  Observable,
  of,
  startWith,
  tap,
} from 'rxjs';
import { processProduct } from '../../../utils/processData';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-inventory',
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  public isLoading = false;
  public errorMessage = signal<string | null>(null);
  public products$!: Observable<Product[]>;

  public searchText = model<string>('');
  private searchText$ = toObservable(this.searchText).pipe(
    debounceTime(300), // Wait 300ms after the user stops typing
    distinctUntilChanged(), // Only emit if the value actually changed
    startWith(this.searchText()) // Emit the initial value immediately
  );

  ngOnInit(): void {
    this.products$ = this.setupProductFilter();
  }

  setupProductFilter(): Observable<Product[]> {
    this.isLoading = true;
    this.errorMessage.set(null);

    const productsUnfiltered$ = this.http.get(`${this.apiUrl}/producto`).pipe(
      map((response) => {
        if (response) {
          const productsRaw = response as ProductRaw[];
          return productsRaw.map(processProduct);
        }
        return [];
      }),
      catchError((error) => {
        console.error('API Error:', error);
        this.errorMessage.set('Failed to fetch data. Please try again.');
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
      })
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
}
