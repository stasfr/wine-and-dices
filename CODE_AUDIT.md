## 🟡 Warning (потенциальные баги / неконсистентность / уязвимости)

| # | Проблема | Где |
|---|----------|-----|
| 11 | **Avatar: `file.content` не валидируется как base64/изображение** — возможна загрузка произвольного контента с поддельным MIME. | `users/avatar.post.ts` |
| 12 | **`tx.rollback()` + `return`** — `rollback()` никогда не возвращает управление (тип `never`), код после него мёртвый и вводит в заблуждение. | `auth/register.post.ts`, `dices/games/create.post.ts` |
| 13 | **Async `onMounted` без cleanup** — если компонент размонтируется во время `$fetch`, `toast.add`/`navigateTo` вызовутся на мёртвом компоненте. | `auth/activate/[activationId].vue` |
| 14 | **Неявная проверка `session.user` после `requireUserSession`** — `requireUserSession` уже бросает 401, проверка избыточна. | Множество файлов в `auth` и `users` |
| 15 | **`navigateTo('/games')` без `await`/`return`** в `onSuccess` коллбэке — в Nuxt 3 навигация должна возвращаться. | `CreateGameForm.vue:38` |
| 18 | **`runtimeConfig` не разделён на `public`/`private`** — `clientUrl`, `clientProtocol` и т.д. должны быть доступны на клиенте через `.public`. | `nuxt.config.ts` |
| 19 | **`nodemailer.auth.user`/`pass` захардкожены пустыми строками** — env-переменные могут не перезаписать их. | `nuxt.config.ts` |

---

## 💡 Архитектурные замечания

| # | Проблема | Где |
|---|----------|-----|
| 32 | **Tight coupling модулей с глобальной схемой БД**: Все модули напрямую импортируют таблицы из `#server/db/schema/schema.js`. `dice-throne-games` напрямую работает с `usersTable`, создавая кросс-модульную зависимость на уровне БД. | Все `modules/*/runtime/server/api/**/*.ts` |
| 33 | **REST пути с избыточными сегментами**: `dices/games/create.post.ts` и `dices/games/list.get.ts` — `create` и `list` лишние, достаточно `index.post.ts` / `index.get.ts`. | `modules/dice-throne-games/runtime/server/api/dices/games/` |
