import { Component, signal, inject, ViewChild, ElementRef, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ContractClient } from '../contract-client';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule
  ],
  templateUrl: './upload.html',
})
export class Upload {
  private contractClient = inject(ContractClient);
  private snackBar = inject(MatSnackBar);

  readonly isUploading = signal<boolean>(false);

  readonly uploaded = output<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  triggerFileInput(): void {
    // Structural guard against race conditions or multi-click events
    if (this.isUploading()) return;
    this.fileInput.nativeElement.click();
  }

  /**
   * Catches native change events when a user completes their choice in the system browser
   */
  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      
      // Secondary validation safety guard guaranteeing only .txt enters execution flow
      if (!file.name.endsWith('.txt') && file.type !== 'text/plain') {
        this.showNotification('Only standard plain text (.txt) files are supported', true);
        this.resetInput();

        return;
      }

      this.executeUpload(file);
    }
  }

  private executeUpload(file: File): void {
    this.isUploading.set(true);

    this.contractClient.upload(file)
      .pipe(
        finalize(() => {
          this.isUploading.set(false);
          this.resetInput();
        })
      )
      .subscribe({
        next: () => {
          this.showNotification('Contract uploaded and processed successfully');
          this.uploaded.emit();
        },
        error: (err) => {
          console.error('Contract upload failure:', err);
          this.showNotification('An error occurred while uploading the contract', true);
        }
      });
  }

  private resetInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private showNotification(message: string, isError = false): void {
    const statusIcon = isError ? '✕  ' : '✔  ';
    const fullMessage = `${statusIcon}${message}`;

    this.snackBar.open(fullMessage, 'Dismiss', {
      duration: isError ? 5000 : 3500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
