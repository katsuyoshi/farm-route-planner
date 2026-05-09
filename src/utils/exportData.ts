import type { SavedField } from "../algorithm/types";

interface ExportData {
  version: number;
  exportedAt: number;
  fields: SavedField[];
}

/**
 * Export saved fields as a downloadable JSON file.
 */
export function exportFields(fields: SavedField[]): void {
  const data: ExportData = {
    version: 1,
    exportedAt: Date.now(),
    fields,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  const a = document.createElement("a");
  a.href = url;
  a.download = `routes-export-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse an exported JSON file and return the saved fields.
 * Throws on invalid format.
 */
export function parseExportFile(content: string): SavedField[] {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error("JSONの解析に失敗しました。ファイル形式を確認してください。");
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("version" in data) ||
    !("fields" in data)
  ) {
    throw new Error(
      "圃場データの形式ではありません。エクスポートしたファイルを選択してください。",
    );
  }

  const exported = data as ExportData;

  if (exported.version !== 1) {
    throw new Error(
      `未対応のバージョンです（v${exported.version}）。アプリを更新してください。`,
    );
  }

  if (!Array.isArray(exported.fields) || exported.fields.length === 0) {
    throw new Error("ファイルに圃場データが含まれていません。");
  }

  return exported.fields;
}
