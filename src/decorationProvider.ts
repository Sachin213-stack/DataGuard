import * as vscode from 'vscode';
import { AnalysisResult } from './analysisRunner';

const warningDecoration = vscode.window.createTextEditorDecorationType({
    textDecoration: 'underline wavy red',
    after: {
        contentText: ' ⚠ Data Quality Issues Detected',
        color: new vscode.ThemeColor('editorWarning.foreground'),
        fontStyle: 'italic'
    }
});

export class DecorationProvider {
    static applyDecorations(editor: vscode.TextEditor | undefined, result: AnalysisResult) {
        if (!editor) { return; }
        const hasIssues = Object.keys(result.missingValues).length > 0 || result.outlierColumns.length > 0;
        if (!hasIssues) {
            editor.setDecorations(warningDecoration, []);
            return;
        }
        const decorations: vscode.DecorationOptions[] = [];
        const patterns = [
            /pd\.read_csv\(['"](.+?)['"]\)/,
            /pd\.read_parquet\(['"](.+?)['"]\)/,
            /pl\.read_csv\(['"](.+?)['"]\)/,
            /pl\.read_parquet\(['"](.+?)['"]\)/,
            /pd\.read_json\(['"](.+?)['"]\)/,
        ];
        for (let i = 0; i < editor.document.lineCount; i++) {
            const line = editor.document.lineAt(i);
            for (const pattern of patterns) {
                if (pattern.test(line.text)) {
                    decorations.push({ range: line.range });
                    break;
                }
            }
        }
        editor.setDecorations(warningDecoration, decorations);
    }
}
