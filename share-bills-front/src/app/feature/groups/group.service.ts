import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environment/environment';
import { GroupBaseDto } from './data/group-base.dto';
import { GroupFullDto } from './data/group-full.dto';
import { GroupCreateDto } from './data/group-create.dto';
import { GroupUpdateDto } from './data/group-update.dto';
import { catchError } from 'rxjs';
import { ErrorService } from '../../core/services/error.service';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
    private http = inject(HttpClient);
    private errorService = inject(ErrorService);
    private base = environment.apiUrl;

    getAllGroups() {
        return this.http.get<GroupBaseDto[]>(`${this.base}/groups`).pipe(
            catchError((err) => this.errorService.handleHttpError(err))
        );
    }

    getGroupById(id: number) {
        return this.http.get<GroupFullDto>(`${this.base}/groups/${id}`).pipe(
            catchError((err) => this.errorService.handleHttpError(err))
        );
    }

    createGroup(dto: GroupCreateDto, image?: File) {
        const url = `${this.base}/groups`;

        const request$ = image
            ? this.http.post<GroupFullDto>(url, this.toFormData(dto, image))
            : this.http.post<GroupFullDto>(url, dto);

        return request$.pipe(
            catchError((err) => this.errorService.handleHttpError(err))
        );
    }

    updateGroup(id: number, dto: GroupUpdateDto, image?: File) {
        const url = `${this.base}/groups/${id}`;
        const request$ = image
            ? this.http.patch<GroupFullDto>(url, this.toFormData(dto, image))
            : this.http.patch<GroupFullDto>(url, dto);
        return request$.pipe(
            catchError((err) => this.errorService.handleHttpError(err))
        );
    }

    addMemberToGroup(groupId: number, userId: number) {
        const url = `${this.base}/groups/${groupId}/new-member/${userId}`;

        return this.http.post<any>(url, {}).pipe(
            catchError((err) => this.errorService.handleHttpError(err))
        );
    }

    private toFormData(dto: GroupCreateDto | GroupUpdateDto, image: File): FormData {
        const fd = new FormData();
        Object.entries(dto).forEach(([k, v]) => {
          if (v !== undefined && v !== null) fd.append(k, String(v));
        });
        fd.append('image', image);
        return fd;
      }
}
