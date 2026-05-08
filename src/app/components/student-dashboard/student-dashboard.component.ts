import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { AnnouncementService } from '../../services/announcement.service';
import { PostService } from '../../services/post.service';
import { forkJoin } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
  announcements: any[] = [];      // only registered announcements
  posts: any[] = [];
  loading = false;
  currentUser: any;
  historySearchTerm: string = '';
historyStatusFilter: string = 'ALL';
filteredAttendanceHistory: any[] = [];
  today: string|number|Date|null = new Date()
  upcomingPage = 1;
pageSize = 6;;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private announcementService: AnnouncementService,
    private postService: PostService,
    private sanitizer: DomSanitizer
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit() {
    this.loadStudentData();
  }

  loadStudentData() {
    this.loading = true;
    const studentId = this.currentUser?.student_data?.student_id;

    forkJoin({
      allClasses: this.apiService.getClasses(),
      upcoming: this.apiService.getUpcomingClasses(),
      attendance: studentId ? this.apiService.getStudentAttendance(studentId) : [],
      myAnnouncements: this.announcementService.getMyRegistrations(), // ✅ only registered
      posts: this.postService.getAll()
    }).subscribe({
      next: (results) => {
        this.allClasses = results.allClasses;
        this.upcomingClasses = results.upcoming;
        this.attendanceHistory = results.attendance;
        this.filteredAttendanceHistory = [...this.attendanceHistory];
        this.announcements = results.myAnnouncements;
        this.posts = results.posts;
        this.calculateSummary();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  calculateSummary() {
    this.attendanceSummary.totalClasses = this.allClasses.length;
    this.attendanceSummary.present = this.attendanceHistory.filter(r => r.is_present).length;
    this.attendanceSummary.absent = this.attendanceSummary.totalClasses - this.attendanceSummary.present;
  }
  applyHistoryFilters() {
  let result = this.attendanceHistory;

  // Filter by search term
  if (this.historySearchTerm?.trim()) {
    const term = this.historySearchTerm.trim().toLowerCase();
    result = result.filter(record => {
      const className = this.getClassName(record.class_id).toLowerCase();
      return className.includes(term);
    });
  }

  // Filter by status
  if (this.historyStatusFilter === 'PRESENT') {
    result = result.filter(record => record.is_present);
  } else if (this.historyStatusFilter === 'ABSENT') {
    result = result.filter(record => !record.is_present);
  }

  this.filteredAttendanceHistory = result;
  this.historyPage = 1;  // back to first page
}

resetHistoryFilters() {
  this.historySearchTerm = '';
  this.historyStatusFilter = 'ALL';
  this.filteredAttendanceHistory = [...this.attendanceHistory];
  this.historyPage = 1;
}

  getClassName(classId: number): string {
    const classItem = this.allClasses.find(c => c.id === classId);
    return classItem?.class_name || `Class #${classId}`;
  }

  formatTime(time: string): string {
    return time ? time.substring(0, 5) : '';
  }

  // Registration is not normally needed in student dashboard because they are already registered,
  // but if you want to allow registration from here (e.g., for new events), you can keep it.
registerForAnnouncement(id: number) {
  this.announcementService.register(id, {}).subscribe({
    next: () => {
      alert('Registered! Refresh to see it in your list.');
      this.loadStudentData();
    },
    error: (err) => alert('Error: ' + err.error?.error)
  });
}

  sanitizeUrl(url: string): SafeResourceUrl {
    let embedUrl = url;
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1].split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
get totalUpcomingPages(): number {
  return Math.ceil(this.upcomingClasses.length / this.pageSize);
}
get paginatedUpcoming(): any[] {
  const start = (this.upcomingPage - 1) * this.pageSize;
  return this.upcomingClasses.slice(start, start + this.pageSize);
}
prevUpcomingPage() { if (this.upcomingPage > 1) this.upcomingPage--; }
nextUpcomingPage() { if (this.upcomingPage < this.totalUpcomingPages) this.upcomingPage++; }

// Pagination for History
historyPage = 1;
get totalHistoryPages(): number {
  return Math.ceil(this.filteredAttendanceHistory.length / this.pageSize);
}
get paginatedHistory(): any[] {
  const start = (this.historyPage - 1) * this.pageSize;
  return this.filteredAttendanceHistory.slice(start, start + this.pageSize);
}
prevHistoryPage() { if (this.historyPage > 1) this.historyPage--; }
nextHistoryPage() { if (this.historyPage < this.totalHistoryPages) this.historyPage++; }


}