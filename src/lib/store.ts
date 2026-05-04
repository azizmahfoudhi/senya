/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type {
  Batch,
  Expense,
  ExpenseCategory,
  FarmSettings,
  FarmState,
  IrrigationStatus,
  Scenario,
  TreeType,
  UUID,
} from "@/lib/domain";
import { demoSeed } from "@/lib/seed";

export type FarmActions = {
  resetToDemo(): void;
  setSettings(patch: Partial<FarmSettings>): void;

  addTreeType(nom: string, rendementMaxKgParArbre: number, isIntensive: boolean): void;
  updateTreeType(id: UUID, patch: Partial<TreeType>): void;
  removeTreeType(id: UUID): void;

  addBatch(input: Omit<Batch, "id">): void;
  updateBatch(id: UUID, patch: Partial<Batch>): void;
  removeBatch(id: UUID): void;

  addExpense(input: Omit<Expense, "id">): void;
  removeExpense(id: UUID): void;

  addScenario(input: Omit<Scenario, "id">): void;
  removeScenario(id: UUID): void;
};

type Store = FarmState & FarmActions;

const initial: FarmState = {
  settings: { surfaceHa: 0, prixKgOlives: 0, pluviometrieAnnuelleMm: 300 },
  types: [],
  lots: [],
  depenses: [],
  yields: [],
  tasks: [],
  treatments: [],
  scenarios: [],
};

export const useFarmStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initial,

      resetToDemo() {
        set(() => demoSeed());
      },

      setSettings(patch) {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
      },

      addTreeType(nom, rendementMaxKgParArbre, isIntensive) {
        const newType: TreeType = { id: uuid(), nom, rendementMaxKgParArbre, isIntensive };
        set((s) => ({ types: [newType, ...s.types] }));
      },
      updateTreeType(id, patch) {
        set((s) => ({
          types: s.types.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }));
      },
      removeTreeType(id) {
        const used = get().lots.some((l) => l.typeId === id);
        if (used) return;
        set((s) => ({ types: s.types.filter((t) => t.id !== id) }));
      },

      addBatch(input) {
        const batch: Batch = { id: uuid(), ...input };
        set((s) => ({ lots: [batch, ...s.lots] }));
      },
      updateBatch(id, patch) {
        set((s) => ({
          lots: s.lots.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        }));
      },
      removeBatch(id) {
        set((s) => ({
          lots: s.lots.filter((l) => l.id !== id),
          depenses: s.depenses.map((e) =>
            e.lotId === id ? { ...e, lotId: undefined } : e,
          ),
        }));
      },

      addExpense(input) {
        const e: Expense = { id: uuid(), ...input };
        set((s) => ({ depenses: [e, ...s.depenses] }));
      },
      removeExpense(id) {
        set((s) => ({ depenses: s.depenses.filter((e) => e.id !== id) }));
      },

      addScenario(input) {
        const sc: Scenario = { id: uuid(), ...input };
        set((s) => ({ scenarios: [sc, ...s.scenarios] }));
      },
      removeScenario(id) {
        set((s) => ({ scenarios: s.scenarios.filter((x) => x.id !== id) }));
      },
    }),
    {
      name: "olivierpilot.v1",
      version: 1,
      partialize: (s) => ({
        settings: s.settings,
        types: s.types,
        lots: s.lots,
        depenses: s.depenses,
        scenarios: s.scenarios,
      }),
      migrate: (persistedState: any) => persistedState as any,
    },
  ),
);

export function ensureBasics(state: FarmState) {
  const hasTypes = state.types.length > 0;
  const hasLots = state.lots.length > 0;
  if (!hasTypes || !hasLots) return demoSeed();
  return state;
}

export function categoryFromSelect(value: string): ExpenseCategory {
  const v = value as ExpenseCategory;
  return v;
}

export function irrigationFromSelect(value: string): IrrigationStatus {
  return (value as IrrigationStatus) ?? "non_irrigue";
}

