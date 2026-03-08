import {
  timestamp,
  pgTable,
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

export const relations = defineRelations(
  { users, userSessions, userActivations },
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
    },
  }),
);
