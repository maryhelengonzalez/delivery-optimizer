from database import Base, engine
import models   # IMPORTANT: this is your models.py file

print("Creating database tables...")

Base.metadata.create_all(bind=engine)

print("Done creating tables.")