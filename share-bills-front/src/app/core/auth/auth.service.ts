import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { LoginDto } from './data/login.dto';
import { TokensDto } from './data/tokens.dto';
import { UserDto } from '../../feature/users/data/user.dto';
import { catchError } from 'rxjs';
import { UserCreateDto } from '../../feature/users/data/user-create.dto';
import { ErrorService } from '../services/error.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);
  private base = environment.apiUrl;
  
  login(dto: LoginDto) {
    return this.http.post<TokensDto>(`${this.base}/auth/login`, dto).pipe(
      catchError((err) => this.errorService.handleHttpError(err))
    );
  }

  me() {
    return this.http.get<UserDto>(`${this.base}/users/profile`).pipe(
      catchError((err) => this.errorService.handleHttpError(err))
    );
  }

  register(dto: UserCreateDto, image?: File) {
    const url = `${this.base}/auth/register`;

    const request$ = image
      ? this.http.post<UserDto>(url, this.toFormData(dto, image))
      : this.http.post<UserDto>(url, dto);

    return request$.pipe(
      catchError((err) => this.errorService.handleHttpError(err))
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
