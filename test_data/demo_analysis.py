import pandas as pd

# DataGuard should show a CodeLens "🔍 View Data Health" above these lines
df = pd.read_csv('test_data/messy_healthcare.csv')

print(df.head())
print(df.describe())
