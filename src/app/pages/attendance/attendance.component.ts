import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ThemePalette } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AttendanceService } from '../../services/attendance.service';
import { ClassesService } from '../../services/classes.service';
import { AuthService } from '../../services/auth.service';
import { Attendance, AttendanceStatus, Class } from '../../models';
import { AttendanceMarkDialogComponent } from './attendance-mark-dialog.component';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatChipsModule, MatSelectModule, MatFormFieldModule, MatSnackBarModule, MatDialogModule],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.scss'
})
export class AttendanceComponent implements OnInit {
  attendance: Attendance[] = [];
  classes: Class[] = [];
  selectedClassId: number | null = null;
  displayedColumns = ['date', 'class', 'student', 'status'];

  constructor(
    public authService: AuthService,
    private attendanceService: AttendanceService,
    private classesService: ClassesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    if (this.authService.hasRole('Teacher') || this.authService.hasRole('Admin')) {
      this.loadClasses();
    } else {
      this.loadAttendance();
    }
  }

  loadClasses(): void {
    this.classesService.getClasses().subscribe({
      next: (classes) => {
        this.classes = classes;
        if (classes.length > 0) {
          this.selectedClassId = classes[0].id;
          this.loadAttendance();
        }
      },
      error: () => this.snackBar.open('Failed to load classes', 'Close', { duration: 3000 })
    });
  }

  onClassChange(classId: number): void {
    this.selectedClassId = classId;
    this.loadAttendance();
  }

  loadAttendance(): void {
    if (this.authService.hasRole('Teacher') && this.selectedClassId === null) return;

    const observable = this.authService.hasRole('Teacher')
      ? this.attendanceService.getClassAttendance(this.selectedClassId!)
      : this.attendanceService.getStudentAttendance();

    observable.subscribe({
      next: (attendance) => this.attendance = attendance,
      error: () => this.snackBar.open('Failed to load attendance', 'Close', { duration: 3000 })
    });
  }

  openMarkAttendance(): void {
    if (this.selectedClassId === null) {
      this.snackBar.open('Select a class first.', 'Close', { duration: 2500 });
      return;
    }

    const classItem = this.classes.find((item) => item.id === this.selectedClassId);
    if (!classItem) {
      this.snackBar.open('Class not found.', 'Close', { duration: 2500 });
      return;
    }

    const dialogRef = this.dialog.open(AttendanceMarkDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: classItem
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Attendance saved successfully.', 'Close', { duration: 2200 });
        this.loadAttendance();
      }
    });
  }

  getStatusLabel(status: AttendanceStatus): string {
    return AttendanceStatus[status] || 'Unknown';
  }

  getStatusColor(status: AttendanceStatus): ThemePalette {
    switch (status) {
      case AttendanceStatus.Present: return 'primary';
      case AttendanceStatus.Late: return 'accent';
      default: return 'warn';
    }
  }
}
