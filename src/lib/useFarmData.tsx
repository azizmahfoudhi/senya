"use client";

import * as React from "react";
import type { Batch, Expense, FarmSettings, Scenario, Treatment, TreeType, UUID, YieldRecord } from "@/lib/domain";
import {
  createBatch,
  createExpense,
  createTreeType,
  createYield,
  deleteBatch,
  deleteExpense,
  deleteTreeType,
  deleteYield,
  getOrCreateSettings,
  listBatches,
  listExpenses,
  listScenarios,

  listTreatments,
  listTreeTypes,
  listYields,
  updateSettings,
  updateTreeType as dbUpdateTreeType,
  updateBatch as dbUpdateBatch,
  updateExpense as dbUpdateExpense,
  createTreatment,
  updateTreatment as dbUpdateTreatment,
  deleteTreatment,
  updateYield as dbUpdateYield,
} from "@/lib/db";

export function useFarmData() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [settingsRowId, setSettingsRowId] = React.useState<UUID | null>(null);
  const [settings, setSettings] = React.useState<FarmSettings>({ surfaceHa: 0, prixKgOlives: 0 });
  const [types, setTypes] = React.useState<TreeType[]>([]);
  const [lots, setLots] = React.useState<Batch[]>([]);
  const [depenses, setDepenses] = React.useState<Expense[]>([]);
  const [treatments, setTreatments] = React.useState<Treatment[]>([]);
  const [yields, setYields] = React.useState<YieldRecord[]>([]);
  const [scenarios, setScenarios] = React.useState<Scenario[]>([]);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, t, l, d, sc, tr, y] = await Promise.all([
        getOrCreateSettings(),
        listTreeTypes(),
        listBatches(),
        listExpenses(),
        listScenarios(),
        listTreatments(),
        listYields(),
      ]);
      let fetchedTypes = t;
      if (fetchedTypes.length === 0) {
        await Promise.all([
          createTreeType({ nom: "Chemlali", rendementMaxKgParArbre: 60, isIntensive: false }),
          createTreeType({ nom: "Koroneiki", rendementMaxKgParArbre: 45, isIntensive: true }),
          createTreeType({ nom: "Chétoui", rendementMaxKgParArbre: 55, isIntensive: false }),
          createTreeType({ nom: "Arbequina", rendementMaxKgParArbre: 40, isIntensive: true }),
        ]);
        fetchedTypes = await listTreeTypes();
      }

      setSettingsRowId(s.rowId);
      setSettings(s.settings);
      setTypes(fetchedTypes);
      setLots(l);
      setDepenses(d);
      setScenarios(sc);
      setTreatments(tr);
      setYields(y);
    } catch (e: any) {
      setError(e?.message ?? "Erreur Supabase");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const actions = React.useMemo(
    () => ({
      async setSettings(patch: Partial<FarmSettings>) {
        if (!settingsRowId) return;
        await updateSettings(settingsRowId, patch);
        setSettings((s) => ({ ...s, ...patch }));
      },

      async addTreeType(nom: string, rendementMaxKgParArbre: number, isIntensive: boolean = false) {
        const created = await createTreeType({ nom, rendementMaxKgParArbre, isIntensive });
        setTypes((t) => [created, ...t]);
      },
      async updateTreeType(id: UUID, input: Partial<Omit<TreeType, "id">>) {
        await dbUpdateTreeType(id, input);
        setTypes((t) => t.map((x) => (x.id === id ? { ...x, ...input } : x)));
      },
      async removeTreeType(id: UUID) {
        await deleteTreeType(id);
        setTypes((t) => t.filter((x) => x.id !== id));
      },

      async addBatch(input: Omit<Batch, "id">) {
        const created = await createBatch(input);
        setLots((l) => [created, ...l]);
      },
      async updateBatch(id: UUID, input: Partial<Omit<Batch, "id">>) {
        await dbUpdateBatch(id, input);
        setLots((l) => l.map((x) => (x.id === id ? { ...x, ...input } : x)));
      },
      async removeBatch(id: UUID) {
        await deleteBatch(id);
        setLots((l) => l.filter((x) => x.id !== id));
      },

      async addExpense(input: Omit<Expense, "id">) {
        const created = await createExpense(input);
        setDepenses((d) => [created, ...d]);
      },
      async updateExpense(id: UUID, input: Partial<Omit<Expense, "id">>) {
        await dbUpdateExpense(id, input);
        setDepenses((d) => d.map((x) => (x.id === id ? { ...x, ...input } : x)));
      },
      async removeExpense(id: UUID) {
        await deleteExpense(id);
        setDepenses((d) => d.filter((x) => x.id !== id));
      },



      async addTreatment(input: Omit<Treatment, "id">) {
        const created = await createTreatment(input);
        setTreatments((prev) => [created, ...prev]);
      },
      async updateTreatment(id: UUID, input: Partial<Omit<Treatment, "id">>) {
        await dbUpdateTreatment(id, input);
        setTreatments((prev) => prev.map((x) => (x.id === id ? { ...x, ...input } : x)));
      },
      async removeTreatment(id: UUID) {
        await deleteTreatment(id);
        setTreatments((prev) => prev.filter((x) => x.id !== id));
      },

      async addYield(input: Omit<YieldRecord, "id">) {
        const created = await createYield(input);
        setYields((prev) => [created, ...prev]);
      },
      async removeYield(id: UUID) {
        await deleteYield(id);
        setYields((prev) => prev.filter((x) => x.id !== id));
      },
      async updateYield(id: UUID, input: Partial<Omit<YieldRecord, "id">>) {
        await dbUpdateYield(id, input);
        setYields((prev) => prev.map((x) => (x.id === id ? { ...x, ...input } : x)));
      },
    }),
    [settingsRowId],
  );

  return {
    loading,
    error,
    refresh,
    settings,
    types,
    lots,
    depenses,
    treatments,
    yields,
    scenarios,
    actions,
  };
}
