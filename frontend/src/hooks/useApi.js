import { useCallback, useEffect, useState } from "react";
import { api } from "../api";

/**
 * Load data from the API.
 *   const { data, error, loading, reload } = useApi("/internships/mine");
 * Pass null as the path to skip loading (e.g. until a filter is ready).
 * Re-fetches whenever the path changes or reload() is called.
 */
export function useApi(path) {
  const [reloadCount, setReloadCount] = useState(0);
  const [state, setState] = useState({ key: null, data: null, error: "" });

  const key = path ? `${path}#${reloadCount}` : null;

  useEffect(() => {
    if (!path) return undefined;
    let active = true;
    api(path)
      .then((data) => active && setState({ key, data, error: "" }))
      .catch((err) => active && setState({ key, data: null, error: err.message }));
    return () => {
      active = false;
    };
  }, [path, key]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return {
    data: state.data,
    error: key && state.key === key ? state.error : "",
    loading: Boolean(key) && state.key !== key,
    reload,
  };
}
