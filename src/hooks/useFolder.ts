import { useState, useCallback, useEffect } from "react";
import {
  saveDirectoryHandle,
  getSavedDirectoryHandle,
  clearDirectoryHandle,
  queryPermission,
  requestPermission,
} from "@/lib/storage";

type FolderState =
  | { status: "loading" }
  | { status: "no-handle" }
  | { status: "needs-permission"; handle: FileSystemDirectoryHandle }
  | { status: "ready"; handle: FileSystemDirectoryHandle };

export function useFolder() {
  const [state, setState] = useState<FolderState>({ status: "loading" });

  useEffect(() => {
    (async () => {
      const handle = await getSavedDirectoryHandle();
      if (!handle) {
        setState({ status: "no-handle" });
        return;
      }
      // queryPermission works without a user gesture
      const permission = await queryPermission(handle);
      if (permission === "granted") {
        setState({ status: "ready", handle });
      } else {
        // "prompt" or "denied" — need user click to re-grant
        setState({ status: "needs-permission", handle });
      }
    })();
  }, []);

  const selectFolder = useCallback(async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: "read" });
      await saveDirectoryHandle(handle);
      setState({ status: "ready", handle });
    } catch {
      // user cancelled
    }
  }, []);

  const setHandle = useCallback(async (handle: FileSystemDirectoryHandle) => {
    await saveDirectoryHandle(handle);
    setState({ status: "ready", handle });
  }, []);

  const reconnect = useCallback(async () => {
    if (state.status !== "needs-permission") return;
    const granted = await requestPermission(state.handle);
    if (granted) {
      setState({ status: "ready", handle: state.handle });
    }
  }, [state]);

  const disconnect = useCallback(async () => {
    await clearDirectoryHandle();
    setState({ status: "no-handle" });
  }, []);

  return { state, selectFolder, setHandle, reconnect, disconnect };
}
