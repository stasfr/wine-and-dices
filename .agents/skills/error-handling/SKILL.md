---
name: error-handling
description: Patterns and best practices for handling errors on the client and server in this Nuxt project
---

### When to use

Use this skill when you need to:
- Handle API errors in Vue components or pages
- Show error toast notifications to users
- Throw errors from server API routes
- Add error handling to `useQuery` or `useMutation` calls
- Create new error handling patterns

---

### Project conventions

This project uses:
- **Nuxt 4** with `createError`, `useError`, `showError`, `<NuxtErrorBoundary>`
- **Pinia Colada** (`useQuery`, `useMutation`) for data fetching
- **@nuxt/ui** `useToast()` for user-facing notifications
- **Valibot** for validation
- **Shared layer** (`shared/`) for error utilities that run on both client and server

---

### Client-side error handling

#### 1. Always use the shared error utilities

Never write inline error message extraction like this:

```ts
// BAD — duplicated in 4+ files
let description = 'An error occurred';
if (typeof err === 'object' && err !== null && 'statusMessage' in err && typeof err.statusMessage === 'string') {
  description = err.statusMessage;
} else if (err instanceof Error) {
  description = err.message;
}
```

Use the shared utilities instead:

```ts
// GOOD
const { handleError, getErrorMessage, getErrorStatusCode } = useErrorHandler();

// Show a toast with the extracted message
handleError(err, { title: 'Failed to save' });

// Or extract the message manually
const msg = getErrorMessage(err, 'Custom fallback');

// Or check the HTTP status code
const code = getErrorStatusCode(err);
if (code === 404) { /* ... */ }
```

#### 2. `useMutation` errors

Always handle `onError` in mutations. Use the `useErrorHandler` composable:

```ts
const { handleError } = useErrorHandler();

const { mutate, asyncStatus } = useMutation({
  mutation: (data) => requestFetch('/api/something', { method: 'POST', body: data }),
  onSuccess: () => {
    toast.add({ title: 'Success', color: 'success' });
  },
  onError: (err) => {
    handleError(err, { title: 'Failed to save' });
  },
});
```

#### 3. `useQuery` errors

Destruct `error` from `useQuery` and display it in the UI. Do not silently ignore query errors:

```ts
const { data, isLoading, error } = useQuery({
  key: ['items'],
  query: () => requestFetch('/api/items'),
});
```

Template:

```vue
<div v-if="error" class="text-center py-8 text-error">
  {{ getErrorMessage(error) }}
</div>
<div v-else-if="isLoading">Loading...</div>
<div v-else>No items found</div>
```

#### 4. Imperative `try/catch` with `$fetch`

Use `useErrorHandler` for errors, but keep custom logic when needed:

```ts
const { handleError, getErrorStatusCode } = useErrorHandler();

try {
  await $fetch('/api/auth/login', { method: 'POST', body: data });
} catch (err: unknown) {
  const code = getErrorStatusCode(err);
  if (code === 404) {
    // Custom handling
    mode.value = 'register';
    toast.add({ title: 'Info', description: '...', color: 'info' });
  } else {
    handleError(err, { title: 'Login failed' });
  }
}
```

---

### Server-side error handling

#### 1. Always use `throw createError()`

Every server API route must use `throw createError()` for HTTP errors:

```ts
// GOOD
throw createError({ status: 401, statusMessage: 'Unauthorized' });
throw createError({ status: 404, statusMessage: 'User not found' });
throw createError({ status: 400, statusMessage: 'Invalid input' });
```

Do not use `new Error()` or raw strings for API errors:

```ts
// BAD
throw new Error('Unauthorized');
throw 'Unauthorized';
```

#### 2. Validate input with Valibot

Always validate `params`, `query`, and `body` before using them:

```ts
const bodySchema = v.object({
  email: v.pipe(v.string(), v.minLength(1), v.email()),
});

const { email } = await readValidatedBody(event, (data) => v.parse(bodySchema, data));
```

Validation failures are automatically handled by Nitro/Valibot with a 400 status.

#### 3. `statusMessage` vs `message`

- Use `statusMessage` for short, HTTP-compliant texts (e.g. "Not Found", "Unauthorized")
- Use `message` for longer, user-facing descriptions
- The client-side `getErrorMessage()` prefers `statusMessage` over `message`

---

### Shared layer reference

| File | Purpose |
|------|---------|
| `shared/types/errors.ts` | `FetchError` interface — defines the shape of HTTP errors |
| `shared/utils/errors.ts` | Pure functions: `getErrorMessage()`, `getErrorStatusCode()` |
| `app/composables/useErrorHandler.ts` | Vue composable wrapping `useToast()` + shared utilities |

---

### Nuxt error mechanisms (use when appropriate)

| Mechanism | When to use |
|-----------|-------------|
| `throw createError({ fatal: true })` | Trigger a full-screen error page (e.g. 404 page not found) |
| `showError()` | Imperatively show the error page from client code |
| `<NuxtErrorBoundary>` | Isolate errors inside a component subtree |
| `vue:error` hook (plugin) | Log or report unhandled Vue errors globally |
| `app:error` hook (plugin) | Log or report app startup errors globally |
| `error.vue` | Custom full-screen error page design |
| `clearError({ redirect: '/' })` | Recover from a fatal error page |

---

### Rules checklist

- [ ] Never write inline error message extraction — use `getErrorMessage()`
- [ ] Never ignore `useQuery` errors — destructure `error` and display it
- [ ] Always handle `useMutation` `onError` with `handleError()`
- [ ] Server routes always `throw createError()` with `status` and `statusMessage`
- [ ] Validate all API inputs with Valibot before processing
