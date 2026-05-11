import { Component, signal, Output, EventEmitter, ViewChild, ElementRef, OnInit, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { ToastService } from '../../services/toast.service';

import * as CryptoJS from 'crypto-js';

declare var Stripe: any;
import { CommonModule, CurrencyPipe } from '@angular/common';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-payment-card',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe, CurrencyPipe],
  templateUrl: './payment-card.component.html',
  styleUrl: './payment-card.component.css'
})
export class PaymentCardComponent implements OnInit, AfterViewInit {
  @ViewChild('tabsContainer') tabsContainer!: ElementRef;
  @ViewChild('scrollTrack') scrollTrack!: ElementRef;
  @Output() methodChange = new EventEmitter<string>();
  @Output() cardTypeChange = new EventEmitter<string>();
  @Output() totalAmountChange = new EventEmitter<number>();
  @Output() tokenErrorEvent = new EventEmitter<boolean>();

  selectedMethod = signal('card');
  detectedCardType = signal('visa');
  isProcessing = signal(false);
  isStripeLoading = signal(false);
  showSummary = signal(true);

  items = signal<any[]>([]);
  subtotal = signal(0);
  tax = signal(0);
  fees = signal(0);
  discount = signal(0);
  gstEnabled = signal(false);
  totalAmount = signal(0);
  paytoEmail = signal('');
  paytoName = signal('');
  paytoID = signal('');
  paytoMobile = signal('');
  paytoValidationMessage = signal('');
  paytoState = signal<'input' | 'authorizing' | 'waiting' | 'failed'>('input');
  paytoTimerValue = signal(180);
  showCancelConfirm = signal(false);
  private timerInterval: any;

  isInvoice = signal(false);
  invoiceNo = signal('');
  issueDate = signal('');
  customerName = signal('');
  merchantName = signal('');
  merchantEmail = signal('');
  merchantPhone = signal('');

  orderService = inject(OrderService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  allMethods = [
    {
      id: 'card', name: 'Card', color: '#3b82f6',
      svg: '<div style="display:flex; align-items:center; gap: 2px;"><svg style="width:16px; height:12px;" viewBox="0 0 48 32"><rect width="48" height="32" rx="4" fill="#1A1F71"></rect><path d="M19.5 21h-3.2l2-12.4h3.2L19.5 21zm13.3-12.1c-.6-.3-1.6-.5-2.9-.5-3.2 0-5.4 1.7-5.4 4.1 0 1.8 1.6 2.8 2.8 3.4 1.2.6 1.6 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.2 0-1.9-.2-2.9-.6l-.4-.2-.4 2.7c.7.3 2.1.6 3.5.6 3.4 0 5.6-1.7 5.6-4.2 0-1.4-.8-2.5-2.7-3.4-1.1-.6-1.8-.9-1.8-1.5 0-.5.6-1 1.8-1 1 0 1.8.2 2.4.5l.3.1.4-2.7z" fill="#fff"></path><path d="M37.3 8.6h-2.5c-.8 0-1.3.2-1.7 1L28.8 21h3.4l.7-1.9h4.1l.4 1.9H40L37.3 8.6zm-3.5 8.1l1.7-4.7.5 2.3.5 2.4h-2.7z" fill="#fff"></path><path d="M15.6 8.6L12.4 17l-.3-1.7c-.6-2-2.4-4.2-4.4-5.3l2.9 11h3.4l5.1-12.4h-3.5z" fill="#fff"></path><path d="M9.8 8.6H4.6l-.1.3c4 1 6.7 3.5 7.8 6.5l-1.1-5.7c-.2-.8-.8-1-1.4-1.1z" fill="#F7B600"></path></svg><svg style="width:16px; height:12px;" viewBox="0 0 48 32"><rect width="48" height="32" rx="4" fill="#252525"></rect><circle cx="19" cy="16" r="8" fill="#EB001B"></circle><circle cx="29" cy="16" r="8" fill="#F79E1B"></circle><path d="M24 10.3a8 8 0 010 11.4 8 8 0 010-11.4z" fill="#FF5F00"></path></svg><svg style="width:16px; height:12px;" viewBox="0 0 48 32"><rect width="48" height="32" rx="4" fill="#2E77BC"></rect><path d="M6 16l3-8h4l3 8-3 8H9L6 16zm12-8h10l2 3 2-3h10l-6 8 6 8H32l-2-3-2 3H18l6-8-6-8z" fill="#fff" opacity="0.9"></path></svg></div>'
    },
    {
      id: 'apple', name: 'Apple Pay', color: '#e2e8f0',
      svg: '<svg style="width:20px; height:20px;" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"></path></svg>'
    },
    {
      id: 'google', name: 'Google Pay', color: '#0ea5e9',
      svg: '<svg style="width:20px; height:20px;" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"></path><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path></svg>'
    },
    {
      id: 'bank', name: 'PayID', color: '#10b981',
      svg: '<img src="images/Payid.png" style="width:20px; height:20px; object-fit: contain;">'
    },
    {
      id: 'upi', name: 'UPI', color: '#f97316',
      svg: '<svg style="width:20px; height:20px;" viewBox="0 0 24 24"><path d="M11 4L7 20" stroke="#097939" stroke-width="2.5" stroke-linecap="round"></path><path d="M13 4L17 20" stroke="#ED752E" stroke-width="2.5" stroke-linecap="round"></path><path d="M7 4L11 20" stroke="#097939" stroke-width="2.5" stroke-linecap="round"></path></svg>'
    },
    {
      id: 'payto', name: 'PayTo', color: '#22d3ee',
      svg: '<img src="images/payto-logo.png" style="width:20px; height:20px; object-fit: contain;">'
    },
    {
      id: 'zip', name: 'Zip', color: '#a78bfa',
      svg: '<span style="font-weight:800; font-size:14px; letter-spacing:-0.02em; background: linear-gradient(to right, #a78bfa, #e879f9); -webkit-background-clip: text; color: transparent;">zip</span>'
    },
    {
      id: 'afterpay', name: 'Afterpay', color: '#2dd4bf',
      svg: '<svg style="width:20px; height:20px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="url(#apGrad)"></circle><defs><linearGradient id="apGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#b2fce4"></stop><stop offset="100%" stop-color="#2dd4bf"></stop></linearGradient></defs><path d="M8.5 12.5l2.5 2.5 4.5-5" stroke="#0d3d2e" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></svg>'
    },
    {
      id: 'klarna', name: 'Klarna', color: '#f472b6',
      svg: '<svg style="width:20px; height:20px;" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#FFB3C7"></rect><path d="M7 6c0 2.5-1 4.5-3 6 2 1.5 3 3.5 3 6" stroke="#0A0B09" stroke-width="2" fill="none" stroke-linecap="round"></path><line x1="13" y1="6" x2="13" y2="18" stroke="#0A0B09" stroke-width="2" stroke-linecap="round"></line><circle cx="18" cy="16" r="2" fill="#0A0B09"></circle></svg>'
    },
    {
      id: 'link', name: 'Link', color: '#22c55e',
      svg: '<svg style="width:20px; height:20px;" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#00D66F"></rect><path d="M7 8h10M7 12h7M7 16h4" stroke="white" stroke-width="2" stroke-linecap="round"></path></svg>'
    }
  ];

  methods: any[] = [];

  orderID = '';
  merId = '';
  paymentId = '';
  useBackend = false;
  accessToken = '';
  deviceId = '';

  stripe: any;
  elements: any;
  paymentElement: any;

  stripeMethods = ['card', 'apple', 'google', 'klarna', 'afterpay', 'zip', 'link'];

  backendMap: { [key: string]: string } = {
    'card': 'card',
    'apple': 'applePay',
    'google': 'googlePay',
    'klarna': 'klarna',
    'afterpay': 'afterPay',
    'zip': 'zipPay',
    'link': 'payWithLink'
  };

  stripeTypeMap: { [key: string]: string } = {
    'card': 'card',
    'applePay': 'apple_pay',
    'googlePay': 'google_pay',
    'klarna': 'klarna',
    'afterPay': 'afterpay_clearpay',
    'zipPay': 'zip',
    'payWithLink': 'link'
  };

  decryptToken(token: string): any {
    try {
      const parts = token.split(":");
      if (parts.length < 2) return null;
      const ivPart = parts[0];
      let encPart = parts[1];
      if (encPart.endsWith("=")) {
        encPart = encPart.slice(0, -1);
      }

      const key = CryptoJS.SHA256(environment.encryptionKey);
      const iv = CryptoJS.enc.Hex.parse(ivPart);
      const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Hex.parse(encPart) });
      const decrypted = CryptoJS.AES.decrypt(cipherParams, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
      const decStr = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decStr) return null;

      const params = new URLSearchParams(decStr);
      return {
        merId: params.get('merId') || '',
        orderId: params.get('orderId') || '',
        paymentId: params.get('paymentId') || ''
      };
    } catch (error) {
      return null;
    }
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      let token = params['token'] || '';
      if (!token) {
        const keys = Object.keys(params);
        const tokenKey = keys.find(k => k.includes(':') && k.length > 30);
        if (tokenKey) {
          token = tokenKey;
          if (params[tokenKey] && params[tokenKey] !== '') {
            token += '=' + params[tokenKey];
          }
        }
      }

      let decryptedPayload = null;
      if (token) {
        decryptedPayload = this.decryptToken(token);

        if (!decryptedPayload) {
          this.orderService.isError.set(true);
          this.tokenErrorEvent.emit(true);
          this.orderService.isLoading.set(false);
          return;
        }
      }

      if (decryptedPayload) {
        this.merId = decryptedPayload.merId;
        this.orderID = decryptedPayload.orderId;
        this.paymentId = decryptedPayload.paymentId;
      } else {
        this.merId = params['merId'] || '';
        this.orderID = params['orderId'] || '';
        this.paymentId = params['paymentId'] || '';
      }

      if (!this.merId && !this.orderID && !this.paymentId) {
        this.orderService.isError.set(true);
        this.tokenErrorEvent.emit(true);
        this.orderService.isLoading.set(false);
        return;
      }

      this.useBackend = !!this.paymentId;

      this.startApiFlow();
      this.restorePayToState();
    });

    try {
      this.stripe = Stripe(environment.stripeKey);
    } catch (e) {
    }
  }

  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    this.toastService.show(message, type);
  }

  handlePaytoInput(event: any) {
    const target = event.target as HTMLInputElement;
    const val = target.value;
    this.paytoMobile.set(val);
    this.paytoValidationMessage.set('');
  }

  formatTimer(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  startTimer() {
    this.clearTimer();
    const endTime = Date.now() + this.paytoTimerValue() * 1000;
    localStorage.setItem('payto_timer_end', endTime.toString());
    localStorage.setItem('payto_state', 'waiting');

    this.timerInterval = setInterval(() => {
      const remaining = Math.round((endTime - Date.now()) / 1000);

      // Polling every 10 seconds
      if (remaining > 0 && remaining < 180 && (180 - remaining) % 10 === 0) {
        this.checkPayToStatus();
      }

      if (remaining <= 0) {
        this.paytoTimerValue.set(0);
        this.clearTimer();
        this.confirmCancel(true);
      } else {
        this.paytoTimerValue.set(remaining);
      }
    }, 1000);
  }

  checkPayToStatus() {
    this.orderService.getPaymentStatus(this.accessToken, this.deviceId, this.orderID).subscribe({
      next: (res) => {
        if (res.status === 'Success') {
          this.clearTimer();
          this.showToast("Payment Successful!", "success");
          if (res.redirectURL) {
            window.location.href = res.redirectURL;
          } else {
            this.paymentSuccess.emit();
          }
        } else if (res.status === 'Failed') {
          this.clearTimer();
          this.showToast("Payment Failed", "error");
          this.paytoState.set('failed');
        }
      },
      error: (err) => { }
    });
  }

  clearTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    localStorage.removeItem('payto_timer_end');
    localStorage.removeItem('payto_state');
  }

  restorePayToState() {
    const savedState = localStorage.getItem('payto_state');
    const timerEnd = localStorage.getItem('payto_timer_end');

    if (savedState === 'waiting' && timerEnd) {
      const remaining = Math.round((parseInt(timerEnd) - Date.now()) / 1000);
      if (remaining > 0) {
        this.selectedMethod.set('payto');
        this.paytoState.set('waiting');
        this.paytoTimerValue.set(remaining);
        this.startTimer();
      } else {
        localStorage.removeItem('payto_state');
        localStorage.removeItem('payto_timer_end');
      }
    }
  }

  confirmCancel(isTimeout = false) {
    if (isTimeout) {
      this.orderService.cancelPaymentRequest(this.accessToken, this.deviceId, this.orderID).subscribe({
        next: (res) => { },
        error: (err) => { }
      });

      this.clearTimer();
      this.showCancelConfirm.set(false);
      this.paytoState.set('failed');
      this.showToast("Payment Failed. Redirecting...", "error");

      setTimeout(() => {
        window.location.href = environment.appBaseUrl;
      }, 5000);
    } else {
      this.clearTimer();
      this.showCancelConfirm.set(false);
      this.paytoState.set('input');
      this.showToast("Payment Request Cancelled", "warning");
    }
  }

  private generateDeviceId(length = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async startApiFlow() {
    this.orderService.isLoading.set(true);
    this.orderService.loadingMessage.set('Setting up your secure payment session...');

    if (this.paymentId) {
      this.orderService.checkPaymentLinkStatus(this.paymentId).subscribe({
        next: (res) => {
          if (res.success) {
          }
        },
        error: (err) => { }
      });
    }

    this.orderService.getOrderItems(this.orderID, this.useBackend).subscribe({
      next: (response) => {
        if (response && response.data) {
          const orderData = response.data;

          if (orderData.paymentStatus === 'Success') {
            this.orderService.isError.set(true);
            this.orderService.isLoading.set(false);
            return;
          }

          this.handleOrderResponse(orderData);

          const deviceId = this.generateDeviceId();
          this.deviceId = deviceId;
          const merchantID = orderData.merchantID;

          this.orderService.generateToken(merchantID, deviceId, this.useBackend).subscribe({
            next: (tokenRes) => {
              const token = tokenRes.data.token || tokenRes.data.deviceID;
              const accessToken = tokenRes.data.token;
              this.accessToken = accessToken || token;

              if (accessToken) {
                this.orderService.getMyPaymentMethod(accessToken, deviceId, this.useBackend).subscribe({
                  next: (methodsRes) => {
                    this.filterMethods(methodsRes.data.paymentMethods);
                  },
                  error: (err) => {
                    this.methods = [...this.allMethods];
                    this.orderService.isLoading.set(false);
                  }
                });
              } else {
                this.methods = [...this.allMethods];
                this.orderService.isLoading.set(false);
              }
            },
            error: (err) => {
              this.methods = [...this.allMethods];
              this.orderService.isLoading.set(false);
            }
          });
        } else {
          this.orderService.isLoading.set(false);
        }
      },
      error: (error) => {
        this.orderService.isLoading.set(false);
        this.methods = [...this.allMethods];
      }
    });
  }

  private handleOrderResponse(orderData: any) {
    if (orderData.orderedThrough === 'QR' && orderData.qrTableData) {
      const qr = orderData.qrTableData;
      const parts = [];
      if (qr.name) parts.push(`Name: ${qr.name}`);
      if (qr.email) parts.push(`Email: ${qr.email}`);
      if (qr.phone) parts.push(`Phone: ${qr.phone}`);
      if (qr.tableNumber) parts.push(`Location: ${qr.tableNumber}`);

      this.items.set([{
        name: 'QR Payment',
        price: orderData.amount || 0,
        desc: parts.join(' | '),
        qty: orderData.qrTableData.quantity || 1
      }]);
    } else if (Array.isArray(orderData.menuList)) {
      const filteredList = orderData.menuList.filter((item: any) => {
        const price = item.itemPrice || item.perItemPrice || item.amount || 0;
        return price > 0;
      });

      this.items.set(filteredList.map((item: any) => {
        let name = item.itemName;
        if (!name && item.firstName) {
          name = `${item.firstName} ${item.lastName || ''}`.trim();
        }
        if (!name) name = 'Unknown Item';

        const descParts = [];
        if (item.description) descParts.push(item.description);
        if (item.email) descParts.push(item.email);
        if (item.mobile) descParts.push(item.mobile);

        return {
          name: name,
          price: item.itemPrice || item.perItemPrice || item.amount || 0,
          desc: descParts.join(' | '),
          qty: item.quantity || 1
        };
      }));
    }

    // Sum up items for true subtotal (matching your image: 50 + 20 + 200 = 270)
    const itemsSum = (orderData.menuList || []).reduce((acc: number, item: any) => acc + (parseFloat(item.totalPrice || item.amount || 0) || 0), 0);
    this.subtotal.set(itemsSum || orderData.amount || 0);

    this.tax.set(parseFloat(orderData.gstAmount || orderData.GSTAmt || 0));
    this.fees.set(orderData.plateformFees || 0);
    this.discount.set(orderData.discount || 0);
    this.gstEnabled.set(!!orderData.gstEnabled);

    // Calculate total: subtotal - discount + tax + fees (matching image: 270 - 50 + 22 = 242)
    const calculatedTotal = this.subtotal() - this.discount() + (this.gstEnabled() ? this.tax() : 0) + this.fees();
    this.totalAmount.set(calculatedTotal);

    this.totalAmountChange.emit(this.totalAmount());
    this.isInvoice.set(orderData.orderedThrough === 'invoice');
    if (orderData.invoiceDetails) {
      this.invoiceNo.set(orderData.invoiceDetails.invoiceNo || '');
      this.issueDate.set(orderData.invoiceDetails.issueDate || '');
      this.customerName.set(orderData.invoiceDetails.invoiceTitle || '');
    }
    if (orderData.merchantData) {
      this.merchantName.set(orderData.merchantData.name || '');
      this.merchantEmail.set(orderData.merchantData.email || '');
      this.merchantPhone.set(orderData.merchantData.mobile || '');
    }
  }

  private filterMethods(apiMethods: string[]) {
    if (!apiMethods || !Array.isArray(apiMethods) || apiMethods.length === 0) {
      this.methods = [...this.allMethods];
      return;
    }

    const normalizedMap: { [key: string]: string } = {
      'card': 'card',
      'applepay': 'apple',
      'googlepay': 'google',
      'zippay': 'zip',
      'afterpay': 'afterpay',
      'klarnapay': 'klarna',
      'klarna': 'klarna',
      'paywithlink': 'link',
      'link': 'link',
      'kuberid': 'upi',
      'upi': 'upi',
      'pay2': 'payto',
      'payto': 'payto'
    };

    const allowedIds = apiMethods.map(m => {
      if (!m || typeof m !== 'string') return null;
      // Strip spaces and convert to lowercase for robust matching
      const normalized = m.toLowerCase().replace(/\s+/g, '');
      return normalizedMap[normalized] || null;
    }).filter(id => id !== null);

    const uniqueIds = Array.from(new Set(allowedIds));
    this.methods = this.allMethods.filter(m => uniqueIds.includes(m.id));

    if (this.methods.length === 0) {
      this.methods = [...this.allMethods];
    }

    this.orderService.isLoading.set(false);

    const current = this.selectedMethod();
    const isAvailable = this.methods.find(m => m.id === current);

    if (!isAvailable) {
      this.selectMethod(this.methods[0]?.id || 'card');
    } else if (this.isStripeMethod()) {
      // Ensure initial load hits createPaymentSession by forcing init
      this.initStripeElement(current);
    }

    this.cdr.detectChanges();
  }

  fetchOrderDetails() {
    // Replaced by startApiFlow
  }

  ngAfterViewInit() {
    // Initialization now handled by API flow in filterMethods to ensure data is ready
  }

  isStripeMethod() {
    return this.stripeMethods.includes(this.selectedMethod());
  }

  async initStripeElement(id: string) {

    if (this.paymentElement) {
      try {
        this.paymentElement.unmount();
        this.paymentElement.destroy();
        this.paymentElement = null;
      } catch (e) {
      }
    }

    const backendType = this.backendMap[id];
    if (!backendType) return;

    const stripeType = this.stripeTypeMap[backendType];
    this.isStripeLoading.set(true);

    try {
      const orderData = this.orderService.orderData();
      if (!orderData) throw new Error("Order data not available");

      if (!this.accessToken) {
        return;
      }

      // Hit createPaymentSession directly using the token from startApiFlow
      this.orderService.createPaymentSession(this.accessToken, this.deviceId, this.orderID, backendType).subscribe({
        next: (data) => {
          if (!data.clientSecret) throw new Error("No clientSecret received from backend");

          this.elements = this.stripe.elements({
            clientSecret: data.clientSecret,
            appearance: {
              theme: 'night',
              variables: {
                colorPrimary: '#10b981',
                colorBackground: '#1e293b',
                colorText: '#ffffff',
                borderRadius: '12px'
              }
            }
          });


          this.paymentElement = this.elements.create("payment", {
            layout: 'tabs',
            paymentMethodOrder: [stripeType]
          });

          setTimeout(() => {
            const mountPoint = document.getElementById("stripe-payment-element-mount-point");
            if (mountPoint && this.paymentElement) {
              this.paymentElement.mount("#stripe-payment-element-mount-point");
            }
          }, 50);

          this.paymentElement.on('ready', () => {
            this.isStripeLoading.set(false);
          });

          this.paymentElement.on('change', (event: any) => {
            if (event.error) {
            }
          });
        },
        error: (err) => {
          this.isStripeLoading.set(false);
        }
      });

    } catch (e: any) {
      this.isStripeLoading.set(false);
    }
  }

  onCardNumberInput(event: any) {
    const val = event.target.value.replace(/\s+/g, '');
    let type = 'visa'; // Default as requested
    if (val.startsWith('5')) type = 'mastercard';
    else if (val.startsWith('3')) type = 'amex';

    this.detectedCardType.set(type);
    this.cardTypeChange.emit(type);
  }

  private isDragging = false;
  private dragStartX = 0;
  private scrollStartX = 0;

  private isThumbDragging = false;
  private thumbDragStartX = 0;
  private thumbDragStartLeft = 0;

  thumbWidth = 60;
  thumbLeft = 0;

  constructor() {
    window.addEventListener('mousemove', (e) => this.onThumbMove(e));
    window.addEventListener('mouseup', () => this.onThumbEndDrag());
  }

  isStepActive(step: number): boolean {
    const method = this.selectedMethod();
    const isSpecialMethod = ['card', 'bank', 'payto'].includes(method);

    if (step === 1) return !isSpecialMethod;
    if (step === 2) return isSpecialMethod;
    return false;
  }

  onTabsDragStart(e: MouseEvent) {
    const el = e.currentTarget as HTMLElement;
    this.isDragging = true;
    this.dragStartX = e.pageX - el.offsetLeft;
    this.scrollStartX = el.scrollLeft;
    el.classList.add('dragging');
  }

  onTabsDragMove(e: MouseEvent) {
    if (!this.isDragging) return;
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - this.dragStartX) * 1.5;
    el.scrollLeft = this.scrollStartX - walk;
    this.updateThumb(el);
  }

  onThumbStartDrag(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isThumbDragging = true;
    this.thumbDragStartX = e.pageX;
    this.thumbDragStartLeft = this.thumbLeft;
  }

  private onThumbMove(e: MouseEvent) {
    if (!this.isThumbDragging || !this.tabsContainer || !this.scrollTrack) return;

    const deltaX = e.pageX - this.thumbDragStartX;
    const trackWidth = this.scrollTrack.nativeElement.clientWidth;
    const maxThumbLeft = trackWidth - this.thumbWidth;

    let newThumbLeft = this.thumbDragStartLeft + deltaX;
    newThumbLeft = Math.max(0, Math.min(newThumbLeft, maxThumbLeft));

    this.thumbLeft = newThumbLeft;

    const container = this.tabsContainer.nativeElement;
    const scrollRatio = newThumbLeft / maxThumbLeft;
    container.scrollLeft = scrollRatio * (container.scrollWidth - container.clientWidth);
  }

  private onThumbEndDrag() {
    this.isThumbDragging = false;
  }

  onTabsDragEnd() {
    this.isDragging = false;
  }

  onTabsScroll(e: Event) {
    const el = e.target as HTMLElement;
    this.updateThumb(el);
  }

  moveTabs(dir: 'left' | 'right') {
    if (!this.tabsContainer) return;
    const el = this.tabsContainer.nativeElement as HTMLElement;
    const amount = dir === 'left' ? -200 : 200;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }

  private updateThumb(el: HTMLElement) {
    const ratio = el.clientWidth / el.scrollWidth;
    const trackWidth = el.clientWidth;
    this.thumbWidth = Math.max(30, trackWidth * ratio);
    this.thumbLeft = (el.scrollLeft / (el.scrollWidth - el.clientWidth)) * (trackWidth - this.thumbWidth);
  }

  async selectMethod(id: string) {
    if (id === 'upi' || id === 'bank') {
      this.showToast("Coming soon...", "info");
      return;
    }

    // Reset PayTo inputs when changing tabs
    this.paytoName.set('');
    this.paytoEmail.set('');
    this.paytoMobile.set('');
    this.paytoID.set('');
    this.paytoValidationMessage.set('');

    this.selectedMethod.set(id);
    this.methodChange.emit(id);

    if (id === 'payto' && this.paytoState() === 'failed') {
      this.paytoState.set('input');
    }

    if (this.isStripeMethod()) {
      await this.initStripeElement(id);
    }
  }

  getMethodName() {
    return this.methods.find(m => m.id === this.selectedMethod())?.name ?? 'Pay';
  }

  getCTA() {
    const method = this.selectedMethod();
    const amountStr = '$' + this.totalAmount().toFixed(2);

    if (method === 'payto') {
      if (this.paytoState() === 'failed') return 'Retry';
      return `Pay ${amountStr}`;
    }
    if (method === 'zip') return 'Continue with Zip';
    if (method === 'afterpay') return 'Continue with Afterpay';
    if (method === 'klarna') return 'Pay first instalment';
    if (method === 'upi') return `Verify & Pay ${amountStr}`;
    return `Pay ${amountStr}`;
  }

  toggleSummary() {
    this.showSummary.set(!this.showSummary());
  }

  @Output() paymentSuccess = new EventEmitter<void>();

  async pay(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.isProcessing.set(true);

    if (this.selectedMethod() === 'payto') {
      if (this.paytoState() === 'failed') {
        this.paytoState.set('input');
        this.isProcessing.set(false);
        return;
      }

      if (this.paytoState() === 'waiting' || this.paytoState() === 'authorizing') {
        this.isProcessing.set(false);
        return;
      }

      if (!this.paytoMobile() || !this.paytoName() || !this.paytoEmail()) {
        this.showToast("Please fill in all fields", "warning");
        this.isProcessing.set(false);
        return;
      }

      this.paytoState.set('authorizing');

      try {
        const response = await fetch(`${environment.apiUrl}/payments/intiatePayTo`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "access_token": this.accessToken,
            "deviceid": this.deviceId
          },
          body: JSON.stringify({
            orderID: this.orderID,
            email: this.paytoEmail(),
            name: this.paytoName(),
            payId: this.paytoMobile()
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        setTimeout(() => {
          this.paytoState.set('waiting');
          this.paytoTimerValue.set(180);
          this.startTimer();
          this.isProcessing.set(false);
        }, 1500);

      } catch (err: any) {
        this.showToast("PayTo initialization failed", "error");
        this.paytoState.set('input');
        this.isProcessing.set(false);
      }
      return;
    }

    if (this.isStripeMethod() && this.paymentElement) {
      try {
        const result = await this.stripe.confirmPayment({
          elements: this.elements,
          confirmParams: {
            return_url: window.location.origin + window.location.pathname.replace(/\/$/, '') + '/success' + window.location.search,
          },
          redirect: 'if_required'
        });


        if (result.error) {
          this.showToast(result.error.message || "Payment Error", "error");
          this.isProcessing.set(false);
        } else {
          this.showToast("Payment Successful! Redirecting...", "success");
          setTimeout(() => {
            window.location.href = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/success' + window.location.search;
          }, 2000);
        }
      } catch (e) {
        this.isProcessing.set(false);
      }
    } else {
      setTimeout(() => {
        this.showToast("Payment Successful! Redirecting...", "success");
        window.location.href = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/success' + window.location.search;
      }, 2000);
    }
  }
}

