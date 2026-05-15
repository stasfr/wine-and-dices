import {
  timestamp,
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';
import { defineRelations } from 'drizzle-orm';

const createdAt = timestamp('created_at', {
  mode: 'string',
  withTimezone: true,
})
  .defaultNow()
  .notNull();

const updatedAt = timestamp('updated_at', {
  mode: 'string',
  withTimezone: true,
});

const deletedAt = timestamp('deleted_at', {
  mode: 'string',
  withTimezone: true,
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email').notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  lastName: varchar('last_name'),
  firstName: varchar('first_name'),
  middleName: varchar('middle_name'),
  avatar: varchar('avatar'),
  createdAt,
  updatedAt,
  deletedAt,
});

export const userActivations = pgTable('user_activations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  createdAt,
});

export const gameModeEnum = pgEnum('game_mode', [
  'one_vs_one',
  'two_vs_two',
  'three_vs_three',
  'two_vs_two_vs_two',
  'king_of_the_hill',
]);

export const characters = pgTable('characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').unique().notNull(),
  ruName: text('ru_name').notNull(),
  key: text('key').unique().notNull(),
  createdAt,
  updatedAt,
  deletedAt,
});

export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  mode: gameModeEnum('mode').notNull(),
  comment: text('comment'),
  date: timestamp('date', {
    mode: 'string',
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  time: timestamp('time', {
    mode: 'string',
    withTimezone: true,
  }),
  createdAt,
  updatedAt,
  deletedAt,
});

export const gameParticipants = pgTable('game_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id')
    .notNull()
    .references(() => games.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
  userId: uuid('user_id').references(() => users.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
  playerName: text('player_name'),
  characterId: uuid('character_id')
    .notNull()
    .references(() => characters.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
  winner: boolean('winner').default(false).notNull(),
  teamIndex: integer('team_index').notNull(),
  createdAt,
  updatedAt,
  deletedAt,
});

export const relations = defineRelations(
  { users, userActivations, characters, games, gameParticipants },
  (r) => ({
    users: {
      activation: r.one.userActivations({
        from: r.users.id,
        to: r.userActivations.userId,
      }),
      games: r.many.games({
        from: r.users.id.through(r.gameParticipants.userId),
        to: r.games.id.through(r.gameParticipants.gameId),
      }),
      characters: r.many.characters({
        from: r.users.id.through(r.gameParticipants.userId),
        to: r.characters.id.through(r.gameParticipants.characterId),
      }),
    },
    games: {
      participants: r.many.users(),
      characters: r.many.characters(),
    },
    characters: {
      users: r.many.users(),
      games: r.many.games({
        from: r.characters.id.through(r.gameParticipants.characterId),
        to: r.games.id.through(r.gameParticipants.gameId),
      }),
    },
  }),
);
