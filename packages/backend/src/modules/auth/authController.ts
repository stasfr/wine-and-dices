import { eq } from 'drizzle-orm';
import { FastifyReply, FastifyRequest } from 'fastify';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

import {
  userSessions as userSessionsTable,
  userActivations as userActivationsTable,
  users as usersTable,
} from '@/db/schema/schema.js';
import { hash, verify } from 'argon2';
import { hashSessionToken } from '@/utils/hash.js';

export async function registerHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const db = request.server.db;

  const body = request.body;
  const userAgent = request.headers['user-agent'];
  const userIp = request.ip;

  if (!userAgent) {
    throw new Error('Unauthorized: No user agent provided', { cause: 401 });
  }

  const { password, ...rest } = body as {
    email: string;
    password: string;
    name: string;
  };

  const passwordHash = await hash(password);

  const user = await db.transaction(async (tx) => {
    const userId = crypto.randomUUID();

    const [createdUser] = await tx
      .insert(usersTable)
      .values({
        ...rest,
        id: userId,
        password: passwordHash,
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const activationId = crypto.randomUUID();

    const [createdActivation] = await tx
      .insert(userActivationsTable)
      .values({
        id: activationId,
        userId: createdUser.id,
      })
      .returning();

    return {
      ...createdUser,
      activation: [createdActivation],
    };
  });

  const transporter = nodemailer.createTransport({
    auth: {
      pass: request.server.config.SMTP_PASSWORD,
      user: request.server.config.SMTP_USER,
    },
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
  });

  const hrefLink = request.server.config.FULL_CLIENT_URL;
  const activationId = user.activation[0].id;

  const mailOptions = {
    from: '"Wine and Dices" <sfworking@yandex.ru>',
    html: `
          <div>
            <span>Ссылка для активации аккаунта </span><a href="${hrefLink}/auth/activate/${activationId}">тык</a>
            <p>P.S. Потом письмо покрасивше будет, честно-честно</p>
          </div>
      `,
    subject: 'Активация аккаунта на Wine and Dices',
    text: 'Привет! Это тестовое сообщение, отправленное с помощью Nodemailer через Яндекс.Почту.',
    to: user.email,
  };

  await transporter.sendMail(mailOptions);

  const sessionToken = crypto.randomUUID();
  const hashedSessionToken = hashSessionToken(sessionToken);
  const session = {
    id: crypto.randomUUID(),
    sessionToken: hashedSessionToken,
    userAgent: userAgent,
    userId: user.id,
    userIp,
    expiresAt: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000).toISOString(),
  };

  await db.insert(userSessionsTable).values(session);

  reply.setCookie('sessionToken', sessionToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
    secure: request.server.config.NODE_ENV === 'production',
  });

  return await reply.status(201).send({
    data: {
      email: user.email,
      id: user.id,
      isActive: user.isActive,
    },
  });
}

export async function loginHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const db = request.server.db;

  const { email, password } = request.body as {
    email: string;
    password: string;
  };
  const userIp = request.ip;
  const userAgent = request.headers['user-agent'];

  const userResult = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!userResult.length) {
    throw new Error('Invalid email or password: User not found', {
      cause: 401,
    });
  }

  const user = userResult[0];

  const correctPassword = await verify(user.password, password);

  if (!correctPassword) {
    throw new Error('Invalid email or password: Password is incorrect', {
      cause: 401,
    });
  }

  const existingSessions = await db
    .select()
    .from(userSessionsTable)
    .where(eq(userSessionsTable.userId, user.id));

  if (existingSessions.length > 0) {
    for (const session of existingSessions) {
      await db
        .delete(userSessionsTable)
        .where(eq(userSessionsTable.id, session.id));
    }
  }

  const { id } = user;
  const sessionToken = crypto.randomUUID();
  const hashedSessionToken = hashSessionToken(sessionToken);

  if (!userAgent) {
    throw new Error('Unauthorized: No user agent provided', { cause: 401 });
  }

  const session: typeof userSessionsTable.$inferInsert = {
    expiresAt: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000).toISOString(),
    id: crypto.randomUUID(),
    sessionToken: hashedSessionToken,
    userAgent: userAgent,
    userId: id,
    userIp,
  };

  await db.insert(userSessionsTable).values(session);

  reply.setCookie('sessionToken', sessionToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
    secure: request.server.config.NODE_ENV === 'production',
  });

  return await reply.status(200).send();
}

export async function logoutHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const db = request.server.db;

  const sessionToken = request.cookies.sessionToken;

  if (!sessionToken) {
    throw new Error('Unauthorized: No session token provided', {
      cause: 401,
    });
  }

  const hashedSessionToken = hashSessionToken(sessionToken);

  await db
    .delete(userSessionsTable)
    .where(eq(userSessionsTable.sessionToken, hashedSessionToken));

  reply.clearCookie('sessionToken');

  return await reply.status(200);
}

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  const db = request.server.db;

  if (!request.user) {
    return await reply.code(401).send({ message: 'Unauthorized' });
  }

  const { id } = request.user;

  const userResult = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id));

  if (!userResult.length) {
    return await reply.code(404).send({ message: 'User not found' });
  }

  const user = userResult[0];

  const { email, isActive } = user;

  return await reply.status(200).send({
    data: {
      email,
      id,
      isActive,
    },
  });
}

export async function activateHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    throw new Error('Unauthorized: No user provided', { cause: 401 });
  }

  const { id: userId, isActive: userIsActive } = request.user;

  if (userIsActive === true) {
    throw new Error('User is already activated', { cause: 400 });
  }

  const db = request.server.db;
  const { activationId } = request.params as { activationId: string };

  const userActivationResult = await db
    .select()
    .from(userActivationsTable)
    .where(eq(userActivationsTable.id, activationId));

  if (!userActivationResult.length) {
    throw new Error('Activation link is invalid: Activation not found', {
      cause: 404,
    });
  }

  const userActivation = userActivationResult[0];

  if (userActivation.userId !== userId) {
    throw new Error('Activation link is invalid: User not found', {
      cause: 404,
    });
  }

  if (
    new Date(userActivation.createdAt) <
    new Date(Date.now() - 1000 * 60 * 60 * 24)
  ) {
    throw new Error('Activation expired', { cause: 404 });
  }

  await db
    .update(usersTable)
    .set({ isActive: true })
    .where(eq(usersTable.id, userId));

  return await reply.status(200).send();
}
