import { useState, useCallback } from "react";
import type { SavedField, FieldPolygon, PlannerConfig } from "../algorithm/types";

const STORAGE_KEY = "routes-saved-fields";

function loadFromStorage(): SavedField[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedField[];
  } catch {
    return [];
  }
}

function saveToStorage(fields: SavedField[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
}

export function useSavedFields() {
  const [fields, setFields] = useState<SavedField[]>(loadFromStorage);

  const saveField = useCallback(
    (name: string, polygon: FieldPolygon, config: PlannerConfig): SavedField => {
      const now = Date.now();
      const newField: SavedField = {
        id: crypto.randomUUID(),
        name,
        polygon,
        config,
        createdAt: now,
        updatedAt: now,
      };
      setFields((prev) => {
        const updated = [...prev, newField];
        saveToStorage(updated);
        return updated;
      });
      return newField;
    },
    [],
  );

  const updateField = useCallback(
    (id: string, polygon: FieldPolygon, config: PlannerConfig) => {
      setFields((prev) => {
        const updated = prev.map((f) =>
          f.id === id ? { ...f, polygon, config, updatedAt: Date.now() } : f,
        );
        saveToStorage(updated);
        return updated;
      });
    },
    [],
  );

  const deleteField = useCallback((id: string) => {
    setFields((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const getField = useCallback(
    (id: string): SavedField | undefined => {
      return fields.find((f) => f.id === id);
    },
    [fields],
  );

  const importFields = useCallback((newFields: SavedField[]) => {
    setFields((prev) => {
      const byId = new Map(prev.map((f) => [f.id, f]));
      for (const f of newFields) {
        const existing = byId.get(f.id);
        if (!existing || f.updatedAt > existing.updatedAt) {
          byId.set(f.id, f);
        }
      }
      const updated = Array.from(byId.values());
      saveToStorage(updated);
      return updated;
    });
  }, []);

  return { fields, saveField, updateField, deleteField, getField, importFields };
}
