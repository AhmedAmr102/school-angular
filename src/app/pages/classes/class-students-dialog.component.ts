import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClassesService } from '../../services/classes.service';
import type { Class, ClassSubjectSetup } from '../../models';

@Component({
  selector: 'app-class-students-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatListModule, MatIconModule],
  templateUrl: './class-students-dialog.component.html',
  styleUrl: './class-students-dialog.component.scss'
})
export class ClassStudentsDialogComponent {
  setups: ClassSubjectSetup[] = [];
  isLoading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Class,
    private classesService: ClassesService,
    private snackBar: MatSnackBar
  ) {
    this.loadSetups();
  }

  private loadSetups(): void {
    this.isLoading = true;
    this.classesService.getClassSubjectSetupsForClass(this.data.id).subscribe({
      next: (setups) => {
        this.setups = setups;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load class setup details', 'Close', { duration: 2500 });
      }
    });
  }
}
