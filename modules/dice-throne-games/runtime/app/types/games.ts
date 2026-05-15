export type GameMode =
  | 'one_vs_one'
  | 'two_vs_two'
  | 'three_vs_three'
  | 'two_vs_two_vs_two'
  | 'king_of_the_hill';

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

export interface IGameTeam {
  teamIndex: number;
  winner: boolean;
  participants: IGameParticipantDetail[];
}

export interface IGameListItem {
  id: string;
  mode: GameMode;
  comment: string | null;
  date: string;
  time: string | null;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  teams: IGameTeam[];
}

export interface IGameDetail {
  game: IGameListItem;
  teams: IGameTeam[];
}
