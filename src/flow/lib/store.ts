import { useSyncExternalStore } from "react";

import { DEMO_CHARACTERS, DEMO_SHOTS, type Character, type Shot } from "@/flow/data/demo";

export type FlowState = {
  shots: Shot[];
  characters: Character[];
};

const STORAGE_KEY = "flowaurora.state.v1";

function initialState(): FlowState {
  return { shots: DEMO_SHOTS, characters: DEMO_CHARACTERS };
}

function loadState(): FlowState {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FlowState>;
      if (Array.isArray(parsed.shots) && Array.isArray(parsed.characters)) {
        return { shots: parsed.shots, characters: parsed.characters };
      }
    }
  } catch {
    // corrupted state falls back to demo data
  }
  return initialState();
}

let state: FlowState = loadState();
const listeners = new Set<() => void>();

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable — in-memory state still works
  }
}

function setState(next: FlowState) {
  state = next;
  persist();
  listeners.forEach((listener) => listener());
}

export const flowStore = {
  getState: (): FlowState => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  addShots(shots: Shot[]) {
    setState({ ...state, shots: [...state.shots, ...shots] });
  },
  removeShot(id: string) {
    setState({ ...state, shots: state.shots.filter((shot) => shot.id !== id) });
  },
  addCharacter(character: Character) {
    setState({ ...state, characters: [...state.characters, character] });
  },
  removeCharacter(id: string) {
    setState({ ...state, characters: state.characters.filter((c) => c.id !== id) });
  },
  resetDemo() {
    setState(initialState());
  },
};

export function useFlow(): FlowState {
  return useSyncExternalStore(flowStore.subscribe, flowStore.getState, initialState);
}
