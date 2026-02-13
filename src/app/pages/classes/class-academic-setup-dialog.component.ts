import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CoursesService } from '../../services/courses.service';
import { UsersService } from '../../services/users.service';
import { ClassesService } from '../../services/classes.service';
import { AuthService } from '../../services/auth.service';
import type { Class, ClassSubjectSetupDraft, Course, User } from '../../models';

@Component({
  selector: 'app-class-academic-setup-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule
  ],
  templateUrl: './class-academic-setup-dialog.component.html',
  styleUrl: './class-academic-setup-dialog.component.scss'
})
export class ClassAcademicSetupDialogComponent {
  setupForm: FormGroup;
  courses: Course[] = [];
  teachers: User[] = [];
  isLoading = false;
  setupGuardMessage = '';

  constructor(
    private fb: FormBuilder,
    private coursesService: CoursesService,
    private usersService: UsersService,
    private classesService: ClassesService,
    private authService: AuthService,
    private dialogRef: MatDialogRef<ClassAcademicSetupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Class
  ) {
    this.setupForm = this.fb.group({
      offerings: this.fb.array([])
    });

    this.loadOptions();
  }

  get offerings(): FormArray<FormGroup> {
    return this.setupForm.get('offerings') as FormArray<FormGroup>;
  }

  get duplicateCourseWarning(): string {
    const selectedCourseIds = this.offerings.controls
      .map((offering) => Number(offering.value.courseId))
      .filter((courseId) => Number.isFinite(courseId) && courseId > 0);
    const uniqueSize = new Set(selectedCourseIds).size;
    return uniqueSize !== selectedCourseIds.length ? 'Each subject can only be added once per class.' : '';
  }

  addOffering(prefill?: ClassSubjectSetupDraft): void {
    const initialStudents = prefill?.studentIds ?? [];
    const defaultTeacherId = prefill?.teacherIds?.[0] ?? this.teachers[0]?.id ?? '';

    const group = this.fb.group({
      courseId: [prefill?.courseId ?? '', Validators.required],
      teacherIds: [prefill?.teacherIds ?? (defaultTeacherId ? [defaultTeacherId] : []), Validators.required],
      studentIds: [initialStudents]
    });

    this.offerings.push(group);
  }

  removeOffering(index: number): void {
    this.offerings.removeAt(index);
  }

  trackByIndex(index: number): number {
    return index;
  }

  private loadOptions(): void {
    this.isLoading = true;

    forkJoin({
      courses: this.coursesService.getManageableCourses().pipe(catchError(() => of([] as Course[]))),
      teachers: this.usersService.getUsers('Teacher').pipe(catchError(() => of([] as User[]))),
      existing: this.classesService.getClassSubjectSetupsForClass(this.data.id).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ courses, teachers, existing }) => {
        const currentUser = this.authService.getCurrentUser();
        const filteredByDepartment = this.data.departmentId
          ? courses.filter((course) => course.departmentId === this.data.departmentId)
          : courses;

        this.courses = filteredByDepartment;
        this.teachers = teachers.filter((teacher) => teacher.isActive);
        if (currentUser?.role === 'Teacher' && !this.teachers.some((teacher) => teacher.id === currentUser.id)) {
          this.teachers.unshift({
            ...currentUser,
            isActive: true
          });
        }

        this.offerings.clear();
        const existingDrafts: ClassSubjectSetupDraft[] = existing.map((item) => ({
          courseId: item.courseId,
          teacherIds: item.teacherIds,
          studentIds: item.studentIds
        }));
        const selectedCourseIds = new Set(existingDrafts.map((item) => item.courseId));
        const missingSelectedCourses = courses.filter(
          (course) => selectedCourseIds.has(course.id) && !this.courses.some((existingCourse) => existingCourse.id === course.id)
        );
        if (missingSelectedCourses.length > 0) {
          this.courses = [...missingSelectedCourses, ...this.courses];
        }

        if (existingDrafts.length > 0) {
          existingDrafts.forEach((item) => this.addOffering(item));
        } else {
          this.addOffering();
        }

        const noSubjects = this.courses.length === 0;
        const noTeachers = this.teachers.length === 0;
        if (noSubjects && noTeachers) {
          this.setupGuardMessage = 'No subjects for this stage and no active teachers found.';
        } else if (noSubjects) {
          this.setupGuardMessage = 'No subjects found for this stage. Create a subject first.';
        } else if (noTeachers) {
          this.setupGuardMessage = 'No active teachers found. Activate or create a teacher first.';
        } else {
          this.setupGuardMessage = '';
        }

        this.isLoading = false;
      },
      error: () => {
        this.setupGuardMessage = 'Failed to load academic setup options.';
        this.isLoading = false;
      }
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.setupForm.invalid) {
      this.setupForm.markAllAsTouched();
      return;
    }
    if (this.setupGuardMessage || this.duplicateCourseWarning) {
      return;
    }

    const payload: ClassSubjectSetupDraft[] = this.offerings.controls.map((offering) => ({
      courseId: Number(offering.value.courseId),
      teacherIds: offering.value.teacherIds ?? [],
      studentIds: offering.value.studentIds ?? []
    }));

    this.isLoading = true;
    this.classesService.saveClassSubjectSetups(this.data.id, payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
