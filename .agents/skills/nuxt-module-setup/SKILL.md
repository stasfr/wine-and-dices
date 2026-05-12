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

### Server handlers inside a module

Place server files under `modules/{name}/runtime/server/`. Nitro treats this directory exactly like the root `server/` folder.

- `runtime/server/api/hello.get.ts` → exposed at `/api/hello`
- `runtime/server/api/users/list.get.ts` → exposed at `/api/users/list`
- `runtime/server/api/users/[id].get.ts` → exposed at `/api/users/:id`
- `runtime/server/middleware/auth.ts` → runs as server middleware
- `runtime/server/utils/helpers.ts` → auto-imported in server code

Server files inside a module can use all the same aliases and imports as root server files (e.g. `#server/db/schema/schema.js`).

### Moving existing code into a module

1. Create the module directory structure under `modules/{name}/runtime/`
2. Copy or move files from `app/` or `server/` into the corresponding `runtime/` subdirectories
3. Register the directories in `index.ts` using the appropriate `add*` utility
4. Remove the original files to avoid duplicates
5. Run `pnpm nuxt prepare` and verify that dev server starts without errors

### Important notes

- Always use `resolver.resolve()` for paths inside `runtime/` so they are resolved relative to the module file.
- Do not manually import server utilities placed in `runtime/server/utils/` — Nitro auto-imports them just like it does for root `server/utils/`.
- File-based routing conventions are identical to the root `server/` directory: `.get.ts`, `.post.ts`, `[param].ts`, etc.
- If you only need to add a single custom route rather than scan an entire directory, use `addServerHandler` instead of `addServerScanDir`.
