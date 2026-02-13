import { Routes } from '@angular/router';
import { AuthGuard, PublicGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [PublicGuard]
  },
  {
    path: '',
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
        canActivate: [AuthGuard],
        data: { roles: ['Admin'] }
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent),
        canActivate: [AuthGuard],
        data: { roles: ['Admin'] }
      },
      {
        path: 'departments',
        loadComponent: () => import('./pages/departments/departments.component').then(m => m.DepartmentsComponent),
        canActivate: [AuthGuard],
        data: { roles: ['Admin'] }
      },
      {
        path: 'courses',
        loadComponent: () => import('./pages/courses/courses.component').then(m => m.CoursesComponent),
        canActivate: [AuthGuard],
        data: { roles: ['Admin'] }
      },
      {
        path: 'classes',
        loadComponent: () => import('./pages/classes/classes.component').then(m => m.ClassesComponent),
        canActivate: [AuthGuard],
        data: { roles: ['Admin', 'Teacher', 'Student'] }
      },
      {
        path: 'assignments',
        loadComponent: () => import('./pages/assignments/assignments.component').then(m => m.AssignmentsComponent),
        canActivate: [AuthGuard],
        data: { roles: ['Admin', 'Teacher', 'Student'] }
      },
      {
        path: 'attendance',
        loadComponent: () => import('./pages/attendance/attendance.component').then(m => m.AttendanceComponent),
        canActivate: [AuthGuard],
        data: { roles: ['Admin', 'Teacher', 'Student'] }
      },
      {
        path: 'grades',
        loadComponent: () => import('./pages/grades/grades.component').then(m => m.GradesComponent),
        canActivate: [AuthGuard],
        data: { roles: ['Student'] }
      },
      {
        path: 'notifications',
        loadComponent: () => import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent),
        canActivate: [AuthGuard],
        data: { roles: ['Student'] }
      },
      {
        path: 'calendar',
        loadComponent: () => import('./pages/calendar/calendar.component').then(m => m.CalendarComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [AuthGuard]
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
