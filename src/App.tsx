import { useState, useCallback } from "react";
import "./App.css";
import { MapView } from "./components/MapView";
import { PolygonDrawer } from "./components/PolygonDrawer";
import { RouteDisplay } from "./components/RouteDisplay";
import { ControlPanel } from "./components/ControlPanel";
import { ResultStats } from "./components/ResultStats";
import { FieldDisplay } from "./components/FieldDisplay";
import { FieldManager } from "./components/FieldManager";
import { GpsMarker } from "./components/GpsMarker";
import { GpsPanel } from "./components/GpsPanel";
import { useFieldPolygon } from "./hooks/useFieldPolygon";
import { useRouteComputation } from "./hooks/useRouteComputation";
import { useGpsTracking } from "./hooks/useGpsTracking";
import { useSavedFields } from "./hooks/useSavedFields";
import { DEFAULT_CONFIG } from "./algorithm/types";
import type { PlannerConfig, SavedField } from "./algorithm/types";
import { parseImportedFile, readFileAsText } from "./utils/importFile";

function App() {
  const { polygon, updatePolygon, clearPolygon } = useFieldPolygon();
  const { route, error, compute, clearRoute } = useRouteComputation();
  const gps = useGpsTracking();
  const { fields, saveField, updateField, deleteField, importFields } = useSavedFields();
  const [config, setConfig] = useState<PlannerConfig>({ ...DEFAULT_CONFIG });
  const [isImported, setIsImported] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [followMode, setFollowMode] = useState(true);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCalculate = useCallback(() => {
    if (polygon) {
      compute(polygon, config);
    }
  }, [polygon, config, compute]);

  const handleClear = useCallback(() => {
    clearPolygon();
    clearRoute();
    setIsImported(false);
    setImportError(null);
    setActiveFieldId(null);
  }, [clearPolygon, clearRoute]);

  const handlePolygonCreated = useCallback(
    (p: Parameters<typeof updatePolygon>[0]) => {
      setIsImported(false);
      setImportError(null);
      clearRoute();
      updatePolygon(p);
      setActiveFieldId(null);
    },
    [updatePolygon, clearRoute],
  );

  const handleImportFile = useCallback(
    async (file: File) => {
      setImportError(null);
      try {
        const content = await readFileAsText(file);
        const fieldPolygon = parseImportedFile(content, file.name);
        updatePolygon(fieldPolygon);
        setIsImported(true);
        clearRoute();
        setActiveFieldId(null);
      } catch (e) {
        setImportError(
          e instanceof Error ? e.message : "ファイルの読み込みに失敗しました",
        );
      }
    },
    [updatePolygon, clearRoute],
  );

  const handleSaveField = useCallback(
    (name: string) => {
      if (!polygon) return;
      const saved = saveField(name, polygon, config);
      setActiveFieldId(saved.id);
    },
    [polygon, config, saveField],
  );

  const handleUpdateField = useCallback(
    (id: string) => {
      if (!polygon) return;
      updateField(id, polygon, config);
    },
    [polygon, config, updateField],
  );

  const handleLoadField = useCallback(
    (field: SavedField) => {
      updatePolygon(field.polygon);
      setConfig(field.config);
      setIsImported(true);
      setActiveFieldId(field.id);
      clearRoute();
      setImportError(null);
    },
    [updatePolygon, clearRoute],
  );

  const handleDeleteField = useCallback(
    (id: string) => {
      deleteField(id);
      if (activeFieldId === id) {
        setActiveFieldId(null);
      }
    },
    [deleteField, activeFieldId],
  );

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-label="メニュー"
      >
        {sidebarOpen ? "\u2715" : "\u2630"}
      </button>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <ControlPanel
          config={config}
          onConfigChange={setConfig}
          polygon={polygon}
          onCalculate={handleCalculate}
          onClear={handleClear}
          onImportFile={handleImportFile}
          hasRoute={route !== null}
          importError={importError}
        />
        <FieldManager
          fields={fields}
          polygon={polygon}
          activeFieldId={activeFieldId}
          onSave={handleSaveField}
          onUpdate={handleUpdateField}
          onLoad={handleLoadField}
          onDelete={handleDeleteField}
          onImportFields={importFields}
        />
        <ResultStats route={route} error={error} />
        <GpsPanel
          gps={gps}
          route={route}
          followMode={followMode}
          onStartTracking={gps.startTracking}
          onStopTracking={gps.stopTracking}
          onToggleFollow={() => setFollowMode((f) => !f)}
        />
      </div>
      <div className="map-container">
        <MapView>
          <PolygonDrawer
            onPolygonCreated={handlePolygonCreated}
            onPolygonCleared={clearPolygon}
          />
          <FieldDisplay polygon={polygon} isImported={isImported} />
          <RouteDisplay route={route} />
          {gps.isTracking && gps.position && (
            <GpsMarker
              position={gps.position}
              accuracy={gps.accuracy}
              followMode={followMode}
            />
          )}
        </MapView>
      </div>
    </>
  );
}

export default App;
