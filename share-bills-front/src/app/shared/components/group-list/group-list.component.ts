import { NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GroupBaseDto } from '../../../feature/groups/data/group-base.dto';
import { GroupCardComponent } from "../group-card/group-card.component";

@Component({
  selector: 'app-group-list',
  imports: [NgFor, GroupCardComponent, NgIf],
  templateUrl: './group-list.component.html',
  styleUrl: './group-list.component.scss',
})
export class GroupListComponent {
  @Input({ required: true }) groups: GroupBaseDto[] = [];

  @Output() selection = new EventEmitter<number>();

  ngOnChanges(): void {
    const map = new Map<string, GroupBaseDto[]>();
  }

  onOpen(groupId: number): void {
    this.selection.emit(groupId);
  }
}
