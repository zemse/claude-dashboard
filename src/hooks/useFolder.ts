import { useState, useCallback, useEffect } from "react";
import {
  saveDirectoryHandle,
  getSavedDirectoryHandle,
  clearDirectoryHandle,
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
      const granted = await requestPermission(handle);
      if (granted) {
        setState({ status: "ready", handle });
      } else {
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

  return { state, selectFolder, reconnect, disconnect };
}
