import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import { users as usersTable } from '#server/db/schema/schema.js';

const bodySchema = v.object({
  files: v.array(
    v.object({
      name: v.string(),
      content: v.string(),
      size: v.number(),
      type: v.string(),
      lastModified: v.number(),
    }),
  ),
});

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default defineEventHandler(async (event) => {
  const db = useDb();
  const session = await requireUserSession(event);

  if (!session.user) {
    throw createError({ status: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readValidatedBody(event, (data) =>
    v.parse(bodySchema, data),
  );

  const files = body.files;

  if (!files || files.length === 0) {
    throw createError({ status: 400, statusMessage: 'No files uploaded' });
  }

  const file = files[0];

  if (!file) {
    throw createError({ status: 400, statusMessage: 'No files uploaded' });
  }

  const fileSize = Number(file.size);
  if (Number.isNaN(fileSize) || fileSize > MAX_FILE_SIZE) {
    throw createError({
      status: 400,
      statusMessage: 'File exceeds maximum size of 5MB',
    });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw createError({
      status: 400,
      statusMessage: `File type ${file.type} is not allowed. Allowed types: jpeg, png, gif, webp`,
    });
  }

  const userSelectResult = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      isActive: usersTable.isActive,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      middleName: usersTable.middleName,
      avatar: usersTable.avatar,
    })
    .from(usersTable)
    .where(eq(usersTable.id, session.user.id));

  const existingUser = userSelectResult[0];

  if (!existingUser) {
    throw createError({ status: 404, statusMessage: 'User not found' });
  }

  if (existingUser.avatar) {
    try {
      await deleteFile(existingUser.avatar, '');
    } catch {
      // ignore if file doesn't exist
    }
  }

  const fileName = await storeFileLocally(file as any, 16, '');

  const updateResult = await db
    .update(usersTable)
    .set({
      avatar: fileName,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(usersTable.id, session.user.id))
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      isActive: usersTable.isActive,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      middleName: usersTable.middleName,
      avatar: usersTable.avatar,
    });

  const user = updateResult[0];

  if (!user) {
    throw createError({ status: 404, statusMessage: 'User not found' });
  }

  await replaceUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      avatar: user.avatar,
    },
    loggedInAt: session.loggedInAt,
  });

  return { data: { avatar: fileName, avatarUrl: `/avatars/${fileName}` } };
});
