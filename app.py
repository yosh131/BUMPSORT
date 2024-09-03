from flask import Flask, render_template, request, jsonify
from config import Config
import hashlib

import sqlite3
from datetime import datetime
import sys
sys.path.append('./templates')

app = Flask(__name__)

@app.context_processor
def inject_globals():
    return dict(version=Config.VERSION, author=Config.AUTHOR)

def generate_user_id(ip_address, timestamp):
    unique_string = f"{ip_address}{timestamp}"
    return hashlib.sha256(unique_string.encode()).hexdigest()

# データベース初期化
# def init_db():
#     conn = sqlite3.connect('database.db')
#     cur = conn.cursor()
    
#     # 新しいテーブルを作成
#     cur.execute('''
#         CREATE TABLE IF NOT EXISTS results (
#             db_id INTEGER PRIMARY KEY AUTOINCREMENT,
#             id INTEGER NOT NULL,
#             song TEXT NOT NULL,
#             album TEXT NOT NULL,
#             rank INTEGER NOT NULL,
#             ip_address TEXT NOT NULL,
#             timestamp TEXT NOT NULL
#         )
#     ''')
    
#     conn.commit()
#     conn.close()




def insert_data(song_objects, ip_address, timestamp, list_id):
    conn = sqlite3.connect('database.db')
    cur = conn.cursor()
    for song_object in song_objects:
        cur.execute('''
            INSERT INTO results (list_id, id, song, album, rank, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            list_id,
            song_object['id'],
            song_object['song'],
            song_object['album'],
            song_object['rank'],
            ip_address,
            timestamp
        ))
    conn.commit()
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
    song_objects = data.get('songObjects')
    ip_address = request.remote_addr
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    list_id = generate_user_id(ip_address, timestamp)
    try:
        insert_data(song_objects, ip_address, timestamp, list_id)
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
