import type { User, UserLogin, UserRegister } from "@Auth/types/user";

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  restoreSession: () => Promise<void>;
  login: (userData: UserLogin) => Promise<void>;
  register: (userData: UserRegister) => Promise<void>;
  logout: () => Promise<void>;
  updateLoadingStatus: () => void;
}
