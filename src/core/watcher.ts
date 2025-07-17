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
    try { 
      const content = fs.readFileSync(u.fsPath, 'utf8');
      console.log(`[Autopilot] Reading file: ${u.fsPath}, content: ${content}`);
      
      const parsed = JSON.parse(content);
      
      // 验证必要字段
      if (!parsed.summary && !parsed.current_status) {
        console.error(`[Autopilot] Invalid JSON structure in ${u.fsPath}: missing summary or current_status`);
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error(`[Autopilot] Error reading/parsing file ${u.fsPath}:`, error);
      return null;
    }
  };

  // Track processed files to avoid duplicates
  const processedFiles = new Set<string>();
  
  // Get existing files and mark them as processed (don't send them)
  try {
    if (fs.existsSync(tmpDir)) {
      const existingFiles = fs.readdirSync(tmpDir)
        .filter(file => file.startsWith('summary-') && file.endsWith('.json'))
        .map(file => path.join(tmpDir, file));
      
      existingFiles.forEach(filePath => {
        processedFiles.add(filePath);
      });
      
      console.log(`[Autopilot] Marked ${existingFiles.length} existing summary files as processed`);
    }
  } catch (error) {
    console.error('[Autopilot] Error reading existing files:', error);
  }

  watcher.onDidCreate(u => { 
    if (!processedFiles.has(u.fsPath)) {
      const d = safeRead(u); 
      if (d) {
        processedFiles.add(u.fsPath);
        pub('summary', d);
        console.log('[Autopilot] Processing new summary file:', u.fsPath);
      }
    }
  });
  
  watcher.onDidChange(u => { 
    if (!processedFiles.has(u.fsPath)) {
      const d = safeRead(u); 
      if (d) {
        processedFiles.add(u.fsPath);
        pub('summary', d);
        console.log('[Autopilot] Processing changed summary file:', u.fsPath);
      }
    }
  });

  return watcher;
}
