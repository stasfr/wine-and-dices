interface CreateGameBody {
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

export const useCreateGame = defineMutation(() => {
  const requestFetch = useRequestFetch();

  const { mutate, ...mutation } = useMutation({
    mutation: (data: CreateGameBody) =>
      requestFetch('/api/dices/games/create', {
        method: 'POST',
        body: data,
      }),
  });

  return {
    ...mutation,
    createGame: mutate,
  };
});
