import * as vscode from 'vscode';
import { DataGuardCodeLensProvider } from './codeLensProvider';
import { AnalysisRunner } from './analysisRunner';
import { DashboardPanel } from './dashboardPanel';
import { DecorationProvider } from './decorationProvider';

export function activate(context: vscode.ExtensionContext) {
    const codeLensProvider = new DataGuardCodeLensProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider({ language: 'python' }, codeLensProvider)
    );

    const analyzeCommand = vscode.commands.registerCommand('dataguard.analyzeDataset', async (filePath?: string) => {
        const targetPath = filePath || getActiveFilePath();
        if (!targetPath) {
            vscode.window.showWarningMessage('DataGuard: No dataset file found to analyze.');
            return;
        }
        vscode.window.showInformationMessage(`DataGuard: Analyzing ${targetPath}...`);
        try {
            const results = await AnalysisRunner.run(context, targetPath);
            DashboardPanel.createOrShow(context.extensionUri, results);
            DecorationProvider.applyDecorations(vscode.window.activeTextEditor, results);
        } catch (err: any) {
            vscode.window.showErrorMessage(`DataGuard Analysis Failed: ${err.message}`);
        }
    });
    context.subscriptions.push(analyzeCommand);

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(doc => {
            if (['.csv', '.parquet', '.json'].some(ext => doc.fileName.endsWith(ext))) {
                vscode.commands.executeCommand('dataguard.analyzeDataset', doc.fileName);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.languageId !== 'python') { return; }
            const text = event.document.getText();
            const patterns = [
                /pd\.read_csv\(['"](.+?)['"]\)/,
                /pd\.read_parquet\(['"](.+?)['"]\)/,
                /pl\.read_csv\(['"](.+?)['"]\)/,
                /pl\.read_parquet\(['"](.+?)['"]\)/,
                /pd\.read_json\(['"](.+?)['"]\)/,
            ];
            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                    vscode.commands.executeCommand('dataguard.analyzeDataset', match[1]);
                    break;
                }
            }
        })
    );
}

function getActiveFilePath(): string | undefined {
    return vscode.window.activeTextEditor?.document.fileName;
}

export function deactivate() {}
