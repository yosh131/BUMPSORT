from flask import Flask, render_template, request, jsonify
import random
import sys
sys.path.append('./templates')

app = Flask(__name__)

animals = ["猫", "犬", "うさぎ", "ハムスター", "鳥", "魚", "カメ", "フェレット", "イグアナ", "ヘビ"]

@app.route('/')
def index():
    return render_template('index.html', animals=animals)

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
