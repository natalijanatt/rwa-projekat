import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { LoginDto } from './data/login.dto';
import { TokensDto } from './data/tokens.dto';
import { UserDto } from '../../feature/users/data/user.dto';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;
  
  login(dto: LoginDto) {
  return this.http.post<TokensDto>(`${this.base}/auth/login`, dto).pipe(
    tap({
      next: (res) => console.log('Login HTTP response:', res),
      error: (err) => console.warn('Login HTTP error:', err),
    })
  );
}

  me() { return this.http.get<UserDto>(`${this.base}/users/profile`); }
}
