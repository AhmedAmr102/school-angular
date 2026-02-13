import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { DepartmentsService } from '../../services/departments.service';
import { CoursesService } from '../../services/courses.service';
import { UsersService } from '../../services/users.service';
import { ClassesService } from '../../services/classes.service';
import type { Class, Course, CreateClassRequest, Department, User } from '../../models';

@Component({
  selector: 'app-class-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule
  ],
  templateUrl: './class-dialog.component.html',
  styleUrl: './class-dialog.component.scss'
})
export class ClassDialogComponent {
  classForm: FormGroup;
  departments: Department[] = [];
  private manageableCourses: Course[] = [];
  private activeTeachers: User[] = [];
  isLoading = false;
  canCreateClass = true;
  createGuardMessage = '';
  readonly semesters = Array.from({ length: 8 }, (_, index) => index + 1);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private departmentsService: DepartmentsService,
    private coursesService: CoursesService,
    private usersService: UsersService,
    private classesService: ClassesService,
    private dialogRef: MatDialogRef<ClassDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Class | null
  ) {
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 4);

    this.classForm = this.fb.group({
      name: [data?.name ?? '', Validators.required],
      departmentId: [data?.departmentId ?? '', Validators.required],
      semester: [data?.semester ?? 1, [Validators.required, Validators.min(1), Validators.max(8)]],
      startDate: [this.formatDateForInput(data?.startDate) ?? this.formatDate(today), Validators.required],
      endDate: [this.formatDateForInput(data?.endDate) ?? this.formatDate(endDate), Validators.required],
      isActive: [data?.isActive ?? true]
    });

    this.classForm.get('departmentId')?.valueChanges.subscribe(() => this.updateCreateGuard());
    this.loadDependencies();
  }

  private loadDependencies(): void {
    this.isLoading = true;
    forkJoin({
      departments: this.departmentsService.getDepartments().pipe(catchError(() => of([] as Department[]))),
      courses: this.coursesService.getManageableCourses().pipe(catchError(() => of([] as Course[]))),
      teachers: this.usersService.getUsers('Teacher').pipe(catchError(() => of([] as User[])))
    }).subscribe({
      next: ({ departments, courses, teachers }) => {
        this.departments = departments.filter((department) => department.isActive);
        this.manageableCourses = courses;
        this.activeTeachers = teachers.filter((teacher) => teacher.isActive);

        const selectedDepartmentId = Number(this.classForm.value.departmentId);
        if (!selectedDepartmentId && this.departments.length > 0) {
          this.classForm.patchValue({ departmentId: this.departments[0].id });
        }

        this.updateCreateGuard();
        this.isLoading = false;
      },
      error: () => {
        this.updateCreateGuard();
        this.isLoading = false;
      }
    });
  }

  private updateCreateGuard(): void {
    if (this.isLoading) {
      this.canCreateClass = true;
      this.createGuardMessage = '';
      return;
    }

    if (this.data) {
      this.canCreateClass = true;
      this.createGuardMessage = '';
      return;
    }

    const selectedDepartmentId = Number(this.classForm.value.departmentId);
    if (!selectedDepartmentId) {
      this.canCreateClass = true;
      this.createGuardMessage = '';
      return;
    }

    const hasDepartmentSubject = this.manageableCourses.some((course) => course.departmentId === selectedDepartmentId);
    const hasAvailableTeacher = this.authService.hasRole('Teacher') || this.activeTeachers.length > 0;

    if (!hasDepartmentSubject) {
      this.canCreateClass = false;
      this.createGuardMessage = 'This stage has no subject yet. Create a subject for this department first.';
      return;
    }

    if (!hasAvailableTeacher) {
      this.canCreateClass = false;
      this.createGuardMessage = 'No active teacher account available. Activate or create a teacher first.';
      return;
    }

    this.canCreateClass = true;
    this.createGuardMessage = '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.classForm.invalid) {
      this.classForm.markAllAsTouched();
      return;
    }
    if (!this.canCreateClass) {
      return;
    }

    const existingStudentIds = (this.data?.students ?? []).map((student) => student.studentId);
    const payload: CreateClassRequest = {
      name: this.classForm.value.name,
      departmentId: Number(this.classForm.value.departmentId),
      semester: Number(this.classForm.value.semester),
      startDate: this.classForm.value.startDate,
      endDate: this.classForm.value.endDate,
      courseId: this.data?.courseId ?? null,
      teacherId: this.data?.teacherId ?? null,
      studentIds: existingStudentIds,
      isActive: !!this.classForm.value.isActive
    };

    this.isLoading = true;
    const request$ = this.data
      ? this.classesService.updateClass(this.data.id, payload)
      : this.classesService.createClass(payload);

    request$.subscribe({
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

  private formatDateForInput(value?: string): string | null {
    if (!value) {
      return null;
    }
    return value.length >= 10 ? value.slice(0, 10) : value;
  }
}
