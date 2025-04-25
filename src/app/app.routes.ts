import { Routes } from '@angular/router';
import { PatientListComponent } from './components/patient-list/patient-list.component';
// ---> 1. Import your Patient Form Component (adjust path if needed)
import { PatientFormComponent } from './components/patient-form/patient-form.component';

export const routes: Routes = [
  { path: '', redirectTo: '/patients', pathMatch: 'full' },
  { path: 'patients', component: PatientListComponent },

  // ---> 2. Add route for creating a new patient
  { path: 'patient/add', component: PatientFormComponent },

  // ---> 3. Add route for editing an existing patient (uses a route parameter :id)
  { path: 'patient/edit/:id', component: PatientFormComponent },

  // Keep the wildcard route last
  { path: '**', redirectTo: '/patients' }
];