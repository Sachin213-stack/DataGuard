import * as vscode from 'vscode';
import { DataGuardCodeLensProvider } from './codeLensProvider';
import { AnalysisRunner } from './analysisRunner';
import { DashboardPanel } from './dashboardPanel';
import { DecorationProvider } from './decorationProvider';
import { findDataLoadMatch, isDataFile } from './constants';

const DEBOUNCE_MS = 1500;

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
            if (isDataFile(doc.fileName)) {
                vscode.commands.executeCommand('dataguard.analyzeDataset', doc.fileName);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.languageId !== 'python') { return; }
            // Only search the changed ranges to avoid reading the entire document on every keystroke
            const changedText = event.contentChanges.map(c => c.text).join('');
            if (!changedText.includes('read_')) { return; }
            // Debounce: wait for the user to stop typing before running analysis
            if ((event.document as any).__dataguardTimer) {
                clearTimeout((event.document as any).__dataguardTimer);
            }
            (event.document as any).__dataguardTimer = setTimeout(() => {
                const match = findDataLoadMatch(event.document.getText());
                if (match) {
                    vscode.commands.executeCommand('dataguard.analyzeDataset', match[1]);
                }
            }, DEBOUNCE_MS);
        })
    );
}

function getActiveFilePath(): string | undefined {
    return vscode.window.activeTextEditor?.document.fileName;
}

export function deactivate() {}
