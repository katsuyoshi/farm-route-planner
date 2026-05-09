import { useState, useCallback } from "react";
import type { FieldPolygon } from "../algorithm/types";

export function useFieldPolygon() {
  const [polygon, setPolygon] = useState<FieldPolygon | null>(null);

  const updatePolygon = useCallback((p: FieldPolygon) => {
    setPolygon(p);
  }, []);

  const clearPolygon = useCallback(() => {
    setPolygon(null);
  }, []);

  return { polygon, updatePolygon, clearPolygon };
}
