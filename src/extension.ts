import * as vscode from 'vscode';
import * as path from 'path';
import { DataGuardCodeLensProvider } from './codeLensProvider';
import { AnalysisRunner } from './analysisRunner';
import { DashboardPanel } from './dashboardPanel';
import { DecorationProvider } from './decorationProvider';
import { findDataLoadMatch, isDataFile, DATA_FILE_EXTENSIONS } from './constants';

const DEBOUNCE_MS = 1500;

export function activate(context: vscode.ExtensionContext) {
    // ---------- CodeLens (still Python-only) ----------
    const codeLensProvider = new DataGuardCodeLensProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider({ language: 'python' }, codeLensProvider)
    );

    // ---------- Core analysis command ----------
    const analyzeCommand = vscode.commands.registerCommand('dataguard.analyzeDataset', async (filePath?: string) => {
        const targetPath = filePath || getActiveDataFilePath();
        if (!targetPath) {
            vscode.window.showWarningMessage('DataGuard: No dataset file found to analyze.');
            return;
        }

        // Resolve relative paths against the workspace *or* cwd
        const resolvedPath = resolveFilePath(targetPath);

        vscode.window.showInformationMessage(`DataGuard: Analyzing ${resolvedPath}...`);
        try {
            const results = await AnalysisRunner.run(context, resolvedPath);
            DashboardPanel.createOrShow(context.extensionUri, results);
            DecorationProvider.applyDecorations(vscode.window.activeTextEditor, results);
        } catch (err: any) {
            vscode.window.showErrorMessage(`DataGuard Analysis Failed: ${err.message}`);
        }
    });
    context.subscriptions.push(analyzeCommand);

    // ---------- Browse & Analyze — works from ANYWHERE ----------
    const browseCommand = vscode.commands.registerCommand('dataguard.browseAndAnalyze', async () => {
        const uris = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Analyze Dataset',
            filters: {
                'Data Files': ['csv', 'parquet', 'json'],
                'All Files': ['*']
            }
        });
        if (uris && uris.length > 0) {
            await vscode.commands.executeCommand('dataguard.analyzeDataset', uris[0].fsPath);
        }
    });
    context.subscriptions.push(browseCommand);

    // ---------- Auto-analyze when ANY data file is opened (global, not workspace-only) ----------
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(doc => {
            if (isDataFile(doc.fileName)) {
                vscode.commands.executeCommand('dataguard.analyzeDataset', doc.fileName);
            }
        })
    );

    // ---------- Watch for data-load statements in Python files ----------
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

    // ---------- Watch file system for new CSV/Parquet/JSON files created ANYWHERE ----------
    const globalWatcher = vscode.workspace.createFileSystemWatcher('**/*.{csv,parquet,json}');
    globalWatcher.onDidCreate(uri => {
        const config = vscode.workspace.getConfiguration('dataguard');
        const autoAnalyze = config.get<boolean>('autoAnalyzeOnCreate', true);
        if (autoAnalyze) {
            vscode.window.showInformationMessage(
                `DataGuard: New data file detected — ${path.basename(uri.fsPath)}`,
                'Analyze Now',
                'Dismiss'
            ).then(choice => {
                if (choice === 'Analyze Now') {
                    vscode.commands.executeCommand('dataguard.analyzeDataset', uri.fsPath);
                }
            });
        }
    });
    context.subscriptions.push(globalWatcher);

    console.log('DataGuard AI activated — global analysis enabled for all data files.');
}

/**
 * Resolve a file path that may be relative to the workspace or an absolute path from anywhere.
 */
function resolveFilePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
        return filePath;
    }
    // Try workspace folders first
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        for (const folder of workspaceFolders) {
            const candidate = path.join(folder.uri.fsPath, filePath);
            // We return the first candidate — the Python sidecar will handle file-not-found
            return candidate;
        }
    }
    // Fall back to cwd (shouldn't normally happen in VS Code)
    return path.resolve(filePath);
}

/**
 * Return the active editor's file path ONLY if it is a supported data file.
 * Otherwise return undefined so the caller can prompt the user.
 */
function getActiveDataFilePath(): string | undefined {
    const fileName = vscode.window.activeTextEditor?.document.fileName;
    if (fileName && isDataFile(fileName)) {
        return fileName;
    }
    return undefined;
}

export function deactivate() {}
