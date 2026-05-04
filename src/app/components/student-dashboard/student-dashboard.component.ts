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
  today: string|number|Date|null = new Date();

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
    this.announcementService.register(id).subscribe({
      next: () => {
        alert('Registered! Refresh to see it in your list.');
        this.loadStudentData(); // reload to show newly registered announcement
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
}