// services/modal.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  openModal(modalId: string) {
    const backdrop = document.getElementById('modal-backdrop');
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      // Remove any existing backdrop
      this.removeExistingBackdrop();
      
      // Show modal
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      modalElement.setAttribute('aria-modal', 'true');
      modalElement.removeAttribute('aria-hidden');
      
      // Add backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.id = 'modal-backdrop';
      document.body.appendChild(backdrop);
      document.body.classList.add('modal-open');
    }
    if (backdrop) {
    backdrop.addEventListener('click', () => this.closeModal(modalId));
  }
  }

  closeModal(modalId: string) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      modalElement.setAttribute('aria-hidden', 'true');
      modalElement.removeAttribute('aria-modal');
      
      this.removeExistingBackdrop();
    }
  }

  private removeExistingBackdrop() {
    const existingBackdrop = document.getElementById('modal-backdrop');
    if (existingBackdrop) {
      existingBackdrop.remove();
    }
    document.body.classList.remove('modal-open');
  }
}