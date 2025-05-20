import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-report',
  standalone: true,
    imports: [NgIf],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  data = signal<SafeResourceUrl | null>(null); // <- IMPORTANTE: usar SafeResourceUrl

  constructor() {
    this.loadText();
  }

  private loadText() {
    this.http.get('http://localhost:3000/repo', { responseType: 'text' })
      .subscribe(res => {
        const safe = this.sanitizer.bypassSecurityTrustResourceUrl(res);
        this.data.set(safe);
      });
  }
}
