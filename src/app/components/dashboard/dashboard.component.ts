import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AnnouncementService } from '../../services/announcement.service';
import { PostService } from '../../services/post.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('cardEnter', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(100, [
            animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('modalEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('0.2s ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: any = null;
  showEditModal = false;
  isPublic = true;
  profileForm: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadMessage = '';
  showPasswordFields = false;
  isSubmitting = false;
  announcements: any[] = [];
  posts: any[] = [];
  loadingInitial = true;
  filteredAnnouncements: any[] = [];
  categories = ['EVENTS', 'WORKSHOPS', 'PERFORMANCES'];
  selectedCategory = 'EVENTS';

  // ---------- Payment Modal ----------
  showPaymentModal = false;
  selectedAnnouncement: any = null;
  paymentDetails = {
    transaction_id: '',
    payment_date: '',
    payment_time: '',
    payment_type: ''
  };

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private fb: FormBuilder,
    private router: Router,
    private announcementService: AnnouncementService,
    private postService: PostService,
    private sanitizer: DomSanitizer
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      currentPassword: [''],
    newPassword: [''],
    confirmPassword: ['']
    });
  }

  ngOnInit() {
  this.authService.isInitialized$
    .pipe(
      filter(initialized => initialized === true),
      take(1),
      switchMap(() => this.authService.currentUser$),
      take(1)
    )
    .subscribe(user => {
      if (user) {
        this.user = user;
        this.isPublic = false;
      } else {
        this.user = null;
        this.isPublic = true;
      }

      // Now it's safe to load content – even if guest
      this.loadAnnouncements();
      this.loadPosts();
      this.loadingInitial = false;    // hide global loading overlay
    });
}

  loadAnnouncements() {
    this.announcementService.getAll().subscribe((data: any[]) => {
      this.announcements = data.map(ann => ({
        ...ann,
        fullImageUrl: this.getFullImageUrl(ann.image_storage || ann.media_url),
        safeVideoUrl: ann.media_type === 'VIDEO'
          ? this.sanitizeUrl(ann.media_url)
          : null,
      }));
      this.filterAnnouncements(this.selectedCategory);
    });
  }

  filterAnnouncements(category: string) {
    this.selectedCategory = category;
    this.filteredAnnouncements = this.announcements.filter(a => a.category === category);
  }
  togglePasswordChange() {
  this.showPasswordFields = !this.showPasswordFields;
  if (!this.showPasswordFields) {
    this.profileForm.patchValue({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  }
}

  loadPosts() {
    this.postService.getAll().subscribe((data: any[]) => {
      this.posts = data.map(post => ({
        ...post,
        safeVideoUrl: this.sanitizeUrl(post.video_url),
      }));
    });
  }

  // ---------- Registration (handles both free & paid) ----------
  registerForAnnouncement(annId: number) {
    if (!this.user) return;
    const ann = this.announcements.find(a => a.id === annId);
    if (!ann) return;

    if (ann.registration_type === 'PAID') {
      // Open payment modal instead of direct registration
      this.selectedAnnouncement = ann;
      this.paymentDetails = {
        transaction_id: '',
        payment_date: '',
        payment_time: '',
        payment_type: ''
      };
      this.showPaymentModal = true;
    } else {
      // Free registration
      this.doRegister(ann.id, {});
    }
  }

  closePaymentModal() {
    this.showPaymentModal = false;
    this.selectedAnnouncement = null;
  }

  closePaymentModalOnOverlay(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closePaymentModal();
    }
  }

  submitPaymentAndRegister() {
    const d = this.paymentDetails;
    if (!d.transaction_id || !d.payment_date || !d.payment_time || !d.payment_type) {
      alert('Please fill all payment details');
      return;
    }
    if (!this.selectedAnnouncement) return;

    this.doRegister(this.selectedAnnouncement.id, {
      transaction_id: d.transaction_id,
      payment_date: d.payment_date,
      payment_time: d.payment_time,
      payment_type: d.payment_type
    });
    this.showPaymentModal = false;
  }

  private doRegister(annId: number, paymentData: any) {
    this.announcementService.register(annId, paymentData).subscribe({
      next: () => {
        alert('Registered successfully!');
        this.loadAnnouncements(); // refresh registration flags
      },
      error: (err) => alert(err.error?.error || 'Registration failed')
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

  openEditProfileModal() {
    this.profileForm.patchValue({
      name: this.user.name,
      email: this.user.email,
      phone: this.user.phone || '',
      address: this.user.address || ''
    });
    this.previewUrl = null;
    this.selectedFile = null;
    this.uploadMessage = '';
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.previewUrl = null;
    this.selectedFile = null;
  }

  closeModalOnOverlay(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeEditModal();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result as string;
      reader.readAsDataURL(this.selectedFile);
      this.uploadMessage = '';
    }
  }

  uploadPhoto(): Promise<any> {
    if (!this.selectedFile) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      this.apiService.uploadProfilePhoto(this.selectedFile!)
        .pipe(take(1))
        .subscribe({
          next: (res) => {
            this.user.photo_url = res.photoUrl;
            this.uploadMessage = 'Photo uploaded!';
            resolve(res);
          },
          error: (err) => {
            this.uploadMessage = 'Upload failed';
            reject(err);
          }
        });
    });
  }

  deletePhoto() {
    if (confirm('Remove profile photo?')) {
      this.apiService.deleteProfilePhoto()
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.user.photo_url = null;
            this.previewUrl = null;
            this.uploadMessage = 'Photo removed';
            this.authService.refreshUserData().pipe(take(1)).subscribe();
          },
          error: (err) => console.error('Delete failed', err)
        });
    }
  }

  async updateProfile() {
    if (this.profileForm.invalid) return;
    this.isSubmitting = true;

    try {
      if (this.selectedFile) {
        await firstValueFrom(this.apiService.uploadProfilePhoto(this.selectedFile));
        const refreshed = await firstValueFrom(this.authService.refreshUserData());
        this.user = refreshed;
      }

      const profileData = this.profileForm.value;
      await firstValueFrom(this.apiService.updateUserProfile(profileData));
      if (this.showPasswordFields) {
      const currentPassword = this.profileForm.get('currentPassword')?.value;
      const newPassword = this.profileForm.get('newPassword')?.value;
      const confirmPassword = this.profileForm.get('confirmPassword')?.value;

      if (currentPassword && newPassword && confirmPassword) {
        if (newPassword !== confirmPassword) {
          alert('New passwords do not match');
          this.isSubmitting = false;
          return;
        }
        await firstValueFrom(this.apiService.changePassword({
          currentPassword,
          newPassword,
          confirmPassword
        }));
        alert('Password updated successfully');
        this.showPasswordFields = false;
      }
    }

      const refreshedUser = await firstValueFrom(this.authService.refreshUserData());
      this.user = refreshedUser;

      this.closeEditModal();
      alert('Profile updated successfully');
    } catch (err: any) {
      console.error(err);
      alert('Update failed: ' + (err.message || 'Unknown error'));
    } finally {
      this.isSubmitting = false;
    }
  }

  navigateToClass(danceClass: any) {
    const url = danceClass.link;
    if (!this.user) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/dashboard' } });
      return;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank');
    } else {
      this.router.navigate([url]);
    }
  }

  getFullImageUrl(relativePath: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return environment.apiBaseUrl + relativePath;
  }

  formatTime(time: string): string {
    return time ? time.substring(0, 5) : '';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}