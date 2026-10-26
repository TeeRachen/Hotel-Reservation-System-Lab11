export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}
export class User {
  id!: number;
  name!: string;
  email!: string;
  passwordHash!: string;
  role!: Role[];
}