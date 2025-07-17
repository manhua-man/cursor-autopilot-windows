<p align="center">
  <img src="./autopilot.png" alt="Cursor Autopilot Logo">
</p>
<p align="center">Remote control your Cursor AI coding sessions via Telegram, Gmail, and Feishu.</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.0.5-purple" alt="Version">
  <a href="https://open-vsx.org/extension/heyzgj/cursor-autopilot">
    <img src="https://img.shields.io/static/v1?label=Open%20VSX&message=Cursor%20Autopilot&color=blue&style=flat-square&logo=visual-studio-code&logoColor=white" alt="Open VSX">
  </a>
</p>

## Overview

The Cursor Autopilot automatically captures Cursor chat summaries, pushes them to your preferred communication channels, and allows you to inject replies back into Cursor to continue or stop the coding session. 

## Installation

### Marketplace Installation (Recommended)

To install Cursor Autopilot directly from the Extensions Marketplace:

| Step | Cursor |
| --- | --- |
| 1 | Open Cursor. |
| 2 | Search for Cursor Autopilot in the Extensions Marketplace (Ctrl/CMD-Shift-X). |
| 3 | Click **Install**. |
| 4 | Once installed, Cursor Autopilot will automatically create a `.autopilot.json` configuration file and `.cursor/rules/after_each_chat.mdc` rule file in your project root. |
| 5 | Configure your preferred adapter (Telegram, Gmail, or Feishu) in the `.autopilot.json` file. |

> [!NOTE]
> As a Cursor user, if you try to install from the Visual Studio Marketplace website banner you might find yourself in a state where VSCode has SpecStory installed but Cursor doesn't.

### Manual Installation

Alternatively, if you cannot find in Extension Marketplace, you can manually install the extension:

1.  **Clone the repository and install dependencies:**
    ```bash
    git clone https://github.com/heyzgj/cursor-autopilot
    cd cursor-autopilot
    npm install
    ```
2.  **Compile and package**:
    ```bash
    npm run compile
    npx vsce package
    ```
4.  **Move to project and install extension**:
    ```bash
    code --install-extension cursor-autopilot.vsix
    ```
5. **Restart Cursor** to activate the extension. The `.autopilot.json` file will be created automatically.

## Configuration

The extension automatically creates a `.autopilot.json` file in your project root when first activated. This file contains default configuration templates for all supported adapters.

**Example `.autopilot.json` structure:**

```json
{
  "enabled": true,
  "adapters": ["telegram"],
  
  "telegram": {
    "token": "YOUR_BOT_TOKEN_HERE",
    "chatId": "YOUR_CHAT_ID_HERE"
  },
  
  "email": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "user": "your-email@gmail.com",
    "pass": "your-app-password",
    "to": "recipient@example.com"
  },
  
  "feishu": {
    "appId": "cli_xxxxxxxxxxxxxxxxx",
    "appSecret": "your_app_secret_here",
    "useWebhook": false
  }
}
```

Simply replace the placeholder values with your actual configuration. The extension will show a warning message if configuration is needed.

### Cursor Rule Configuration

The extension automatically creates the required Cursor rule file at `.cursor/rules/after_each_chat.mdc`. This rule captures chat summaries for the autopilot to process.

**The rule content (automatically created):**

```yaml
---
alwaysApply: true
---

At the end of each chat, save a JSON file with:

Path: ./tmp/summary-${{date:YYYYMMDD-HHmmss}}.json

Fields:

summary: What was done in this chat

current_status: What's completed and what's left to do
```

The rule is set to `alwaysApply: true` to guarantee it's always active.

## Usage

1.  **Start Chat**: Initiate an AI chat session in Cursor.
2.  **Receive Notification**: Get a summary of the AI's progress on your configured external channel.
3.  **Reply with Instructions**:
    *   `1` = Continue AI work.
    *   `2` = Stop the current task.
    *   Any other text = Send custom instructions directly to the AI.
4.  **AI Continues**: The AI in Cursor will respond based on your input.

For practical usage examples and advanced workflows, see the [SETUP_GUIDE](docs/SETUP_GUIDE.md).

## Testing

You can test the extension's injection functionality:

*   **Quick Test**: Open Command Palette (`Cmd+Shift+P`) and execute `Inject text into Cursor Chat`, then type your message.

## Documentation

For comprehensive details on setup, usage, development, and troubleshooting, please refer to the [SETUP_GUIDE](docs/SETUP_GUIDE.md).

## Support

If you encounter any bugs or have feature requests, please open an issue on our [GitHub repository](https://github.com/heyzgj/cursor-autopilot/issues).

## Contributing

We welcome contributions! Please open a GitHub issue to discuss your ideas or proposed changes with the core team before submitting pull requests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for full details.

## Acknowledgments

*   Built specifically for the Cursor AI editor.
*   Inspired by the need for enhanced remote coding collaboration.

---

**⭐ Star this repo if you find it useful!**