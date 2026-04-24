// Minimal VS Code API mock for unit tests
const vscode = {
    Range: class Range {
        constructor(
            public startLine: number,
            public startChar: number,
            public endLine: number,
            public endChar: number
        ) {}
    },
    CodeLens: class CodeLens {
        constructor(public range: any, public command?: any) {}
    },
    ThemeColor: class ThemeColor {
        constructor(public id: string) {}
    },
    ViewColumn: {
        Two: 2,
    },
    window: {
        createTextEditorDecorationType: jest.fn(() => ({
            key: 'mockDecorationType',
            dispose: jest.fn(),
        })),
        createWebviewPanel: jest.fn(),
        showInformationMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        activeTextEditor: undefined as any,
    },
    workspace: {
        getConfiguration: jest.fn(() => ({
            get: jest.fn((_key: string, defaultVal: any) => defaultVal),
        })),
        onDidOpenTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
        onDidChangeTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
    },
    languages: {
        registerCodeLensProvider: jest.fn(() => ({ dispose: jest.fn() })),
    },
    commands: {
        registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
        executeCommand: jest.fn(),
    },
    Uri: {
        file: jest.fn((p: string) => ({ fsPath: p })),
    },
};

export = vscode;
