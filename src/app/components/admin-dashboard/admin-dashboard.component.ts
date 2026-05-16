import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

import { ApiService } from '../../services/api.service';
import { ModalService } from '../../services/modal.service';
import { AuthService } from 'src/app/services/auth.service';
import { AnnouncementService } from '../../services/announcement.service';
import { PostService } from '../../services/post.service';

// ----------------------------------------------------------------------
// Animations (used in template)
// ----------------------------------------------------------------------
export const dashboardAnimations = [
  trigger('fadeIn', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('600ms ease-out', style({ opacity: 1 }))
    ])
  ]),
  trigger('slideUp', [
    transition(':enter', [
      style({ transform: 'translateY(20px)', opacity: 0 }),
      animate('500ms cubic-bezier(0.2, 0.9, 0.4, 1)',
        style({ transform: 'translateY(0)', opacity: 1 }))
    ])
  ]),
  trigger('fadeInUp', [
    transition(':enter', [
      style({ transform: 'translateY(12px)', opacity: 0 }),
      animate('400ms ease-out',
        style({ transform: 'translateY(0)', opacity: 1 }))
    ])
  ]),
  trigger('staggerList', [
    transition('* => *', [
      query(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        stagger('70ms', [
          animate('350ms ease-out',
            style({ opacity: 1, transform: 'translateY(0)' }))
        ])
      ], { optional: true })
    ])
  ])
];

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  animations: [dashboardAnimations]
})
export class AdminDashboardComponent implements OnInit {
  // --------------------------------------------------------------------
  // User & state
  // --------------------------------------------------------------------
  currentUser: any = null;
  loading = false;
  errorMessage = '';
  successMessage = '';

  // --------------------------------------------------------------------
  // Data arrays
  // --------------------------------------------------------------------
  users: any[] = [];
  filteredUsers: any[] = [];
  classes: any[] = [];
  filteredClasses: any[] = [];
  payments: any[] = [];
  studentStats: any[] = [];
  filteredStudentStats: any[] = [];
  instructorStats: any[] = [];
  activeInstructors: any[] = [];
  groups: any[] = [];
  announcements: any[] = [];
  posts: any[] = [];
  activeStudents: any[] = [];

  // --------------------------------------------------------------------
  // Selected items (modals)
  // --------------------------------------------------------------------
  selectedInstructor: any = null;
  selectedClass: any = null;
  selectedStudent: any = null;
  selectedAnnouncement: any = null;
  registrations: any[] = [];

  // --------------------------------------------------------------------
  // Forms
  // --------------------------------------------------------------------
  classForm: FormGroup;
  payRateForm: FormGroup;
  announcementForm: FormGroup;
  postForm: FormGroup;

  editingAnnouncementId: number | null = null;
  editingPostId: number | null = null;
  selectedFile: File | null = null;

  // --------------------------------------------------------------------
  // Filters & search
  // --------------------------------------------------------------------
  userSearchTerm = '';
  studentSearchTerm = '';
  instructorFilter = '';
  groupFilter = '';

  // --------------------------------------------------------------------
  // Payment & month
  // --------------------------------------------------------------------
  selectedMonth: string = new Date().toISOString().slice(0, 7);

  // --------------------------------------------------------------------
  // Pagination
  // --------------------------------------------------------------------
  pageSize = 6;
  classPage = 1;
  userPage = 1;
  studentPage = 1;
  instructorPage = 1;
  paymentPage = 1;
  announcementPage = 1;
  postPage = 1;

  // --------------------------------------------------------------------
  // Loading flags
  // --------------------------------------------------------------------
  loadingdata = true;
  loadingGroups = false;
  loadingClasses = false;
  loadingPayments = false;
  calculatingPayments = false;
  creatingClass = false;
  markingAttendance = false;
  loadingStudents = false;
  assigningStudent = false;

  // --------------------------------------------------------------------
  // Academic year (example – implement API calls accordingly)
  // --------------------------------------------------------------------
  academicYear = { start: '', end: '' };

  // --------------------------------------------------------------------
  // Helper: today's date for HTML
  // --------------------------------------------------------------------
  today: string = new Date().toISOString().split('T')[0];

  // --------------------------------------------------------------------
  // Constructor
  // --------------------------------------------------------------------
  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private fb: FormBuilder,
    public modalService: ModalService,
    private announcementService: AnnouncementService,
    private postService: PostService,
    private sanitizer: DomSanitizer
  ) {
    this.currentUser = this.authService.currentUser;

    // Class form
    this.classForm = this.fb.group({
      class_name: ['', Validators.required],
      class_date: ['', Validators.required],
      class_time: ['', Validators.required],
      instructor_id: [''],
      group_id: ['', Validators.required]
    });

    // Pay rate form
    this.payRateForm = this.fb.group({
      payRate: [0, [Validators.required, Validators.min(0)]]
    });

    // Announcement form
    this.announcementForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['EVENTS', Validators.required],
      media_type: ['IMAGE', Validators.required],
      media_url: [''],
      registration_enabled: [false],
      registration_type: ['FREE'],
      price: [0],
      event_date: [''],
      event_start_time: ['']
    });

    // Post form
    this.postForm = this.fb.group({
      title: [''],
      description: [''],
      video_url: ['', Validators.required],
      thumbnail_url: ['']
    });
  }

  // --------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------
  ngOnInit(): void {
    this.loadAllData();
    this.loadActiveStudents();
    this.loadGroups();
    this.loadAnnouncements();
    this.loadPosts();
    this.loadSettings();
    this.loadingdata = false;
  }

  // --------------------------------------------------------------------
  // Data loading – main
  // --------------------------------------------------------------------
  loadAllData(): void {
    this.loadUsers();
    this.loadClasses();
    this.loadPayments();
    this.loadStudentStats();
    this.loadInstructorStats();
    this.loadActiveInstructors();
  }

  loadUsers(): void {
    this.apiService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = [...data];
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load users: ' + err.message;
      }
    });
  }

  loadClasses(): void {
    this.loadingClasses = true;
    this.apiService.getAllClassesForAdmin().subscribe({
      next: (data) => {
        this.classes = data;
        this.filteredClasses = [...this.classes];
        this.loadingClasses = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load classes: ' + err.message;
        this.loadingClasses = false;
      }
    });
  }

  loadPayments(): void {
    this.loadingPayments = true;
    this.apiService.getMonthlyPayments(this.selectedMonth).subscribe({
      next: (data) => {
        this.payments = data;
        this.loadingPayments = false;
      },
      error: (err) => {
        console.error(err);
        this.loadingPayments = false;
      }
    });
  }

  loadStudentStats(): void {
    this.apiService.getStudentStats().subscribe({
      next: (data) => {
        this.studentStats = data;
        this.filteredStudentStats = [...data];
      },
      error: (err) => console.error(err)
    });
  }

  loadInstructorStats(): void {
    this.apiService.getInstructorTagSummary().subscribe({
      next: (data) => {
        this.instructorStats = data;
      },
      error: (err) => {
        console.error(err);
        this.instructorStats = [];
      }
    });
  }

  loadActiveInstructors(): void {
    this.apiService.getUsers().subscribe({
      next: (data) => {
        const instructors = data.filter((u: any) => u.role === 'INSTRUCTOR' && u.is_active);
        this.activeInstructors = instructors
          .filter((i: any) => i.instructor_id)
          .map((i: any) => ({
            instructor_id: i.instructor_id,
            user_id: i.id,
            name: i.name,
            email: i.email,
            pay_per_class: i.pay_per_class || 30
          }));
        if (this.activeInstructors.length === 0 && instructors.length > 0) {
          this.errorMessage = 'Instructors found but missing instructor records.';
        }
      },
      error: (err) => {
        console.error(err);
        this.activeInstructors = [];
      }
    });
  }

  loadGroups(): void {
    this.loadingGroups = true;
    this.apiService.getGroups().subscribe({
      next: (data) => {
        this.groups = data;
        this.loadingGroups = false;
      },
      error: (err) => {
        console.error(err);
        this.loadingGroups = false;
      }
    });
  }

  loadActiveStudents(): void {
    this.loadingStudents = true;
    this.apiService.getActiveStudents().subscribe({
      next: (data) => {
        if (data && data.length) this.activeStudents = data;
        else this.loadStudentsFromUsersList();
        this.loadingStudents = false;
      },
      error: () => {
        this.loadStudentsFromUsersList();
        this.loadingStudents = false;
      }
    });
  }

  loadStudentsFromUsersList(): void {
    this.apiService.getUsers().subscribe({
      next: (data) => {
        const studentUsers = data.filter((u: any) => u.role === 'STUDENT' && u.is_active && u.student_id);
        this.activeStudents = studentUsers.map((s: any) => ({
          student_id: s.student_id,
          user_id: s.id,
          name: s.name,
          email: s.email
        }));
      },
      error: (err) => console.error(err)
    });
  }

  // --------------------------------------------------------------------
  // Announcements & Posts
  // --------------------------------------------------------------------
  loadAnnouncements(): void {
    this.announcementService.getAll().subscribe(data => this.announcements = data);
  }

  loadPosts(): void {
    this.postService.getAll().subscribe(data => {
      this.posts = data.map((post: any) => ({
        ...post,
        safeVideoUrl: this.sanitizeUrl(post.video_url)
      }));
    });
  }

  openAnnouncementModal(announcement?: any): void {
    if (announcement) {
      this.editingAnnouncementId = announcement.id;
      this.announcementForm.patchValue(announcement);
    } else {
      this.editingAnnouncementId = null;
      this.announcementForm.reset({
        category: 'EVENTS',
        media_type: 'IMAGE',
        registration_enabled: false,
        registration_type: 'FREE',
        price: 0,
        event_date: '',
        event_start_time: ''
      });
    }
    this.selectedFile = null;
    this.modalService.openModal('announcementModal');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) this.selectedFile = input.files[0];
  }

  saveAnnouncement(): void {
    if (this.announcementForm.invalid) return;
    const formData = new FormData();
    Object.keys(this.announcementForm.value).forEach(key => {
      const val = this.announcementForm.value[key];
      if (val !== undefined && val !== null) formData.append(key, val);
    });
    if (this.selectedFile) formData.append('image', this.selectedFile);

    const request = this.editingAnnouncementId
      ? this.announcementService.update(this.editingAnnouncementId, formData)
      : this.announcementService.create(formData);
    request.subscribe({
      next: () => {
        this.loadAnnouncements();
        this.modalService.closeModal('announcementModal');
        alert('Announcement saved');
      },
      error: (err) => alert('Error: ' + err.error?.error)
    });
  }

  deleteAnnouncement(id: number): void {
    if (confirm('Delete this announcement?')) {
      this.announcementService.delete(id).subscribe(() => this.loadAnnouncements());
    }
  }

  viewRegistrations(ann: any): void {
    this.selectedAnnouncement = ann;
    this.announcementService.getRegistrations(ann.id).subscribe(regs => {
      this.registrations = regs;
      this.modalService.openModal('registrationsModal');
    });
  }

  closeRegistrationsModal(): void {
    this.modalService.closeModal('registrationsModal');
  }

  markRegistrationPaid(regId: number): void {
    // You must implement this method in your AnnouncementService
    this.announcementService.markRegistrationPaid(regId).subscribe(() => {
      this.viewRegistrations(this.selectedAnnouncement);
    });
  }

  openPostModal(post?: any): void {
    if (post) {
      this.editingPostId = post.id;
      this.postForm.patchValue(post);
    } else {
      this.editingPostId = null;
      this.postForm.reset();
    }
    this.modalService.openModal('postModal');
  }

  savePost(): void {
    if (this.postForm.invalid) return;
    const formValue = this.postForm.value;
    const request = this.editingPostId
      ? this.postService.update(this.editingPostId, formValue)
      : this.postService.create(formValue);
    request.subscribe({
      next: () => {
        this.loadPosts();
        this.modalService.closeModal('postModal');
        alert('Post saved');
      },
      error: (err) => alert('Error: ' + err.error?.error)
    });
  }

  deletePost(id: number): void {
    if (confirm('Delete this post?')) {
      this.postService.delete(id).subscribe(() => this.loadPosts());
    }
  }

  // --------------------------------------------------------------------
  // Class management
  // --------------------------------------------------------------------
  openCreateClassModal(): void {
    this.classForm.reset();
    this.modalService.openModal('createClassModal');
  }

  closeCreateClassModal(): void {
    this.modalService.closeModal('createClassModal');
  }

  createClass(): void {
    if (this.classForm.invalid) return;
    this.creatingClass = true;
    this.classForm.disable();

    this.apiService.createClass(this.classForm.value).subscribe({
      next: () => {
        this.creatingClass = false;
        this.classForm.enable();
        this.classForm.reset();
        this.loadClasses();
        this.closeCreateClassModal();
        this.successMessage = 'Class created successfully!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.creatingClass = false;
        this.classForm.enable();
        console.error(err);
        this.errorMessage = 'Failed to create class: ' + err.message;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  deleteClass(classId: number): void {
    if (confirm('Delete this class and all attendance records?')) {
      this.apiService.deleteClass(classId).subscribe({
        next: () => {
          this.loadClasses();
          this.successMessage = 'Class deleted!';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Failed to delete class: ' + err.message;
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    }
  }

  assignStudentToClass(): void {
    if (!this.selectedClass || !this.selectedStudent) return;
    this.assigningStudent = true;
    this.apiService.assignStudentToClass(this.selectedClass.id, this.selectedStudent.student_id).subscribe({
      next: () => {
        this.assigningStudent = false;
        this.modalService.closeModal('assignStudentModal');
        this.loadClasses();
        alert('Student assigned!');
      },
      error: (err) => {
        this.assigningStudent = false;
        console.error(err);
        alert('Failed: ' + err.message);
      }
    });
  }

  openAssignStudentModal(classItem: any): void {
    this.selectedClass = classItem;
    this.selectedStudent = null;
    this.loadActiveStudents();
    this.modalService.openModal('assignStudentModal');
  }

  // --------------------------------------------------------------------
  // User management
  // --------------------------------------------------------------------
  toggleUserStatus(userId: number): void {
    this.apiService.toggleUserStatus(userId).subscribe({
      next: () => {
        this.loadUsers();
        this.successMessage = 'User status updated!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to update user status';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  deleteUser(userId: number): void {
    if (confirm('Delete this user? All associated data will be removed.')) {
      this.apiService.deleteUser(userId).subscribe({
        next: (res) => {
          this.successMessage = `User "${res.deletedUser.name}" deleted`;
          setTimeout(() => this.successMessage = '', 5000);
          this.loadUsers();
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Failed to delete user';
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    }
  }

  openPayRateModal(user: any): void {
    this.selectedInstructor = user;
    this.payRateForm.patchValue({ payRate: user.pay_per_class || 30 });
    this.modalService.openModal('payRateModal');
  }

  closePayRateModal(): void {
    this.modalService.closeModal('payRateModal');
  }

  updatePayRate(): void {
    if (!this.payRateForm.valid || !this.selectedInstructor) return;
    const payRate = this.payRateForm.value.payRate;
    this.apiService.updatePayRate(this.selectedInstructor.instructor_id, payRate).subscribe({
      next: () => {
        this.loadUsers();
        this.closePayRateModal();
        this.successMessage = 'Pay rate updated!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to update pay rate';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // --------------------------------------------------------------------
  // Payment management
  // --------------------------------------------------------------------
  calculatePayments(): void {
    this.calculatingPayments = true;
    this.apiService.calculateMonthlyPayments(this.selectedMonth).subscribe({
      next: () => {
        this.calculatingPayments = false;
        this.loadPayments();
        this.successMessage = 'Payments calculated!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.calculatingPayments = false;
        console.error(err);
        this.errorMessage = 'Calculation failed';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  markAsPaid(paymentId: number): void {
    this.apiService.markPaymentAsPaid(paymentId).subscribe({
      next: () => {
        this.loadPayments();
        this.successMessage = 'Payment marked as paid';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to update payment';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // --------------------------------------------------------------------
  // Filters & search
  // --------------------------------------------------------------------
  filterUsers(): void {
    if (!this.userSearchTerm) {
      this.filteredUsers = [...this.users];
      this.userPage = 1;
      return;
    }
    const term = this.userSearchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(u =>
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
    this.userPage = 1;
  }

  filterStudents(): void {
    if (!this.studentSearchTerm) {
      this.filteredStudentStats = [...this.studentStats];
      this.studentPage = 1;
      return;
    }
    const term = this.studentSearchTerm.toLowerCase();
    this.filteredStudentStats = this.studentStats.filter(s =>
      s.student_name?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term)
    );
    this.studentPage = 1;
  }

  applyClassFilters(): void {
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

  resetClassFilters(): void {
    this.instructorFilter = '';
    this.groupFilter = '';
    this.filteredClasses = [...this.classes];
    this.classPage = 1;
  }

  // --------------------------------------------------------------------
  // Academic Year (optional – implement if needed)
  // --------------------------------------------------------------------
  loadSettings(): void {
    this.apiService.getSettings().subscribe((settings: any) => {
      this.academicYear.start = settings.academic_year_start || '';
      this.academicYear.end = settings.academic_year_end || '';
    });
  }

  saveAcademicYear(): void {
    this.apiService.updateSettings({
      academic_year_start: this.academicYear.start,
      academic_year_end: this.academicYear.end
    }).subscribe(() => {
      alert('Academic year updated!');
    });
  }

  // --------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------
  getAttendancePercentage(stat: any): number {
    if (!stat.total_classes) return 0;
    return Math.round((stat.attended_classes / stat.total_classes) * 100);
  }

  getMissedClasses(stat: any): number {
    return (stat.total_classes || 0) - (stat.attended_classes || 0);
  }

  getTotalClasses(): number {
    return this.filteredStudentStats.reduce((sum, s) => sum + (s.total_classes || 0), 0);
  }

  getTotalAttended(): number {
    return this.filteredStudentStats.reduce((sum, s) => sum + (s.attended_classes || 0), 0);
  }

  getTotalMissed(): number {
    return this.getTotalClasses() - this.getTotalAttended();
  }

  getOverallAttendancePercentage(): number {
    const total = this.getTotalClasses();
    return total ? Math.round((this.getTotalAttended() / total) * 100) : 0;
  }

  getTotalPayments(): number {
    return this.payments.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  }

  get uniqueInstructors(): string[] {
    const names = this.classes.map(c => c.instructor_name).filter((n, i, arr) => n && arr.indexOf(n) === i);
    return names.sort();
  }

  get uniqueGroups(): string[] {
    const groups = this.classes.map(c => c.group_name).filter((g, i, arr) => g && arr.indexOf(g) === i);
    return groups.sort();
  }

  sanitizeUrl(url: string): SafeResourceUrl {
    let embedUrl = url;
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  trackById(index: number, item: any): number {
    return item.id;
  }

  clearError(): void { this.errorMessage = ''; }
  clearSuccess(): void { this.successMessage = ''; }

  // --------------------------------------------------------------------
  // Pagination getters (used in template)
  // --------------------------------------------------------------------
  get totalClassPages(): number {
    return Math.ceil(this.filteredClasses.length / this.pageSize);
  }
  get paginatedClasses(): any[] {
    const start = (this.classPage - 1) * this.pageSize;
    return this.filteredClasses.slice(start, start + this.pageSize);
  }
  prevClassPage(): void { if (this.classPage > 1) this.classPage--; }
  nextClassPage(): void { if (this.classPage < this.totalClassPages) this.classPage++; }
  goToClassPage(p: number): void { if (p >= 1 && p <= this.totalClassPages) this.classPage = p; }

  get totalUserPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize);
  }
  get paginatedUsers(): any[] {
    const start = (this.userPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }
  prevUserPage(): void { if (this.userPage > 1) this.userPage--; }
  nextUserPage(): void { if (this.userPage < this.totalUserPages) this.userPage++; }

  get totalStudentPages(): number {
    return Math.ceil(this.filteredStudentStats.length / this.pageSize);
  }
  get paginatedStudentStats(): any[] {
    const start = (this.studentPage - 1) * this.pageSize;
    return this.filteredStudentStats.slice(start, start + this.pageSize);
  }
  prevStudentPage(): void { if (this.studentPage > 1) this.studentPage--; }
  nextStudentPage(): void { if (this.studentPage < this.totalStudentPages) this.studentPage++; }

  get totalInstructorPages(): number {
    return Math.ceil(this.instructorStats.length / this.pageSize);
  }
  get paginatedInstructorStats(): any[] {
    const start = (this.instructorPage - 1) * this.pageSize;
    return this.instructorStats.slice(start, start + this.pageSize);
  }
  prevInstructorPage(): void { if (this.instructorPage > 1) this.instructorPage--; }
  nextInstructorPage(): void { if (this.instructorPage < this.totalInstructorPages) this.instructorPage++; }

  get totalPaymentPages(): number {
    return Math.ceil(this.payments.length / this.pageSize);
  }
  get paginatedPayments(): any[] {
    const start = (this.paymentPage - 1) * this.pageSize;
    return this.payments.slice(start, start + this.pageSize);
  }
  prevPaymentPage(): void { if (this.paymentPage > 1) this.paymentPage--; }
  nextPaymentPage(): void { if (this.paymentPage < this.totalPaymentPages) this.paymentPage++; }

  get totalAnnouncementPages(): number {
    return Math.ceil(this.announcements.length / this.pageSize);
  }
  get paginatedAnnouncements(): any[] {
    const start = (this.announcementPage - 1) * this.pageSize;
    return this.announcements.slice(start, start + this.pageSize);
  }
  prevAnnouncementPage(): void { if (this.announcementPage > 1) this.announcementPage--; }
  nextAnnouncementPage(): void { if (this.announcementPage < this.totalAnnouncementPages) this.announcementPage++; }

  get totalPostPages(): number {
    return Math.ceil(this.posts.length / this.pageSize);
  }
  get paginatedPosts(): any[] {
    const start = (this.postPage - 1) * this.pageSize;
    return this.posts.slice(start, start + this.pageSize);
  }
  prevPostPage(): void { if (this.postPage > 1) this.postPage--; }
  nextPostPage(): void { if (this.postPage < this.totalPostPages) this.postPage++; }
}