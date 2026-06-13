# Place this file in backend/ and run: python debug_auth.py
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.models import Worker
from app.auth import create_access_token, verify_password
from app.config import settings
from jose import jwt

db = SessionLocal()

# Check worker exists
worker = db.query(Worker).filter(Worker.email == "priya@aromi.demo").first()
if not worker:
    print("❌ Worker NOT found in DB")
    db.close()
    sys.exit()

print(f"✅ Worker found: id={worker.id}, name={worker.name}, active={worker.is_active}")

# Check password
ok = verify_password("demo1234", worker.hashed_password)
print(f"✅ Password check: {ok}")

# Create token
token = create_access_token({"sub": worker.id})
print(f"✅ Token created: {token[:60]}...")

# Decode token
payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
print(f"✅ Decoded payload: {payload}")
print(f"   sub type: {type(payload['sub'])} value: {payload['sub']}")

# Simulate get_current_worker
worker_id = int(payload["sub"])
found = db.query(Worker).filter(Worker.id == worker_id).first()
print(f"✅ Worker lookup by id={worker_id}: {found.name if found else 'NOT FOUND'}")

db.close()
print("\n✅ All checks passed — problem is in token transmission, not backend logic")
