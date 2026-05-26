export interface IUserListItem {
  id: string;
  email: string;
  lastName: string | null;
  firstName: string | null;
  middleName: string | null;
  avatar: string | null;
}

export interface IUserProfile {
  id: string;
  email: string;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  middleName: string | null | undefined;
  avatar: string | null | undefined;
}
