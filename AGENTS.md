# Rules for user tasks

- Never use "!" in ts code for missing fields or variables. Always add an additional if statement and check explicitly for field or variable exists

```typescript
interface User {
  id: string;
  name: string | undefined;
}

// BAD
const username = user.name!

// GOOD
if (!user.name) {
  // or
  throw new Error('some error');
  // or
  return;
  // or
  createError({status: 400, statusText: 'some error'})
}

const username = user.name
```

- When creating API endpoints, always validate incoming data (params, query, body) using Valibot schemas

```typescript
// GOOD - router params
const paramsSchema = v.object({
  userId: v.pipe(v.string(), v.minLength(1)),
});

const params = await getValidatedRouterParams(event, (data) =>
  v.parse(paramsSchema, data),
);

// GOOD - query
const querySchema = v.object({
  page: v.optional(v.pipe(v.string(), v.toNumber(), v.number(), v.integer(), v.minValue(1)), '1'),
});

const { page } = await getValidatedQuery(event, (data) => v.parse(querySchema, data));

// GOOD - body
const bodySchema = v.object({
  email: v.pipe(v.string(), v.minLength(1), v.email()),
});

const { email } = await readValidatedBody(event, (data) => v.parse(bodySchema, data));
```

- To check TypeScript types, do not run `npx nuxt typecheck` or `npx vue-tsc` — they fail because `vue-tsc` and `@vue/language-core` are not installed in this project.  
  Use `tsc` directly against the generated Nuxt tsconfigs instead:
  - Server code: `npx tsc --noEmit --project .nuxt/tsconfig.server.json`
  - Client code: `npx tsc --noEmit --project .nuxt/tsconfig.app.json`
  If the `.nuxt` directory is missing, run `npx nuxt prepare` first.
