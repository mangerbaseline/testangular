import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-total-amount',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './total-amount.component.html',
  styles: []
})
export class TotalAmountComponent {
  orderService = inject(OrderService);
}
