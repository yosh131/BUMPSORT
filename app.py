from flask import Flask, render_template, request, jsonify
from config import Config
import random
import sys
sys.path.append('./templates')

app = Flask(__name__)

animals = ["猫", "犬", "うさぎ", "ハムスター", "鳥", "魚", "カメ", "フェレット", "イグアナ", "ヘビ"]

@app.context_processor
def inject_globals():
    return dict(version=Config.VERSION, author=Config.AUTHOR)

@app.route('/')
def index():
    return render_template('index.html', animals=animals)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/start')
def start():
    return render_template('start.html')

@app.route('/how_to_use')
def how_to_use():
    return render_template('how_to_use.html')

@app.route('/ranking')
def ranking():
    return render_template('ranking.html')

@app.route('/sort', methods=['POST'])
def sort():
    choices = request.json['choices']
    remaining = [animal for animal in animals if animal not in choices]
    
    if len(remaining) >= 2:
        pair = random.sample(remaining, 2)
        return jsonify({'pair': pair})
    else:
        sorted_animals = choices + remaining
        return jsonify({'result': sorted_animals})

if __name__ == '__main__':
    app.run(debug=True)
