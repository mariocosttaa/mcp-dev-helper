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
var __importStar = (this && this.__importStar) || (function() {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o) {
            var ar = [];
            for (var k in o)
                if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null)
            for (var k = ownKeys(mod), i = 0; i < k.length; i++)
                if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const http = __importStar(require("http"));
const API_BASE_URL = 'http://localhost:7777';
async function fetchDocumentation(projectId, docName) {
    return new Promise((resolve, reject) => {
        const url = `${API_BASE_URL}/api/docs/${encodeURIComponent(projectId)}/${encodeURIComponent(docName)}`;
        const request = http.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (response.statusCode === 200) {
                        resolve(json);
                    } else {
                        resolve({ error: json.error || 'Unknown error' });
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error}`));
                }
            });
        });
        request.on('error', (error) => {
            reject(error);
        });
        request.setTimeout(5000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

function getProjectId() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
    }
    // Use the name of the root workspace folder as project ID
    return workspaceFolders[0].name;
}

function getSelectedText() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return null;
    }
    const selection = editor.selection;
    if (selection.isEmpty) {
        // If nothing is selected, try to get the word at the cursor
        const wordRange = editor.document.getWordRangeAtPosition(selection.active);
        if (wordRange) {
            return editor.document.getText(wordRange);
        }
        return null;
    }
    return editor.document.getText(selection);
}

function createWebviewPanel(htmlContent, docName) {
    const panel = vscode.window.createWebviewPanel('mcp-dev-helper', `mcp-dev-helper: ${docName}`, vscode.ViewColumn.Beside, {
        enableScripts: true,
        retainContextWhenHidden: true,
    });
    // Wrap the HTML content with proper styling
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      padding: 20px;
      line-height: 1.6;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }
    h1, h2, h3, h4, h5, h6 {
      color: var(--vscode-textLink-foreground);
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    code {
      background-color: var(--vscode-textCodeBlock-background);
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    pre {
      background-color: var(--vscode-textCodeBlock-background);
      padding: 12px;
      border-radius: 5px;
      overflow-x: auto;
    }
    pre code {
      background-color: transparent;
      padding: 0;
    }
    a {
      color: var(--vscode-textLink-foreground);
    }
    blockquote {
      border-left: 4px solid var(--vscode-textBlockQuote-border);
      padding-left: 16px;
      margin-left: 0;
      color: var(--vscode-descriptionForeground);
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid var(--vscode-panel-border);
      padding: 8px;
    }
    th {
      background-color: var(--vscode-panel-background);
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
  `;
    panel.webview.html = fullHtml;
}
async function showDocumentation() {
    const projectId = getProjectId();
    if (!projectId) {
        vscode.window.showErrorMessage('No workspace folder found. Please open a workspace first.');
        return;
    }
    const selectedText = getSelectedText();
    if (!selectedText) {
        vscode.window.showWarningMessage('Please select text or place your cursor on a word to view its documentation.');
        return;
    }
    try {
        const response = await fetchDocumentation(projectId, selectedText);
        if (response.error) {
            if (response.error.includes('not found')) {
                vscode.window.showWarningMessage(`Documentation not found for "${selectedText}" in project "${projectId}".`);
            } else {
                vscode.window.showErrorMessage(`Error fetching documentation: ${response.error}`);
            }
            return;
        }
        if (response.htmlContent) {
            createWebviewPanel(response.htmlContent, selectedText);
        } else {
            vscode.window.showErrorMessage('No content received from server.');
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('ECONNREFUSED') ||
            errorMessage.includes('timeout')) {
            vscode.window.showErrorMessage('mcp-dev-helper server is not running. Please start it with "mcp-dev-helper start" in your terminal.');
        } else {
            vscode.window.showErrorMessage(`Failed to fetch documentation: ${errorMessage}`);
        }
    }
}

function activate(context) {
    const disposable = vscode.commands.registerCommand('mcp-dev-helper.showDoc', showDocumentation);
    context.subscriptions.push(disposable);
}

function deactivate() {
    // Cleanup if needed
}
//# sourceMappingURL=extension.js.map