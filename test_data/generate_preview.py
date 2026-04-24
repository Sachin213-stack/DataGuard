"""Generate a standalone preview of the DataGuard dashboard with real Titanic data."""
import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'sidecar'))
from analyze import analyze

HEALTH_SCORE_OUTLIER_PENALTY = 5

# Analyze the Titanic dataset
result = analyze(os.path.join(os.path.dirname(__file__), 'titanic.csv'))

# Read the dashboard template
html_path = os.path.join(os.path.dirname(__file__), '..', 'media', 'dashboard.html')
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Inject the analysis data (same as dashboardPanel.ts does)
html = html.replace('__ANALYSIS_DATA__', json.dumps(result))
html = html.replace('__OUTLIER_PENALTY__', str(HEALTH_SCORE_OUTLIER_PENALTY))

# Write the preview HTML
output_path = os.path.join(os.path.dirname(__file__), 'dashboard_preview.html')
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"Dashboard preview saved to: {output_path}")
