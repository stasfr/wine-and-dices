import { FastifyInstance } from 'fastify';

import {
  getCharactersListHandler,
  getCharacterByIdHandler,
} from '@/modules/dices/modules/characters/dicesCharactersController.js';

export function dicesCharactersRoutes(server: FastifyInstance) {
  server.get('/list', getCharactersListHandler);
  server.get('/:characterId', getCharacterByIdHandler);
}
