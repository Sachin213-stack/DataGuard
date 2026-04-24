import * as vscode from 'vscode';
import { AnalysisResult } from './analysisRunner';
import { testDataLoadPattern } from './constants';

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
        const hasIssues = Object.keys(result.missingValues).length > 0
            || result.outlierColumns.length > 0
            || result.classImbalance !== null;
        if (!hasIssues) {
            editor.setDecorations(warningDecoration, []);
            return;
        }
        const decorations: vscode.DecorationOptions[] = [];
        for (let i = 0; i < editor.document.lineCount; i++) {
            const line = editor.document.lineAt(i);
            if (testDataLoadPattern(line.text)) {
                decorations.push({ range: line.range });
            }
        }
        editor.setDecorations(warningDecoration, decorations);
    }
}
