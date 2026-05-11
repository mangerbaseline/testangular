import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-background-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './background-animation.component.html',
  styleUrls: ['./background-animation.component.css']
})
export class BackgroundAnimationComponent {
  particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 0.8 + Math.random() * 2,
    opacity: 0.1 + Math.random() * 0.3,
    delay: Math.random() * 5,
    duration: 10 + Math.random() * 15
  }));

  orbits = [
    { size: 1.5, radius: 90, speed: 25, delay: -2, angle: 45 },
    { size: 2.2, radius: 130, speed: 30, delay: -5, angle: 120 },
    { size: 3.5, radius: 170, speed: 35, delay: -8, angle: 210 },
    { size: 1.8, radius: 210, speed: 40, delay: -12, angle: 300 },
    { size: 2.8, radius: 250, speed: 45, delay: -15, angle: 15 },
    { size: 4.5, radius: 290, speed: 52, delay: -20, angle: 85 },
    { size: 5.2, radius: 330, speed: 58, delay: -25, angle: 165 },
    { size: 3.8, radius: 370, speed: 65, delay: -30, angle: 255 },
    { size: 2.1, radius: 410, speed: 72, delay: -35, angle: 330 },
    { size: 4.8, radius: 450, speed: 80, delay: -40, angle: 60 },
  ];
}
