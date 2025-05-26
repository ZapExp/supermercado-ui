import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgIf } from '@angular/common';
import { finalize, catchError, throwError } from 'rxjs';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [NgIf],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css',
})
export class ReportComponent {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  data = signal<SafeResourceUrl | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.loadReport();
  }

  private loadReport() {
    this.isLoading.set(true);
    this.data.set(null);
    this.errorMessage.set(null);

    this.http
      .get('http://localhost:3000/panel', { responseType: 'text' })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorMessage.set('Fallo al intentar cargar el reporte.');
          return throwError(() => error);
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe({
        next: (res) => {
          const separator = res.includes('?') ? '&' : '?';
          const urlWithParams = `${res}${separator}#background=false&bordered=false&titled=true`;
          const safe =
            this.sanitizer.bypassSecurityTrustResourceUrl(urlWithParams);
          this.data.set(safe);
        },
        error: () => {},
      });
  }

  retryLoad(): void {
    this.loadReport();
  }
}
