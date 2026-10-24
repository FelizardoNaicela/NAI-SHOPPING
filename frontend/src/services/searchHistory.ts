const KEY = "marketplace-search-history";
const MAX_ITEMS = 10;

export function getSearchHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveSearchHistory(text: string) {
  const value = text.trim();

  if (!value) return;

  let history = getSearchHistory();

  history = history.filter(
    item => item.toLowerCase() !== value.toLowerCase()
  );

  history.unshift(value);

  history = history.slice(0, MAX_ITEMS);

  localStorage.setItem(KEY, JSON.stringify(history));
}

export function removeSearchHistory(text: string) {
  const history = getSearchHistory().filter(
    item => item !== text
  );

  localStorage.setItem(KEY, JSON.stringify(history));
}

export function clearSearchHistory() {
  localStorage.removeItem(KEY);
}