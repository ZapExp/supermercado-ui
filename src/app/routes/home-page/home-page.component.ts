import { Component, inject } from '@angular/core';
import { AuthStateService } from '../../services/auth-state.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent {
  private readonly auth = inject(AuthStateService);

  userData = this.auth.userData;
}
