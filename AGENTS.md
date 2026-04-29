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
