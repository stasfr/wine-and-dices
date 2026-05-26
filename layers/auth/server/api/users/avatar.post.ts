import { eq } from 'drizzle-orm';
import { fileTypeFromBuffer } from 'file-type';
import { writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default defineEventHandler(async (event) => {
  const { db, users: usersTable } = useDb();
  const session = await requireUserSession(event);

  if (!session.user) {
    throw createError({ status: 401, statusMessage: 'Unauthorized' });
  }

  const formData = await readMultipartFormData(event);
  const file = formData?.find((f) => f.name === 'avatar');

  if (!file || !file.data) {
    throw createError({ status: 400, statusMessage: 'No file uploaded' });
  }

  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({
      status: 400,
      statusMessage: 'File exceeds maximum size of 5MB',
    });
  }

  const fileType = await fileTypeFromBuffer(file.data);

  if (
    !fileType ||
    !ALLOWED_MIME_TYPES.includes(
      fileType.mime as (typeof ALLOWED_MIME_TYPES)[number],
    )
  ) {
    throw createError({
      status: 400,
      statusMessage: 'Invalid file type. Allowed types: jpeg, png, gif, webp',
    });
  }

  const userSelectResult = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
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
      const oldPath = join(
        process.cwd(),
        'public',
        'avatars',
        existingUser.avatar,
      );
      await rm(oldPath, { force: true });
    } catch (error) {
      console.error('Failed to delete old avatar:', error);
    }
  }

  const ext = fileType.ext;
  const randomName = crypto.randomUUID();
  const fileName = `${randomName}.${ext}`;
  const filePath = join(process.cwd(), 'public', 'avatars', fileName);

  await writeFile(filePath, file.data);

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
