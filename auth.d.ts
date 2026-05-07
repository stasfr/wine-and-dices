declare module '#auth-utils' {
  interface User {
    id: string;
    email: string;
    isActive: boolean;
    firstName?: string | null;
    lastName?: string | null;
    middleName?: string | null;
  }
}

export {};
