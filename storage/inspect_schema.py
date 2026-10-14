import json

with open('storage/schema_dump.json', 'r') as f:
    data = json.load(f)

for table, cols in data.items():
    pk = [c['field'] for c in cols if c.get('key') == 'PRI']
    hh_cols = [c['field'] for c in cols if 'hh' in c['field'].lower() or 'household' in c['field'].lower()]
    req_cols = [c['field'] for c in cols if 'request' in c['field'].lower()]
    user_cols = [c['field'] for c in cols if 'user' in c['field'].lower() or 'created_by' in c['field'].lower()]
    print(f"Table: {table} ({len(cols)} cols)")
    print(f"  PK: {pk}")
    print(f"  Household cols: {hh_cols}")
    if req_cols:
        print(f"  Request cols: {req_cols}")
    if user_cols:
        print(f"  User cols: {user_cols}")

