import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, Event } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { BackgroundAnimationComponent } from './components/background-animation/background-animation.component';
import { BrandHeaderComponent } from './components/brand-header/brand-header.component';
import { ToastService } from './services/toast.service';
import { OrderService } from './services/order.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    BackgroundAnimationComponent,
    BrandHeaderComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  title = 'angularpaymentui';
  showHeaderFooter = true;
  toastService = inject(ToastService);
  orderService = inject(OrderService);

  constructor(private router: Router) { }

  ngOnInit() {
    // Initial check for current URL
    this.showHeaderFooter = !this.router.url.includes('/success');

    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.showHeaderFooter = !event.urlAfterRedirects.includes('/success');
    });
  }
}
