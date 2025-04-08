# create_admin.py

from app.database import SessionLocal
from app.schemas import UserCreate  # Pydantic schema for creating users
from app.routes.v1.admin import create_user  # function to create a user

# Define the first admin user details
admin_user = UserCreate(
    username="admin",           # Set desired admin username
    full_name="Administrator",  # Full name of the admin
    email="admin@example.com",   # Admin email
    password="supersecretpassword",  # Strong password
    role_ids=[1],                # Make sure role_id 1 is "admin" in your roles table
)

def create_admin_user():
    db = SessionLocal()
    try:
        # Try to create the admin user
        created_user = create_user(admin_user, db)
        print(f"Admin user created successfully: {created_user.username}")
    except Exception as e:
        print(f"Error creating admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
