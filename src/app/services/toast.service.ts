import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  message = signal('');
  type = signal<ToastType>('info');
  private timeout: any;

  show(message: string, type: ToastType = 'info') {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    
    this.message.set(message);
    this.type.set(type);

    this.timeout = setTimeout(() => {
      this.message.set('');
    }, 4000);
  }

  clear() {
    this.message.set('');
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }
}
