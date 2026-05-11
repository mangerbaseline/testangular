import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);

  // Base URLs from environment
  private wwwApi = environment.apiUrl;
  private backendApi = environment.apiUrl;

  // Shared state 
  totalAmount = signal(0);
  orderData = signal<any>(null);
  isLoading = signal(true);
  loadingMessage = signal('Setting up your secure payment session...');
  isError = signal(false);

  checkPaymentLinkStatus(paymentId: string): Observable<any> {
    return this.http.post(`${this.backendApi}/paymentlink/checkPaymentLinkStatus`, { paymentId });
  }

  getOrderItems(orderID: string, useBackend: boolean = false): Observable<any> {
    const baseUrl = useBackend ? this.backendApi : this.wwwApi;
    return this.http.post(`${baseUrl}/order/checkout/getItemListNew`, { orderID }).pipe(
      tap((response: any) => {
        if (response && response.data) {
          this.orderData.set(response.data);
          if (response.data) {
            // Sum up items for true subtotal (matching your image: 50 + 20 + 200 = 270)
            const menuList = response.data.menuList || [];
            const subtotal = menuList.reduce((acc: number, item: any) => acc + (parseFloat(item.totalPrice || item.amount || 0) || 0), 0) || parseFloat(response.data.subTotal || response.data.prevAmt || response.data.amount || 0);

            const fees = parseFloat(response.data.plateformFees) || 0;
            const discount = parseFloat(response.data.discount) || 0;
            const gst = response.data.gstEnabled ? (parseFloat(response.data.gstAmount || response.data.GSTAmt) || 0) : 0;

            const calculatedTotal = subtotal + fees - discount + gst;
            this.totalAmount.set(calculatedTotal);
          }
        }
      })
    );
  }

  generateToken(merchantID: string, deviceID: string, useBackend: boolean = false): Observable<any> {
    const baseUrl = useBackend ? this.backendApi : this.wwwApi;
    return this.http.post(`${baseUrl}/order/checkout/generateToken`, { merchantID, deviceID });
  }

  getMyPaymentMethod(token: string, deviceId: string, useBackend: boolean = false): Observable<any> {
    const baseUrl = useBackend ? this.backendApi : this.wwwApi;
    const headers = new HttpHeaders({
      'access_token': token,
      'deviceid': deviceId
    });
    return this.http.post(`${baseUrl}/order/checkout/getMyPaymentMethod`, {}, { headers });
  }

  getPaymentStatus(token: string, deviceId: string, orderID: string): Observable<any> {
    const headers = new HttpHeaders({
      'access_token': token,
      'deviceid': deviceId,
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.backendApi}/payments/getPaymentStatus`, { orderID }, { headers });
  }

  createPaymentSession(token: string, deviceId: string, orderID: string, paymentType: string): Observable<any> {
    const headers = new HttpHeaders({
      'token': token,
      'deviceid': deviceId,
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.backendApi}/payments/createPaymentSession`, { orderID, paymentType }, { headers });
  }

  cancelPaymentRequest(token: string, deviceId: string, orderID: string): Observable<any> {
    const headers = new HttpHeaders({
      'access_token': token,
      'deviceid': deviceId,
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.backendApi}/payments/cancelPaymentRequest`, { orderID }, { headers });
  }

  getTicketByMerchantId(merchantID: string): Observable<any> {
    return this.http.get(`${this.backendApi}/getTicketByMerchantId/${merchantID}`);
  }
}

