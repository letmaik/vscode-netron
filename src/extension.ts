import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.window.registerWebviewEditorProvider(
            'netron',
            {
                async resolveWebviewEditor(resource: vscode.Uri, editor: vscode.WebviewEditor): Promise<void> {
                    // https://github.com/microsoft/vscode/blob/master/extensions/image-preview/src/preview.ts
                    const resourceRoot = resource.with({
                        path: resource.path.replace(/\/[^\/]+?\.\w+$/, '/'),
                    });
                    editor.webview.options = { 
                        enableScripts: true,
                        localResourceRoots: [
                            resourceRoot
                        ]
                    }

                    NetronPanel.show(editor, context.extensionPath, resource)
                }
            }
        )
    )

	context.subscriptions.push(
		vscode.commands.registerCommand('netron.open', (resource: vscode.Uri) => {
            const panel = vscode.window.createWebviewPanel(
                NetronPanel.viewType,
                'Netron',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );
			NetronPanel.show(panel, context.extensionPath, resource);
		})
	);
}

class NetronPanel {
    public static readonly viewType = 'netron';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionPath: string;
    private readonly _resource: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static show(panel: vscode.WebviewPanel, extensionPath: string, resource: vscode.Uri) {
        new NetronPanel(panel, extensionPath, resource);
    }

    private constructor(panel: vscode.WebviewPanel, extensionPath: string, resource: vscode.Uri) {
        this._panel = panel;
        this._extensionPath = extensionPath;
        this._resource = resource

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public dispose() {
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview
        const indexPath = vscode.Uri.file(
            path.join(this._extensionPath, 'webview', 'index.html')
        )
        let html = fs.readFileSync(indexPath.fsPath, 'utf8');

        const modelUri = webview.asWebviewUri(this._resource)
        html = html.replace('%MODEL%', modelUri.toString())

        webview.html = html
    }
}

