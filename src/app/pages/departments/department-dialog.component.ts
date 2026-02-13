import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { DepartmentsService } from '../../services/departments.service';
import { UsersService } from '../../services/users.service';
import type { Department, User } from '../../models';

@Component({
    selector: 'app-department-dialog',
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
    templateUrl: './department-dialog.component.html',
    styleUrl: './department-dialog.component.scss'
})
export class DepartmentDialogComponent {
    deptForm: FormGroup;
    teachers: User[] = [];
    isLoading = false;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<DepartmentDialogComponent>,
        private departmentsService: DepartmentsService,
        private usersService: UsersService,
        @Inject(MAT_DIALOG_DATA) public data: Department | null
    ) {
        this.deptForm = this.fb.group({
            name: [data?.name || '', Validators.required],
            description: [data?.description || '', Validators.required],
            headDepartmentId: [data?.headDepartmentId || '']
        });
        this.loadTeachers();
    }

    loadTeachers(): void {
        this.usersService.getUsers('Teacher').subscribe(users => {
            const activeTeachers = users.filter(u => u.isActive);
            const selectedHeadId = this.deptForm.value.headDepartmentId;
            const selectedHead = users.find((user) => user.id === selectedHeadId);
            if (selectedHead && !activeTeachers.some((user) => user.id === selectedHead.id)) {
                this.teachers = [selectedHead, ...activeTeachers];
            } else {
                this.teachers = activeTeachers;
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSubmit(): void {
        if (this.deptForm.valid) {
            this.isLoading = true;
            const request = this.deptForm.value;

            const obs = this.data
                ? this.departmentsService.updateDepartment(this.data.id, request)
                : this.departmentsService.createDepartment(request);

            obs.subscribe({
                next: () => this.dialogRef.close(true),
                error: () => this.isLoading = false
            });
        }
    }
}
