import * as vscode from 'vscode';
import { DATA_LOAD_PATTERNS } from './constants';

export class DataGuardCodeLensProvider implements vscode.CodeLensProvider {
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const lenses: vscode.CodeLens[] = [];
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            for (const pattern of DATA_LOAD_PATTERNS) {
                const match = line.text.match(pattern);
                if (match) {
                    const range = new vscode.Range(i, 0, i, 0);
                    lenses.push(new vscode.CodeLens(range, {
                        title: '🔍 View Data Health',
                        command: 'dataguard.analyzeDataset',
                        arguments: [match[1]]
                    }));
                    break;
                }
            }
        }
        return lenses;
    }
}
