export const DATA_LOAD_PATTERNS = [
    /pd\.read_csv\(['"](.+?)['"]\)/,
    /pd\.read_parquet\(['"](.+?)['"]\)/,
    /pl\.read_csv\(['"](.+?)['"]\)/,
    /pl\.read_parquet\(['"](.+?)['"]\)/,
    /pd\.read_json\(['"](.+?)['"]\)/,
] as const satisfies readonly RegExp[];

export function findDataLoadMatch(text: string): RegExpMatchArray | null {
    for (const pattern of DATA_LOAD_PATTERNS) {
        const match = text.match(pattern);
        if (match) { return match; }
    }
    return null;
}

export function testDataLoadPattern(text: string): boolean {
    return DATA_LOAD_PATTERNS.some(p => p.test(text));
}

export const DATA_FILE_EXTENSIONS = ['.csv', '.parquet', '.json'] as const;

export type DataFileExtension = typeof DATA_FILE_EXTENSIONS[number];

export function isDataFile(fileName: string): boolean {
    return DATA_FILE_EXTENSIONS.some(ext => fileName.endsWith(ext));
}

export const HEALTH_SCORE_OUTLIER_PENALTY = 5;
