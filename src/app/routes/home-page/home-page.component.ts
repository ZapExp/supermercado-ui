import { Component, inject } from '@angular/core';
import { AuthStateService } from '../../services/auth-state.service';

@Component({
  selector: 'app-home-page',
  imports: [],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent {
  private readonly auth = inject(AuthStateService);

  userData = this.auth.userData;
}
