import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-visual-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visual-display.component.html',
  styleUrls: ['./visual-display.component.css']
})
export class VisualDisplayComponent {
  @Input() selectedMethod = 'card';
  @Input() cardType = '';
  @Input() totalAmount = 0;

  qrPixels = [
    1, 0, 1, 1, 0, 1, 1, 0, 1, 0,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 1,
    1, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    1, 1, 0, 1, 0, 0, 1, 0, 1, 1,
    0, 0, 1, 0, 1, 0, 0, 1, 0, 0,
    1, 0, 0, 1, 0, 1, 1, 0, 1, 0,
    0, 1, 1, 0, 1, 0, 0, 1, 0, 1,
    1, 0, 0, 1, 0, 1, 0, 0, 1, 0,
    0, 1, 0, 0, 1, 0, 1, 0, 0, 1,
    1, 0, 1, 1, 0, 1, 0, 1, 1, 0,
  ];

  getCardSymbol() {
    if (this.cardType === 'visa') return 'V';
    if (this.cardType === 'mastercard') return 'M';
    if (this.cardType === 'amex') return 'A';
    return '';
  }

  getCardTypeColor() {
    if (this.cardType === 'visa') return '#2563eb';
    if (this.cardType === 'mastercard') return '#ea580c';
    if (this.cardType === 'amex') return '#06b6d4';
    return '#2563eb';
  }

  getGlowColor() {
    const colors: Record<string, string> = {
      card: 'rgba(16,185,129,0.6)',
      apple: 'rgba(200,200,200,0.4)',
      google: 'rgba(66,133,244,0.5)',
      bank: 'rgba(16,185,129,0.5)',
      upi: 'rgba(99,102,241,0.5)',
      payto: 'rgba(16,185,129,0.5)',
      link: 'rgba(0,214,111,0.5)',
      zip: 'rgba(170,143,255,0.4)',
      afterpay: 'rgba(178,252,228,0.4)',
      klarna: 'rgba(255,179,199,0.4)',
    };
    return colors[this.selectedMethod] ?? colors['card'];
  }
}
