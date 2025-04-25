import { Component, OnInit } from '@angular/core';
// *** REQUIRED IMPORTS for template directives ***
import { CommonModule } from '@angular/common'; // Provides *ngIf, *ngFor
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms'; // Provides formGroup, formControlName etc.
// Original imports
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { NotificationService } from '../../services/notification.service';
import { Patient } from '../../models/patient';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-patient-form',
  standalone: true, // *** MAKE COMPONENT STANDALONE ***
  imports: [
    CommonModule, // *** IMPORT CommonModule ***
    ReactiveFormsModule // *** IMPORT ReactiveFormsModule ***
  ],
  templateUrl: './patient-form.component.html',
  styleUrls: ['./patient-form.component.scss']
})
export class PatientFormComponent implements OnInit {
  patientForm: FormGroup;
  patientToEdit: Patient | null = null;
  mode: 'create' | 'edit' = 'create';
  loading = false;
  isSubmitting = false;

  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  genders = ['Male', 'Female', 'Other'];

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.patientForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        const numericId = parseInt(id, 10);
        if (!isNaN(numericId)) {
           this.mode = 'edit';
           this.loadPatient(numericId);
        } else {
             console.error('Invalid patient ID in route:', id);
             this.notificationService.error('Invalid patient ID provided.');
             this.router.navigate(['/patients']);
        }
      } else {
          this.mode = 'create';
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      uid: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      age: ['', [Validators.required, Validators.min(0), Validators.max(120)]],
      gender: [null, Validators.required], // Use null for default select value
      bloodGroup: [null, Validators.required], // Use null for default select value
      address: [''],
      medicalHistory: [''],
      photoUrl: ['']
    });
  }

  loadPatient(id: number): void {
    this.loading = true;
    this.patientService.getPatientById(id).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (patient) => {
        if (!patient) {
             this.notificationService.error('Patient not found. Redirecting.');
             this.router.navigate(['/patient/add']);
             return;
        }
        this.patientToEdit = patient;
        // mode is already set in ngOnInit
        console.log('Loaded patient for editing:', patient);
        this.populateForm(patient);
      },
      error: (error) => {
        console.error('Error loading patient:', error);
        this.notificationService.error('Patient not found or failed to load.');
        this.router.navigate(['/patients']);
      }
    });
  }

  populateForm(patient: Patient): void {
    this.patientForm.patchValue({
      name: patient.name,
      uid: patient.uid,
      phone: patient.phone,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      address: patient.address ?? '',
      medicalHistory: patient.medicalHistory ?? '',
      photoUrl: patient.photoUrl ?? ''
    });
  }

  checkUidExists(uid: string): void {
    if (!uid || !/^\d{11}$/.test(uid)) {
         if (this.uidControl?.hasError('duplicate')) {
            const errors = { ...this.uidControl.errors };
            delete errors['duplicate'];
            this.uidControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
         }
        return;
    }

    this.patientService.checkUidExists(uid).subscribe({
      next: (patients) => {
        const existingPatient = patients.find(p => this.mode === 'edit' && this.patientToEdit
          ? p.id !== this.patientToEdit!.id
          : true);

        if (existingPatient) {
          this.notificationService.warning('This UID is already registered');
          this.uidControl?.setErrors({ ...(this.uidControl?.errors || {}), duplicate: true });
        } else {
           if (this.uidControl?.hasError('duplicate')) {
            const errors = { ...this.uidControl.errors };
            delete errors['duplicate'];
            this.uidControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
           }
        }
      },
      error: (err) => {
           console.error("Error checking UID existence:", err);
           this.notificationService.error("Could not verify UID uniqueness.");
      }
    });
  }

  onSubmit(): void {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      this.notificationService.error('Please fix the form errors before submitting');
      return;
    }
    if (this.isSubmitting) {
        return;
    }

    this.isSubmitting = true;
    const formData = this.patientForm.value;

    if (this.mode === 'edit' && this.patientToEdit?.id) {
      const patientIdToUpdate = this.patientToEdit.id;
      this.patientService.getPatientById(patientIdToUpdate).pipe(
         finalize(() => { /* Only reset submitting in the final operation */ }) // Don't reset here
      ).subscribe({
        next: () => {
          this.patientService.updatePatient(patientIdToUpdate, formData).pipe(
             finalize(() => this.isSubmitting = false) // Reset on final action
          ).subscribe({
            next: () => {
              this.notificationService.success('Patient updated successfully');
              this.router.navigate(['/patients']);
            },
            error: (error) => {
              console.error('Error updating patient:', error);
              this.notificationService.error('Failed to update patient. Please try again.');
            }
          });
        },
        error: () => {
          // Reset submitting if pre-check fails and we decide to create new
          this.notificationService.warning('This patient no longer exists. Creating a new record instead.');
          this.createNewPatient(formData); // This call now handles finalize
        }
      });
    } else {
      this.createNewPatient(formData);
    }
  }

  private createNewPatient(formData: any): void {
    this.patientService.createPatient(formData as Patient).pipe(
       finalize(() => this.isSubmitting = false) // Reset on final action
    ).subscribe({
      next: () => {
        this.notificationService.success('Patient added successfully');
        this.router.navigate(['/patients']);
      },
      error: (error) => {
        console.error('Error adding patient:', error);
        this.notificationService.error('Failed to add patient. Please try again.');
      }
    });
  }

  // *** RENAMED method to match HTML ***
  cancel(): void {
    this.router.navigate(['/patients']);
  }

  // Helper methods for form validation
  get nameControl(): AbstractControl | null { return this.patientForm.get('name'); }
  get uidControl(): AbstractControl | null { return this.patientForm.get('uid'); }
  get phoneControl(): AbstractControl | null { return this.patientForm.get('phone'); }
  get ageControl(): AbstractControl | null { return this.patientForm.get('age'); }
  get genderControl(): AbstractControl | null { return this.patientForm.get('gender'); }
  get bloodGroupControl(): AbstractControl | null { return this.patientForm.get('bloodGroup'); }
  get addressControl(): AbstractControl | null { return this.patientForm.get('address'); }
  get medicalHistoryControl(): AbstractControl | null { return this.patientForm.get('medicalHistory'); }
  get photoUrlControl(): AbstractControl | null { return this.patientForm.get('photoUrl'); }
}