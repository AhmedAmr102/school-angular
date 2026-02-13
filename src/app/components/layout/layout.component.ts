import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import type { User } from '../../models';

interface NavItem {
  title: string;
  route: string;
  icon: string;
  roles: string[];
}

interface SearchConfig {
  placeholder: string;
  enabled: boolean;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit, OnDestroy {
  user: User | null = null;
  isCollapsed = false;
  searchText = '';
  searchPlaceholder = 'Search is not available on this page';
  searchEnabled = false;
  private currentPath = '';
  private destroy$ = new Subject<void>();

  navItems: NavItem[] = [
    { title: 'Dashboard', route: '/', icon: 'dashboard', roles: ['Admin', 'Teacher', 'Student'] },
    { title: 'Users', route: '/users', icon: 'group', roles: ['Admin'] },
    { title: 'Create Accounts', route: '/register', icon: 'person_add', roles: ['Admin'] },
    { title: 'Departments', route: '/departments', icon: 'business', roles: ['Admin'] },
    { title: 'Courses', route: '/courses', icon: 'menu_book', roles: ['Admin'] },
    { title: 'Classes', route: '/classes', icon: 'school', roles: ['Admin', 'Teacher', 'Student'] },
    { title: 'Assignments', route: '/assignments', icon: 'assignment', roles: ['Admin', 'Teacher', 'Student'] },
    { title: 'Attendance', route: '/attendance', icon: 'check_circle', roles: ['Admin', 'Teacher', 'Student'] },
    { title: 'Grades', route: '/grades', icon: 'grade', roles: ['Student'] },
    { title: 'Notifications', route: '/notifications', icon: 'notifications', roles: ['Student'] },
    { title: 'Calendar', route: '/calendar', icon: 'calendar_today', roles: ['Admin', 'Teacher', 'Student'] },
  ];

  private readonly searchConfigByPath: Record<string, SearchConfig> = {
    users: { enabled: true, placeholder: 'Search teachers/students by ID, username, name, or email' },
    classes: { enabled: true, placeholder: 'Search class, stage, subject, teacher, or student count' },
    courses: { enabled: true, placeholder: 'Search subject code, name, teachers, or class coverage' },
    departments: { enabled: true, placeholder: 'Search department, description, or head name' },
    assignments: { enabled: true, placeholder: 'Search assignments by title, class, or due date' }
  };

  get filteredNavItems(): NavItem[] {
    return this.navItems.filter(item => item.roles.some(role => this.authService.hasRole(role)));
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
      });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.updateSearchContext());

    this.updateSearchContext();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  logout(): void {
    this.authService.logout();
  }

  onSearchSubmit(): void {
    if (!this.searchEnabled) {
      return;
    }

    const targetRoute = this.getLeafRoute(this.route);
    const query = this.searchText.trim();
    this.router.navigate([], {
      relativeTo: targetRoute,
      queryParams: { q: query || null },
      queryParamsHandling: 'merge'
    });
  }

  clearSearch(): void {
    this.searchText = '';
    this.onSearchSubmit();
  }

  private updateSearchContext(): void {
    const leaf = this.getLeafRoute(this.route);
    const path = leaf.snapshot.routeConfig?.path ?? '';
    this.currentPath = path;

    const config = this.searchConfigByPath[path];
    this.searchEnabled = !!config?.enabled;
    this.searchPlaceholder = config?.placeholder ?? 'Search is not available on this page';
    this.searchText = leaf.snapshot.queryParamMap.get('q') ?? '';
  }

  private getLeafRoute(route: ActivatedRoute): ActivatedRoute {
    let current = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }
}
