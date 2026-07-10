import { useMemo, useState } from "react";

export function useSearch<T>(items: T[], getText: (item: T) => string) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      getText(item).toLowerCase().includes(search.toLowerCase()),
    );
  }, [items, search, getText]);

  return {
    search,
    setSearch,
    filteredItems,
  };
}
