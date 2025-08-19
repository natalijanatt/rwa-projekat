import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environment/environment';
import { GroupBaseDto } from './data/group-base.dto';
import { GroupFullDto } from './data/group-full.dto';
import { GroupCreateDto } from './data/group-create.dto';
import { catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
    private http = inject(HttpClient);
    private base = environment.apiUrl;

    getAllGroups() {
        return this.http.get<GroupBaseDto[]>(`${this.base}/groups`);
    }

    getGroupById(id: number) {
        return this.http.get<GroupFullDto>(`${this.base}/groups/${id}`);
    }

    createGroup(dto: GroupCreateDto, image?: File) {
        const url = `${this.base}/groups`;

        const request$ = image
            ? this.http.post<GroupFullDto>(url, this.toFormData(dto, image))
            : this.http.post<GroupFullDto>(url, dto);

        return request$.pipe(
            catchError((err: HttpErrorResponse) => {
                const msg =
                    (Array.isArray(err.error?.message) ? err.error.message.join(', ') : err.error?.message) ||
                    err.message || 'Group creation failed';
                return throwError(() => ({ ...err, friendlyMessage: msg }));
            })
        );
    }

    updateGroup(id: number, dto: GroupCreateDto, image?: File) {
        const url = `${this.base}/groups/${id}`;
        const request$ = image
            ? this.http.patch<GroupFullDto>(url, this.toFormData(dto, image))
            : this.http.patch<GroupFullDto>(url, dto);
        return request$.pipe(
            catchError((err: HttpErrorResponse) => {
                const msg =
                    (Array.isArray(err.error?.message) ? err.error.message.join(', ') : err.error?.message) ||
                    err.message || 'Group update failed';
                return throwError(() => ({ ...err, friendlyMessage: msg }));
            })
        );
    }

    addMemberToGroup(groupId: number, userId: number) {
        const url = `${this.base}/groups/${groupId}/new-member/${userId}`;

        return this.http.post<any>(url, {}).pipe(
            catchError((err: HttpErrorResponse) => {
                const msg =
                    (Array.isArray(err.error?.message) ? err.error.message.join(', ') : err.error?.message) ||
                    err.message || 'Adding member to group failed';
                return throwError(() => ({ ...err, friendlyMessage: msg }));
            })
        );
    }

    private toFormData(dto: GroupCreateDto, image: File): FormData {
        const fd = new FormData();
        Object.entries(dto).forEach(([k, v]) => {
          if (v !== undefined && v !== null) fd.append(k, String(v));
        });
        fd.append('image', image);
        return fd;
      }
}
