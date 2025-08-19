import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { LoginDto } from './data/login.dto';
import { TokensDto } from './data/tokens.dto';
import { UserDto } from '../../feature/users/data/user.dto';
import { catchError, tap, throwError } from 'rxjs';
import { UserCreateDto } from '../../feature/users/data/user-create.dto';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;
  
  login(dto: LoginDto) {
  return this.http.post<TokensDto>(`${this.base}/auth/login`, dto).pipe(
    tap({
      next: ((res) => console.log('Login HTTP response:', res)),
      error: (err) => console.warn('Login HTTP error:', err),
    })
  );
}

  me() { return this.http.get<UserDto>(`${this.base}/users/profile`).pipe(
    tap({
      next: (res) => console.log('Me HTTP response:', res),
      error: (err) => console.warn('Me HTTP error:', err),
    }),
  ); }

  register(dto: UserCreateDto, image?: File) {
    const url = `${this.base}/auth/register`;

    const request$ = image
      ? this.http.post<UserDto>(url, this.toFormData(dto, image))
      : this.http.post<UserDto>(url, dto);

    return request$.pipe(
      catchError((err: HttpErrorResponse) => {
        const msg =
          (Array.isArray(err.error?.message) ? err.error.message.join(', ') : err.error?.message) ||
          err.message || 'Registration failed';
        return throwError(() => ({ ...err, friendlyMessage: msg }));
      })
    );
  }

  private toFormData(dto: UserCreateDto, image: File): FormData {
    const fd = new FormData();
    Object.entries(dto).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    fd.append('image', image);
    return fd;
  }
}
