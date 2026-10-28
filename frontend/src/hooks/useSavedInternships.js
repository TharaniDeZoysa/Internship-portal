import { useCallback, useMemo } from "react";
import { api } from "../api";
import { useAuth } from "../context/useAuth";
import { useApi } from "./useApi";

// Bookmarked internships for the logged-in student.
export function useSavedInternships() {
  const { role } = useAuth();
  const isStudent = role === "student";
  const { data, error, reload } = useApi(isStudent ? "/profile/saved" : null);

  const items = useMemo(() => data?.data ?? [], [data]);
  const ids = useMemo(() => new Set(items.map((item) => item._id)), [items]);

  const toggle = useCallback(
    async (id) => {
      await api(`/profile/saved/${id}`, { method: ids.has(id) ? "DELETE" : "POST" });
      reload();
    },
    [ids, reload]
  );

  return { isStudent, items, ids, toggle, error, reload };
}
