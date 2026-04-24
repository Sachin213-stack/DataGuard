"""Generate realistic test datasets for DataGuard end-to-end testing."""
import os
import numpy as np
import pandas as pd

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ─── Dataset 1: Clean Employee Data (healthy) ────────────────────────────
np.random.seed(42)
n = 500
clean = pd.DataFrame({
    'employee_id': range(1, n + 1),
    'age': np.random.randint(22, 60, n),
    'salary': np.random.normal(75000, 15000, n).round(2),
    'department': np.random.choice(['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'], n),
    'years_experience': np.random.randint(1, 30, n),
})
clean.to_csv(os.path.join(OUT_DIR, 'clean_employees.csv'), index=False)
print("✅ Created clean_employees.csv (500 rows, no issues expected)")

# ─── Dataset 2: Messy Healthcare Data (many issues) ──────────────────────
np.random.seed(7)
n = 1000
age = np.random.randint(18, 90, n).astype(float)
age[np.random.choice(n, 80, replace=False)] = np.nan  # 8% missing

blood_pressure = np.random.normal(120, 15, n).round(1)
# Inject extreme outliers
blood_pressure[np.random.choice(n, 30, replace=False)] = np.random.choice([250, 280, 300, 20, 15], 30)

cholesterol = np.random.normal(200, 40, n).round(1)
cholesterol[np.random.choice(n, 50, replace=False)] = np.nan  # 5% missing

# Heavily imbalanced target
diagnosis = np.random.choice(['Healthy', 'Disease'], n, p=[0.92, 0.08])

income = np.random.lognormal(10.5, 0.8, n).round(2)
income[np.random.choice(n, 120, replace=False)] = np.nan  # 12% missing

messy = pd.DataFrame({
    'patient_id': range(1, n + 1),
    'age': age,
    'blood_pressure': blood_pressure,
    'cholesterol': cholesterol,
    'income': income,
    'diagnosis': diagnosis,
    'gender': np.random.choice(['M', 'F'], n),
})
messy.to_csv(os.path.join(OUT_DIR, 'messy_healthcare.csv'), index=False)
print("✅ Created messy_healthcare.csv (1000 rows, missing values + outliers + class imbalance)")

# ─── Dataset 3: E-commerce Transactions (JSON format) ────────────────────
np.random.seed(99)
n = 300
ecommerce = pd.DataFrame({
    'order_id': [f'ORD-{i:05d}' for i in range(1, n + 1)],
    'amount': np.random.exponential(50, n).round(2),
    'quantity': np.random.randint(1, 10, n),
    'category': np.random.choice(['Electronics', 'Clothing', 'Food', 'Books'], n),
    'rating': np.random.choice([1, 2, 3, 4, 5], n, p=[0.05, 0.1, 0.2, 0.35, 0.3]),
})
# Add a few massive outlier transactions
ecommerce.loc[np.random.choice(n, 5, replace=False), 'amount'] = [9999.99, 15000.0, 22000.0, 8500.0, 12000.0]
ecommerce.to_json(os.path.join(OUT_DIR, 'ecommerce_orders.json'), orient='records')
print("✅ Created ecommerce_orders.json (300 rows, amount outliers)")

# ─── Dataset 4: Tiny Parquet (edge case) ──────────────────────────────────
tiny = pd.DataFrame({
    'x': [1.0, 2.0, None],
    'y': ['a', 'b', 'a'],
})
tiny.to_parquet(os.path.join(OUT_DIR, 'tiny_edge_case.parquet'), index=False)
print("✅ Created tiny_edge_case.parquet (3 rows, edge case)")

print("\n🎯 All 4 test datasets generated successfully!")
