---
name: nuxt-module-setup
description: skill for creating, configuring and extending Nuxt modules with components, server handlers, composables and types
---

### When to use

Use this skill when you need to:
- Create a new Nuxt module in the `modules/` directory
- Add server API endpoints inside a module
- Register Vue components, composables or types from a module
- Extend an existing module with new runtime features
- Move existing app-level code (components, API routes, etc.) into a module

### Module structure

A Nuxt module must live in `modules/{module-name}/` and contain an `index.ts` entry file.

```
modules/{module-name}/
├── index.ts                          # module definition
├── types/                            # TypeScript declarations (module augmentations, global types)
│   └── auth.d.ts
└── runtime/
    ├── app/
    │   ├── components/               # Vue components auto-registered by the module
    │   ├── composables/              # Vue composables auto-registered by the module
    │   └── types/                    # TypeScript types exported by the module
    └── server/
        ├── api/                      # Server API routes (scanned by Nitro)
        ├── routes/                   # Server routes without /api prefix
        ├── middleware/               # Server middleware
        └── utils/                    # Server utilities and helpers
```

### Module entry file (`index.ts`)

Always use `defineNuxtModule` from `@nuxt/kit` together with `createResolver`.

```typescript
import {
  addComponentsDir,
  addServerScanDir,
  createResolver,
  defineNuxtModule,
} from 'nuxt/kit';

export default defineNuxtModule({
  meta: {
    name: 'module-name',
  },
  setup() {
    const resolver = createResolver(import.meta.url);

    // Register Vue components
    addComponentsDir({
      path: resolver.resolve('./runtime/app/components'),
      pathPrefix: false,
    });

    // Register server handlers (api, routes, middleware, utils)
    addServerScanDir(resolver.resolve('./runtime/server'));
  },
});
```

### Key `@nuxt/kit` utilities

| Utility | Purpose |
|---------|---------|
| `defineNuxtModule` | Creates a Nuxt module |
| `createResolver` | Resolves paths relative to the module file |
| `addComponentsDir` | Auto-registers Vue components |
| `addServerScanDir` | Scans `runtime/server` for API routes, middleware, utils |
| `addServerHandler` | Adds a single server handler with explicit route |
| `addServerImportsDir` | Auto-imports server utilities from a directory |
| `addServerPlugin` | Adds a Nitro runtime plugin |
| `addTypeTemplate` | Registers a `.d.ts` file in the generated `.nuxt/types/` directory |

### Server handlers inside a module

Place server files under `modules/{name}/runtime/server/`. Nitro treats this directory exactly like the root `server/` folder.

- `runtime/server/api/hello.get.ts` → exposed at `/api/hello`
- `runtime/server/api/users/list.get.ts` → exposed at `/api/users/list`
- `runtime/server/api/users/[id].get.ts` → exposed at `/api/users/:id`
- `runtime/server/middleware/auth.ts` → runs as server middleware
- `runtime/server/utils/helpers.ts` → auto-imported in server code

Server files inside a module can use all the same aliases and imports as root server files (e.g. `#server/db/schema/schema.js`).

### Type declarations inside a module

Use `addTypeTemplate` from `@nuxt/kit` to register `.d.ts` files that augment third-party modules or declare global types. Keep the declaration file inside the module (e.g. `modules/{name}/types/`) and reference it via `src` so you do not hard-code the text in `index.ts`.

```typescript
import {
  addServerScanDir,
  addTypeTemplate,
  createResolver,
  defineNuxtModule,
} from 'nuxt/kit';

export default defineNuxtModule({
  meta: {
    name: 'auth',
  },
  setup() {
    const resolver = createResolver(import.meta.url);

    addServerScanDir(resolver.resolve('./runtime/server'));

    addTypeTemplate(
      {
        src: resolver.resolve('./types/auth.d.ts'),
        filename: 'types/auth.d.ts',
      },
      { nitro: true, nuxt: true },
    );
  },
});
```

**Important:**
- By default `addTypeTemplate` registers types only for the **app** context. If the declaration is also used in server files (e.g. augmenting `#auth-utils`), pass `{ nitro: true, nuxt: true }` as the second argument.
- Nuxt 4 automatically includes `modules/*/shared/**/*` in `tsconfig.shared.json` and `tsconfig.app.json`, but **not** in `tsconfig.server.json`. Therefore, placing a `.d.ts` file in `modules/{name}/shared/` does **not** make it available to the server TypeScript context. Always use `addTypeTemplate` with `{ nitro: true }` for declarations that must be visible on the server.

### Moving existing code into a module

1. Create the module directory structure under `modules/{name}/runtime/`
2. Copy or move files from `app/` or `server/` into the corresponding `runtime/` subdirectories
3. Register the directories in `index.ts` using the appropriate `add*` utility
4. Remove the original files to avoid duplicates
5. Run `pnpm nuxt prepare` and verify that dev server starts without errors

### Auto-importing types for the client

If your module exposes TypeScript interfaces or types that should be available in Vue components without manual imports, register them via `addImports` with `type: true`.

```typescript
import {
  addComponentsDir,
  addImports,
  addServerScanDir,
  createResolver,
  defineNuxtModule,
} from 'nuxt/kit';

export default defineNuxtModule({
  meta: {
    name: 'module-name',
  },
  setup() {
    const resolver = createResolver(import.meta.url);

    addComponentsDir({
      path: resolver.resolve('./runtime/app/components'),
      pathPrefix: false,
    });

    addServerScanDir(resolver.resolve('./runtime/server'));

    // Auto-import types for the client
    addImports([
      { name: 'ITestInterface', as: 'ITestInterface', from: resolver.resolve('./runtime/app/types'), type: true },
    ]);
  },
});
```

**Important:**
- Always set `type: true` when registering pure type imports. Without this flag, Nuxt will treat the symbol as a runtime value and the generated `.nuxt/imports.d.ts` will emit a regular import instead of `import type`, which causes TypeScript errors when the symbol does not exist at runtime.
- The `from` path must resolve to a real file that exports the type. If you keep types in a directory (e.g. `runtime/app/types/`), point `from` to the concrete file (e.g. `runtime/app/types/index.ts`) or to a barrel file.
- Run `pnpm nuxt prepare` after changing `addImports` so that `.nuxt/imports.d.ts` is regenerated and the IDE picks up the new declarations.

### Important notes

- Always use `resolver.resolve()` for paths inside `runtime/` so they are resolved relative to the module file.
- Do not manually import server utilities placed in `runtime/server/utils/` — Nitro auto-imports them just like it does for root `server/utils/`.
- File-based routing conventions are identical to the root `server/` directory: `.get.ts`, `.post.ts`, `[param].ts`, etc.
- If you only need to add a single custom route rather than scan an entire directory, use `addServerHandler` instead of `addServerScanDir`.
