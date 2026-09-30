'use client';
import { create } from 'zustand';
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from 'zustand/middleware';
import type { DiagnosticKind } from '../lib/concepts';
import { activities } from '../data/activities';
import {
  emptySession,
  submit,
  rewind,
  validateStoredSession,
  type Session,
} from '../lib/tutor';

export const STORAGE_KEY = 'geometria-dojo-v1';
const memory: Record<string, string> = {};
let durable = true;
function storageUnavailable() {
  if (!durable) return;
  durable = false;
  queueMicrotask(() => useGeometryStore.setState({ durable: false }));
}
const storage: StateStorage = {
  getItem: key => {
    try {
      return localStorage.getItem(key);
    } catch {
      storageUnavailable();
      return memory[key] ?? null;
    }
  },
  setItem: (key, value) => {
    memory[key] = value;
    try {
      localStorage.setItem(key, value);
    } catch {
      storageUnavailable();
    }
  },
  removeItem: key => {
    delete memory[key];
    try {
      localStorage.removeItem(key);
    } catch {
      storageUnavailable();
    }
  },
};
interface GeometryState {
  sessions: Record<string, Session>;
  selected: string;
  theme: 'dark' | 'light';
  hydrated: boolean;
  durable: boolean;
  select: (id: string) => void;
  tool: (id: string, tool: string, rationale: string) => void;
  submit: (id: string, answer: string, evidence: string) => void;
  hint: (id: string, step: string) => void;
  rewind: (id: string, step: string) => void;
  diagnose: (
    id: string,
    step: string,
    message: string,
    kind: DiagnosticKind,
  ) => void;
  reset: (id: string) => void;
  clear: () => void;
  toggleTheme: () => void;
}
export const useGeometryStore = create<GeometryState>()(
  persist(
    set => ({
      sessions: {},
      selected: 'altura-ortocentro',
      theme: 'light',
      hydrated: false,
      durable: true,
      select: selected => set({ selected }),
      tool: (id, tool, rationale) =>
        set(s => ({
          sessions: {
            ...s.sessions,
            [id]: { ...(s.sessions[id] ?? emptySession()), tool, rationale },
          },
        })),
      submit: (id, answer, evidence) =>
        set(s => ({
          sessions: {
            ...s.sessions,
            [id]: submit(
              id,
              s.sessions[id] ?? emptySession(),
              answer,
              evidence,
            ),
          },
        })),
      hint: (id, step) =>
        set(s => {
          const session = s.sessions[id] ?? emptySession();
          return {
            sessions: {
              ...s.sessions,
              [id]: {
                ...session,
                hints: {
                  ...session.hints,
                  [step]: Math.min(3, (session.hints[step] ?? 0) + 1),
                },
              },
            },
          };
        }),
      rewind: (id, step) =>
        set(s => ({
          sessions: {
            ...s.sessions,
            [id]: rewind(id, s.sessions[id] ?? emptySession(), step),
          },
        })),
      diagnose: (id, step, message, kind) =>
        set(s => {
          const session = s.sessions[id] ?? emptySession();
          return {
            sessions: {
              ...s.sessions,
              [id]: {
                ...session,
                firstDivergence: session.firstDivergence ?? {
                  step,
                  message,
                  kind,
                  corrected: false,
                },
              },
            },
          };
        }),
      reset: id =>
        set(s => ({ sessions: { ...s.sessions, [id]: emptySession() } })),
      clear: () => {
        set({ sessions: {}, selected: 'altura-ortocentro' });
        storage.removeItem(STORAGE_KEY);
      },
      toggleTheme: () =>
        set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => storage),
      skipHydration: true,
      partialize: s => ({
        sessions: s.sessions,
        selected: s.selected,
        theme: s.theme,
      }),
      merge: (persisted, current) => {
        const saved =
          persisted && typeof persisted === 'object'
            ? (persisted as Partial<GeometryState>)
            : {};
        const sessions = Object.fromEntries(
          Object.entries(saved.sessions ?? {})
            .filter(([id]) => !!activities[id])
            .map(([id, s]) => [id, validateStoredSession(id, s)]),
        );
        return {
          ...current,
          sessions,
          selected:
            typeof saved.selected === 'string' &&
            (!!activities[saved.selected] ||
              /^lista-[12]-q\d\d$/.test(saved.selected))
              ? saved.selected
              : 'altura-ortocentro',
          theme: saved.theme === 'dark' ? 'dark' : 'light',
        };
      },
    },
  ),
);
export async function hydrateGeometry(): Promise<void> {
  try {
    await useGeometryStore.persist.rehydrate();
  } finally {
    useGeometryStore.setState({ hydrated: true, durable });
  }
}
