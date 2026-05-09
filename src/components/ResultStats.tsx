import type { RouteResult } from "../algorithm/types";

interface ResultStatsProps {
  route: RouteResult | null;
  error: string | null;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function ResultStats({ route, error }: ResultStatsProps) {
  if (error) {
    return (
      <div className="result-stats error">
        <p>{error}</p>
      </div>
    );
  }

  if (!route) return null;

  return (
    <div className="result-stats">
      <h2>計算結果</h2>
      <dl>
        <dt>総走行距離</dt>
        <dd>{formatDistance(route.totalDistance)}</dd>
        <dt>内部走行</dt>
        <dd>{formatDistance(route.interiorDistance)}</dd>
        <dt>外周走行</dt>
        <dd>{formatDistance(route.headlandDistance)}</dd>
        <dt>内部パス数</dt>
        <dd>{route.passCount}</dd>
        <dt>走査角度</dt>
        <dd>{route.optimalAngle}°{route.optimalAngle <= 45 || route.optimalAngle >= 135 ? "（東西）" : route.optimalAngle >= 45 && route.optimalAngle <= 135 ? "（南北）" : ""}</dd>
        <dt>ターン数</dt>
        <dd>{route.turnCount}</dd>
        {route.entryPoint && (
          <>
            <dt>出入り口</dt>
            <dd>設定済み</dd>
          </>
        )}
      </dl>
      <div className="legend">
        <span className="legend-item">
          <span className="legend-line pass" /> 内部パス
        </span>
        <span className="legend-item">
          <span className="legend-line turn" /> ターン
        </span>
        <span className="legend-item">
          <span className="legend-line headland" /> 外周
        </span>
        <span className="legend-item">
          <span className="legend-line headland-transit" /> 空移動
        </span>
        {route.entryPoint && (
          <span className="legend-item">
            <span className="legend-dot entry" /> 出入り口
          </span>
        )}
        <span className="legend-item">
          <span className="legend-dot start" /> 開始
        </span>
        <span className="legend-item">
          <span className="legend-dot end" /> 終了
        </span>
      </div>
    </div>
  );
}
