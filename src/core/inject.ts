import * as vscode from 'vscode';

export const sendToChat = async (text: string) => {
  // Simply call the registered cursorInject.send command
  await vscode.commands.executeCommand('cursorInject.send', text);
};
