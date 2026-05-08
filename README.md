# subscription-tracker
A FastAPI-based subscription tracker with an SQLite backend. 

### Features
- Surgical database queries with SQLAlchemy.
- Dynamic updates using Python's `setattr`.
- Automated alerts for "CANCEL" reminders.

# run virtual environment
venv\Scripts\activate 

# run program
python -m uvicorn main:app --reload