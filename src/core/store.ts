import fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';

const getConfigPath = () => {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    throw new Error('No workspace folder found. Please open a project folder in Cursor.');
  }
  return path.join(workspaceFolder.uri.fsPath, '.autopilot.json');
};

const defaultConfig = {
  enabled: true,
  adapters: ['telegram'],
  
  telegram: {
    token: 'YOUR_BOT_TOKEN_HERE',
    chatId: 'YOUR_CHAT_ID_HERE'
  },
  
  email: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'your-email@gmail.com',
    pass: 'your-app-password',
    to: 'recipient@example.com'
  },
  
  feishu: {
    appId: 'cli_xxxxxxxxxxxxxxxxx',
    appSecret: 'your_app_secret_here',
    useWebhook: false
  }
};

export const load = () => {
  try {
    const configPath = getConfigPath();
    
    // Check if file exists
    if (!fs.existsSync(configPath)) {
      console.log('[Autopilot] Creating default .autopilot.json configuration...');
      save(defaultConfig);
      vscode.window.showInformationMessage(
        'Cursor Autopilot: Created .autopilot.json configuration file. Please configure your adapters (Telegram, Email, or Feishu) to get started.',
        'Open Config'
      ).then(selection => {
        if (selection === 'Open Config') {
          vscode.workspace.openTextDocument(configPath).then(doc => {
            vscode.window.showTextDocument(doc);
          });
        }
      });
      return defaultConfig;
    }
    
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.error('[Autopilot] Error loading config:', error);
    return defaultConfig;
  }
};

export const save = (obj: any) => {
  try {
    const configPath = getConfigPath();
    fs.writeFileSync(configPath, JSON.stringify(obj, null, 2));
    console.log('[Autopilot] Configuration saved to:', configPath);
  } catch (error) {
    console.error('[Autopilot] Error saving config:', error);
    vscode.window.showErrorMessage(`Failed to save configuration: ${error}`);
  }
};
