import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, forkJoin, takeUntil, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import type { User } from '../../models';

interface StatCard {
  title: string;
  value: string | number;
  description: string;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  color: string;
}

interface Activity {
  id: number;
  title: string;
  description: string;
  time: string;
  type: 'assignment' | 'grade' | 'class' | 'general';
}

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: User | null = null;
  currentTime = new Date();
  private destroy$ = new Subject<void>();
  private timeInterval: any;
  private statsRequestSubscription?: Subscription;
  statsLoading = false;

  stats: StatCard[] = [];

  activities: Activity[] = [
    { id: 1, title: 'New Assignment', description: 'Mathematics - Calculus II', time: '5 min ago', type: 'assignment' },
    { id: 2, title: 'Grade Published', description: 'Physics Mid-term Exam', time: '1 hour ago', type: 'grade' },
    { id: 3, title: 'Class Schedule', description: 'Computer Science 101 moved to Room 302', time: '2 hours ago', type: 'class' },
    { id: 4, title: 'System Update', description: 'New features available', time: '3 hours ago', type: 'general' },
  ];

  events: Event[] = [
    { id: 1, title: 'Staff Meeting', date: 'Today, 2:00 PM', location: 'Conference Room A' },
    { id: 2, title: 'Parent-Teacher Conference', date: 'Tomorrow, 9:00 AM', location: 'Main Hall' },
  ];

  constructor(
    public authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        this.updateStats();
      });

    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    this.statsRequestSubscription?.unsubscribe();
  }

  getGreeting(): string {
    const hour = this.currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  updateStats(): void {
    this.statsRequestSubscription?.unsubscribe();
    this.statsLoading = true;

    if (this.authService.hasRole('Admin')) {
      this.statsRequestSubscription = forkJoin({
        totalStudents: this.dashboardService.getAdminTotalStudents(),
        totalTeachers: this.dashboardService.getAdminTotalTeachers(),
        totalDepartments: this.dashboardService.getAdminTotalDepartments(),
        totalCourses: this.dashboardService.getAdminTotalCourses()
      }).subscribe({
        next: (stats) => {
          this.stats = [
            { title: 'Total Students', value: stats.totalStudents, description: 'Active student accounts', icon: 'people', color: 'blue' },
            { title: 'Total Teachers', value: stats.totalTeachers, description: 'Active teacher accounts', icon: 'school', color: 'green' },
            { title: 'Total Departments', value: stats.totalDepartments, description: 'Departments in the system', icon: 'business', color: 'orange' },
            { title: 'Total Courses', value: stats.totalCourses, description: 'Courses in the system', icon: 'menu_book', color: 'cyan' },
          ];
          this.statsLoading = false;
        },
        error: () => {
          this.statsLoading = false;
          this.stats = [];
        }
      });
      return;
    }

    if (this.authService.hasRole('Teacher')) {
      this.statsRequestSubscription = this.dashboardService.getTeacherDashboardStats().subscribe({
        next: (stats) => {
          this.stats = [
            { title: 'Assigned Courses', value: stats.totalAssignedCourses, description: 'Courses assigned to you', icon: 'menu_book', color: 'blue' },
            { title: 'Total Students', value: stats.totalStudents, description: 'Students in your courses', icon: 'people', color: 'green' },
            { title: 'Total Assignments', value: stats.totalAssignments, description: 'Assignments you created', icon: 'assignment', color: 'orange' }
          ];
          this.statsLoading = false;
        },
        error: () => {
          this.statsLoading = false;
          this.stats = [];
        }
      });
      return;
    }

    this.statsRequestSubscription = this.dashboardService.getStudentDashboardStats().subscribe({
      next: (stats) => {
        this.stats = [
          { title: 'Enrolled Courses', value: stats.totalEnrolledCourses, description: 'Courses you are enrolled in', icon: 'menu_book', color: 'blue' },
          { title: 'Enrolled Classes', value: stats.totalEnrolledClasses, description: 'Classes you attend', icon: 'class', color: 'orange' },
          { title: 'GPA', value: stats.gpa.toFixed(2), description: 'Current GPA from graded submissions', icon: 'grade', color: 'green' }
        ];
        this.statsLoading = false;
      },
      error: () => {
        this.statsLoading = false;
        this.stats = [];
      }
    });
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'assignment': return 'assignment';
      case 'grade': return 'grade';
      case 'class': return 'class';
      default: return 'info';
    }
  }

  viewAllActivity(): void {
    if (this.authService.hasRole('Admin')) {
      this.router.navigate(['/courses']);
      return;
    }
    this.router.navigate(['/assignments']);
  }

  goTo(route: string): void {
    this.router.navigate([route]);
  }
}
