import traceback
from backend.database import engine
from backend.models import Base

try:
    Base.metadata.create_all(bind=engine)
    print("SUCCESS: Database tables created successfully")
except Exception as e:
    print("ERROR: Error creating database tables:")
    traceback.print_exc()
