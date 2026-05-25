from database import engine
import models.drivers
import models.orders

print("Creating database tables...")

models.drivers.Base.metadata.create_all(bind=engine)
models.orders.Base.metadata.create_all(bind=engine)

print("DONE: tables created")