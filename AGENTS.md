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
  createError({ status: 400, statusMessage: 'some error' });
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
- if a component needs to use a ref on a tag or a custom component, it must strictly be done using `useTemplateRef`
- the variable from `useTemplateRef` must follow a strict naming convention:

1. the template must have a readable name, without prefixes like `ref`/`element`, etc. For example, `ref="someName"`
2. if the reference is to a native HTML element, add `El` to the variable name. For example, `someNameEl = useTemplateRef('someName')`
3. if the reference is to a custom component, add `Ref` to the variable name. For example, `someNameRef = useTemplateRef('someName')`

- Always use props, emits, and defineModel (except primitives for defineModel) in components via variables, and extract their types into separate interfaces inside the component's script tag

```vue
<!-- GOOD -->
<script setup lang="ts">
interface Props {
  someProp: string;
}

interface Emits {
  someEvent: [value: string];
}

interface Model {
  someModel: string;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const model = defineModel<Model>();
</script>

<template>
  <button @click="emit('someEvent', props.someProp)">
    {{ props.someProp }}
  </button>
</template>

<!-- BAD -->
<script setup lang="ts">
defineProps<{
  someProp?: string;
}>();

defineEmits<{
  someEvent: [value: string];
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
- In Vue components and composables, prefer using `ref` instead of `reactive`, even if `reactive` is used in the example
- Never extract Pinia Colada queries, mutations, or any Pinia Colada-related logic into separate files. Always define them directly inside the component that uses them
- For route params and queries on the client side, always use `@vueuse/router` composables (`useRouteParams`, `useRouteQuery`) instead of manual `route.params` / `route.query` access with type assertions

```typescript
// BAD
const route = useRoute();
const gameId = computed(() => route.params.gameId as string);

// GOOD
const gameId = useRouteParams<string>('gameId', '');
const page = useRouteQuery<string>('page', '1');
```

- All interactions with the user must be in Russian, but all content in the application must be in English.
