import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { ActivatedRoute } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-summary.component.html',
  styleUrls: ['./order-summary.component.css']
})
export class OrderSummaryComponent implements OnInit {
  private orderService = inject(OrderService);

  isExpanded = signal(true);
  loading = signal(true);
  items = signal<any[]>([]);

  subtotal = signal(0);
  tax = signal(0);
  fees = signal(0);
  discount = signal(0);
  total = signal(0);
  gstEnabled = signal(false);

  private route = inject(ActivatedRoute);

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
    this.fetchOrderDetails();
  }

  fetchOrderDetails() {
    this.loading.set(true);

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

      if (!orderID) {
        this.loading.set(false);
        this.orderService.isError.set(true);
        return;
      }

      this.orderService.getOrderItems(orderID, !!paymentId).subscribe({
        next: (response) => {
          if (response && response.data) {
            const orderData = response.data;

            if (Array.isArray(orderData.menuList)) {
              const filteredList = orderData.menuList.filter((item: any) => {
                const price = item.itemPrice || item.perItemPrice || item.amount || 0;
                return price > 0;
              });

              this.items.set(filteredList.map((item: any) => ({
                name: item.itemName || 'Unknown Item',
                price: item.itemPrice || item.perItemPrice || item.amount || 0,
                desc: item.description || '',
                qty: item.quantity || 1
              })));
            }

            // In this API structure:
            // prevAmt seems to be the raw subtotal (sum of item prices)
            // discount is the discount amount
            // GSTAmt is the tax
            // plateformFees is an additional fee
            // amount is the total to be paid

            const itemsSum = (orderData.menuList || []).reduce((acc: number, item: any) => acc + (parseFloat(item.totalPrice || item.amount || 0) || 0), 0);
            this.subtotal.set(itemsSum || orderData.prevAmt || 0);

            this.tax.set(parseFloat(orderData.gstAmount || orderData.GSTAmt || 0));
            this.fees.set(orderData.plateformFees || 0);
            this.discount.set(orderData.discount || 0);
            this.gstEnabled.set(!!orderData.gstEnabled);

            const calculatedTotal = this.subtotal() - this.discount() + (this.gstEnabled() ? this.tax() : 0) + this.fees();
            this.total.set(calculatedTotal);

            // If we want to show platform fees, we might need another line in the UI
            // For now, let's keep it simple or include platform fees in the subtotal/tax if needed
          }
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.orderService.isError.set(true);
        }
      });
    });
  }


  toggleExpand() {
    this.isExpanded.set(!this.isExpanded());
  }
}
