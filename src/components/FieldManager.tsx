import { useState, useRef } from "react";
import type { SavedField, FieldPolygon } from "../algorithm/types";
import { exportFields, parseExportFile } from "../utils/exportData";
import { readFileAsText } from "../utils/importFile";

interface FieldManagerProps {
  fields: SavedField[];
  polygon: FieldPolygon | null;
  activeFieldId: string | null;
  onSave: (name: string) => void;
  onUpdate: (id: string) => void;
  onLoad: (field: SavedField) => void;
  onDelete: (id: string) => void;
  onImportFields: (fields: SavedField[]) => void;
}

export function FieldManager({
  fields,
  polygon,
  activeFieldId,
  onSave,
  onUpdate,
  onLoad,
  onDelete,
  onImportFields,
}: FieldManagerProps) {
  const [fieldName, setFieldName] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const name = fieldName.trim();
    if (!name) return;
    onSave(name);
    setFieldName("");
  };

  return (
    <div className="field-manager">
      <h2>圃場管理</h2>

      {/* Save current field */}
      {polygon && (
        <div className="field-save">
          {activeFieldId ? (
            <button
              className="btn btn-field-update"
              onClick={() => onUpdate(activeFieldId)}
            >
              上書き保存
            </button>
          ) : (
            <div className="field-save-form">
              <input
                type="text"
                placeholder="圃場名を入力"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <button
                className="btn btn-field-save"
                onClick={handleSave}
                disabled={!fieldName.trim()}
              >
                保存
              </button>
            </div>
          )}
          {activeFieldId && (
            <button
              className="btn btn-field-save-new"
              onClick={() => {
                const name = prompt("新しい圃場名を入力してください");
                if (name?.trim()) onSave(name.trim());
              }}
            >
              別名で保存
            </button>
          )}
        </div>
      )}

      {/* Field list */}
      {fields.length > 0 && (
        <ul className="field-list">
          {fields.map((f) => (
            <li
              key={f.id}
              className={`field-item ${f.id === activeFieldId ? "active" : ""}`}
            >
              <span className="field-name">{f.name}</span>
              <div className="field-actions">
                <button
                  className="btn-field-load"
                  onClick={() => onLoad(f)}
                  title="読込"
                >
                  読込
                </button>
                <button
                  className="btn-field-delete"
                  onClick={() => onDelete(f.id)}
                  title="削除"
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {fields.length === 0 && (
        <p className="hint">保存された圃場はありません</p>
      )}

      {/* Export / Import */}
      <div className="field-export-actions">
        {fields.length > 0 && (
          <button
            className="btn btn-field-export"
            onClick={() => exportFields(fields)}
          >
            エクスポート
          </button>
        )}
        <button
          className="btn btn-field-import"
          onClick={() => fileInputRef.current?.click()}
        >
          データ読込
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setImportError(null);
            try {
              const content = await readFileAsText(file);
              const imported = parseExportFile(content);
              onImportFields(imported);
            } catch (err) {
              setImportError(
                err instanceof Error ? err.message : "読み込みに失敗しました",
              );
            }
            e.target.value = "";
          }}
        />
      </div>
      {importError && <p className="import-error">{importError}</p>}
    </div>
  );
}
