import { useState, useCallback } from "react";
import type {
  FieldPolygon,
  PlannerConfig,
  RouteResult,
} from "../algorithm/types";
import { planCoveragePath } from "../algorithm/coveragePlanner";

export function useRouteComputation() {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(
    (polygon: FieldPolygon, config: PlannerConfig) => {
      setError(null);
      try {
        if (polygon.coordinates.length < 4) {
          setError("ポリゴンには3つ以上の頂点が必要です");
          return;
        }
        const result = planCoveragePath(polygon, config);
        if (result.path.length < 2) {
          setError(
            "有効なルートを生成できませんでした。作業幅が圃場に対して大きすぎる可能性があります。",
          );
          return;
        }
        setRoute(result);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "ルート計算中にエラーが発生しました",
        );
      }
    },
    [],
  );

  const clearRoute = useCallback(() => {
    setRoute(null);
    setError(null);
  }, []);

  return { route, error, compute, clearRoute };
}
