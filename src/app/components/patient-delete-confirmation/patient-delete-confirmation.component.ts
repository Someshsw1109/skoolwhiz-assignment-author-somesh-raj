import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Patient } from '../../models/patient';
import { NotificationService } from '../../services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient-delete-confirmation',
  imports: [
    CommonModule
  ],
  templateUrl: './patient-delete-confirmation.component.html',
  styleUrl: './patient-delete-confirmation.component.scss',
})
export class PatientDeleteConfirmationComponent {
  @Input() patient: Patient | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private notificationService: NotificationService
  ) {}

  /**
   * Confirm patient deletion with validation
   */
  confirmDelete(): void {
    // Log the patient being deleted for debugging
    console.log('Confirming deletion of patient:', this.patient);
    
    if (this.patient && this.patient.id !== undefined && this.patient.id !== null) {
      console.log(`Confirming deletion of patient with ID: ${this.patient.id}`);
      this.activeModal.close(true); // This will trigger the action in the parent component
    } else {
      console.error('Cannot delete: Invalid patient ID', this.patient);
      this.notificationService.error('Cannot delete: Invalid patient record');
      this.activeModal.dismiss('Invalid patient ID');
    }
  }

  /**
   * Cancel deletion
   */
  cancel(): void {
    console.log('Deletion cancelled by user');
    this.activeModal.dismiss('cancel');
  }
}