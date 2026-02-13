import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AssignmentsService } from '../../services/assignments.service';
import type { Assignment } from '../../models';

@Component({
  selector: 'app-assignment-submit-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './assignment-submit-dialog.component.html',
  styleUrl: './assignment-submit-dialog.component.scss'
})
export class AssignmentSubmitDialogComponent {
  selectedFile: File | null = null;
  isSubmitting = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public assignment: Assignment,
    private assignmentsService: AssignmentsService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AssignmentSubmitDialogComponent>
  ) {}

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  submit(): void {
    if (!this.selectedFile) {
      this.snackBar.open('Please choose a file first.', 'Close', { duration: 2200 });
      return;
    }

    this.isSubmitting = true;
    this.assignmentsService.submitAssignment(this.assignment.id, this.selectedFile).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
