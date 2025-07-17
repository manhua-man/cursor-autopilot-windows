import fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';

const RULE_FILE = 'after-each-chat.mdc';   // unified file name 🔑

const getWorkspace = () => {
  const ws = vscode.workspace.workspaceFolders?.[0];
  if (!ws) throw new Error('No workspace folder found. Open a folder in Cursor.');
  return ws.uri.fsPath;
};

const getConfigPath = () => path.join(getWorkspace(), '.autopilot.json');
const getCursorRulePath = () => path.join(getWorkspace(), '.cursor', 'rules', RULE_FILE);

const defaultConfig = {
  enabled: true,
  adapters: ['telegram'],
  telegram: { token: 'YOUR_BOT_TOKEN_HERE', chatId: 'YOUR_CHAT_ID_HERE' },
  email:    {
    host: 'smtp.gmail.com', port: 587, secure: false,
    user: 'your-email@gmail.com', pass: 'your-app-password', to: 'recipient@example.com'
  },
  feishu:   { appId: 'cli_xxxxxxxxxxxxxxxxx', appSecret: 'your_app_secret_here', useWebhook: false }
};

const cursorRuleContent = `---
alwaysApply: true
---

At the end of each chat, save a JSON file with:

Path: ./tmp/summary-\${{date:YYYYMMDD-HHmmss}}.json

Fields:

summary: What was done in this chat
current_status: What's completed and what's left to do
`;

export const load = () => {
  try {
    ensureFiles();
    return JSON.parse(fs.readFileSync(getConfigPath(), 'utf8'));
  } catch (err: any) {
    vscode.window.showErrorMessage(`[Autopilot] Init failed: ${err.message ?? err}`);
    console.error('[Autopilot]', err);
    return defaultConfig;
  }
};

export const save = (obj: any) => {
  fs.writeFileSync(getConfigPath(), JSON.stringify(obj, null, 2));
  console.log('[Autopilot] Configuration saved');
};

function ensureFiles() {
  // .autopilot.json
  if (!fs.existsSync(getConfigPath())) {
    fs.writeFileSync(getConfigPath(), JSON.stringify(defaultConfig, null, 2));
    console.log('[Autopilot] Created default .autopilot.json');
  }

  // .cursor/rules/after-each-chat.mdc
  const rulePath = getCursorRulePath();
  if (!fs.existsSync(rulePath)) {
    fs.mkdirSync(path.dirname(rulePath), { recursive: true });
    fs.writeFileSync(rulePath, cursorRuleContent);
    console.log('[Autopilot] Created Cursor rule:', rulePath);
  }
}
