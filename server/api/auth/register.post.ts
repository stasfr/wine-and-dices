import * as v from 'valibot';
import crypto from 'node:crypto';
import {
  userActivations as userActivationsTable,
  users as usersTable,
} from '#server/db/schema/schema.js';

const bodySchema = v.object({
  email: v.pipe(v.string(), v.minLength(1), v.email()),
  password: v.pipe(v.string(), v.minLength(1)),
});

export default defineEventHandler(async (event) => {
  const db = useDb();
  const config = useRuntimeConfig();
  const { password, email } = await readValidatedBody(event, (data) =>
    v.parse(bodySchema, data),
  );

  const user = await db.transaction(async (tx) => {
    const passwordHash = await hashPassword(password);
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

  const { sendMail } = useNodeMailer();

  const hrefLink = `${config.clientProtocol}://${config.clientUrl}:${config.clientPort}`;
  const activationId = user.activation.id;

  await sendMail({
    html: `
          <div>
            <span>Ссылка для активации аккаунта </span><a href="${hrefLink}/auth/activate/${activationId}">тык</a>
            <p>P.S. Потом письмо покрасивше будет, честно-честно</p>
          </div>
    `,
    subject: 'Активация аккаунта на Wine and Dices',
    text: 'Привет! Это тестовое сообщение, отправленное с помощью Nodemailer через Яндекс.Почту.',
    to: user.email,
  });

  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
    },
    loggedInAt: Date.now(),
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
