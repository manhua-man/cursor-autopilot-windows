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

const getCursorRulePath = () => {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    throw new Error('No workspace folder found. Please open a project folder in Cursor.');
  }
  return path.join(workspaceFolder.uri.fsPath, '.cursor', 'rules', 'after_each_chat.mdc');
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

const cursorRuleContent = `---
alwaysApply: true
---

At the end of each chat, save a JSON file with:

Path: ./tmp/summary-\${{date:YYYYMMDD-HHmmss}}.json

Fields:

summary: What was done in this chat

current_status: What's completed and what's left to do`;

const createCursorRule = () => {
  try {
    const rulePath = getCursorRulePath();
    const ruleDir = path.dirname(rulePath);
    
    // Create .cursor/rules directory if it doesn't exist
    if (!fs.existsSync(ruleDir)) {
      fs.mkdirSync(ruleDir, { recursive: true });
      console.log('[Autopilot] Created .cursor/rules directory');
    }
    
    // Create the rule file if it doesn't exist
    if (!fs.existsSync(rulePath)) {
      fs.writeFileSync(rulePath, cursorRuleContent);
      console.log('[Autopilot] Created Cursor rule file:', rulePath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[Autopilot] Error creating Cursor rule:', error);
    return false;
  }
};

export const load = () => {
  try {
    const configPath = getConfigPath();
    let configCreated = false;
    let ruleCreated = false;
    
    // Check if config file exists
    if (!fs.existsSync(configPath)) {
      console.log('[Autopilot] Creating default .autopilot.json configuration...');
      save(defaultConfig);
      configCreated = true;
    }
    
    // Check if cursor rule exists
    ruleCreated = createCursorRule();
    
    // Show appropriate message based on what was created
    if (configCreated || ruleCreated) {
      let message = 'Cursor Autopilot: ';
      const actions: string[] = [];
      
      if (configCreated) {
        message += 'Created .autopilot.json configuration file. ';
        actions.push('Open Config');
      }
      
      if (ruleCreated) {
        message += 'Created .cursor/rules/after_each_chat.mdc rule file. ';
        actions.push('Open Rule');
      }
      
      message += 'Please configure your adapters to get started.';
      
      vscode.window.showInformationMessage(message, ...actions).then(selection => {
        if (selection === 'Open Config') {
          vscode.workspace.openTextDocument(configPath).then(doc => {
            vscode.window.showTextDocument(doc);
          });
        } else if (selection === 'Open Rule') {
          const rulePath = getCursorRulePath();
          vscode.workspace.openTextDocument(rulePath).then(doc => {
            vscode.window.showTextDocument(doc);
          });
        }
      });
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
