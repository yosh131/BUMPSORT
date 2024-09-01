from flask import Flask, render_template, request, jsonify
from config import Config
import random
import sys
sys.path.append('./templates')

app = Flask(__name__)

@app.context_processor
def inject_globals():
    return dict(version=Config.VERSION, author=Config.AUTHOR)

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

if __name__ == '__main__':
    app.run(debug=True)
