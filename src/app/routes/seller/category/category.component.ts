import { HttpClient } from '@angular/common/http';
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
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationResult } from '../../../utils/types';
import { RouterLink } from '@angular/router';

export interface Category {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationDialogComponent, RouterLink],
  templateUrl: './category.component.html',
  styleUrl: './category.component.css',
})
export class CategoryComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  public isLoading = signal(false);
  public isDeleting = signal(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  public categories$!: Observable<Category[]>;

  public searchText = model<string>('');
  private searchText$: Observable<string> = toObservable(this.searchText).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    startWith(this.searchText())
  );

  @ViewChild(ConfirmationDialogComponent)
  dialog!: ConfirmationDialogComponent<number>;

  private refreshCategoriesTrigger$ = new BehaviorSubject<void>(undefined);
  private deleteSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.categories$ = this.setupCategoryStream();
  }

  private fetchAllCategories(): Observable<Category[]> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Using /models/categoria as shown in the image screenshot
    return this.http.get<Category[]>(`${this.apiUrl}/categoria`).pipe(
      map((response) => {
        return response || []; // API is expected to return Category[] or null
      }),
      catchError((error) => {
        console.error('API Error fetching categories:', error);
        this.errorMessage.set(
          'Fallo al cargar la lista de categorías. Por favor, inténtelo de nuevo.'
        );
        return of([]);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  private setupCategoryStream(): Observable<Category[]> {
    const categoriesUnfiltered$ = this.refreshCategoriesTrigger$.pipe(
      switchMap(() => this.fetchAllCategories())
    );

    return combineLatest([categoriesUnfiltered$, this.searchText$]).pipe(
      map(([categories, search]) => {
        if (!search) {
          return categories;
        }
        const lowerCaseSearch = search.toLowerCase();
        return categories.filter((category) =>
          category.nombre.toLowerCase().includes(lowerCaseSearch)
        );
      })
    );
  }

  openDeleteConfirmation(id: number, name: string): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const message = `¿Estás seguro de que deseas eliminar la categoría "${name}" (ID: ${id})?`;
    this.dialog.message.set(message);
    this.dialog.title.set(`Confirmar eliminación de categoría`);
    this.dialog.confirmButtonText.set('Sí, Eliminar');
    this.dialog.open(id);
  }

  handleDeleteConfirmation(result: ConfirmationResult<number>): void {
    if (!result.confirmed || result.data === null) {
      return;
    }

    const categoryIdToDelete = result.data;
    this.isDeleting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.deleteSubscription?.unsubscribe();

    this.deleteSubscription = this.http
      .delete(`${this.apiUrl}/categoria/${categoryIdToDelete}`)
      .pipe(
        tap(() => {
          this.successMessage.set(
            `Categoría ID ${categoryIdToDelete} eliminada con éxito.`
          );
          this.refreshCategoriesTrigger$.next();
          setTimeout(() => this.successMessage.set(null), 3000);
        }),
        catchError((error) => {
          const detail =
            error.error?.message || error.message || 'Error desconocido.';
          this.errorMessage.set(
            `Fallo al eliminar la categoría ID ${categoryIdToDelete}. Detalle: ${detail}`
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
    this.refreshCategoriesTrigger$.complete();
  }
}
