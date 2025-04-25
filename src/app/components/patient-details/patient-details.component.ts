import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import type { Patient } from '../../models/patient';

@Component({
  selector: 'app-patient-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-details.component.html',
  styleUrl: './patient-details.component.scss',
})
export class PatientDetailsComponent {
  @Input() patient!: Patient;
  
  constructor(public activeModal: NgbActiveModal) { }
}