export interface ICreateGameBody {
  date: string;
  time: string | null;
  comment: string | undefined;
  mode: string;
  isTie: boolean;
  participants: {
    playerName: string;
    userId: string | undefined;
    characterId: string;
    winner: boolean;
    ultimateCount: number;
    teamIndex: number;
  }[];
}
