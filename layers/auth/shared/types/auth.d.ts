declare module '#auth-utils' {
  interface User {
    id: string;
    email: string;
    isActive: boolean;
    firstName: string | null | undefined;
    lastName: string | null | undefined;
    middleName: string | null | undefined;
    avatar: string | null | undefined;
  }
}

export {};
