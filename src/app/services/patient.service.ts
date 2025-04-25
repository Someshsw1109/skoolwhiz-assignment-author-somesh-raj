import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, switchMap, map, catchError } from 'rxjs';
import { Patient } from '../models/patient';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = 'http://localhost:3000/patients';

  constructor(private http: HttpClient) { }

  /**
   * Get all patients with error handling
   */
  getAllPatients(): Observable<Patient[]> {
    console.log('Fetching all patients');
    return this.http.get<Patient[]>(this.apiUrl).pipe(
      map(patients => {
        console.log('Received patients:', patients);
        return patients.filter(patient => patient.id !== undefined && patient.id !== null);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get a patient by ID with error handling
   */
  getPatientById(id: number): Observable<Patient> {
    if (!id) {
      console.error('Invalid patient ID provided:', id);
      return throwError(() => new Error('Invalid patient ID'));
    }
    
    console.log(`Fetching patient with ID: ${id}`);
    return this.http.get<Patient>(`${this.apiUrl}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          console.error(`Patient with ID ${id} not found`);
          return throwError(() => ({
            status: 404,
            message: 'Patient not found',
            originalError: error
          }));
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Create a new patient with auto-incremented numeric ID
   */
  createPatient(patient: Patient): Observable<Patient> {
    console.log('Creating new patient:', patient);
    return this.getAllPatients().pipe(
      switchMap(patients => {
        // Find maximum ID from existing patients
        const maxId = patients.length > 0 
          ? Math.max(...patients.map(p => typeof p.id === 'number' ? p.id : 0)) 
          : 0;
        
        // Create patient with explicit numeric ID that's maxId + 1
        const patientToCreate = {
          ...patient,
          id: maxId + 1,
          createdAt: new Date().toISOString()
        };
        
        console.log('Sending patient with calculated ID:', patientToCreate);
        
        // Send it with our manually calculated ID
        return this.http.post<Patient>(this.apiUrl, patientToCreate);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Update a patient with better error handling
   */
  updatePatient(id: number, patient: Partial<Patient>): Observable<Patient> {
    if (!id) {
      console.error('Invalid patient ID for update:', id);
      return throwError(() => new Error('Invalid patient ID for update'));
    }
    
    console.log(`Updating patient with ID: ${id}`, patient);
    
    return this.http.patch<Patient>(`${this.apiUrl}/${id}`, patient).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          console.error(`Patient with ID ${id} not found for update`);
          return throwError(() => ({
            status: 404,
            message: 'Patient not found',
            originalError: error
          }));
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Delete a patient with improved error handling
   */
  deletePatient(id: number): Observable<void> {
    if (!id) {
      console.error('Invalid patient ID for deletion:', id);
      return throwError(() => new Error('Invalid patient ID for deletion'));
    }
    
    console.log(`Deleting patient with ID: ${id}`);
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          console.error(`Patient with ID ${id} not found for deletion`);
          return throwError(() => ({
            status: 404,
            message: 'Patient not found',
            originalError: error
          }));
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Search patients by query string
   */
  searchPatients(query: string): Observable<Patient[]> {
    if (!query || query.trim() === '') {
      return this.getAllPatients();
    }
    
    console.log(`Searching patients with query: ${query}`);
    
    return this.http.get<Patient[]>(`${this.apiUrl}?q=${query}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Filter patients by blood group
   */
  filterPatientsByBloodGroup(bloodGroup: string): Observable<Patient[]> {
    if (!bloodGroup || bloodGroup === 'All Blood Groups') {
      return this.getAllPatients();
    }
    
    console.log(`Filtering patients by blood group: ${bloodGroup}`);
    
    return this.http.get<Patient[]>(`${this.apiUrl}?bloodGroup=${bloodGroup}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Check if a UID already exists
   */
  checkUidExists(uid: string): Observable<Patient[]> {
    if (!uid || uid.trim() === '') {
      return of([]);
    }
    
    console.log(`Checking if UID exists: ${uid}`);
    
    return this.http.get<Patient[]>(`${this.apiUrl}?uid=${uid}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors with improved information
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error: Code: ${error.status}, Message: ${error.message}`;
      
      // Add more details for specific status codes
      if (error.status === 0) {
        errorMessage = 'Cannot connect to server. Please check your network connection or the server might be down.';
      } else if (error.status === 404) {
        errorMessage = 'The requested resource was not found.';
      } else if (error.status === 500) {
        errorMessage = 'Internal server error. Please try again later.';
      }
    }
    
    console.error('API Error:', errorMessage, error);
    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      originalError: error
    }));
  }
}