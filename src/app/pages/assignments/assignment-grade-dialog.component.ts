import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AssignmentsService } from '../../services/assignments.service';
import type { Assignment, AssignmentSubmission, GradeAssignmentRequest } from '../../models';

@Component({
  selector: 'app-assignment-grade-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './assignment-grade-dialog.component.html',
  styleUrl: './assignment-grade-dialog.component.scss'
})
export class AssignmentGradeDialogComponent implements OnInit {
  displayedColumns = ['student', 'grade', 'remarks', 'visible', 'actions'];
  students: AssignmentSubmission[] = [];
  isLoading = false;
  savingStudentId: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public assignment: Assignment,
    private assignmentsService: AssignmentsService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AssignmentGradeDialogComponent>
  ) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  private loadStudents(): void {
    this.isLoading = true;
    this.assignmentsService.getAssignmentStudentsForGrading(this.assignment.id).subscribe({
      next: (students) => {
        this.students = students.map((student) => ({
          ...student,
          grade: student.grade ?? null,
          remarks: student.remarks ?? '',
          isVisibleToStudent: student.isVisibleToStudent ?? true
        }));
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  saveStudent(student: AssignmentSubmission): void {
    if (this.savingStudentId) {
      return;
    }

    const grade = student.grade;
    if (grade != null && (Number.isNaN(Number(grade)) || grade < 0 || grade > 100)) {
      this.snackBar.open('Grade must be between 0 and 100.', 'Close', { duration: 2500 });
      return;
    }

    const payload: GradeAssignmentRequest = {
      studentId: student.studentId,
      grade: grade == null ? undefined : Number(grade),
      remarks: (student.remarks ?? '').trim(),
      isVisibleToStudent: student.isVisibleToStudent !== false
    };

    this.savingStudentId = student.studentId;
    this.assignmentsService.gradeAssignment(this.assignment.id, payload).subscribe({
      next: () => {
        this.savingStudentId = null;
        this.snackBar.open(`Saved grade for ${student.studentName}.`, 'Close', { duration: 1800 });
      },
      error: () => {
        this.savingStudentId = null;
      }
    });
  }

  close(): void {
    this.dialogRef.close(true);
  }

  isSaving(studentId: string): boolean {
    return this.savingStudentId === studentId;
  }
}
