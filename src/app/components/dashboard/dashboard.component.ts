import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AnnouncementService } from '../../services/announcement.service';
import { PostService } from '../../services/post.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import {environment} from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';


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
  isSubmitting = false;
  announcements: any[] = [];
  posts: any[] = [];
  loadingInitial = true;
  filteredAnnouncements: any[] = [];
  categories = ['EVENTS', 'WORKSHOPS', 'PERFORMANCES'];
  selectedCategory = 'EVENTS';
  private destroy$ = new Subject<void>();

  // Dance classes (same as before)
  danceClasses = [
    { name: 'BOLLYWOOD DANCE', description: 'Bollywood dance classes for all ages starting from 5 years', icon: '💃', link: 'https://www.dbds.ie/service-page/bollywood-dance-classes-kids?referral=service_list_widget' },
    { name: 'HIP HOP DANCE', description: 'Energetic Hip‑Hop classes for all levels', icon: '🕺', link: 'https://www.dbds.ie/service-page/hip-hop-dance-class?referral=service_list_widget' },
    { name: 'BHANGRA DANCE', description: 'Vibrant, colorful, energetic Punjabi folk dance', icon: '🥁', link: 'https://www.dbds.ie/service-page/hip-hop-dance-class?referral=service_list_widget' },
    { name: 'KATHAK DANCE', description: 'Classical Indian dance with graceful movements', icon: '✨', link: 'https://www.dbds.ie/booking-calendar/kathak-dance-class?referral=service_list_widget' },
    { name: 'BHARATANATYAM', description: 'Ancient classical dance form of South India', icon: '🪭', link: 'https://www.dbds.ie/booking-calendar/bharatanatyam-dance?referral=service_list_widget' },
    { name: 'BOLLYWOOD FITNESS', description: 'Fun fitness with Bollywood music', icon: '🏋️', link: 'https://www.dbds.ie/service-page/bollywood-fitness-class-adults-sword?referral=service_list_widget' },
    { name: 'CERTIFICATION COURSE', description: '1‑Year Certificate in Bollywood Dance & Music', icon: '📜', link: 'https://www.dbds.ie/service-page/certificate-in-bollywood-dance-and-music?referral=service_list_widget' },
    { name: 'KIDS BOLLYWOOD', description: 'Special classes for children 5+ years', icon: '🧒', link: 'https://www.dbds.ie/booking-calendar/bollywood-dance-classes-adults-in-dublin?referral=service_list_widget' }
  ];

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
      address: ['']
    });
  }

  ngOnInit() {
    
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.user = user;
          this.isPublic = false;
          this.loadAnnouncements();
          
        } else {
          this.user = null;
          this.isPublic = true;
        }
      });
    this.loadAnnouncements();
    this.loadPosts();
  }

  loadAnnouncements() {
    this.announcementService.getAll().subscribe(data => {
      this.announcements = data;
      this.filterAnnouncements(this.selectedCategory);
      this.loadingInitial = false;
    });
  }
  filterAnnouncements(category: string) {
    this.selectedCategory = category;
    this.filteredAnnouncements = this.announcements.filter(a => a.category === category);
  }

  loadPosts() {
    this.postService.getAll().subscribe(data => {
      this.posts = data;
      this.loadingInitial = false;
    });
  }

  registerForAnnouncement(id: number) {
    if (!this.user) return;
    this.announcementService.register(id).subscribe({
      next: () => {
        alert('Registration successful!');
        this.loadAnnouncements(); // refresh flags
      },
      error: (err) => alert(err.error?.error || 'Registration failed')
    });
  }
  sanitizeUrl(url: string): SafeResourceUrl {
    // YouTube embed conversion if needed
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
    // Upload photo if selected
    if (this.selectedFile) {
      await firstValueFrom(this.apiService.uploadProfilePhoto(this.selectedFile));
      // After upload, refresh user data to get updated photo_url
      const refreshed = await firstValueFrom(this.authService.refreshUserData());
      this.user = refreshed;
    }

    // Update profile data (name, email, phone, address)
    const profileData = this.profileForm.value;
    await firstValueFrom(this.apiService.updateUserProfile(profileData));

    // Refresh user data again to get latest changes
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

  comingSoon(feature: string) {
    alert(`${feature} — Coming Soon! 🚀`);
  }

  navigateToClass(danceClass: any) {
    const url = danceClass.link;
    // If user not logged in, redirect to login with return URL
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
  const base = environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/$/, '') : '';
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${base}${path}`;
}
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  toggleDarkLight() {
  document.body.classList.toggle('light-mode');
}
}