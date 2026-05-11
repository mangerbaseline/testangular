// import { Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { OrderService } from '../../services/order.service';

// @Component({
//   selector: 'app-brand-header',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <div class="brand-header">
//       <div class="merchant-row">
//         <div class="merchant-flex-container">
//           <div class="merchant-visual">
//           <div class="merchant-logo-main">
//             <ng-container *ngIf="orderService.orderData()?.merchantData?.profile_pic; else defaultIcon">
//               <img [src]="orderService.orderData()?.merchantData?.profile_pic" alt="Merchant Logo" class="merchant-img">
//             </ng-container>
//             <ng-template #defaultIcon>
//               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store w-6 h-6 text-primary"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"></path></svg>
//             </ng-template>
//             <div class="merchant-badge-overlay">
//               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield w-3 h-3 text-black" style="color: black"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
//             </div>
//           </div>
//           <div class="merchant-details">
//             <div class="paying-to">
//               Paying to <span class="verified-tag">
//                 Verified</span>
//             </div>
//             <div class="merchant-name-row">
//               <span class="merchant-name">{{ orderService.orderData()?.merchantData?.name || ' ' }}</span>
//               <svg viewBox="0 0 24 24" fill="none" width="14" height="14" class="ext-icon" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3h6v6m-11 5L21 3"/></svg>
//             </div>
//           </div>
//         </div>

//         <div class="mobile-price">
//           <div class="m-price-label">Amount</div>
//           <div class="m-price-value">{{ orderService.totalAmount() | currency }}</div>
//         </div>
//       </div>
//     </div>
//   </div>
//   `,
//   styles: [`
//     .brand-header {
//       position: absolute;
//       top: 24px;
//       left: 24px;
//       right: 24px; /* Ensure it spans full width */
//       display: flex;
//       flex-direction: column;
//       gap: 10px;
//       z-index: 100;
//     }

//     .merchant-flex-container {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       width: 100%;
//     }

//     .mobile-price {
//       text-align: right;
//       display: block;
//     }

//     .m-price-label {
//       font-size: 10px;
//       text-transform: uppercase;
//       font-weight: 800;
//       color: #94a3b8;
//       letter-spacing: 0.1em;
//       margin-bottom: -2px;
//     }

//     .m-price-value {
//       font-size: 22px;
//       font-weight: 800;
//       color: #10b981;
//     }

//     @media (min-width: 860px) {
//       .mobile-price {
//         display: none;
//       }
//     }

//     .logo-row {
//       display: flex;
//       align-items: center;
//       gap: 10px;
//     }

//     .logo-icon {
//       display: flex;
//       align-items: center;
//       justify-content: center;
//     }

//     .brand-name {
//       font-family: 'Space Grotesk';
//       font-size: 20px;
//       color: #f1f5f9;
//       font-weight: 600;
//       letter-spacing: -0.5px;
//     }

//     .brand-pay{
//       color: #10b77f;
//     }

//     .brand-name strong {
//       font-weight: 800;
//       color: #f1f5f9;
//     }

//     .merchant-row {
//       display: flex;
//       flex-direction: column;
//       gap: 5px;
//     }

//     .paying-label {
//       display: flex;
//       align-items: center;
//       font-size: 11px;
//       color: #475569;
//       font-weight: 500;
//     }

//     .verified-badge {
//       display: inline-flex;
//       align-items: center;
//       gap: 3px;
//       font-size: 10px;
//       font-weight: 700;
//       color: #10b981;
//       background: rgba(16,185,129,0.1);
//       border: 1px solid rgba(16,185,129,0.2);
//       border-radius: 100px;
//       padding: 1px 6px;
//     }

//     .brand-logo-circle {
//       width: 40px;
//       height: 40px;
//       background: linear-gradient(135deg, #fcd34d, #10b981);
//       border-radius: 50%;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
//     }
//     .brand-logo-circle svg {
//   color: black;
// }

//     .m-price-label {
//       font-size: 11px;
//       color: rgba(255,255,255,0.4);
//       margin-bottom: -4px;
//       text-transform: uppercase;
//       font-weight: 800;
//       letter-spacing: 0.1em;
//     }

//     .merchant-visual {
//       display: flex;
//       align-items: center;
//       gap: 12px;
//       margin-top: 4px;
//     }

//     .merchant-logo-main {
//       width: 48px;
//       height: 48px;
//       background: rgba(16, 185, 129, 0.1);
//       border: 1px solid rgba(16, 185, 129, 0.2);
//       border-radius: 50%;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       position: relative;
//     }
//     .merchant-logo-main svg {
//       color: #10b981;
//     }

//     .merchant-img {
//       width: 100%;
//       height: 100%;
//       object-fit: contain;
//       border-radius: 50%;
//     }

//     .merchant-badge-overlay {
//       position: absolute;
//       bottom: -2px;
//       right: -2px;
//       width: 18px;
//       height: 18px;
//       background: #10b981;
//       border: 2px solid #020617;
//       border-radius: 50%;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//     }

//     .paying-to {
//       font-size: 12px;
//       background-color: ;
//       color: rgba(255,255,255,0.4);
//       display: flex;
//       align-items: center;
//       gap: 5px;
//       margin-bottom: 2px;
//     }

//     .verified-tag {
//       padding: 4px 8px;
//       color: #10b981;
//       border-radius: 12px;
//       background-color: #52c7a04d;
//       font-weight: 700;
//       display: flex;
//       align-items: center;
//     }

//     .merchant-name-row {
//       display: flex;
//       align-items: center;
//       gap: 6px;
//     }

//     .merchant-name {
//       font-family: 'Space Grotesk';
//       font-size: 16px;
//       font-weight: 700;
//       color: #f1f5f9;
//     }

//     @media (max-width: 860px) {
//       .brand-header {
//         position: relative;
//         top: 0;
//         left: 0;
//         right: 0;
//         padding: 24px 24px 8px; 
//         background: transparent;
//         gap: 16px;
//       }
//     }

//     .ext-icon {
//       opacity: 0.4;
//       cursor: pointer;
//     }

//     .ext-icon:hover { opacity: 0.7; }
//   `]
// })
// export class BrandHeaderComponent {
//   orderService = inject(OrderService);
// }
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-brand-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './brand-header.component.html',
  styleUrls: ['./brand-header.component.css']
})
export class BrandHeaderComponent {
  orderService = inject(OrderService);

  hasRealData(): boolean {
    const orderData = this.orderService.orderData();
    const merchantData = orderData?.merchantData;

    // Check if we have ANY real merchant data
    return !!(merchantData && (merchantData.name || merchantData.profile_pic));
  }

  hasValidAmount(): boolean {
    const totalAmount = this.orderService.totalAmount();
    return !!(totalAmount && totalAmount > 0);
  }

  getMerchantName(): string {
    const merchantData = this.orderService.orderData()?.merchantData;


    if (merchantData?.name && !this.isDummyName(merchantData.name)) {
      return merchantData.name;
    }


    return '';
  }

  private isDummyName(name: string): boolean {
    const dummyPatterns = [
      /^test/i,
      /^demo/i,
      /^example/i,
      /^dummy/i,
      /^sample/i,
      /^merchant$/i,
      /^store$/i
    ];

    return dummyPatterns.some(pattern => pattern.test(name));
  }
}