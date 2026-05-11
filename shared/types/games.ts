export type GameMode =
  | 'one_vs_one'
  | 'two_vs_two'
  | 'three_vs_three'
  | 'two_vs_two_vs_two'
  | 'king_of_the_hill';

export interface IGameListItem {
  id: string;
  mode: GameMode;
  comment: string | null;
  date: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}
