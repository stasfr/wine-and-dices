# Code Audit Report — Wine and Dices

> Дата аудита: 2026-05-13
> Проанализировано: 19 Vue-компонентов, 14 server API endpoints, 3 Nuxt модуля, конфигурация проекта

---

## 🔴 Критично (баги / runtime-ошибки / архитектурные провалы)

| # | Проблема | Где |
|---|----------|-----|
| 6 | **Прямые импорты из внутренних путей модулей** — страницы импортируют `~~/modules/dice-throne-games/...`, нарушая границы модулей. | `app/pages/games/index.vue`, `[gameId].vue` |

---

## 🟡 Warning (потенциальные баги / неконсистентность / уязвимости)

| # | Проблема | Где |
|---|----------|-----|
| 11 | **Avatar: `file.content` не валидируется как base64/изображение** — возможна загрузка произвольного контента с поддельным MIME. | `users/avatar.post.ts` |
| 12 | **`tx.rollback()` + `return`** — `rollback()` никогда не возвращает управление (тип `never`), код после него мёртвый и вводит в заблуждение. | `auth/register.post.ts`, `dices/games/create.post.ts` |
| 13 | **Async `onMounted` без cleanup** — если компонент размонтируется во время `$fetch`, `toast.add`/`navigateTo` вызовутся на мёртвом компоненте. | `auth/activate/[activationId].vue` |
| 14 | **Неявная проверка `session.user` после `requireUserSession`** — `requireUserSession` уже бросает 401, проверка избыточна. | Множество файлов в `auth` и `users` |
| 15 | **`navigateTo('/games')` без `await`/`return`** в `onSuccess` коллбэке — в Nuxt 3 навигация должна возвращаться. | `CreateGameForm.vue:38` |
| 16 | **Хрупкий доступ к приватному API `UInputDate`** — `inputDateRef?.inputsRef?.[3]?.$el` зависит от внутренней реализации Nuxt UI. | `CreateGameForm.vue:378` |
| 17 | **Отсутствуют auth middleware** — страницы `/profile`, `/games/create` не защищены от неавторизованных пользователей на клиенте. | `app/middleware/` — директория отсутствует |
| 18 | **`runtimeConfig` не разделён на `public`/`private`** — `clientUrl`, `clientProtocol` и т.д. должны быть доступны на клиенте через `.public`. | `nuxt.config.ts` |
| 19 | **`nodemailer.auth.user`/`pass` захардкожены пустыми строками** — env-переменные могут не перезаписать их. | `nuxt.config.ts` |

---

## 🟢 Style / AGENTS.md нарушения

| # | Проблема | Где |
|---|----------|-----|
| 20 | **`?` в типах вместо явного `undefined`** — запрещено правилами проекта. | `create.ts`, `search.ts`, `GameParticipantForm.vue` |
| 21 | **Явно указаны return types у функций** — `getErrorMessage`, `validateWinners`, `validate`. | `UserProfile.vue`, `CreateGameForm.vue` |
| 22 | **Arrow function вместо function declaration** для `useGamesList`. | `app/queries/games.ts` |
| 23 | **`defineModel` с инлайн-типом вместо `interface Model`** | `GameParticipantForm.vue` |
| 24 | **Tailwind классы не кратные 2**: `-mx-2.5`, `gap-3`, `p-3`. | `AppHeader.vue`, `[gameId].vue` |
| 25 | **Type assertion `route.params.gameId as string`** — `params.gameId` может быть `string[]`. | `[gameId].vue:5` |
| 26 | **Type assertion для ошибки вместо type guard** | `auth/login.vue:87` |
| 27 | **`useUserSession().fetch()` внутри обработчика** — повторный вызов composable вместо деструктуризации на верхнем уровне. | `auth/login.vue:56,76` |
| 28 | **Конфликт Tailwind v3/v4** — `@nuxtjs/tailwindcss@6` (peer: Tailwind ~3.4) + `tailwindcss@4` + `@nuxt/ui@4` (сам управляет Tailwind). `@nuxtjs/tailwindcss` лишний. | `package.json` |
| 29 | **@nuxt/eslint, eslint, typescript в `dependencies`** — должны быть в `devDependencies`. | `package.json` |
| 30 | **Отсутствует `future: { compatibilityVersion: 4 }`** — Nuxt 4.4 работает в режиме обратной совместимости. | `nuxt.config.ts` |

---

## 💡 Архитектурные замечания

| # | Проблема | Где |
|---|----------|-----|
| 32 | **Tight coupling модулей с глобальной схемой БД**: Все модули напрямую импортируют таблицы из `#server/db/schema/schema.js`. `dice-throne-games` напрямую работает с `usersTable`, создавая кросс-модульную зависимость на уровне БД. | Все `modules/*/runtime/server/api/**/*.ts` |
| 33 | **REST пути с избыточными сегментами**: `dices/games/create.post.ts` и `dices/games/list.get.ts` — `create` и `list` лишние, достаточно `index.post.ts` / `index.get.ts`. | `modules/dice-throne-games/runtime/server/api/dices/games/` |
