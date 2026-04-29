import crypto from 'node:crypto';
import {
  userSessions as userSessionsTable,
  userActivations as userActivationsTable,
  users as usersTable,
} from '#server/db/schema/schema.js';
import { hash } from 'argon2';

export default defineEventHandler(async (event) => {
  const db = useDb();
  const config = useRuntimeConfig();
  const body = await readBody(event);

  if (!body) {
    throw createError({ status: 400, statusText: 'No body provided' });
  }

  if (!body.email) {
    throw createError({ status: 400, statusText: 'No email provided' });
  }

  if (!body.password) {
    throw createError({ status: 400, statusText: 'No password provided' });
  }

  const { password, email } = body as { password: string; email: string };
  const userAgent = getHeader(event, 'user-agent');
  const userIp = getRequestIP(event);

  if (!userAgent) {
    throw createError({
      status: 401,
      statusText: 'Unauthorized: No user agent provided',
    });
  }

  const user = await db.transaction(async (tx) => {
    const passwordHash = await hash(password);
    const userId = crypto.randomUUID();

    const [createdUser] = await tx
      .insert(usersTable)
      .values({
        id: userId,
        email,
        password: passwordHash,
      })
      .returning();

    if (!createdUser) {
      tx.rollback();
      return;
    }

    const activationId = crypto.randomUUID();

    const [createdActivation] = await tx
      .insert(userActivationsTable)
      .values({
        id: activationId,
        userId: createdUser.id,
      })
      .returning();

    if (!createdActivation) {
      tx.rollback();
      return;
    }

    return {
      ...createdUser,
      activation: createdActivation,
    };
  });

  if (!user || !user.activation) {
    throw createError({
      status: 500,
      statusText: 'Failed to create user',
    });
  }

  const mailer = useNodemailerClient();

  const hrefLink = `${config.clientProtocol}://${config.clientUrl}:${config.clientPort}`;
  const activationId = user.activation.id;

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

  await mailer.sendMail(mailOptions);

  const sessionToken = crypto.randomUUID();
  const hashedSessionToken = hashSessionToken(sessionToken);
  const session = {
    id: crypto.randomUUID(),
    sessionToken: hashedSessionToken,
    userAgent,
    userId: user.id,
    userIp,
    expiresAt: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000).toISOString(),
  };

  await db.insert(userSessionsTable).values(session);

  setCookie(event, 'sessionToken', sessionToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
  });

  setResponseStatus(event, 201);

  return {
    data: {
      email: user.email,
      id: user.id,
      isActive: user.isActive,
    },
  };
});
