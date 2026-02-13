import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { CoursesService } from '../../services/courses.service';
import { DepartmentsService } from '../../services/departments.service';
import type { Course, Department } from '../../models';

@Component({
    selector: 'app-course-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule
    ],
    templateUrl: './course-dialog.component.html',
    styleUrl: './course-dialog.component.scss'
})
export class CourseDialogComponent {
    courseForm: FormGroup;
    departments: Department[] = [];
    isLoading = false;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<CourseDialogComponent>,
        private coursesService: CoursesService,
        private departmentsService: DepartmentsService,
        @Inject(MAT_DIALOG_DATA) public data: Course | null
    ) {
        this.courseForm = this.fb.group({
            code: [data?.code || '', Validators.required],
            name: [data?.name || '', Validators.required],
            description: [data?.description || '', Validators.required],
            credits: [data?.credits || 3, [Validators.required, Validators.min(1)]],
            departmentId: [data?.departmentId || '', Validators.required]
        });
        this.loadDepartments();
    }

    loadDepartments(): void {
        this.departmentsService.getDepartments().subscribe(depts => {
            this.departments = depts.filter(d => d.isActive);
        });
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSubmit(): void {
        if (this.courseForm.valid) {
            this.isLoading = true;
            const request = this.courseForm.value;

            const obs = this.data
                ? this.coursesService.updateCourse(this.data.id, request)
                : this.coursesService.createCourse(request);

            obs.subscribe({
                next: () => this.dialogRef.close(true),
                error: () => this.isLoading = false
            });
        }
    }
}
