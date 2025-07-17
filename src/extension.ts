import * as vscode from 'vscode';
import { load } from './core/store';
import { sub } from './core/dispatcher';
import { watch } from './core/watcher';
import { adapterMap, Adapter } from './adapters';
import { sendToChat } from './core/inject';

const OPEN_COMMANDS   = ['composer.startComposerPrompt'];
const FOCUS_COMMANDS  = ['aichat.newfollowupaction'];
const SUBMIT_COMMANDS = [
  'composer.submitComposerPrompt',
  'aichat.submitFollowupAction',
  'composer.sendPrompt',
  'cursor.chat.send'
];
const SEND_KEYBIND    = 'cursor.sendKeyBinding';

export function activate(ctx: vscode.ExtensionContext) {
  console.log('[Autopilot] activate');

  /** bootstrap once a workspace is present */
  const boot = () => {
    const root = vscode.workspace.workspaceFolders?.[0];
    if (!root) {
      console.log('[Autopilot] No workspace yet; waiting…');
      return; // will retry on workspace change
    }
    initAutopilot(ctx);
  };

  boot(); // first attempt on activation
  ctx.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => boot())
  );
}

function initAutopilot(ctx: vscode.ExtensionContext) {
  console.log('[Autopilot] init');

  // Commands -------------------------------------------------------------
  ctx.subscriptions.push(
    vscode.commands.registerCommand('cursorInject.send', async (text?: string) => {
      text = text ?? await vscode.window.showInputBox({
        prompt: 'Enter text to inject into Cursor Chat',
        placeHolder: 'Type your message here…'
      });
      if (!text?.trim()) return;
      await injectTextToChat(text);
    })
  );

  ctx.subscriptions.push(
    vscode.commands.registerCommand('autopilot.test', async () => {
      const msg = `Test message ${new Date().toLocaleTimeString()} 🚀`;
      vscode.window.showInformationMessage(`Testing injection: ${msg}`);
      await injectTextToChat(msg);
    })
  );

  // Config + adapters ----------------------------------------------------
  const store   = load();
  const actives: Adapter[] = [];

  const needsConfig = store.adapters.some((name: string) => {
    const cfg = store[name];
    switch (name) {
      case 'telegram': return !cfg?.token  || cfg.token  === 'YOUR_BOT_TOKEN_HERE';
      case 'email':    return !cfg?.user   || cfg.user   === 'your-email@gmail.com';
      case 'feishu':   return !cfg?.appId  || cfg.appId  === 'cli_xxxxxxxxxxxxxxxxx';
      default:         return false;
    }
  });

  if (needsConfig) {
    vscode.window.showWarningMessage(
      'Cursor Autopilot: Please configure adapters in .autopilot.json',
      'Open Config'
    ).then(sel => sel && openConfig());
  }

  store.adapters.forEach((name: string) => {
    const factory = adapterMap[name];
    if (!factory) return vscode.window.showWarningMessage(`Unknown adapter: ${name}`);
    try { actives.push(factory(store[name] || {})); }
    catch (e) { vscode.window.showErrorMessage(`Adapter ${name} init failed: ${e}`); }
  });

  actives.forEach(a => a.onReply(r => {
    const resp = r.trim()==='1' ? 'Continue ✅' : r.trim()==='2' ? 'Stop ❌' : r;
    sendToChat(resp);
  }));

  sub('summary', s => {
    if (!load().enabled) return;
    actives.forEach(a => a.send(s).catch(e => console.error('[Autopilot]', e)));
  });

  const w = watch(); if (w) ctx.subscriptions.push(w);

  vscode.window.showInformationMessage(
    `Autopilot ${store.enabled ? 'ON' : 'OFF'} | adapters: ${store.adapters.join(', ')}`
  );
}

function openConfig() {
  const root = vscode.workspace.workspaceFolders?.[0];
  if (!root) return;
  const p = root.uri.fsPath + '/.autopilot.json';
  vscode.workspace.openTextDocument(p).then(doc => vscode.window.showTextDocument(doc));
}

async function injectTextToChat(text: string) {
  // … unchanged …
}

/* ------------------------------------------------------------------ */

export function deactivate() {}
