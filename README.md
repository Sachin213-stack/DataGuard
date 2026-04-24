# DataGuard AI 🛡

> AI-powered dataset health analysis for Data Scientists — right inside VS Code.

[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.85.0-blue)](https://code.visualstudio.com/)
[![Python](https://img.shields.io/badge/Python-3.8%2B-yellow)](https://python.org)

## Features

- **🔍 CodeLens Integration** — "View Data Health" button appears above every `pd.read_csv`, `pd.read_parquet`, `pl.read_csv`, and `pd.read_json` call
- **⚡ Auto-Trigger** — Automatically analyzes `.csv`, `.parquet`, and `.json` files when you open them
- **📊 Rich Dashboard** — Interactive webview with:
  - Health score gauge (0–100)
  - Missing values bar chart
  - Data types donut chart
  - Per-column stats table
  - Outlier detection badges
- **🤖 AI Summaries** — Rule-based summaries by default; GPT-3.5 summaries when OpenAI API key is configured
- **🚨 Inline Decorations** — Red wavy underlines on data-loading lines when quality issues are detected

## Installation

### Prerequisites

- VS Code 1.85+
- Python 3.8+ with pip

### Install Python dependencies

```bash
pip install -r sidecar/requirements.txt
```

### Build the extension

```bash
npm install
npm run compile
```

### Run in VS Code

Press `F5` to launch the Extension Development Host.

## Usage

1. **Open a Python file** containing `pd.read_csv('data.csv')` — a "🔍 View Data Health" CodeLens appears above the line
2. **Click the CodeLens** to analyze the dataset and open the dashboard
3. **Open a `.csv` / `.parquet` / `.json` file** directly — analysis triggers automatically
4. **Command Palette** → `DataGuard: Analyze Dataset Health`

## Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `dataguard.openaiApiKey` | string | `""` | OpenAI API key for GPT-powered summaries |

Set via VS Code settings (`Ctrl+,`) or `settings.json`:

```json
{
  "dataguard.openaiApiKey": "sk-..."
}
```

## Health Score

The health score (0–100) is calculated as:

```
score = 100 - (avg_missing_pct × 0.5) - (outlier_column_count × 5)
```

- 🟢 **80–100**: Healthy dataset
- 🟡 **50–79**: Moderate issues
- 🔴 **0–49**: Critical data quality problems

## Analysis Details

The Python sidecar (`sidecar/analyze.py`) computes:

| Metric | Method |
|--------|--------|
| Missing values | `df.isnull().sum()` |
| Outlier detection | IQR method (ratio > 5% flagged) |
| Class imbalance | Value counts for categorical columns with < 10 unique values |
| Data types | `df.dtypes` |

## Project Structure

```
dataguard-ai/
├── src/
│   ├── extension.ts          # Entry point, event listeners
│   ├── analysisRunner.ts     # Python sidecar spawner
│   ├── codeLensProvider.ts   # CodeLens above read_* calls
│   ├── decorationProvider.ts # Red underline decorations
│   └── dashboardPanel.ts     # Webview panel manager
├── media/
│   └── dashboard.html        # Chart.js + Tailwind dashboard
├── sidecar/
│   ├── analyze.py            # Python analysis engine
│   └── requirements.txt
└── package.json
```

## License

MIT