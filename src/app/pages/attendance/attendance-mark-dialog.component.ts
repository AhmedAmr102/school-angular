import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AttendanceService } from '../../services/attendance.service';
import type { AttendanceStatus, Class, CreateAttendanceRequest } from '../../models';

@Component({
  selector: 'app-attendance-mark-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './attendance-mark-dialog.component.html',
  styleUrl: './attendance-mark-dialog.component.scss'
})
export class AttendanceMarkDialogComponent {
  attendanceForm: FormGroup;
  isLoading = false;
  readonly statuses: { label: string; value: number }[] = [
    { label: 'Present', value: 0 },
    { label: 'Absent', value: 1 },
    { label: 'Late', value: 2 }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public classItem: Class,
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AttendanceMarkDialogComponent>
  ) {
    this.attendanceForm = this.fb.group({
      studentId: ['', Validators.required],
      status: [0, Validators.required]
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.attendanceForm.invalid) {
      this.attendanceForm.markAllAsTouched();
      return;
    }

    const payload: CreateAttendanceRequest = {
      classId: this.classItem.id,
      studentId: this.attendanceForm.value.studentId,
      status: Number(this.attendanceForm.value.status) as AttendanceStatus
    };

    this.isLoading = true;
    this.attendanceService.createAttendance(payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to mark attendance.', 'Close', { duration: 2500 });
      }
    });
  }
}
