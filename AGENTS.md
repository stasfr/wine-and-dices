# Rules for user tasks

- Never use "!" in ts code for missing fields or variables. Always add an additional if statement and check explicitly for field or variable exists

```typescript
interface User {
  id: string;
  name: string | undefined;
}

// BAD
const username = user.name!;

// GOOD
if (!user.name) {
  // or
  throw new Error('some error');
  // or
  return;
  // or
  createError({ status: 400, statusText: 'some error' });
}

const username = user.name;
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
  page: v.optional(
    v.pipe(v.string(), v.toNumber(), v.number(), v.integer(), v.minValue(1)),
    '1',
  ),
});

const { page } = await getValidatedQuery(event, (data) =>
  v.parse(querySchema, data),
);

// GOOD - body
const bodySchema = v.object({
  email: v.pipe(v.string(), v.minLength(1), v.email()),
});

const { email } = await readValidatedBody(event, (data) =>
  v.parse(bodySchema, data),
);
```

- To check TypeScript types, run `pnpm nuxt typecheck`
- Run all package related commands using `pnpm`
- Never split the code into multiple files (like vue composables or utility functions). Keep all related code in a single file. If the user asks to split into files, then split
- Always extract types into separate files in the types directory
- Always use tailwind v4 classes for styling. Always make their values multiples of 2 (`w-8`, `p-2` - this is good. `w-7`, `p-3` - this is bad)
- When using `useTemplateRef`, do not add the "Ref" suffix to the variable name. For component refs, use the component name as the variable name. For element refs, add the "Element" suffix to the variable name.

```typescript
// BAD
const fooRef = useTemplateRef('fooRef');

// GOOD - component ref
const foo = useTemplateRef('foo');

// GOOD - element ref
const fooElement = useTemplateRef('foo');
```

- Always use props in components via a variable, and extract their types into a separate interface inside the component's script tag

```vue
<!-- GOOD -->
<script setup lang="ts">
interface Props {
  someProp: string;
}

const props = defineProps<Props>();
</script>

<template>
  {{ props.someProp }}
</template>

<!-- BAD -->
<script setup lang="ts">
defineProps<{
  someProp?: string;
}>();
</script>

<template>
  {{ someProp }}
</template>
```

- Prefer interfaces over types
- Never use `?` in types. Explicitly indicate that a variable can be `undefined`
- Do not write function return types
- Prefer function declarations over arrow functions
- All interactions with the user must be in Russian, but all content in the application must be in English.
