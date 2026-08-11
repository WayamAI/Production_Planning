import "@testing-library/jest-dom/vitest";

// Polyfill for localStorage in Vitest environment
if (!global.localStorage) {
  const store: Record<string, string> = {};

  global.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => {
        delete store[key];
      });
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    length: 0,
  };

  Object.defineProperty(global.localStorage, "length", {
    get() {
      return Object.keys(store).length;
    },
  });
}
