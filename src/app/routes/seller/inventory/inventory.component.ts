import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import type { Product, ProductRaw } from '../../../utils/types';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';
import { processProduct } from '../../../utils/processData';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inventory',
  imports: [CommonModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  public isLoading = false;
  public errorMessage: string | null = null;
  public products$!: Observable<Product[]>;

  ngOnInit(): void {
    this.products$ = this.fetchProducts();
  }

  fetchProducts(): Observable<Product[]> {
    this.isLoading = true;
    this.errorMessage = null;

    return this.http.get(`${this.apiUrl}/producto`).pipe(
      map((response) => {
        if (response) {
          const productsRaw = response as ProductRaw[];
          return productsRaw.map(processProduct);
        }
        return []; // Return empty if data is not as expected
      }),
      catchError((error) => {
        // 5. Operator 3: Error Handling
        console.error('API Error:', error);
        this.errorMessage = 'Failed to fetch data. Please try again.';
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    );
  }
}
