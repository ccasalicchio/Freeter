import { List } from '@/base/list';

export interface KanbanCard {
  id: number;
  title: string;
  description: string;
  color: string;
  columnIdx: number;
}

export interface KanbanState {
  cards: List<KanbanCard>;
  nextCardId: number;
}

export type GetKanbanState = () => KanbanState;
export type SetKanbanState = (state: KanbanState) => void;

export const cardColors = ['#4e9af1', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
