import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatGridListModule, MatBadgeModule, MatTooltipModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements OnInit {
  currentDate = new Date();
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarDays: any[] = [];
  upcomingEvents = [
    { title: 'Mid-term Exams', date: new Date(2024, 2, 15), color: '#ef4444' },
    { title: 'Parent Meeting', date: new Date(2024, 2, 20), color: '#3b82f6' },
    { title: 'Science Fair', date: new Date(2024, 2, 25), color: '#10b981' },
  ];
  ngOnInit(): void { this.generateCalendar(); }
  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    this.calendarDays = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      this.calendarDays.push({ date: daysInPrevMonth - i, isOtherMonth: true, isToday: false, events: [] });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
      const events = this.getEventsForDay(i, month, year);
      this.calendarDays.push({ date: i, isOtherMonth: false, isToday, events });
    }
    const remainingCells = 42 - this.calendarDays.length;
    for (let i = 1; i <= remainingCells; i++) {
      this.calendarDays.push({ date: i, isOtherMonth: true, isToday: false, events: [] });
    }
  }
  getEventsForDay(day: number, month: number, year: number): any[] {
    return this.upcomingEvents.filter(e => e.date.getDate() === day && e.date.getMonth() === month && e.date.getFullYear() === year);
  }
  previousMonth(): void { this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1); this.generateCalendar(); }
  nextMonth(): void { this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1); this.generateCalendar(); }
}
