import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environment/environment';
import { GroupBaseDto } from './data/group-base.dto';

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
        return this.http.get<GroupBaseDto>(`${this.base}/groups/${id}`);
    }
}
