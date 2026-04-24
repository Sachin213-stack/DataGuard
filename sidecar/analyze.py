#!/usr/bin/env python3
import sys
import json
import os
import numpy as np
import pandas as pd

def detect_outliers_iqr(series: pd.Series) -> float:
    """Return fraction of outliers using IQR method."""
    Q1 = series.quantile(0.25)
    Q3 = series.quantile(0.75)
    IQR = Q3 - Q1
    if IQR == 0:
        return 0.0
    outliers = ((series < Q1 - 1.5 * IQR) | (series > Q3 + 1.5 * IQR)).sum()
    return float(outliers) / len(series)

def generate_rule_based_summary(result: dict) -> str:
    lines = []
    if result['missingPercent']:
        worst = max(result['missingPercent'], key=result['missingPercent'].get)
        pct = result['missingPercent'][worst]
        lines.append(f"⚠ Column '{worst}' has {pct:.1f}% missing values — consider imputation or removal.")
    if result['outlierColumns']:
        lines.append(f"⚠ Outliers detected in: {', '.join(result['outlierColumns'])}. Consider capping or log-transformation.")
    if result['classImbalance']:
        for col, counts in result['classImbalance'].items():
            values = list(counts.values())
            if max(values) / (sum(values) + 1e-9) > 0.8:
                lines.append(f"⚠ Column '{col}' is heavily imbalanced. Consider resampling techniques.")
    if not lines:
        lines.append("✅ No critical data quality issues detected. Your dataset looks healthy!")
    return ' '.join(lines)

def generate_ai_summary(result: dict) -> str:
    api_key = os.environ.get('OPENAI_API_KEY', '')
    if not api_key:
        return generate_rule_based_summary(result)
    try:
        from langchain_openai import ChatOpenAI
        from langchain.schema import HumanMessage
        llm = ChatOpenAI(model='gpt-3.5-turbo', temperature=0.3, openai_api_key=api_key)
        stats_text = json.dumps({
            'shape': result['shape'],
            'missingPercent': result['missingPercent'],
            'outlierColumns': result['outlierColumns'],
            'classImbalance': result['classImbalance'],
        }, indent=2)
        prompt = (
            "You are a data quality expert. Given these dataset statistics, provide concise, "
            "actionable advice in 2-3 sentences for a Data Scientist:\n\n" + stats_text
        )
        response = llm([HumanMessage(content=prompt)])
        return response.content
    except Exception as e:
        return generate_rule_based_summary(result) + f" (AI unavailable: {e})"

def analyze(file_path: str) -> dict:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.csv':
        df = pd.read_csv(file_path)
    elif ext == '.parquet':
        df = pd.read_parquet(file_path)
    elif ext == '.json':
        df = pd.read_json(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    missing = df.isnull().sum()
    missing_values = {col: int(cnt) for col, cnt in missing.items() if cnt > 0}
    missing_percent = {col: round(float(cnt) / len(df) * 100, 2) for col, cnt in missing.items() if cnt > 0}

    outlier_columns = []
    for col in df.select_dtypes(include=[np.number]).columns:
        frac = detect_outliers_iqr(df[col].dropna())
        if frac > 0.05:
            outlier_columns.append(col)

    class_imbalance = {}
    for col in df.select_dtypes(include=['object', 'category']).columns:
        if df[col].nunique() < 10:
            class_imbalance[col] = df[col].value_counts().to_dict()

    dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}

    result = {
        'filePath': file_path,
        'shape': list(df.shape),
        'columns': list(df.columns),
        'missingValues': missing_values,
        'missingPercent': missing_percent,
        'outlierColumns': outlier_columns,
        'classImbalance': class_imbalance if class_imbalance else None,
        'dtypes': dtypes,
        'summary': '',
    }
    result['summary'] = generate_ai_summary(result)
    return result

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No file path provided'}))
        sys.exit(1)
    try:
        output = analyze(sys.argv[1])
        print(json.dumps(output))
    except Exception as e:
        print(json.dumps({'error': str(e), 'filePath': sys.argv[1]}))
        sys.exit(1)
