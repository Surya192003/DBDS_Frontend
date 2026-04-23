import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  upcomingClasses: any[] = [];
  allClasses: any[] = [];
  attendanceHistory: any[] = [];
  attendanceSummary = { totalClasses: 0, present: 0, absent: 0 };
  loading = false;
  currentUser: any;
today: string|number|Date|null = new Date();

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit() {
    this.loadStudentData(); // ✅ Load everything at once
    console.log('currentUser:', this.authService.currentUser);
  }

  loadStudentData() {
    this.loading = true;

    // 1. Load all classes the student is enrolled in
    this.apiService.getClasses().subscribe({
      next: (data: any) => {
        this.allClasses = data;
        console.log('Student classes loaded:', this.allClasses.length);
      },
      error: (err) => console.error('Error loading classes:', err)
    });

    // 2. Load upcoming classes
    this.apiService.getUpcomingClasses().subscribe({
      next: (data: any) => {
        this.upcomingClasses = data;
        console.log('Upcoming classes:', this.upcomingClasses.length);
      },
      error: (err) => console.error('Error loading upcoming:', err)
    });

    // 3. Load attendance history – use correct student_id
    const studentId = this.currentUser?.student_data?.student_id; // ✅ Must be students.id
    if (studentId) {
      this.apiService.getStudentAttendance(studentId).subscribe({
        next: (data: any) => {
          this.attendanceHistory = data;
          this.calculateSummary();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading attendance:', err);
          this.loading = false;
        }
      });
    } else {
      console.error('No student_id found in currentUser');
      this.loading = false;
    }
  }

  calculateSummary() {
  this.attendanceSummary.totalClasses = this.allClasses.length;          // from enrolled classes, not attendanceHistory
  this.attendanceSummary.present = this.attendanceHistory.filter(r => r.is_present).length;
  this.attendanceSummary.absent = this.attendanceSummary.totalClasses - this.attendanceSummary.present;
}

  getClassName(classId: number): string {
    const classItem = this.allClasses.find(c => c.id === classId);
    return classItem?.class_name || `Class #${classId}`;
  }

  formatTime(time: string): string {
    return time ? time.substring(0, 5) : '';
  }
}