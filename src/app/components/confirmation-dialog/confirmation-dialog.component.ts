import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ConfirmationResult } from '../../utils/types';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent<T = number> {
  public message = signal('¿Estas seguro?');
  public confirmButtonText = signal('Si, Confirmar');
  public cancelButtonText = signal('Cancelar');
  public title = signal('Confirmación Requerida');

  @Output() confirmed = new EventEmitter<ConfirmationResult<T>>();

  @ViewChild('confirmationDialog') dialogRef!: ElementRef<HTMLDialogElement>;

  private extraData: T | null = null;
  public open(data?: T): void {
    this.extraData = data ?? null;
    if (this.dialogRef?.nativeElement) {
      this.dialogRef.nativeElement.showModal();
    } else {
      console.error('Dialog element not found!');
    }
  }

  public close(): void {
    if (this.dialogRef?.nativeElement) {
      this.dialogRef.nativeElement.close();
    }
  }

  onConfirm(): void {
    this.confirmed.emit({ confirmed: true, data: this.extraData });
    this.extraData = null;
  }

  onCancel(): void {
    this.confirmed.emit({ confirmed: false, data: this.extraData });
    this.extraData = null;
  }

  onDialogClose(): void {
    if (this.extraData !== null) {
      console.log('Dialog closed via ESC or backdrop');
      this.confirmed.emit({ confirmed: false, data: this.extraData });
      this.extraData = null;
    }
  }
}
