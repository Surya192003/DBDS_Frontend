import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import { AnnouncementService } from '../../services/announcement.service';
import { PostService } from '../../services/post.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-instructor-dashboard',
  templateUrl: './instructor-dashboard.component.html',
  styleUrls: ['./instructor-dashboard.component.css']
})
export class InstructorDashboardComponent implements OnInit, OnDestroy {
  [x: string]: any;
  classes: any[] = [];
  monthlyPerformance: any[] = [];
  activeStudents: any[] = [];
  classStudents: any[] = [];
  announcements: any[] = [];
  posts: any[] = [];
  registeredAnnouncements: any[] = [];
  selectedClass: any = null;
  songLink: string = '';
  currentUser: any;

  // Filters
  instructorFilter: string = '';
  groupFilter: string = '';
  filteredClasses: any[] = [];

  // Statistics
  totalClasses: number = 0;
  completedClasses: number = 0;
  upcomingClasses: number = 0;
  totalStudents: number = 0;
  attendanceRate: number = 0;

  // Attendance form
  attendanceForm: FormGroup = new FormGroup({});
  markingAttendance: boolean = false;
  loading: boolean = false;
  loadingStudents: boolean = false;
  Math = Math;
  announcementPage: number = 1;
  pageSize: number = 5;
  classPage: number = 1;
  classPageSize: number = 6;
  private subscriptions: Subscription[] = [];

  tagStatusMap: { [classId: number]: { tagged_in: boolean, tagged_out: boolean } } = {};

  // Base URL for uploaded images – adjust to your backend
  private baseImageUrl = 'https://your-backend.com';   // ← set your API domain

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private modalService: ModalService,
    private fb: FormBuilder,
    private announcementService: AnnouncementService,
    private postService: PostService,
    private sanitizer: DomSanitizer
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }


  loadDashboardData() {
    this.loadClasses();
    this.loadMonthlyPerformance();
    this.loadActiveStudents();
    this.loadAnnouncementsAndPosts();
    this.loadMyRegisteredEvents();
  }

  loadAnnouncementsAndPosts() {
    forkJoin({
      announcements: this.announcementService.getAll(),
      posts: this.postService.getAll()
    }).subscribe({
      next: (res) => {
        // Pre‑sanitize video URLs and build full image paths
        this.announcements = res.announcements.map((ann: any) => ({
          ...ann,
          safeVideoUrl: ann.media_type === 'VIDEO' ? this.sanitizeUrl(ann.media_url) : null,
          fullImageUrl: this.getFullImageUrl(ann.image_storage)
        }));
        this.posts = res.posts.map((post: any) => ({
          ...post,
          safeVideoUrl: this.sanitizeUrl(post.video_url)

        }));
        this.announcementPage = 1
      },
      error: (err) => console.error(err)
    });
  }

  loadMyRegisteredEvents() {
    this.announcementService.getMyRegistrations().subscribe({
      next: (data) => {
        this.registeredAnnouncements = data.map((reg: any) => ({
          ...reg,
          safeVideoUrl: reg.media_type === 'VIDEO' ? this.sanitizeUrl(reg.media_url) : null,
          fullImageUrl: this.getFullImageUrl(reg.image_storage)
        }));
      },
      error: (err) => console.error('Error loading my registrations', err)
    });
  }

  registerForAnnouncement(id: number) {
    this.announcementService.register(id).subscribe({
      next: () => {
        alert('Registered successfully!');
        this.loadAnnouncementsAndPosts();
        this.loadMyRegisteredEvents();
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

  // Build full image URL for uploaded files
  getFullImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${this.baseImageUrl}${path}`;
  }

  // ---------- Filters ----------
  get uniqueInstructors(): string[] {
    return [...new Set(this.classes.map(c => c.instructor_name).filter(Boolean))].sort();
  }

  get uniqueGroups(): string[] {
    return [...new Set(this.classes.map(c => c.group_name).filter(Boolean))].sort();
  }

  applyClassFilters() {
    let result = this.classes;
    if (this.instructorFilter) {
      result = result.filter(c => c.instructor_name === this.instructorFilter);
    }
    if (this.groupFilter) {
      result = result.filter(c => c.group_name === this.groupFilter);
    }
    this.filteredClasses = result;
    this.classPage = 1;
  }

  resetClassFilters() {
    this.instructorFilter = '';
    this.groupFilter = '';
    this.filteredClasses = [...this.classes];
    this.classPage = 1;
  }


  // ---------- Classes ----------
  loadClasses() {
    this.loading = true;
    const sub = this.apiService.getClasses().subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.classes = data;
          this.filteredClasses = [...this.classes];
        } else if (data?.rows && Array.isArray(data.rows)) {
          this.classes = data.rows;
          this.filteredClasses = [...this.classes];
        } else if (data?.data && Array.isArray(data.data)) {
          this.classes = data.data;
          this.filteredClasses = [...this.classes];
        } else {
          this.classes = [];
          this.filteredClasses = [];
        }
        this.classes.forEach(cls => this.loadTagStatus(cls.id));
        this.calculateStatistics();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.classes = [];
        this.filteredClasses = [];
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  calculateStatistics() {
    this.totalClasses = this.classes.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.completedClasses = this.classes.filter(c => {
      const d = new Date(c.class_date);
      d.setHours(0, 0, 0, 0);
      return d < today;
    }).length;

    this.upcomingClasses = this.classes.filter(c => {
      const d = new Date(c.class_date);
      d.setHours(0, 0, 0, 0);
      return d >= today;
    }).length;
  }

  // ---------- Monthly performance ----------
  loadMonthlyPerformance() {
    if (!this.currentUser?.instructor_id) return;
    const sub = this.apiService.getInstructorMonthlyPerformance(this.currentUser.instructor_id).subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) this.monthlyPerformance = data;
        else if (data?.rows) this.monthlyPerformance = data.rows;
        else this.monthlyPerformance = [];
      },
      error: (err) => {
        console.error('Monthly performance error:', err);
        this.monthlyPerformance = [];
      }
    });
    this.subscriptions.push(sub);
  }

  loadActiveStudents() {
    const sub = this.apiService.getActiveStudents().subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) this.activeStudents = data;
        else if (data?.rows) this.activeStudents = data.rows;
        else this.activeStudents = [];
        this.totalStudents = this.activeStudents.length;
      },
      error: (err) => {
        console.error('Active students error:', err);
        this.activeStudents = [];
        this.totalStudents = 0;
      }
    });
    this.subscriptions.push(sub);
  }

  // ---------- Attendance ----------
  loadClassStudents(classId: number) {
    this.loadingStudents = true;
    const sub = this.apiService.getClassStudents(classId).subscribe({
      next: (data: any) => {
        let students = [];
        if (Array.isArray(data)) students = data;
        else if (data?.rows) students = data.rows;
        else if (data?.data) students = data.data;
        else if (data?.students) students = data.students;

        this.classStudents = students.map((s: any) => ({
          student_id: s.student_id ?? s.id ?? 0,
          name: s.name || s.student_name,
          student_name: s.name || s.student_name,
          email: s.email,
          is_present: s.is_present ?? s.present_status ?? false
        }));
        this.prepareAttendanceForm();
        this.loadingStudents = false;
      },
      error: (err) => {
        console.error('Error loading class students:', err);
        this.classStudents = [];
        this.loadingStudents = false;
      }
    });
    this.subscriptions.push(sub);
  }

  prepareAttendanceForm() {
    const group: any = {};
    this.classStudents.forEach(student => {
      if (student.student_id) {
        group[`student_${student.student_id}`] = new FormControl(!!student.is_present);
      }
    });
    this.attendanceForm = new FormGroup(group);
  }

  getAttendanceControl(studentId: number): FormControl {
    const key = `student_${studentId}`;
    if (this.attendanceForm && this.attendanceForm.contains(key)) {
      return this.attendanceForm.get(key) as FormControl;
    }
    const fallback = new FormControl(false);
    fallback.disable();
    return fallback;
  }

  openAttendanceModal(classItem: any) {
    if (!classItem?.id) return;
    this.selectedClass = classItem;
    this.classStudents = [];
    this.attendanceForm = new FormGroup({});
    this.loadingStudents = true;
    this.modalService.openModal('attendanceModal');
    this.loadClassStudents(classItem.id);
  }

  submitAttendance() {
    if (!this.selectedClass || !this.selectedClass.id) return;
    if (this.classStudents.length === 0) return;
    this.markingAttendance = true;

    const attendanceRecords = this.classStudents.map(student => ({
      student_id: student.student_id,
      is_present: this.getAttendanceControl(student.student_id)?.value || false
    }));

    const attendanceData = {
      class_id: this.selectedClass.id,
      attendance_data: attendanceRecords
    };

    const sub = this.apiService.markBulkAttendance(attendanceData).subscribe({
      next: () => {
        this.markingAttendance = false;
        this.modalService.closeModal('attendanceModal');
        this.loadClasses();
        alert('Attendance marked successfully!');
      },
      error: (err) => {
        console.error('Attendance error:', err);
        this.markingAttendance = false;
        alert('Failed to mark attendance');
      }
    });
    this.subscriptions.push(sub);
  }

  closeAttendanceModal() {
    this.modalService.closeModal('attendanceModal');
  }

  // ---------- Song ----------
  openSongModal(classItem: any) {
    if (!classItem?.id) return;
    this.selectedClass = classItem;
    this.songLink = classItem.song_link || '';
    this.modalService.openModal('songModal');
  }

  updateSongLink() {
    if (!this.selectedClass?.id) return;
    if (!this.songLink?.trim()) return;
    this.loading = true;
    const sub = this.apiService.updateSongLink(this.selectedClass.id, this.songLink).subscribe({
      next: () => {
        this.loadClasses();
        this.modalService.closeModal('songModal');
        alert('Song link updated!');
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        alert('Update failed');
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  closeSongModal() {
    this.modalService.closeModal('songModal');
  }

  // ---------- Tag ----------
  loadTagStatus(classId: number) {
    this.apiService.getTagStatus(classId).subscribe({
      next: (status) => this.tagStatusMap[classId] = status,
      error: (err) => console.error('Tag status error', err)
    });
  }

  tagIn(classId: number) {
    this.apiService.tagIn(classId).subscribe({
      next: () => {
        this.loadTagStatus(classId);
        alert('Tagged in successfully');
      },
      error: (err) => alert(err.error?.message || 'Tag in failed')
    });
  }

  tagOut(classId: number) {
    this.apiService.tagOut(classId).subscribe({
      next: () => {
        this.loadTagStatus(classId);
        alert('Tagged out successfully');
      },
      error: (err) => alert(err.error?.message || 'Tag out failed')
    });
  }

  // ---------- Helpers ----------
  getStatusClass(date: string): string {
    const classDate = new Date(date);
    classDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (classDate < today) return 'completed';
    if (classDate.getTime() === today.getTime()) return 'today';
    return 'upcoming';
  }

  getStatusText(date: string): string {
    const status = this.getStatusClass(date);
    if (status === 'completed') return 'COMPLETED';
    if (status === 'today') return 'ACTIVE_TODAY';
    return 'UPCOMING';
  }

  isStudentPresent(studentId: number): boolean {
    const control = this.getAttendanceControl(studentId);
    return control ? control.value : false;
  }

  get upcomingAnnouncements(): any[] {
    return this.announcements.filter(ann => {
      if (!ann.event_date) return true;                // no date → keep visible
      const eventDate = new Date(ann.event_date);
      eventDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    });
  }
  get paginatedUpcomingAnnouncements(): any[] {
    const start = (this.announcementPage - 1) * this.pageSize;
    return this.upcomingAnnouncements.slice(start, start + this.pageSize);
  }

  get totalUpcomingPages(): number {
    return Math.ceil(this.upcomingAnnouncements.length / this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalUpcomingPages) {
      this.announcementPage = page;
    }
  }

  nextPage() {
    if (this.announcementPage < this.totalUpcomingPages) {
      this.announcementPage++;
    }
  }

  prevPage() {
    if (this.announcementPage > 1) {
      this.announcementPage--;
    }
  }

  // Check if event is past (for registered announcements)
  isEventPast(eventDate: string): boolean {
    if (!eventDate) return false;
    const d = new Date(eventDate);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }

  // Current‑month classes (filtered + sorted)
  get currentMonthClasses(): any[] {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // zero‑based
    return this.filteredClasses.filter(c => {
      const d = new Date(c.class_date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }

  // Sorted: ACTIVE_TODAY → UPCOMING → COMPLETED
  get sortedCurrentMonthClasses(): any[] {
    const sorted = [...this.currentMonthClasses];
    sorted.sort((a, b) => {
      const order: { [key: string]: number } = { 'today': 0, 'upcoming': 1, 'completed': 2 };
      const statusA = this.getStatusClass(a.class_date);
      const statusB = this.getStatusClass(b.class_date);
      return (order[statusA] ?? 0) - (order[statusB] ?? 0);
    });
    return sorted;
  }

  get totalClassPages(): number {
    return Math.ceil(this.sortedCurrentMonthClasses.length / this.classPageSize);
  }

  get paginatedClassesForDisplay(): any[] {
    const start = (this.classPage - 1) * this.classPageSize;
    return this.sortedCurrentMonthClasses.slice(start, start + this.classPageSize);
  }

  // Page navigation
  goToClassPage(page: number) {
    if (page >= 1 && page <= this.totalClassPages) {
      this.classPage = page;
    }
  }

  nextClassPage() {
    if (this.classPage < this.totalClassPages) {
      this.classPage++;
    }
  }

  prevClassPage() {
    if (this.classPage > 1) {
      this.classPage--;
    }
  }

  // Reset page when filters change


}