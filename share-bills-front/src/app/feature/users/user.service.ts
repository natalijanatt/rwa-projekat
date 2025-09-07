import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environment/environment";
import { UserCreateDto } from "./data/user-create.dto";
import { UserFilterDto } from "./data/user-filter.dto";
import { UserDto } from "./data/user.dto";
import { UserUpdateDto } from "./data/user-update.dto";
import { catchError, throwError } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private base = environment.apiUrl;

    updateAvatar(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.base}/users/avatar`, formData, {
            reportProgress: true,
            observe: 'events'
        });
    }

    searchUsers(filters: UserFilterDto) {
        return this.http.get(`${this.base}/users`, {
            params: {
                query: filters.query || ''
            }
        });
    }

    // updateUser(userData: Partial<UserDto>) {
    //     return this.http.patch<UserDto>(`${this.base}/users`, userData);
    // }

    updateUser(userData: UserUpdateDto, image: File | null) {
        const url = `${this.base}/users`;
        const request$ = image
            ? this.http.patch<UserDto>(url, this.toFormData(userData, image))
            : this.http.patch<UserDto>(url, userData);
        return request$.pipe(
            catchError((err: HttpErrorResponse) => {
                const msg =
                    (Array.isArray(err.error?.message) ? err.error.message.join(', ') : err.error?.message) ||
                    err.message || 'User update failed';
                return throwError(() => ({ ...err, friendlyMessage: msg }));
            })
        );
    }

    toFormData(dto: UserUpdateDto, image: File): FormData {
        const fd = new FormData();
        Object.entries(dto).forEach(([k, v]) => {
            if (v !== undefined && v !== null) fd.append(k, String(v));
        });
        fd.append('file', image);
        return fd;
    }
}