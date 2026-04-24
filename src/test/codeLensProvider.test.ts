import { DataGuardCodeLensProvider } from '../codeLensProvider';

// Build a minimal TextDocument mock from an array of lines
function makeDocument(lines: string[]): any {
    return {
        lineCount: lines.length,
        lineAt: (i: number) => ({ text: lines[i] }),
    };
}

describe('DataGuardCodeLensProvider.provideCodeLenses', () => {
    let provider: DataGuardCodeLensProvider;

    beforeEach(() => {
        provider = new DataGuardCodeLensProvider();
    });

    it('returns an empty array for a document with no data-load calls', () => {
        const doc = makeDocument(['import pandas as pd', 'x = 1', 'print(x)']);
        const lenses = provider.provideCodeLenses(doc);
        expect(lenses).toEqual([]);
    });

    it('returns one lens for a single pd.read_csv line', () => {
        const doc = makeDocument(["df = pd.read_csv('train.csv')"]);
        const lenses = provider.provideCodeLenses(doc);
        expect(lenses).toHaveLength(1);
    });

    it('sets the correct command on the lens', () => {
        const doc = makeDocument(["df = pd.read_csv('train.csv')"]);
        const [lens] = provider.provideCodeLenses(doc);
        expect(lens.command?.command).toBe('dataguard.analyzeDataset');
    });

    it('sets the correct title on the lens', () => {
        const doc = makeDocument(["df = pd.read_csv('train.csv')"]);
        const [lens] = provider.provideCodeLenses(doc);
        expect(lens.command?.title).toBe('🔍 View Data Health');
    });

    it('passes the captured file path as the command argument', () => {
        const doc = makeDocument(["df = pd.read_csv('data/my_file.csv')"]);
        const [lens] = provider.provideCodeLenses(doc);
        expect(lens.command?.arguments).toEqual(['data/my_file.csv']);
    });

    it('creates a lens with a Range starting at the matched line', () => {
        const doc = makeDocument(['import pandas', "df = pd.read_csv('file.csv')"]);
        const lenses = provider.provideCodeLenses(doc);
        expect(lenses).toHaveLength(1);
        // Range is constructed as (lineIndex, 0, lineIndex, 0)
        const range = lenses[0].range as any;
        expect(range.startLine).toBe(1);
        expect(range.startChar).toBe(0);
    });

    it('returns one lens per matching line across multiple lines', () => {
        const doc = makeDocument([
            "df1 = pd.read_csv('a.csv')",
            'x = 1',
            "df2 = pd.read_parquet('b.parquet')",
        ]);
        const lenses = provider.provideCodeLenses(doc);
        expect(lenses).toHaveLength(2);
    });

    it('only adds one lens per line even if a line could match multiple patterns', () => {
        // A line that contains two different load calls (unusual but possible)
        const doc = makeDocument(["pd.read_csv('a.csv') or pd.read_parquet('b.parquet')"]);
        const lenses = provider.provideCodeLenses(doc);
        // break after first match ensures only one lens per line
        expect(lenses).toHaveLength(1);
    });

    it('recognises all supported load patterns', () => {
        const doc = makeDocument([
            "pd.read_csv('a.csv')",
            "pd.read_parquet('b.parquet')",
            "pl.read_csv('c.csv')",
            "pl.read_parquet('d.parquet')",
            "pd.read_json('e.json')",
        ]);
        const lenses = provider.provideCodeLenses(doc);
        expect(lenses).toHaveLength(5);
    });

    it('returns an empty array for an empty document', () => {
        const doc = makeDocument([]);
        const lenses = provider.provideCodeLenses(doc);
        expect(lenses).toEqual([]);
    });
});
