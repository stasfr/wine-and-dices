export interface ICreateGameBody {
  date: string;
  comment?: string;
  mode: string;
  participants: {
    playerName: string;
    characterId: string;
    winner: boolean;
    teamIndex: number;
  }[];
}
