import * as v from 'valibot';
import crypto from 'node:crypto';
import {
  userActivations as userActivationsTable,
  users as usersTable,
} from '#server/db/schema/schema.js';

const passwordSchema = v.pipe(
  v.string(),
  v.minLength(8, 'Must be at least 8 characters'),
  v.maxLength(64, 'Must be at most 64 characters'),
  v.regex(/^\S*$/, 'Must not contain spaces'),
  v.regex(/[a-z]/, 'Must contain at least one lowercase letter'),
  v.regex(/[A-Z]/, 'Must contain at least one uppercase letter'),
  v.regex(/[0-9]/, 'Must contain at least one digit'),
  v.regex(/[\p{P}\p{S}]/u, 'Must contain at least one special character'),
);

const bodySchema = v.object({
  email: v.pipe(v.string(), v.minLength(1), v.email()),
  password: passwordSchema,
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
      statusMessage: 'Failed to create user',
    });
  }

  const { sendMail } = useNodeMailer();

  const hrefLink = `${config.clientProtocol}://${config.clientUrl}:${config.clientPort}`;
  const activationId = user.activation.id;

  await sendMail({
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Wine and Dices!</h2>
        <p>Thank you for registering. To complete your account setup, please click the button below:</p>
        <p>
          <a href="${hrefLink}/auth/activate/${activationId}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 6px;">Activate Account</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="${hrefLink}/auth/activate/${activationId}">${hrefLink}/auth/activate/${activationId}</a></p>
        <p>If you did not register on our website, you can safely ignore this email.</p>
        <p>Best regards,<br>Wine and Dices Team</p>
      </div>
    `,
    subject: 'Wine and Dices - Account Activation',
    text: `Hello!\n\nThank you for registering on Wine and Dices. Please activate your account by clicking the following link:\n\n${hrefLink}/auth/activate/${activationId}\n\nIf you did not register on our website, you can safely ignore this email.\n\nBest regards,\nWine and Dices Team`,
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
      avatar: user.avatar,
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
