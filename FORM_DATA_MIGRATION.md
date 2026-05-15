# Миграция загрузки аватара с base64 на FormData

## Проблема

Текущая реализация endpoint'а `/api/users/avatar` использует `nuxt-file-storage`, который передаёт файлы через JSON в виде **base64 data URL**:

- Клиент: `useFileStorage()` конвертирует `File` → base64 строку
- Сервер: `storeFileLocally()` парсит `data:image/jpeg;base64,...` обратно в буфер

Это создаёт несколько проблем:

1. **Лишний трафик** — base64 даёт ~33% overhead на размер файла
2. **Сложная валидация** — приходится валидировать строку, а не бинарные данные. MIME-тип из JSON (`file.type`) и MIME-тип из data URL (`file.content`) могут расходиться, что даёт возможность для Content-Type spoofing
3. **Зависимость от `nuxt-file-storage`** — модуль заточен под base64 и не даёт прямого доступа к буферу файла для проверки magic bytes

## Решение

Перейти на нативный `multipart/form-data` через встроенную утилиту Nitro `readMultipartFormData(event)`.

### Преимущества

| Критерий | Base64 (сейчас) | FormData |
|----------|----------------|----------|
| Размер передачи | +33% overhead | Оригинальный размер |
| Валидация типа | Проверка строки/regexp | Проверка **magic bytes** через `file-type` |
| Валидация целостности | Сложно (нужно декодировать) | Просто — если `Buffer` валиден, файл валиден |
| Стандартность | Костыль через JSON | Нативный HTTP `multipart/form-data` |
| Зависимость | `nuxt-file-storage` | Чистый `h3` + `fs/promises` |

## Файлы, которые нужно изменить

### Клиент
- `modules/users/runtime/app/components/UserProfile.vue`
  - Убрать `useFileStorage()`
  - Использовать нативный `FormData` и `requestFetch('/api/users/avatar', { method: 'POST', body: formData })`

### Сервер
- `modules/users/runtime/server/api/users/avatar.post.ts`
  - Заменить `readValidatedBody` на `readMultipartFormData(event)`
  - Убрать `storeFileLocally`, писать файл напрямую через `fs/promises.writeFile`
  - Добавить валидацию через `file-type` (или `magic-bytes.js`) по буферу
  - Самостоятельно генерировать имя файла и проверять расширение

## Пример серверной реализации

```typescript
import { fileTypeFromBuffer } from 'file-type';
import { writeFile, rm } from 'fs/promises';
import { join } from 'path';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event);
  const file = formData?.find((f) => f.name === 'avatar');

  if (!file || !file.data) {
    throw createError({ status: 400, statusMessage: 'No file uploaded' });
  }

  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({ status: 400, statusMessage: 'File too large' });
  }

  const fileType = await fileTypeFromBuffer(file.data);

  if (
    !fileType ||
    !ALLOWED_MIME_TYPES.includes(fileType.mime as (typeof ALLOWED_MIME_TYPES)[number])
  ) {
    throw createError({ status: 400, statusMessage: 'Invalid file type' });
  }

  // ... сохранение файла, обновление БД
});
```

## Статус

**TODO** — требуется реализация.
