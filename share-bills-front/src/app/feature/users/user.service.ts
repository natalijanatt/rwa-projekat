import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environment/environment";
import { UserCreateDto } from "./data/user-create.dto";

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
}