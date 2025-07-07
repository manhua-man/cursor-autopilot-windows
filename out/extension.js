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
const child_process_1 = require("child_process");
// ─────────────────────────────────────────────────────────────
// Cursor Composer Chat Automation util — FINAL FALLBACK EDITION
// If all in‑IDE commands fail, we spawn an OS‑level script that
// physically presses ⌘/Ctrl+Enter, which Composer always treats
// as “Send”. Works on macOS (osascript) and Linux (xdotool).
// ─────────────────────────────────────────────────────────────
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
    const disposable = vscode.commands.registerCommand('cursorInject.send', async () => {
        const text = await vscode.window.showInputBox({ prompt: '要发到 Composer 的内容' });
        if (!text)
            return;
        const cmds = await vscode.commands.getCommands(true);
        console.log('[cursorInject] available chat‑related commands:', cmds.filter(c => /composer|aichat|chat|prompt/i.test(c)));
        // 1️⃣ Open Composer
        for (const id of OPEN_COMMANDS) {
            if (cmds.includes(id)) {
                await vscode.commands.executeCommand(id);
                break;
            }
        }
        await delay(400);
        // 2️⃣ Focus input
        for (const id of FOCUS_COMMANDS) {
            if (cmds.includes(id)) {
                await vscode.commands.executeCommand(id);
                break;
            }
        }
        await delay(250);
        // 3️⃣ Paste text
        await vscode.env.clipboard.writeText(text);
        if (cmds.includes(SEND_KEYBIND)) {
            await vscode.commands.executeCommand(SEND_KEYBIND, {
                text: process.platform === 'darwin' ? 'cmd+v' : 'ctrl+v'
            });
        }
        else {
            await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
        }
        // 4️⃣ Submit prompt — try in‑IDE routes first
        let submitted = false;
        for (const id of SUBMIT_COMMANDS) {
            if (cmds.includes(id)) {
                await vscode.commands.executeCommand(id);
                submitted = true;
                break;
            }
        }
        if (!submitted && cmds.includes(SEND_KEYBIND)) {
            await vscode.commands.executeCommand(SEND_KEYBIND, {
                text: process.platform === 'darwin' ? 'cmd+enter' : 'ctrl+enter'
            });
            submitted = true;
        }
        if (!submitted) {
            console.log('[cursorInject] Fallback → OS‑level Cmd/Ctrl+Enter');
            await osLevelSend();
        }
    });
    ctx.subscriptions.push(disposable);
}
function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}
async function osLevelSend() {
    if (process.platform === 'darwin') {
        await execPromise(`osascript -e 'tell application "System Events" to keystroke return using {command down}'`);
    }
    else if (process.platform === 'linux') {
        await execPromise(`xdotool key ctrl+Return`);
    }
    else {
        vscode.window.showWarningMessage('OS‑level fallback not implemented for this platform. Please press Enter manually.');
    }
}
function execPromise(cmd) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(cmd, (err) => (err ? reject(err) : resolve()));
    });
}
function deactivate() { }
//# sourceMappingURL=extension.js.map