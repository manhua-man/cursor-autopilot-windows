import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { pub } from './dispatcher';

export function watch() {
  const root = vscode.workspace.workspaceFolders?.[0];
  if (!root) return;

  // watch "./tmp/summary-*.json"
  const tmpDir = path.join(root.uri.fsPath, 'tmp');
  const pattern = new vscode.RelativePattern(tmpDir, 'summary-*.json');
  const watcher = vscode.workspace.createFileSystemWatcher(pattern);

  const safeRead = (u: vscode.Uri) => {
    try { return JSON.parse(fs.readFileSync(u.fsPath, 'utf8')); }
    catch { return null; }
  };

  watcher.onDidCreate(u => { const d = safeRead(u); if (d) pub('summary', d); });
  watcher.onDidChange(u => { const d = safeRead(u); if (d) pub('summary', d); });

  return watcher;
}
