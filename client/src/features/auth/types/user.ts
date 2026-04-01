export type User = {
  id: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "DRIVER" | "EMPLOYEE";
  isActive: boolean;
};

export type UserLogin = {
  username: string;
  password: string;
};

export interface UserRegister extends User {
  password: string;
}
