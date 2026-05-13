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
  participants: IGameParticipantDetail[];
}

export interface IGameParticipantDetail {
  id: string;
  playerName: string | null;
  winner: boolean;
  teamIndex: number;
  characterId: string;
  characterName: string | null;
  characterKey: string | null;
  userId: string | null;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  userMiddleName: string | null;
}

export interface IGameDetail {
  game: IGameListItem;
  participants: IGameParticipantDetail[];
}
