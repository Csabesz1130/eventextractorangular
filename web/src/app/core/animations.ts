import { animate, style, transition, trigger } from '@angular/animations';

export const fadeSlideIn = trigger('fadeSlideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(8px)' }),
    animate('220ms cubic-bezier(.2,.8,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    animate('160ms ease-in', style({ opacity: 0, transform: 'translateY(-6px)' }))
  ])
]);

