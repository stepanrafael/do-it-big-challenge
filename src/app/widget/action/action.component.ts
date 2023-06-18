import { Component, Input } from '@angular/core';

export type Action = {
  id: string;
  title: string;
  description: string;
  instruction: string;
  icon: string;
  disabled?: boolean;
};

@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.scss'],
})
export class ActionComponent {
  @Input() item!: Action;
}
