import {
  timestamp,
  pgTable,
  pgEnum,
  uuid,
  varchar,
  index,
  text,
  inet,
  boolean,
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

const expiresAt = timestamp('expires_at', {
  mode: 'string',
  withTimezone: true,
}).notNull();

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email').notNull().unique(),
  password: varchar('password').notNull(),
  isActive: boolean('is_active').default(false).notNull(),
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

export const userSessions = pgTable(
  'user_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    sessionToken: text('session_token').unique().notNull(),
    userAgent: text('user_agent').notNull(),
    userIp: inet('user_ip').notNull(),
    createdAt,
    expiresAt,
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
);

export const gameModeEnum = pgEnum('game_mode', [
  'one_vs_one',
  'two_vs_two',
  'three_vs_three',
  'king_of_the_hill',
]);

export const characters = pgTable('characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').unique().notNull(), // e.g. "John Doe"
  key: text('key').unique().notNull(), // e.g. "john-doe"
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
  createdAt,
  updatedAt,
  deletedAt,
});

export const relations = defineRelations(
  { users, userSessions, userActivations, characters, games, gameParticipants },
  (r) => ({
    userSessions: {
      user: r.one.users({
        from: r.userSessions.userId,
        to: r.users.id,
      }),
    },
    users: {
      sessions: r.many.userSessions(),
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
