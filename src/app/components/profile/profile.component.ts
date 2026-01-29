import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  profileForm: FormGroup;
  loading: boolean = false;
  updating: boolean = false;
  uploading: boolean = false;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.loading = true;
    this.apiService.getUserProfile().subscribe({
      next: (data: any) => {
        this.user = data;
        this.profileForm.patchValue({
          name: data.name,
          email: data.email
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.errorMessage = 'Failed to load profile';
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Only image files are allowed';
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'File size must be less than 5MB';
        return;
      }

      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadPhoto() {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file first';
      return;
    }

    this.uploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.uploadProfilePhoto(this.selectedFile).subscribe({
      next: (response: any) => {
        this.uploading = false;
        this.selectedFile = null;
        this.previewUrl = null;
        this.successMessage = response.message;
        
        // Update local user data
        if (response.user) {
          this.user = response.user;
        }
        
        // Update auth service
        this.authService.refreshUserData().subscribe();
      },
      error: (error) => {
        this.uploading = false;
        this.errorMessage = error.message || 'Failed to upload photo';
        console.error('Upload error:', error);
      }
    });
  }

  deletePhoto() {
    if (confirm('Are you sure you want to remove your profile photo?')) {
      this.apiService.deleteProfilePhoto().subscribe({
        next: (response: any) => {
          this.successMessage = response.message;
          this.user.photo_url = null;
          
          // Update auth service
          this.authService.refreshUserData().subscribe();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to delete photo';
          console.error('Delete photo error:', error);
        }
      });
    }
  }

  updateProfile() {
    if (this.profileForm.valid) {
      this.updating = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.apiService.updateUserProfile(this.profileForm.value).subscribe({
        next: (response: any) => {
          this.updating = false;
          this.successMessage = response.message;
          
          // Update local user data
          this.user.name = this.profileForm.value.name;
          this.user.email = this.profileForm.value.email;
          
          // Update auth service
          this.authService.refreshUserData().subscribe();
        },
        error: (error) => {
          this.updating = false;
          this.errorMessage = error.message || 'Failed to update profile';
          console.error('Update error:', error);
        }
      });
    }
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  getRoleBadgeClass() {
    switch (this.user?.role) {
      case 'ADMIN': return 'bg-danger';
      case 'INSTRUCTOR': return 'bg-primary';
      case 'STUDENT': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getRoleName() {
    switch (this.user?.role) {
      case 'ADMIN': return 'Administrator';
      case 'INSTRUCTOR': return 'Instructor';
      case 'STUDENT': return 'Student';
      default: return 'User';
    }
  }
}