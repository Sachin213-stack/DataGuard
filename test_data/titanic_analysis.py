import pandas as pd

# DataGuard will show "🔍 View Data Health" above this line
df = pd.read_csv('test_data/titanic.csv')

print(f"Shape: {df.shape}")
print(f"Columns: {list(df.columns)}")
print(f"\nMissing values:\n{df.isnull().sum()[df.isnull().sum() > 0]}")
print(f"\nFirst 5 rows:\n{df.head()}")
