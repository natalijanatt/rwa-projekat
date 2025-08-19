import { Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';

import { GroupListComponent } from '../../../shared/components/group-list/group-list.component';
import { GroupService } from '../../../feature/groups/group.service';
import { GroupBaseDto } from '../../../feature/groups/data/group-base.dto';
import { GroupViewComponent } from '../../../shared/components/group-view/group-view.component';
import { GroupCreateComponent } from '../group-create/group-create.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-groups-all',
  standalone: true,
  imports: [NgIf, GroupListComponent, ButtonComponent, GroupViewComponent, GroupCreateComponent],
  templateUrl: './groups-all.component.html',
  styleUrl: './groups-all.component.scss'
})
export class GroupsAllComponent {
  private groupsService = inject(GroupService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  groups = signal<GroupBaseDto[]>([]);
  selectedGroupId = signal<number | null>(null);
  creatingGroup = signal<boolean>(true);

  ngOnInit() {
    this.groupsService.getAllGroups().subscribe({
      next: (gs) => this.groups.set(gs),
      error: (err) => console.error('Failed to load groups', err)
    });

    this.route.paramMap.pipe(
      map(pm => pm.get('id') ?? pm.get('groupId')),
      map(id => id ? Number(id) : null),
      distinctUntilChanged(),
    ).subscribe(id => {
      this.selectedGroupId.set(id);
      if (id) this.creatingGroup.set(false);
    });
  }

  onSelect(groupId: number) {
    if (!groupId || this.selectedGroupId() === groupId) return;
    this.creatingGroup.set(false);
    this.router.navigate(['/groups', groupId]);
  }

  onCreateGroup() {
    this.creatingGroup.set(true);
    this.router.navigate(['/groups']);
  }

  openUpdateDialog() {}
  goToMembers(_id: number) {}
  openAddExpense(_id: number) {}
  openGroupSettings(_id: number) {}
}
