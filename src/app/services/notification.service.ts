import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private toastr: ToastrService) { }

  success(message: string, title: string = 'Success') {
    this.toastr.success(message, title);
  }

  error(message: string, title: string = 'Error') {
    this.toastr.error(message, title);
  }

  info(message: string, title: string = 'Info') {
    this.toastr.info(message, title);
  }

  warning(message: string, title: string = 'Warning') {
    this.toastr.warning(message, title);
  }
}