# School Management System - Angular 17 Frontend

A modern, professional frontend for the School Management System built with Angular 17 and Angular Material.

## Features

- **Authentication**: Login and Registration with JWT token support
- **Role-Based Access Control**: Admin, Teacher, and Student roles
- **Modern UI**: Beautiful gradient design with Angular Material components
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Sidebar**: Professional dark-themed navigation

### Admin Features
- Manage Departments
- Manage Courses
- Manage Users
- View all Classes

### Teacher Features
- Manage Classes
- Create Assignments
- Mark Attendance
- View Student Progress

### Student Features
- View Classes
- Submit Assignments
- View Grades
- Track Attendance
- Receive Notifications

## Tech Stack

- **Angular 17**: Latest version with standalone components
- **Angular Material**: Modern UI component library
- **TypeScript**: Type-safe development
- **RxJS**: Reactive programming
- **SCSS**: Advanced styling

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   └── layout/          # Main layout with sidebar
│   ├── pages/
│   │   ├── login/           # Login page
│   │   ├── register/        # Registration page
│   │   ├── dashboard/       # Dashboard with stats
│   │   ├── departments/     # Department management
│   │   ├── courses/         # Course management
│   │   ├── classes/         # Class management
│   │   ├── users/           # User management
│   │   ├── assignments/     # Assignment management
│   │   ├── attendance/      # Attendance tracking
│   │   ├── grades/          # Grade viewing
│   │   ├── notifications/   # Notifications
│   │   └── calendar/        # Academic calendar
│   ├── services/
│   │   └── api.service.ts   # API service
│   ├── guards/
│   │   └── auth.guard.ts    # Authentication guard
│   ├── models/
│   │   └── index.ts         # TypeScript interfaces
│   ├── app.component.ts     # Root component
│   ├── app.config.ts        # App configuration
│   └── app.routes.ts        # Route definitions
├── assets/                  # Static assets
└── styles.scss             # Global styles
```

## API Integration

The frontend connects to the School Management API at `https://localhost:7058/api`

### Endpoints

#### Auth
- `POST /auth/Account/login` - User login
- `POST /auth/Account/Register` - User registration
- `POST /auth/Account/RefreshToken` - Refresh access token

#### Admin
- `GET /admin/Departments` - List departments
- `POST /admin/Departments` - Create department
- `PUT /admin/Departments/{id}` - Update department
- `DELETE /admin/Departments/{id}` - Delete department
- `GET /admin/Courses` - List courses
- `POST /admin/Courses` - Create course
- `PUT /admin/Courses/{id}` - Update course
- `DELETE /admin/Courses/{id}` - Delete course
- `GET /admin/Users` - List users

#### Teacher
- `GET /teacher/Classes` - List classes
- `POST /teacher/Classes` - Create class
- `PUT /teacher/Classes/{id}` - Update class
- `DELETE /teacher/Classes/{id}` - Delete class
- `GET /teacher/Assignments` - List assignments
- `POST /teacher/Assignments` - Create assignment
- `GET /teacher/Attendance/{classId}` - Get class attendance
- `POST /teacher/Attendance` - Mark attendance

### Class Setup Flow (Frontend/Backend Contract)

The frontend now uses a two-step class setup:

1. Create a class with basic data only (name, semester, dates, `departmentId`)
2. Configure academic setup later for that class:
   - one or more subjects inside the same class
   - one or more teachers per subject
   - subject-specific students (or all class students if not selected)

Class-subject detailed setup is stored in frontend local storage key:

- `school.classSubjectSetups.v1`

For backend compatibility, the first configured subject is synced as the class primary subject/teacher.

To support this flow, backend class APIs should allow:

- `departmentId` as a required class field
- `courseId` to be `null` when class is first created
- `teacherId` to be `null` when class is first created
- `studentIds` to be empty when class is first created

`PUT /management/Classes/{id}` should update academic setup without requiring a new class record.

#### Student
- `GET /student/Assignments` - Get student assignments
- `POST /student/Assignments/{id}/submit` - Submit assignment
- `GET /student/Assignments/grads` - Get grades
- `GET /student/Attendance` - Get attendance
- `GET /student/Notifications/stream` - Get notifications

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:4200`

### Build for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Configuration

### API Base URL

Update the API base URL in `src/app/services/api.service.ts`:

```typescript
private readonly API_BASE_URL = 'https://localhost:7058/api';
```

### Theme Colors

Customize the theme colors in `src/styles.scss`:

```scss
$primary-palette: (
  500: #2196f3,
  // ... other colors
);
```

## Screenshots

### Login Page
- Beautiful gradient background
- Modern card design
- Form validation

### Dashboard
- Role-based statistics cards
- Recent activity feed
- Upcoming events
- Quick actions

### Sidebar Navigation
- Dark theme
- Collapsible
- Role-based menu items
- User profile section

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@edumanage.com or open an issue on GitHub.
