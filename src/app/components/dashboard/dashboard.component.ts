import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: any = null;
  showEditModal = false;
  profileForm: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadMessage = '';
  isSubmitting = false;
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
    private router: Router
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
        if (!user) {
          this.router.navigate(['/login']);
          return;
        }
        this.user = user;
      });
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

  updateProfile() {
    if (this.profileForm.invalid) return;
    this.isSubmitting = true;

    const photoPromise = this.selectedFile ? this.uploadPhoto() : Promise.resolve(null);
    photoPromise.then(() => {
      const profileData = this.profileForm.value;
      this.apiService.updateUserProfile(profileData)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            this.user = { ...this.user, ...profileData };
            this.authService.refreshUserData().pipe(take(1)).subscribe();
            this.closeEditModal();
            alert('Profile updated successfully');
          },
          error: (err) => {
            this.isSubmitting = false;
            alert('Update failed: ' + err.message);
          }
        });
    }).catch(() => this.isSubmitting = false);
  }

  comingSoon(feature: string) {
    alert(`${feature} — Coming Soon! 🚀`);
  }

  navigateToClass(danceClass: any) {
  const url = danceClass.link;
  
  // Check if it's an external URL (starts with http:// or https://)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Open external link in a new tab
    window.open(url, '_blank');
  } else {
    // Internal Angular route
    this.router.navigate([url]);
  }
}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}