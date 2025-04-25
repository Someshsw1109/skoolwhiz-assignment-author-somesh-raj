import { Component, OnInit } from '@angular/core';
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../models/patient';
import { NotificationService } from '../../services/notification.service';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PatientDetailsComponent } from '../patient-details/patient-details.component';
import { PatientDeleteConfirmationComponent } from '../patient-delete-confirmation/patient-delete-confirmation.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule] // Add these imports for standalone component
})
export class PatientListComponent implements OnInit {
  patients: Patient[] = [];
  loading = false;
  selectedBloodGroup = 'All Blood Groups';
  searchQuery = '';
  bloodGroups = ['All Blood Groups', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  constructor(
    private patientService: PatientService, 
    private notificationService: NotificationService,
    private router: Router,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  // Add missing methods that are referenced in the HTML
  openAddPatientModal(): void {
    this.addPatient();
  }

  onSearchChange(): void {
    this.searchPatients();
  }

  exportToCSV(): void {
    this.exportData();
  }

  loadPatients(): void {
    this.loading = true;
    this.patientService.getAllPatients().subscribe({
      next: (data) => {
        this.patients = data;
        console.log('Loaded patients:', this.patients);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading patients:', error);
        this.notificationService.error('Failed to load patients');
        this.loading = false;
      }
    });
  }

  searchPatients(): void {
    if (!this.searchQuery.trim()) {
      this.loadPatients();
      return;
    }

    this.loading = true;
    this.patientService.searchPatients(this.searchQuery).subscribe({
      next: (data) => {
        this.patients = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching patients:', error);
        this.notificationService.error('Failed to search patients');
        this.loading = false;
      }
    });
  }

  filterByBloodGroup(): void {
    this.loading = true;
    if (this.selectedBloodGroup === 'All Blood Groups') {
      this.loadPatients();
      return;
    }

    this.patientService.filterPatientsByBloodGroup(this.selectedBloodGroup).subscribe({
      next: (data) => {
        this.patients = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error filtering patients:', error);
        this.notificationService.error('Failed to filter patients');
        this.loading = false;
      }
    });
  }

  addPatient(): void {
    this.router.navigate(['/patient/add']);
  }

  viewPatientDetails(patient: Patient): void {
    console.log('Viewing patient details:', patient);
    
    // First verify the patient exists
    if (!patient || !patient.id) {
      this.notificationService.error('Invalid patient record');
      return;
    }
    
    this.patientService.getPatientById(patient.id).subscribe({
      next: (fetchedPatient) => {
        // Patient exists, show details
        const modalRef = this.modalService.open(PatientDetailsComponent, { size: 'lg' });
        modalRef.componentInstance.patient = fetchedPatient;
      },
      error: (error) => {
        console.error('Error: Patient not found', error);
        this.notificationService.error('This patient record no longer exists. Please refresh the list.');
        // Refresh the list to remove outdated entries
        this.loadPatients();
      }
    });
  }

  editPatient(patient: Patient): void {
    console.log('Editing patient:', patient);
    
    // First verify the patient exists
    if (!patient || !patient.id) {
      this.notificationService.error('Invalid patient record');
      return;
    }
    
    this.patientService.getPatientById(patient.id).subscribe({
      next: (fetchedPatient) => {
        // Patient exists, proceed with edit
        this.router.navigate(['/patient/edit', patient.id]);
      },
      error: (error) => {
        console.error('Error: Patient not found', error);
        this.notificationService.error('This patient record no longer exists. Please refresh the list.');
        // Refresh the list to remove outdated entries
        this.loadPatients();
      }
    });
  }

  deletePatient(patient: Patient): void {
    console.log('Deleting patient:', patient);
    
    // First verify the patient exists
    if (!patient || !patient.id) {
      this.notificationService.error('Invalid patient record');
      return;
    }
    
    this.patientService.getPatientById(patient.id).subscribe({
      next: () => {
        // Patient exists, confirm deletion
        const modalRef = this.modalService.open(PatientDeleteConfirmationComponent);
        modalRef.componentInstance.patient = patient;
        
        modalRef.result.then(
          (result) => {
            if (result) {
              this.confirmDelete(patient.id!);
            }
          },
          () => {} // Dismissed
        );
      },
      error: (error) => {
        console.error('Error: Patient not found', error);
        this.notificationService.error('This patient record no longer exists. Please refresh the list.');
        // Refresh the list to remove outdated entries
        this.loadPatients();
      }
    });
  }

  confirmDelete(id: number): void {
    if (!id) {
      this.notificationService.error('Invalid patient ID');
      return;
    }
    
    console.log('Attempting to delete patient with ID:', id);
    
    this.patientService.deletePatient(id).subscribe({
      next: () => {
        this.notificationService.success('Patient deleted successfully');
        this.loadPatients();
      },
      error: (error) => {
        console.error('Error deleting patient:', error);
        
        // Check if it's a 404 Not Found error
        if (error.status === 404) {
          this.notificationService.warning('Patient no longer exists in the database');
          // Refresh the list to remove stale data
          this.loadPatients();
        } else {
          this.notificationService.error('Failed to delete patient: ' + (error.message || 'Unknown error'));
        }
      }
    });
  }

  exportData(): void {
    // Create CSV content
    let csvContent = 'ID,Name,UID,Phone,Age,Gender,Blood Group\n';
    
    this.patients.forEach(patient => {
      csvContent += `${patient.id},${patient.name},${patient.uid},${patient.phone},${patient.age},${patient.gender},${patient.bloodGroup}\n`;
    });
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'patients.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}