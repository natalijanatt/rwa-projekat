import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { NgIf, NgFor, NgClass, CommonModule } from '@angular/common';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-card-list',
  standalone: true,
  imports: [NgIf, NgFor, CardComponent, CommonModule],
  templateUrl: './card-list.component.html',
  styleUrls: ['./card-list.component.scss']
})
export class CardListComponent<T = any> {
  /** Items to render */
  @Input() items: T[] = [];

  /** Visual layout */
  @Input() minColumnWidth = '240px'; // CSS length, e.g. 200px / 16rem
  @Input() gap = '1rem';

  /** States */
  @Input() loading = false;
  @Input() skeletonCount = 6; // number of skeleton cards when loading
  @Input() emptyMessage = 'No items to display.';
  @Input() errorMessage?: string;

  /** Interaction */
  @Input() clickable = false;          // makes each item wrapper clickable
  @Input() trackByKey?: keyof T;       // use a stable key if available
  @Output() itemClick = new EventEmitter<T>();

  /** Templates (provided by the consumer) */
  @ContentChild('item', { read: TemplateRef }) itemTpl?: TemplateRef<any>;
  @ContentChild('skeleton', { read: TemplateRef }) skeletonTpl?: TemplateRef<any>;
  @ContentChild('empty', { read: TemplateRef }) emptyTpl?: TemplateRef<any>;
  @ContentChild('error', { read: TemplateRef }) errorTpl?: TemplateRef<any>;

  trackBy = (_: number, item: T) =>
    this.trackByKey ? (item as any)?.[this.trackByKey] ?? _ : _;

  onItemClick(item: T) {
    if (this.clickable) this.itemClick.emit(item);
  }
}
