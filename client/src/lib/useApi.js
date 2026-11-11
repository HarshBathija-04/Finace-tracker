import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

/** GETs `path` (skipped when null) and refetches when it changes; `reload` refetches on demand. */
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(path) });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!path) return;
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path, { signal: ctrl.signal })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => !ctrl.signal.aborted && setState((s) => ({ ...s, error, loading: false })));
    return () => ctrl.abort();
  }, [path, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}
