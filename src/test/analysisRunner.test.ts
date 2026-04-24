import { AnalysisRunner } from '../analysisRunner';
import * as cp from 'child_process';
import { EventEmitter } from 'events';

// Mock child_process at the module level
jest.mock('child_process');

const mockedSpawn = cp.spawn as jest.MockedFunction<typeof cp.spawn>;

// Helpers to create fake stream and process objects
function makeStream() {
    const emitter = new EventEmitter();
    return emitter as any;
}

function makeProcess(stdout: any, stderr: any) {
    const proc = new EventEmitter() as any;
    proc.stdout = stdout;
    proc.stderr = stderr;
    return proc;
}

function makeContext(extensionPath = '/fake/ext'): any {
    return {
        extensionPath,
        subscriptions: [],
    };
}

const sampleResult = {
    filePath: '/data/test.csv',
    shape: [100, 3],
    columns: ['a', 'b', 'c'],
    missingValues: {},
    missingPercent: {},
    outlierColumns: [],
    classImbalance: null,
    dtypes: { a: 'float64', b: 'int64', c: 'object' },
    summary: 'All good',
};

describe('AnalysisRunner.run', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('resolves with parsed JSON when the process exits with code 0', async () => {
        const stdout = makeStream();
        const stderr = makeStream();
        const proc = makeProcess(stdout, stderr);
        mockedSpawn.mockReturnValue(proc);

        const promise = AnalysisRunner.run(makeContext(), '/data/test.csv');

        // Emit JSON output and close with success
        stdout.emit('data', Buffer.from(JSON.stringify(sampleResult)));
        proc.emit('close', 0);

        const result = await promise;
        expect(result).toEqual(sampleResult);
    });

    it('rejects with the stderr message when the process exits with a non-zero code', async () => {
        const stdout = makeStream();
        const stderr = makeStream();
        const proc = makeProcess(stdout, stderr);
        mockedSpawn.mockReturnValue(proc);

        const promise = AnalysisRunner.run(makeContext(), '/data/bad.csv');
        stderr.emit('data', Buffer.from('FileNotFoundError: bad.csv'));
        proc.emit('close', 1);

        await expect(promise).rejects.toThrow('FileNotFoundError: bad.csv');
    });

    it('rejects with a fallback message when stderr is empty and exit code is non-zero', async () => {
        const stdout = makeStream();
        const stderr = makeStream();
        const proc = makeProcess(stdout, stderr);
        mockedSpawn.mockReturnValue(proc);

        const promise = AnalysisRunner.run(makeContext(), '/data/bad.csv');
        proc.emit('close', 2);

        await expect(promise).rejects.toThrow('Python exited with code 2');
    });

    it('rejects when stdout contains invalid JSON', async () => {
        const stdout = makeStream();
        const stderr = makeStream();
        const proc = makeProcess(stdout, stderr);
        mockedSpawn.mockReturnValue(proc);

        const promise = AnalysisRunner.run(makeContext(), '/data/test.csv');
        stdout.emit('data', Buffer.from('not-json-at-all'));
        proc.emit('close', 0);

        await expect(promise).rejects.toThrow(/Failed to parse analysis output/);
    });

    it('rejects when the spawn itself emits an error', async () => {
        const stdout = makeStream();
        const stderr = makeStream();
        const proc = makeProcess(stdout, stderr);
        mockedSpawn.mockReturnValue(proc);

        const promise = AnalysisRunner.run(makeContext(), '/data/test.csv');
        proc.emit('error', new Error('spawn ENOENT'));

        await expect(promise).rejects.toThrow('spawn ENOENT');
    });

    it('passes the correct arguments to python3', async () => {
        const stdout = makeStream();
        const stderr = makeStream();
        const proc = makeProcess(stdout, stderr);
        mockedSpawn.mockReturnValue(proc);

        const context = makeContext('/my/extension');
        const promise = AnalysisRunner.run(context, '/data/test.csv');
        stdout.emit('data', Buffer.from(JSON.stringify(sampleResult)));
        proc.emit('close', 0);
        await promise;

        expect(mockedSpawn).toHaveBeenCalledWith(
            'python3',
            ['/my/extension/sidecar/analyze.py', '/data/test.csv'],
            expect.objectContaining({ env: expect.any(Object) })
        );
    });

    it('includes GEMINI_API_KEY in the spawned process environment', async () => {
        // The vscode mock returns '' for any config.get call; we just verify the key is present
        const stdout = makeStream();
        const stderr = makeStream();
        const proc = makeProcess(stdout, stderr);
        mockedSpawn.mockReturnValue(proc);

        const promise = AnalysisRunner.run(makeContext(), '/data/test.csv');
        stdout.emit('data', Buffer.from(JSON.stringify(sampleResult)));
        proc.emit('close', 0);
        await promise;

        const spawnOptions = mockedSpawn.mock.calls[0][2] as any;
        expect(spawnOptions.env).toHaveProperty('GEMINI_API_KEY');
    });

    it('accumulates data across multiple stdout chunks before parsing', async () => {
        const stdout = makeStream();
        const stderr = makeStream();
        const proc = makeProcess(stdout, stderr);
        mockedSpawn.mockReturnValue(proc);

        const json = JSON.stringify(sampleResult);
        const half = Math.floor(json.length / 2);

        const promise = AnalysisRunner.run(makeContext(), '/data/test.csv');
        stdout.emit('data', Buffer.from(json.slice(0, half)));
        stdout.emit('data', Buffer.from(json.slice(half)));
        proc.emit('close', 0);

        const result = await promise;
        expect(result).toEqual(sampleResult);
    });
});
