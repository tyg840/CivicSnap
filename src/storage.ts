import { Issue, User } from "./types";

const STORAGE_KEYS = {
  user: "civicpulse_user",
  issues: "civicpulse_issues",
} as const;

const readJson = <T>(key: string): T | null => {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : null;
  } catch (error) {
    console.warn(`Unable to read localStorage key "${key}". Resetting cached value.`, error);
    window.localStorage.removeItem(key);
    return null;
  }
};

const writeJson = <T>(key: string, value: T) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const loadStoredUser = () => readJson<User>(STORAGE_KEYS.user);

export const saveStoredUser = (user: User) => {
  writeJson(STORAGE_KEYS.user, user);
};

export const clearStoredUser = () => {
  window.localStorage.removeItem(STORAGE_KEYS.user);
};

export const loadStoredIssues = () => readJson<Issue[]>(STORAGE_KEYS.issues);

export const saveStoredIssues = (issues: Issue[]) => {
  writeJson(STORAGE_KEYS.issues, issues);
};

export const resetStoredDevelopmentData = (seedIssues: Issue[]) => {
  window.localStorage.removeItem(STORAGE_KEYS.user);
  saveStoredIssues(seedIssues);
};
