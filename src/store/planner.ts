'use client';

import { create } from 'zustand';
import { Plot, PlacedItem, Plan, Side } from '@/types';

interface PlannerState {
  // Plan meta
  planId: string | null;
  planName: string;
  planDescription: string;

  // Plot
  plot: Plot;
  setPlot: (plot: Plot) => void;

  // Items
  items: PlacedItem[];
  addItem: (item: PlacedItem) => void;
  updateItem: (id: string, patch: Partial<PlacedItem>) => void;
  removeItem: (id: string) => void;
  setItems: (items: PlacedItem[]) => void;

  // Selection
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;

  // Canvas view
  scale: number;
  setScale: (s: number) => void;
  panX: number;
  panY: number;
  setPan: (x: number, y: number) => void;

  // UI state
  showGrid: boolean;
  toggleGrid: () => void;
  snapToGrid: boolean;
  toggleSnap: () => void;
  gridSize: number;

  // Undo / Redo
  history: PlacedItem[][];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Load a full plan
  loadPlan: (plan: Plan) => void;
  setPlanMeta: (id: string | null, name: string, description: string) => void;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  planId: null,
  planName: 'My House Plan',
  planDescription: '',

  plot: { width: 40, height: 30, origin: 'A' as Side },
  setPlot: (plot) => set({ plot }),

  items: [],
  addItem: (item) => {
    get().pushHistory();
    set((s) => ({ items: [...s.items, item] }));
  },
  updateItem: (id, patch) => {
    set((s) => ({
      items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  },
  removeItem: (id) => {
    get().pushHistory();
    set((s) => ({
      items: s.items.filter((it) => it.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
  },
  setItems: (items) => set({ items }),

  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),

  scale: 20, // pixels per foot
  setScale: (scale) => set({ scale: Math.max(8, Math.min(60, scale)) }),
  panX: 60,
  panY: 60,
  setPan: (panX, panY) => set({ panX, panY }),

  showGrid: true,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  snapToGrid: true,
  toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  gridSize: 1, // 1 foot

  history: [],
  historyIndex: -1,
  pushHistory: () => {
    const { items, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(items)));
    set({ history: newHistory.slice(-50), historyIndex: newHistory.length - 1 });
  },
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    set({ items: JSON.parse(JSON.stringify(history[newIndex])), historyIndex: newIndex });
  },
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    set({ items: JSON.parse(JSON.stringify(history[newIndex])), historyIndex: newIndex });
  },

  loadPlan: (plan) => {
    set({
      planId: plan.id,
      planName: plan.name,
      planDescription: plan.description,
      plot: plan.plot,
      items: plan.items,
      selectedId: null,
      history: [],
      historyIndex: -1,
    });
  },
  setPlanMeta: (planId, planName, planDescription) =>
    set({ planId, planName, planDescription }),
}));
