import { openDB } from "idb";

const DB_NAME = "claude-dashboard";
const DB_VERSION = 1;
const STORE_NAME = "handles";
const HANDLE_KEY = "projectsFolder";

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function saveDirectoryHandle(
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, handle, HANDLE_KEY);
}

export async function getSavedDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await getDB();
  const handle = await db.get(STORE_NAME, HANDLE_KEY);
  return handle ?? null;
}

export async function clearDirectoryHandle(): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, HANDLE_KEY);
}

export async function queryPermission(
  handle: FileSystemDirectoryHandle
): Promise<"granted" | "denied" | "prompt"> {
  try {
    return await handle.queryPermission({ mode: "read" });
  } catch {
    return "denied";
  }
}

export async function requestPermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  try {
    if ((await handle.requestPermission({ mode: "read" })) === "granted")
      return true;
  } catch {
    // requestPermission can throw if no user gesture
  }
  return false;
}
