import * as vscode from 'vscode';

export class DataGuardCodeLensProvider implements vscode.CodeLensProvider {
    private readonly patterns = [
        /pd\.read_csv\(['"](.+?)['"]\)/,
        /pd\.read_parquet\(['"](.+?)['"]\)/,
        /pl\.read_csv\(['"](.+?)['"]\)/,
        /pl\.read_parquet\(['"](.+?)['"]\)/,
        /pd\.read_json\(['"](.+?)['"]\)/,
    ];

    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const lenses: vscode.CodeLens[] = [];
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            for (const pattern of this.patterns) {
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
