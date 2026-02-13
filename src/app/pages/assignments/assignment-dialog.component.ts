import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ClassesService } from '../../services/classes.service';
import { AssignmentsService } from '../../services/assignments.service';
import type { Assignment, Class, CreateAssignmentRequest } from '../../models';

@Component({
  selector: 'app-assignment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './assignment-dialog.component.html',
  styleUrl: './assignment-dialog.component.scss'
})
export class AssignmentDialogComponent {
  assignmentForm: FormGroup;
  classes: Class[] = [];
  assignableClasses: Class[] = [];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private classesService: ClassesService,
    private assignmentsService: AssignmentsService,
    private dialogRef: MatDialogRef<AssignmentDialogComponent>
  ) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    this.assignmentForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      dueDate: [this.formatDate(dueDate), Validators.required],
      classId: ['', Validators.required]
    });

    this.loadClasses();
  }

  private loadClasses(): void {
    this.classesService.getClasses().subscribe({
      next: (classes) => {
        this.classes = classes;
        this.assignableClasses = classes.filter((classItem) => !!classItem.courseId);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.assignmentForm.invalid) {
      this.assignmentForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const payload: CreateAssignmentRequest = {
      title: this.assignmentForm.value.title,
      description: this.assignmentForm.value.description || '',
      dueDate: this.assignmentForm.value.dueDate,
      classId: Number(this.assignmentForm.value.classId)
    };

    this.assignmentsService.createAssignment(payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
