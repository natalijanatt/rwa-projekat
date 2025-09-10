import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environment/environment";
import { UserCreateDto } from "./data/user-create.dto";
import { UserFilterDto } from "./data/user-filter.dto";
import { UserDto } from "./data/user.dto";
import { UserUpdateDto } from "./data/user-update.dto";
import { catchError } from "rxjs";
import { ErrorService } from "../../core/services/error.service";

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private errorService = inject(ErrorService);
    private base = environment.apiUrl;

    updateAvatar(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.base}/users/avatar`, formData, {
            reportProgress: true,
            observe: 'events'
        }).pipe(
            catchError((err) => this.errorService.handleHttpError(err))
        );
    }

    searchUsers(filters: UserFilterDto) {
        return this.http.get(`${this.base}/users`, {
            params: {
                query: filters.query || ''
            }
        }).pipe(
            catchError((err) => this.errorService.handleHttpError(err))
        );
    }

    updateUser(userData: UserUpdateDto, image: File | null) {
        const url = `${this.base}/users`;
        const request$ = image
            ? this.http.patch<UserDto>(url, this.toFormData(userData, image))
            : this.http.patch<UserDto>(url, userData);
        return request$.pipe(
            catchError((err) => this.errorService.handleHttpError(err))
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