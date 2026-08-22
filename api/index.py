import os
import sys

# Add backend directory to sys.path so 'app' can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app

# Vercel needs the app object
