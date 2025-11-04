import { persist } from "zustand/middleware";
import { create, StateCreator } from "zustand";

type Store = {
  apiKey: string;
  setApiKey: (apiKey: string) => void;
};

const customStore: StateCreator<Store> = (set) => ({
  apiKey: "",
  setApiKey: (apiKey) => set({ apiKey }),
});

export const useKey = create<Store>()(
  persist(customStore, {
    name: "store",
  })
);
