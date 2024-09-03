from flask import Flask, render_template, request, jsonify
from config import Config
import hashlib
import psycopg2
import sqlite3
from datetime import datetime
import sys
import os
import pytz
from dotenv import load_dotenv

# .envファイルを読み込み
load_dotenv()

# DB操作用の環境変数を取得
dbname = os.getenv("DATABASE_NAME")
user = os.getenv("DATABASE_USER")
password = os.getenv("DATABASE_PASSWORD")
host = os.getenv("DATABASE_HOST")
port = os.getenv("DATABASE_PORT")

sys.path.append('./templates')



app = Flask(__name__)

@app.context_processor
def inject_globals():
    return dict(version=Config.VERSION, author=Config.AUTHOR)

def generate_user_id(ip_address, timestamp):
    unique_string = f"{ip_address}{timestamp}"
    return hashlib.sha256(unique_string.encode()).hexdigest()


def get_client_ip():
    if request.headers.getlist("X-Forwarded-For"):
        ip_address = request.headers.getlist("X-Forwarded-For")[0]
    else:
        ip_address = request.remote_addr
    return ip_address

def create_table():
    conn = psycopg2.connect(
        host=host,
        database=dbname,
        user=user,
        password=password,
        port=port
    )
    cur = conn.cursor()
    try:
        conn.autocommit = False    
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
    except Exception as e:
        # エラー発生時はロールバック
        conn.rollback()
        print(f"Error: {e}")
        raise  # 上位の呼び出し元に例外を伝達
    finally:
        cur.close()
        conn.close()



def insert_data(song_objects, ip_address, timestamp, list_id, theme, count_compare):
    conn = psycopg2.connect(
        host=host,
        database=dbname,
        user=user,
        password=password,
        port=port
        )
    cur = conn.cursor()
    print(f"connection: {dbname}")

    try:
        # トランザクション開始
        conn.autocommit = False

        for song_object in song_objects:
            cur.execute('''
                INSERT INTO results (list_id, theme, id, song, album, rank, ip_address, timestamp, count_compare)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                list_id,
                theme,
                song_object['id'],
                song_object['song'],
                song_object['album'],
                song_object['rank'],
                ip_address,
                timestamp,
                count_compare
            ))

        # すべての挿入が成功したらコミット
        conn.commit()
    except Exception as e:
        # エラー発生時はロールバック
        conn.rollback()
        print(f"Error: {e}")
        raise  # 上位の呼び出し元に例外を伝達
    finally:
        cur.close()
        conn.close()


@app.route('/')
def home():
    return render_template('index.html')

# @app.route('/select_thema')
# def select_thema():
#     return render_template('select_thema.html')

@app.route('/start')
def start():
    return render_template('start.html')

@app.route('/how_to_use')
def how_to_use():
    return render_template('how_to_use.html')

@app.route('/ranking')
def ranking():
    return render_template('ranking.html')

@app.route('/sort')
def sort():
    return render_template('sort.html')

@app.route('/result')
def result():
    param = request.args.get('param')  # クエリパラメータを取得
    return render_template('result.html', param=param)

@app.route('/save_results', methods=['POST'])
def save_results():
    data = request.json
    print(data)
    song_objects = data.get('songObjects')
    theme = data.get('theme')
    countComp = data.get('count')
    ip_address = get_client_ip()
    # JST（UTC+9）のタイムゾーンオブジェクトを作成
    jst = pytz.timezone('Asia/Tokyo')
    timestamp = datetime.now(jst).strftime('%Y-%m-%d %H:%M:%S')
    list_id = generate_user_id(ip_address, timestamp)
    try:
        create_table()
        insert_data(song_objects, ip_address, timestamp, list_id, theme, countComp)
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
