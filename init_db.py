import sqlite3

def init_db():
    conn = sqlite3.connect('database.db')
    cur = conn.cursor()
    
    cur.execute('''
        DROP TABLE IF EXISTS results;
    ''')
    
    cur.execute('''
        CREATE TABLE results (
            db_id INTEGER PRIMARY KEY AUTOINCREMENT,
            list_id INTEGER NOT NULL,
            id INTEGER NOT NULL,
            song TEXT,
            album TEXT,
            rank INTEGER,
            ip_address TEXT,
            timestamp TEXT
        );
    ''')
    
    conn.commit()
    conn.close()

init_db()
