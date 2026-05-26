import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';

export default defineAuthenticatedHandler(async (event, session) => {
  const { db, userActivations: userActivationsTable } = useDb();
  const config = useRuntimeConfig();

  if (session.user.isActive) {
    throw createError({
      status: 400,
      statusMessage: 'User is already activated',
    });
  }

  const existingActivations = await db
    .select()
    .from(userActivationsTable)
    .where(eq(userActivationsTable.userId, session.user.id));

  if (existingActivations.length > 0) {
    await db
      .delete(userActivationsTable)
      .where(eq(userActivationsTable.userId, session.user.id));
  }

  const activationId = crypto.randomUUID();

  const [createdActivation] = await db
    .insert(userActivationsTable)
    .values({
      id: activationId,
      userId: session.user.id,
    })
    .returning();

  if (!createdActivation) {
    throw createError({
      status: 500,
      statusMessage: 'Failed to create activation',
    });
  }

  const { sendMail } = useNodeMailer();

  const hrefLink = `${config.clientProtocol}://${config.clientUrl}:${config.clientPort}`;

  await sendMail({
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Activate your Wine and Dices account</h2>
        <p>To complete your account setup, please click the button below:</p>
        <p>
          <a href="${hrefLink}/auth/activate/${activationId}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 6px;">Activate Account</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="${hrefLink}/auth/activate/${activationId}">${hrefLink}/auth/activate/${activationId}</a></p>
        <p>If you did not request this email, you can safely ignore it.</p>
        <p>Best regards,<br>Wine and Dices Team</p>
      </div>
    `,
    subject: 'Wine and Dices - Account Activation',
    text: `Hello!\n\nPlease activate your Wine and Dices account by clicking the following link:\n\n${hrefLink}/auth/activate/${activationId}\n\nIf you did not request this email, you can safely ignore it.\n\nBest regards,\nWine and Dices Team`,
    to: session.user.email,
  });

  setResponseStatus(event, 200);

  return;
});
