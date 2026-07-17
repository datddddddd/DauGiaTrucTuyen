import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import database
import models
from sqlalchemy.orm import Session

def check():
    db = next(database.get_db())
    try:
        users = db.query(models.User).all()
        print(f"Total users found: {len(users)}")
        for u in users:
            print(f"ID: {u.id} | Username: '{u.username}' | Email: '{u.email}' | Role: '{u.role}' | Hashed Password: '{u.hashed_password}' | Blocked: {u.is_blocked} | Verified: {u.is_verified}")
    except Exception as e:
        print(f"Error checking users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check()
