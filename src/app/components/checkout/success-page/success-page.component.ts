import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../services/order.service';

import * as CryptoJS from 'crypto-js';
import { toPng, toBlob } from 'html-to-image';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-success-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-page.component.html',
  styleUrls: ['./success-page.component.css']
})
export class SuccessPageComponent implements OnInit, OnDestroy {
  orderService = inject(OrderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  countdown = signal(600);
  isMerchantImageValid = signal(true);
  ticketData = signal<any>(null);
  private timer: any;

  getRawSubtotal(): number {
    const list = this.orderService.orderData()?.menuList || [];
    return list.reduce((acc: number, item: any) => acc + (parseFloat(item.totalPrice || item.amount || 0) || 0), 0);
  }

  handleMerchantImageError() {
    this.isMerchantImageValid.set(false);
  }

  isEvent(): boolean {
    return this.orderService.orderData()?.payment_sub_type === 'event';
  }

  getEventItem() {
    const list = this.orderService.orderData()?.menuList;
    return (list && list.length > 0) ? list[0] : null;
  }

  getQuantity(): number {
    const data = this.orderService.orderData();
    if (!data) return 1;

    // Check menuList first
    if (data.menuList && data.menuList.length > 0) {
      return data.menuList[0].quantity || 1;
    }

    // Fallback to qrTableData
    if (data.qrTableData && data.qrTableData.quantity) {
      return data.qrTableData.quantity;
    }

    return 1;
  }


  ngOnInit() {
    this.orderService.isLoading.set(true);
    this.orderService.isError.set(false);
    this.orderService.loadingMessage.set('Confirming your payment and generating receipt...');
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

      let orderID = params['orderId'] || '';
      let paymentId = params['paymentId'] || '';

      if (token) {
        const decrypted = this.decryptToken(token);
        if (decrypted) {
          orderID = decrypted.orderId;
          paymentId = decrypted.paymentId;
        }
      }

      if (orderID) {
        this.orderService.getOrderItems(orderID, !!paymentId).subscribe({
          next: (res) => {
            this.startCountdown();
            this.orderService.isLoading.set(false);

            // If event booking, fetch additional ticket details
            if (this.isEvent()) {
              const merchantId = res.data?.merchantID || res.data?.userID;
              if (merchantId) {
                this.orderService.getTicketByMerchantId(merchantId).subscribe({
                  next: (ticketRes) => {
                    if (ticketRes && ticketRes.success) {
                      this.ticketData.set(ticketRes.response);
                    }
                  }
                });
              }
            }
          },
          error: (err) => {
            this.orderService.isLoading.set(false);
            this.orderService.isError.set(true);
          }
        });
      } else {
        this.orderService.isLoading.set(false);
        this.orderService.isError.set(true);
      }
    });
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private decryptToken(token: string): any {
    try {
      const parts = token.split(":");
      if (parts.length < 2) return null;
      const ivPart = parts[0];
      let encPart = parts[1];
      if (encPart.endsWith("=")) encPart = encPart.slice(0, -1);

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

  private startCountdown() {
    const url = this.orderService.orderData()?.url;
    if (!url || url.trim() === '') {
      return;
    }

    this.timer = setInterval(() => {
      this.countdown.update(v => v - 1);
      if (this.countdown() <= 0) {
        clearInterval(this.timer);
        this.onReturn();
      }
    }, 1000);
  }

  onReturn() {
    if (this.isEvent()) {
      const merchantId = this.orderService.orderData()?.merchantID || this.orderService.orderData()?.userID;
      if (merchantId) {
        window.location.href = `https://backend.kuberfinancial.com.au/tableQR?merId=${merchantId}&spl=true&event=true`;
        return;
      }
    }

    const url = this.orderService.orderData()?.url;
    if (url && url.trim() !== '') {
      window.location.href = url;
    }
  }

  getPaymentIcon(): string {
    const mode = (this.orderService.orderData()?.paymentMode || '').toLowerCase();

    if (mode.startsWith('pay')) return 'images/payto-logo.png';
    if (mode.includes('card')) return 'images/mastercard.svg';
    if (mode.includes('apple')) return 'images/apple-pay.svg';
    if (mode.includes('google')) return 'images/google-pay.svg';
    if (mode.includes('klarna')) return 'images/klarna.svg';
    if (mode.includes('afterpay')) return 'images/afterpay.svg';
    if (mode.includes('bank')) return 'images/bank.svg';
    if (mode.includes('upi')) return 'images/upi.svg';
    if (mode.includes('link')) return 'images/link-stripe.svg';

    return '';
  }

  isZipPay(): boolean {
    const mode = (this.orderService.orderData()?.paymentMode || '').toLowerCase();
    return mode.includes('zip');
  }

  async downloadReceipt() {
    const node = document.getElementById('receipt-content');
    if (!node) return;

    // Small delay to ensure any dynamic styles or images are fully painted
    await new Promise(resolve => setTimeout(resolve, 300));

    const options = {
      backgroundColor: '#020617',
      cacheBust: true,
      skipFonts: true,
      pixelRatio: 2, // High quality
      style: {
        borderRadius: '24px',
        padding: '20px'
      }
    };

    try {
      const dataUrl = await toPng(node, options);
      const link = document.createElement('a');
      link.download = `Receipt-${this.orderService.orderData()?.txn_id || 'KuberPay'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      try {
        const dataUrl = await toPng(node, { ...options, filter: (n: any) => n.tagName !== 'IMG' });
        const link = document.createElement('a');
        link.download = `Receipt-${this.orderService.orderData()?.txn_id || 'KuberPay'}-Simple.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
      }
    }
  }

  async shareReceipt() {
    const node = document.getElementById('receipt-content');
    if (!node) return;

    await new Promise(resolve => setTimeout(resolve, 300));

    const options = {
      backgroundColor: '#020617',
      cacheBust: true,
      skipFonts: true,
      pixelRatio: 2
    };

    try {
      const blob = await toBlob(node, options);
      if (!blob) return;
      await this.performShare(blob);
    } catch (error) {
      try {
        const blob = await toBlob(node, { ...options, filter: (n: any) => n.tagName !== 'IMG' });
        if (blob) await this.performShare(blob);
      } catch (err) {
      }
    }
  }

  private async performShare(blob: Blob) {
    const filename = `Receipt-${this.orderService.orderData()?.txn_id || 'KuberPay'}.png`;
    const file = new File([blob], filename, { type: 'image/png' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Payment Receipt',
          text: 'My payment receipt from KuberPay',
        });
      } catch (e) {
        this.downloadReceipt();
      }
    } else {
      this.downloadReceipt();
    }
  }
}
