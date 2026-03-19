import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

import {
  userSessions as userSessionsTable,
  userActivations as userActivationsTable,
  users as usersTable,
} from '@/db/schema/schema.js';
import { hash } from 'argon2';
import { hashSessionToken } from '@/utils/hash.js';

export default async function authRegister(fastify: FastifyInstance) {
  fastify.route({
    method: 'POST',
    url: '/v1/auth/register',
    schema: {
      body: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
        },
        required: ['email', 'password'],
      } as const,
    },
    handler: async (
      request: FastifyRequest<{ Body: { email: string; password: string } }>,
      reply: FastifyReply,
    ) => {
      const db = request.server.db;

      const body = request.body;
      const userAgent = request.headers['user-agent'];
      const userIp = request.ip;

      if (!userAgent) {
        throw new Error('Unauthorized: No user agent provided', { cause: 401 });
      }

      const { password, ...rest } = body;

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
        expiresAt: new Date(
          Date.now() + 60 * 60 * 24 * 30 * 1000,
        ).toISOString(),
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
    },
  });
}
