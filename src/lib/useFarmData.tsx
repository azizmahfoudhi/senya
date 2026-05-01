"use client";

import * as React from "react";
import type { Batch, Expense, FarmSettings, FarmTask, Harvest, Scenario, Treatment, TreeType, UUID } from "@/lib/domain";
import {
  createBatch,
  createExpense,
  createTreeType,
  deleteBatch,
  deleteExpense,
  deleteTreeType,
  getOrCreateSettings,
  listBatches,
  listExpenses,
  listScenarios,
  listTreeTypes,
  updateSettings,
  updateTreeType as dbUpdateTreeType,
  updateBatch as dbUpdateBatch,
  updateExpense as dbUpdateExpense,
  listHarvests, createHarvest, updateHarvest as dbUpdateHarvest, deleteHarvest,
  listTasks, createTask, updateTask as dbUpdateTask, deleteTask,
  listTreatments, createTreatment, updateTreatment as dbUpdateTreatment, deleteTreatment,
} from "@/lib/db";

export function useFarmData() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [settingsRowId, setSettingsRowId] = React.useState<UUID | null>(null);
  const [settings, setSettings] = React.useState<FarmSettings>({ surfaceHa: 0, prixKgOlives: 0 });
  const [types, setTypes] = React.useState<TreeType[]>([]);
  const [lots, setLots] = React.useState<Batch[]>([]);
  const [depenses, setDepenses] = React.useState<Expense[]>([]);
  const [harvests, setHarvests] = React.useState<Harvest[]>([]);
  const [tasks, setTasks] = React.useState<FarmTask[]>([]);
  const [treatments, setTreatments] = React.useState<Treatment[]>([]);
  const [scenarios, setScenarios] = React.useState<Scenario[]>([]);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await getOrCreateSettings();
      setSettingsRowId(s.rowId);
      setSettings(s.settings);

      const [t, l, d, sc, h, tk, tr] = await Promise.all([
        listTreeTypes(),
        listBatches(),
        listExpenses(),
        listScenarios(),
        listHarvests(),
        listTasks(),
        listTreatments(),
      ]);
      setTypes(t);
      setLots(l);
      setDepenses(d);
      setScenarios(sc);
      setHarvests(h);
      setTasks(tk);
      setTreatments(tr);
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

      async addTreeType(nom: string, rendementMaxKgParArbre: number) {
        const created = await createTreeType({ nom, rendementMaxKgParArbre });
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

      // Harvests
      async addHarvest(input: Omit<Harvest, "id">) {
        const created = await createHarvest(input);
        setHarvests((prev) => [created, ...prev]);
      },
      async updateHarvest(id: UUID, input: Partial<Omit<Harvest, "id">>) {
        await dbUpdateHarvest(id, input);
        setHarvests((prev) => prev.map((x) => (x.id === id ? { ...x, ...input } : x)));
      },
      async removeHarvest(id: UUID) {
        await deleteHarvest(id);
        setHarvests((prev) => prev.filter((x) => x.id !== id));
      },

      // Tasks
      async addTask(input: Omit<FarmTask, "id">) {
        const created = await createTask(input);
        setTasks((prev) => [created, ...prev]);
      },
      async updateTask(id: UUID, input: Partial<Omit<FarmTask, "id">>) {
        await dbUpdateTask(id, input);
        setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, ...input } : x)));
      },
      async removeTask(id: UUID) {
        await deleteTask(id);
        setTasks((prev) => prev.filter((x) => x.id !== id));
      },

      // Treatments
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
    harvests,
    tasks,
    treatments,
    scenarios,
    actions,
  };
}

