import psycopg2
import os
from dotenv import load_dotenv

# .envファイルを読み込み
load_dotenv()

# DB操作用の環境変数を取得
dbname = os.getenv("DATABASE_NAME")
user = os.getenv("DATABASE_USER")
password = os.getenv("DATABASE_PASSWORD")
host = os.getenv("DATABASE_HOST")
port = os.getenv("DATABASE_PORT")

def create_table():
    conn = psycopg2.connect(
        host=host,
        database=dbname,
        user=user,
        password=password
    )
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS results (
            db_id SERIAL PRIMARY KEY,
            list_id TEXT NOT NULL,
            theme TEXT, 
            id INTEGER NOT NULL,
            song TEXT,
            album TEXT,
            rank INTEGER,
            ip_address TEXT,
            timestamp TIMESTAMP,
            count_compare INTEGER
        );
    ''')
    conn.commit()
    cur.close()
    conn.close()

create_table()