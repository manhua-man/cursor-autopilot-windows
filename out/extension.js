"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const store_1 = require("./core/store");
const dispatcher_1 = require("./core/dispatcher");
const watcher_1 = require("./core/watcher");
const adapters_1 = require("./adapters");
const inject_1 = require("./core/inject");
const OPEN_COMMANDS = ['composer.startComposerPrompt'];
const FOCUS_COMMANDS = ['aichat.newfollowupaction'];
const SUBMIT_COMMANDS = [
    'composer.submitComposerPrompt',
    'aichat.submitFollowupAction',
    'composer.sendPrompt',
    'cursor.chat.send'
];
const SEND_KEYBIND = 'cursor.sendKeyBinding';
function activate(ctx) {
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
    ctx.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => boot()));
}
function initAutopilot(ctx) {
    console.log('[Autopilot] init');
    // Commands -------------------------------------------------------------
    ctx.subscriptions.push(vscode.commands.registerCommand('cursorInject.send', async (text) => {
        text = text ?? await vscode.window.showInputBox({
            prompt: 'Enter text to inject into Cursor Chat',
            placeHolder: 'Type your message here…'
        });
        if (!text?.trim())
            return;
        await injectTextToChat(text);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('autopilot.test', async () => {
        const msg = `Test message ${new Date().toLocaleTimeString()} 🚀`;
        vscode.window.showInformationMessage(`Testing injection: ${msg}`);
        await injectTextToChat(msg);
    }));
    // Config + adapters ----------------------------------------------------
    const store = (0, store_1.load)();
    const actives = [];
    const needsConfig = store.adapters.some((name) => {
        const cfg = store[name];
        switch (name) {
            case 'telegram': return !cfg?.token || cfg.token === 'YOUR_BOT_TOKEN_HERE';
            case 'email': return !cfg?.user || cfg.user === 'your-email@gmail.com';
            case 'feishu': return !cfg?.appId || cfg.appId === 'cli_xxxxxxxxxxxxxxxxx';
            default: return false;
        }
    });
    if (needsConfig) {
        vscode.window.showWarningMessage('Cursor Autopilot: Please configure adapters in .autopilot.json', 'Open Config').then(sel => sel && openConfig());
    }
    store.adapters.forEach((name) => {
        const factory = adapters_1.adapterMap[name];
        if (!factory)
            return vscode.window.showWarningMessage(`Unknown adapter: ${name}`);
        try {
            actives.push(factory(store[name] || {}));
        }
        catch (e) {
            vscode.window.showErrorMessage(`Adapter ${name} init failed: ${e}`);
        }
    });
    actives.forEach(a => a.onReply(r => {
        const resp = r.trim() === '1' ? 'Continue ✅' : r.trim() === '2' ? 'Stop ❌' : r;
        (0, inject_1.sendToChat)(resp);
    }));
    (0, dispatcher_1.sub)('summary', s => {
        if (!(0, store_1.load)().enabled)
            return;
        actives.forEach(a => a.send(s).catch(e => console.error('[Autopilot]', e)));
    });
    const w = (0, watcher_1.watch)();
    if (w)
        ctx.subscriptions.push(w);
    vscode.window.showInformationMessage(`Autopilot ${store.enabled ? 'ON' : 'OFF'} | adapters: ${store.adapters.join(', ')}`);
}
function openConfig() {
    const root = vscode.workspace.workspaceFolders?.[0];
    if (!root)
        return;
    const p = root.uri.fsPath + '/.autopilot.json';
    vscode.workspace.openTextDocument(p).then(doc => vscode.window.showTextDocument(doc));
}
async function injectTextToChat(text) {
    // … unchanged …
}
/* ------------------------------------------------------------------ */
function deactivate() { }
//# sourceMappingURL=extension.js.map