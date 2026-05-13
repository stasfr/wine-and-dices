export interface ICreateGameBody {
  date: string;
  comment: string | undefined;
  mode: string;
  participants: {
    playerName: string;
    characterId: string;
    winner: boolean;
    teamIndex: number;
  }[];
}
