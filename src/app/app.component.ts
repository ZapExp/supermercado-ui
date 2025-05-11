import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStateService } from './services/auth-state.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'supermercado-ui';
  private readonly auth = inject(AuthStateService);

  userData = this.auth.userData;
  isAuthenticated = this.auth.isAuthenticated;

  login() {
    this.auth.login();
  }

  logout() {
    this.auth.logout();
  }
}
