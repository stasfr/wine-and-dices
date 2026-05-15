export interface ICreateGameBody {
  date: string;
  comment: string | undefined;
  mode: string;
  participants: {
    playerName: string;
    userId: string | undefined;
    characterId: string;
    winner: boolean;
    teamIndex: number;
  }[];
}
