export const useGamesList = defineQuery(() => {
  const requestFetch = useRequestFetch();

  return useQuery({
    key: ['games'],
    query: () => requestFetch('/api/dices/games/list'),
  });
});
