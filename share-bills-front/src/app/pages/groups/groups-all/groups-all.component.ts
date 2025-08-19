import { Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { GroupListComponent } from '../../../shared/components/group-list/group-list.component';
import { GroupService } from '../../../feature/groups/group.service';
import { GroupBaseDto } from '../../../feature/groups/data/group-base.dto';
import { GroupFullDto } from '../../../feature/groups/data/group-full.dto';
import { GroupViewComponent } from '../../../shared/components/group-view/group-view.component'; // <- where you placed it

@Component({
  selector: 'app-groups-all',
  standalone: true,
  imports: [NgIf, GroupListComponent, GroupViewComponent],
  templateUrl: './groups-all.component.html',
  styleUrl: './groups-all.component.scss'
})
export class GroupsAllComponent {
  private groupsService = inject(GroupService);

  groups = signal<GroupBaseDto[]>([]);
  selectedGroupId = signal<number | null>(null);
  selectedGroup = signal<GroupFullDto | null>(null);
  loadingDetails = signal<boolean>(false);

  ngOnInit() {
    this.groupsService.getAllGroups().subscribe({
      next: (groups) => { this.groups.set(groups); console.log('Groups loaded:', groups); },
      error: (err) => console.error('Failed to load groups', err)
    });
  }

  onSelect(groupId: number) {
    if (!groupId) return;
    if( this.selectedGroupId() === groupId) return;
    this.selectedGroupId.set(groupId);
    this.loadingDetails.set(true);

    // Adjust service method name if yours is different:
    this.groupsService.getGroupById(groupId).subscribe({
      next: (full) => {
        this.selectedGroup.set(full);
        console.log('Selected group:', this.selectedGroup());
      },
      error: (err) => console.error('Failed to load group details', err),
      complete: () => this.loadingDetails.set(false),
    });
    
  }

  // Handlers from GroupView actions — wire these to your dialogs/routes as needed
  openUpdateDialog(group: GroupFullDto) {
    // TODO: open dialog for quick update
    console.log('Update clicked', group);
  }
  goToMembers(groupId: number) {
    // TODO: route to members view
    console.log('View members clicked', groupId);
  }
  openAddExpense(groupId: number) {
    // TODO: open add-expense dialog/page
    console.log('Add expense clicked', groupId);
  }
  openGroupSettings(groupId: number) {
    // TODO: open group settings / update page
    console.log('Update group clicked', groupId);
  }
}
