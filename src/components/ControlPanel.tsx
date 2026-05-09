import { useRef } from "react";
import type { PlannerConfig, FieldPolygon, AngleMode } from "../algorithm/types";

interface ControlPanelProps {
  config: PlannerConfig;
  onConfigChange: (config: PlannerConfig) => void;
  polygon: FieldPolygon | null;
  onCalculate: () => void;
  onClear: () => void;
  onImportFile: (file: File) => void;
  hasRoute: boolean;
  importError: string | null;
}

export function ControlPanel({
  config,
  onConfigChange,
  polygon,
  onCalculate,
  onClear,
  onImportFile,
  hasRoute,
  importError,
}: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    }
  };

  return (
    <div className="control-panel">
      <h1 className="panel-title">田んぼルート最適化</h1>

      <div className="control-section">
        <h2>圃場データ</h2>
        <button
          className="btn btn-import"
          onClick={() => fileInputRef.current?.click()}
        >
          KML / GeoJSON をインポート
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".kml,.geojson,.json"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <p className="hint import-hint">
          Google マイマップからKMLエクスポート、または地図上でポリゴンを描画。
          KML内のポイントは出入り口として使用されます。
        </p>
        {polygon?.entryPoint && (
          <p className="entry-point-info">
            出入り口: 設定済み
          </p>
        )}
        {importError && <p className="import-error">{importError}</p>}
      </div>

      <div className="control-section">
        <h2>パラメータ設定</h2>

        <label className="control-label">
          作業幅 (m)
          <input
            type="number"
            min={0.5}
            max={20}
            step={0.5}
            value={config.workingWidth}
            onChange={(e) =>
              onConfigChange({
                ...config,
                workingWidth: Math.max(0.5, Number(e.target.value)),
              })
            }
          />
        </label>

        <label className="control-label">
          オーバーラップ率 (%)
          <input
            type="number"
            min={0}
            max={50}
            step={5}
            value={Math.round(config.overlapRatio * 100)}
            onChange={(e) =>
              onConfigChange({
                ...config,
                overlapRatio: Math.min(
                  0.5,
                  Math.max(0, Number(e.target.value) / 100),
                ),
              })
            }
          />
        </label>

        <label className="control-label">
          外周周回数
          <input
            type="number"
            min={0}
            max={10}
            step={1}
            value={config.headlandLaps}
            onChange={(e) =>
              onConfigChange({
                ...config,
                headlandLaps: Math.max(0, Math.min(10, Math.round(Number(e.target.value)))),
              })
            }
          />
        </label>

        <label className="control-label">
          走行方向
          <select
            value={config.angleMode}
            onChange={(e) =>
              onConfigChange({
                ...config,
                angleMode: e.target.value as AngleMode,
              })
            }
          >
            <option value="auto">自動（全方向探索）</option>
            <option value="east-west">東西方向（横）</option>
            <option value="north-south">南北方向（縦）</option>
            <option value="manual">角度を手動指定</option>
          </select>
        </label>

        {config.angleMode === "manual" ? (
          <label className="control-label">
            走査角度 (°)
            <input
              type="number"
              min={0}
              max={179}
              step={1}
              value={config.manualAngle}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  manualAngle: Math.max(0, Math.min(179, Number(e.target.value))),
                })
              }
            />
            <span className="angle-hint">0°=東西 / 90°=南北</span>
          </label>
        ) : (
          <label className="control-label">
            角度探索ステップ (°)
            <input
              type="number"
              min={1}
              max={30}
              step={1}
              value={config.angleStep}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  angleStep: Math.max(1, Math.min(30, Number(e.target.value))),
                })
              }
            />
          </label>
        )}
      </div>

      <div className="control-actions">
        <button
          className="btn btn-primary"
          onClick={onCalculate}
          disabled={!polygon}
        >
          ルート計算
        </button>
        <button
          className="btn btn-secondary"
          onClick={onClear}
          disabled={!polygon && !hasRoute}
        >
          クリア
        </button>
      </div>

      {!polygon && !importError && (
        <p className="hint">
          地図上でポリゴンを描くか、KMLファイルをインポートしてください
        </p>
      )}
    </div>
  );
}
