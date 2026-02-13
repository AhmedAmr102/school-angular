import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ClassesService } from '../../services/classes.service';
import { UsersService } from '../../services/users.service';
import type { Class, ClassSubjectSetup, User } from '../../models';

@Component({
  selector: 'app-class-student-enrollment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './class-student-enrollment-dialog.component.html',
  styleUrl: './class-student-enrollment-dialog.component.scss'
})
export class ClassStudentEnrollmentDialogComponent {
  form: FormGroup;
  setups: ClassSubjectSetup[] = [];
  students: User[] = [];
  isLoading = false;
  guardMessage = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public classItem: Class,
    private fb: FormBuilder,
    private classesService: ClassesService,
    private usersService: UsersService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<ClassStudentEnrollmentDialogComponent>
  ) {
    this.form = this.fb.group({
      studentId: ['', Validators.required],
      courseIds: [[]]
    });

    this.form.get('studentId')?.valueChanges.subscribe((studentId) => {
      this.syncCoursesForStudent(studentId);
    });

    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;

    forkJoin({
      setups: this.classesService.getClassSubjectSetupsForClass(this.classItem.id).pipe(catchError(() => of([] as ClassSubjectSetup[]))),
      students: this.usersService.getUsers('Student').pipe(catchError(() => of([] as User[])))
    }).subscribe({
      next: ({ setups, students }) => {
        this.setups = setups;
        this.students = students.filter((student) => student.isActive);

        if (this.setups.length === 0) {
          this.guardMessage = 'No subjects found for this class. Configure class subjects first.';
        } else if (this.students.length === 0) {
          this.guardMessage = 'No active students found. Activate or create student accounts first.';
        } else {
          this.guardMessage = '';
          this.form.patchValue({ studentId: this.students[0].id });
          this.syncCoursesForStudent(this.students[0].id);
        }

        this.isLoading = false;
      },
      error: () => {
        this.guardMessage = 'Failed to load student enrollment data.';
        this.isLoading = false;
      }
    });
  }

  private syncCoursesForStudent(studentId: string): void {
    if (!studentId) {
      this.form.patchValue({ courseIds: [] }, { emitEvent: false });
      return;
    }

    const enrolledCourses = this.setups
      .filter((setup) => setup.studentIds.includes(studentId))
      .map((setup) => setup.courseId);

    this.form.patchValue({ courseIds: enrolledCourses }, { emitEvent: false });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const studentId = this.form.value.studentId as string;
    const courseIds = (this.form.value.courseIds as number[]).map((courseId) => Number(courseId));

    this.isLoading = true;
    this.classesService.updateStudentEnrollmentInClass(this.classItem.id, studentId, courseIds).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to save student enrollment.', 'Close', { duration: 2500 });
      }
    });
  }
}
