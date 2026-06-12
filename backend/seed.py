import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import seed_data

if __name__ == "__main__":
    print("Running seed data...")
    try:
        seed_data()
        print("Seed data completed!")
    except Exception as e:
        print(f"Seed data error: {e}")
        import traceback
        traceback.print_exc()
