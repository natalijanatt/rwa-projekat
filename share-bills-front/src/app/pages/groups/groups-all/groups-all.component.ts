import { Component, inject, signal } from '@angular/core';
import { GroupBaseDto } from '../../../feature/groups/data/group-base.dto';
import { GroupService } from '../../../feature/groups/group.service';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-groups-all',
  imports: [NgIf, NgFor],
  templateUrl: './groups-all.component.html',
  styleUrl: './groups-all.component.scss'
})
export class GroupsAllComponent {
  private groupsService = inject(GroupService);
  groups = signal<GroupBaseDto[]>([]);

  ngOnInit() {
    this.groupsService.getAllGroups().subscribe({
      next: (groups) =>{this.groups.set(groups); console.log('Groups loaded:', groups);} ,
      error: (err) => console.error('Failed to load groups', err)
    });
  }
}
