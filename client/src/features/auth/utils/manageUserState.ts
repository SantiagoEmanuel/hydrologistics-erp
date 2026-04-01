import type { User } from "@Auth/types/user";

function saveUserState(user: User): void {
  sessionStorage.setItem("user", JSON.stringify(user));
  return;
}

function getUserState(): User | null {
  const user = sessionStorage.getItem("user");
  return user ? (JSON.parse(user) as User) : null;
}

function clearUserState(): void {
  sessionStorage.removeItem("user");
  cookieStore.delete("auth_token");
  return;
}

export { clearUserState, getUserState, saveUserState };
