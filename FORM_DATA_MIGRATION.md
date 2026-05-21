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

Перейти на нативный `multipart/form-data` через встроенную утилиту Nitro `readMultipartFormData(event)` или `readFormData(event)`.

### Выбор между `readMultipartFormData` и `readFormData`

| Критерий | `readMultipartFormData` | `readFormData` |
|----------|------------------------|----------------|
| Тип возвращаемого значения | Массив объектов `{ name, data, filename?, type? }` | Нативный `FormData` (Web API) |
| Доступ к буферу | `file.data` — сразу `Buffer` | `Buffer.from(await file.arrayBuffer())` — дополнительный шаг |
| API | Специфичный h3 | Стандартный Web API, знакомый фронтенд-разработчикам |
| Перспективность | Возвращён в h3 v2 для обратной совместимости ([#1120](https://github.com/h3js/h3/pull/1120)) | Базовый метод h3, более стабилен в долгосрочной перспективе |

**Рекомендация для аватаров**: `readMultipartFormData` — проще, так как сразу даёт `Buffer` для `file-type`. Для других сценариев рассмотреть `readFormData`.

### Преимущества

| Критерий | Base64 (сейчас) | FormData |
|----------|----------------|----------|
| Размер передачи | +33% overhead | Оригинальный размер |
| Валидация типа | Проверка строки/regexp | Проверка **magic bytes** через `file-type` |
| Валидация целостности | Сложно (нужно декодировать) | Просто — если `Buffer` валиден, файл валиден |
| Стандартность | Костыль через JSON | Нативный HTTP `multipart/form-data` |
| Зависимость | `nuxt-file-storage` | Чистый `h3` + `fs/promises` |

### Известные ограничения `readMultipartFormData`

Функция работает корректно для файлов до ~100MB и на стандартных Node.js-средах, но имеет задокументированные edge cases:

| Проблема | Проявление | Статус |
|----------|-----------|--------|
| Ошибка парсинга больших файлов (>100MB) | `Invalid array length` при `Array.push` | [Открыт](https://github.com/h3js/h3/issues/851), не исправлен |
| Пустой результат на Netlify | `body === []` вместо данных формы | [Закрыт как `not planned`](https://github.com/h3js/h3/issues/590) |
| Некорректный размер буфера на Azure Functions | `Buffer` имеет неверную длину | [Закрыт как `not planned`](https://github.com/h3js/h3/issues/1019) |
| Отсутствие стриминга | Весь файл загружается в память целиком | [Открыт](https://github.com/h3js/h3/issues/1155), обсуждение |

**Для аватаров (обычно <5MB) эти ограничения неактуальны.**

## Зависимости

- `file-type` — для проверки magic bytes. Актуальная версия **22.0.1** (апрель 2025). Пакет ESM-only, требует Node.js 22+.
- Альтернатива: `magic-bytes.js` — более лёгкий, но менее популярный.

## Файлы, которые нужно изменить

### Клиент
- `modules/users/runtime/app/components/UserProfile.vue`
  - Убрать `useFileStorage()`
  - Использовать нативный `FormData` и `requestFetch('/api/users/avatar', { method: 'POST', body: formData })`

### Сервер
- `modules/users/runtime/server/api/users/avatar.post.ts`
  - Заменить `readValidatedBody` на `readMultipartFormData(event)` (или `readFormData(event)`)
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

## Альтернативная реализация через `readFormData`

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
  const formData = await readFormData(event);
  const file = formData.get('avatar');

  if (!file || !(file instanceof Blob)) {
    throw createError({ status: 400, statusMessage: 'No file uploaded' });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.length > MAX_FILE_SIZE) {
    throw createError({ status: 400, statusMessage: 'File too large' });
  }

  const fileType = await fileTypeFromBuffer(buffer);

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
