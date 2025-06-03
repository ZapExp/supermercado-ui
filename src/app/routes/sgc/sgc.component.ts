import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgIf } from '@angular/common';
import { finalize, catchError, throwError } from 'rxjs';

@Component({
  selector: 'app-sgc',
  templateUrl: './sgc.component.html',
  styleUrl: './sgc.component.css',
})
export class SgcComponent {
  addToCalendar() {
    const eventDate = new Date('2025-06-15T16:00:00');
    const calendarUrl = this.generateCalendarEvent(
      'Reunión de Mejora Continua - La Guaca',
      eventDate,
      'Revisión de procesos y sugerencias',
      'https://meet.google.com/tzn-xait-awe'
    );

    window.open(calendarUrl, '_blank');
  }

  private generateCalendarEvent(
    title: string,
    date: Date,
    description: string,
    location: string
  ): string {
    const startDate = date.toISOString().replace(/-|:|\.\d+/g, '');
    const endDate = new Date(date.getTime() + 60 * 60 * 1000)
      .toISOString()
      .replace(/-|:|\.\d+/g, '');

    return (
      `https://www.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(title)}` +
      `&dates=${startDate}/${endDate}` +
      `&details=${encodeURIComponent(description)}` +
      `&location=${encodeURIComponent(location)}` +
      `&sf=true&output=xml`
    );
  }
}
