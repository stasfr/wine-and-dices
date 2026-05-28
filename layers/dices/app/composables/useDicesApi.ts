import type {
  ICharacter,
  ICreateGameBody,
  IGameDetail,
  IGameListItem,
} from '../types';

export default function useDicesApi() {
  const requestFetch = useRequestFetch();

  async function getCharactersList() {
    return await requestFetch<{ data: ICharacter[] }>(
      '/api/dices/characters/list',
    );
  }

  async function createGame(body: ICreateGameBody) {
    return await requestFetch('/api/dices/games/create', {
      method: 'POST',
      body,
    });
  }

  async function getGame(gameId: string) {
    return await requestFetch<{ data: IGameDetail }>(
      `/api/dices/games/${gameId}`,
    );
  }

  async function getGamesList(query: Record<string, string>) {
    return await requestFetch<{ data: IGameListItem[] }>(
      '/api/dices/games/list',
      {
        query,
      },
    );
  }

  return {
    getCharactersList,
    createGame,
    getGame,
    getGamesList,
  };
}
