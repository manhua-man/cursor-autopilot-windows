import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { pub } from './dispatcher';

export function watch() {
  const root = vscode.workspace.workspaceFolders?.[0];
  if (!root) return;

  // Watch fixed file: ".cursor/CHAT_SUMMARY"
  const cursorDir = path.join(root.uri.fsPath, '.cursor');
  const pattern = new vscode.RelativePattern(cursorDir, 'CHAT_SUMMARY');
  const watcher = vscode.workspace.createFileSystemWatcher(pattern);

  const safeRead = (u: vscode.Uri) => {
    try { 
      // Add small delay to ensure file write is complete
      setTimeout(() => {
        if (!fs.existsSync(u.fsPath)) {
          console.log(`[Autopilot] File not found: ${u.fsPath}`);
          return;
        }
        
        const content = fs.readFileSync(u.fsPath, 'utf8').trim();
        if (!content) {
          console.log(`[Autopilot] Empty file: ${u.fsPath}`);
          return;
        }
        
        console.log(`[Autopilot] Reading file: ${u.fsPath}`);
        
        const parsed = JSON.parse(content);
        
        // Validate required fields
        if (!parsed.summary && !parsed.current_status) {
          console.error(`[Autopilot] Invalid JSON structure: missing summary or current_status`);
          return;
        }
        
        pub('summary', parsed);
        console.log('[Autopilot] Published summary to adapters');
      }, 100);
    } catch (error) {
      console.error(`[Autopilot] Error reading/parsing file ${u.fsPath}:`, error);
    }
  };

  // Create .cursor directory if not exists
  if (!fs.existsSync(cursorDir)) {
    fs.mkdirSync(cursorDir, { recursive: true });
    console.log(`[Autopilot] Created directory: ${cursorDir}`);
  }

  watcher.onDidCreate(u => { 
    console.log('[Autopilot] CHAT_SUMMARY created');
    safeRead(u);
  });
  
  watcher.onDidChange(u => { 
    console.log('[Autopilot] CHAT_SUMMARY changed');
    safeRead(u);
  });

  console.log(`[Autopilot] Watching: ${path.join(cursorDir, 'CHAT_SUMMARY')}`);
  return watcher;
}
