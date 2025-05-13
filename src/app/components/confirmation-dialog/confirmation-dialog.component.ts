import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
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
  @Input() message: string = '¿Estas seguro?';
  @Input() confirmButtonText: string = 'Si, Confirmar';
  @Input() cancelButtonText: string = 'Cancelar';
  @Input() title: string = 'Confirmación Requerida';

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

  /** Closes the dialog without emitting an event. */
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
