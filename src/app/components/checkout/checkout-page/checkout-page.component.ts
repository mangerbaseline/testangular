import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaymentCardComponent } from '../../payment-card/payment-card.component';
import { VisualDisplayComponent } from '../../visual-display/visual-display.component';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, PaymentCardComponent, VisualDisplayComponent],
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.css']
})
export class CheckoutPageComponent {
  selectedMethod = signal('card');
  cardType = signal('visa');
  totalAmount = signal(0);
  hasTokenError = signal(false);

  constructor(private router: Router) { }

  onMethodChange(method: string) {
    this.selectedMethod.set(method);
  }

  onCardTypeChange(type: string) {
    this.cardType.set(type);
  }

  onTotalAmountChange(amount: number) {
    this.totalAmount.set(amount);
  }

  onPaymentSuccess() {
    this.router.navigate(['/checkout/success'], { queryParamsHandling: 'preserve' });
  }

  onTokenError(isError: boolean) {
    this.hasTokenError.set(isError);
  }
}
