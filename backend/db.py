import sqlite3
import os

# Use absolute path so the DB is always found regardless of working directory
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cyberids.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model TEXT,
        timestamp TEXT,
        counts TEXT,
        summary TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER,
        event TEXT,
        threat_level TEXT,
        confidence REAL,
        timestamp TEXT
    )''')
    conn.commit()
    conn.close()
