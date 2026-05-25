from database import Base, engine
import models  # ✅ correct (single file models.py)

print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)

print("Recreating all tables...")
Base.metadata.create_all(bind=engine)

print("✅ Database reset complete")