
// グローバル変数
let selectedTheme = ''; //ソートのテーマ
let selectedIds = []; //選択された曲ID
let selectedSongs = []; //選択された曲オブジェクト
let numberOfTop = 0; //上位K曲
let totalSongs = selectedIds.length;
let songObjects = []; //選択された曲オブジェクト

// 比較回数カウント
let countComparison = 0;
let comparisons = new Map();
let referenceCount = 200; // 後でn,kから予め算出された目安を取得


// 比較回数の参考値を取得
async function fetchData(N, K) {
    const response = await fetch('static/songdata/data.json'); // 外部ファイルのパス
    const data = await response.json();

    const result = data.find(item => item.n === N && item.k === K);
    if (result) {
        return result.value;
    } else {
        return 200; // 該当する要素が見つからなかった場合
    }
}



// CSV読み込み部
// CSVファイルをShift-JISで読み込む関数
async function loadCSV() {
    await fetch('static/songdata/songs.csv')  // 読み込むCSVファイルのパス
        .then(response => response.arrayBuffer())
        .then(buffer => {
            const decoder = new TextDecoder('shift-jis');
            const text = decoder.decode(new Uint8Array(buffer));
            // SessionStorageからもこのタイミングで変数読み出し
            selectedTheme = sessionStorage.getItem('selectedTheme')
            selectedIds = JSON.parse(sessionStorage.getItem('selectedIds'));
            numberOfTop = parseInt(sessionStorage.getItem('K'));
            //Nを超えないように抑える
            numberOfTop = Math.min(numberOfTop, selectedIds.length);

            // 概ね必要な比較回数を取得
            fetchData(selectedIds.length, numberOfTop).then(value => {
                referenceCount = value;
                console.log(referenceCount);
            }).catch(error => {
                console.error(error);
            });


            // Parse時に、指定のIDだけ抜き出す
            songObjects = parseCSV(text, selectedIds);
            // ソートのためにシャッフルしておく
            shuffle(songObjects);
            selectedSongs = songObjects; //ソート部と変数を合わせるために暫定処理
        });

    startSort();
}

// CSVのテキストをパースしてSongObjectのリストを返す
function parseCSV(text, selectedIds) {
    const lines = text.trim().split('\n');
    let songObjs = [];
    lines.slice(1).forEach(line => {  // 一行目をスキップ
        const [id, song, album, dummy] = line.split(',');
        const rank = -1;
        if (selectedIds.includes(id)) {
            songObjs.push({ id, song, album, rank })
        }
    });
    return songObjs;
}

function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
}


// ページロード時にCSVを読み込む
window.onload = loadCSV();

/* ---------- ここからソートの処理 -----------  */

let choiceHistory = -1; // Choiceの結果を格納

async function startSort() {

    // 曲表示と選択ボタンのUI表示

    // テスト
    // let idxs = getRandomIntegersInRange(0, selectedSongs.length - 1, 2)
    // compare_func(selectedSongs[idxs[0]], selectedSongs[idxs[1]]);

    const progressContainer = document.getElementById('song-count');
    progressContainer.innerHTML = `<p class='center'>${selectedSongs.length}曲中 Top ${numberOfTop} をソートします</p><br>`;

    const progressDiv = document.getElementById('progress-container');
    progressDiv.style.display = 'block';


    // HTMLの要素を取得
    const themeContainer = document.getElementById('theme_container');

    // テンプレートリテラルを使ってHTMLを生成
    themeContainer.innerHTML = `<h3>テーマ:${selectedTheme} </h3>`;


    // 選択肢のタイルを先に表示
    const songContainer = document.getElementById('song-container');
    const songBox1 = document.createElement('div');
    songBox1.className = 'song-box';
    songBox1.textContent = '';
    songBox1.id = '2';
    songBox1.addEventListener('click', () => submitPreference(2));

    const songBox2 = document.createElement('div');
    songBox2.className = 'song-box';
    songBox2.textContent = '';
    songBox2.id = '4';
    songBox2.addEventListener('click', () => submitPreference(4));

    const drawBox = document.createElement('div');
    drawBox.className = 'song-box draw-box';
    drawBox.textContent = '引き分け';
    drawBox.id = '3';
    drawBox.addEventListener('click', () => submitPreference(3));


    songContainer.appendChild(songBox1);
    songContainer.appendChild(drawBox);
    songContainer.appendChild(songBox2);




    // ToDo
    // pivotSelection, partition: pivotSelectionで選択した結果は辞書か何かに記憶しておき、Partitioinで同じ質問があればスキップされるようにする
    // 同順位を管理する機能はmust.
    // Kの値を可変に。

    // resultの表示UI
    await updateProgressBar(0.0); //プログレスの初期化
    (async () => {
        await quickSortFirstK(selectedSongs, 0, selectedSongs.length, numberOfTop);

        await transitionResult(selectedSongs);
    })();
    // resultをサーバのDBに蓄積させて月間ランキングの作成

    // const med_idx = pivotSelection(selectedSongs, 0, selectedSongs.length, compare_func);
    // console.log(med_idx);


    // for (let i = 0; i < 10; i++) {
    //     let idxs = getRandomIntegersInRange(0, selectedSongs.length - 1, 2)
    //     // GUIでa,bを表示
    //     displaySongs(selectedSongs[idxs[0]], selectedSongs[idxs[1]])
    //     await waitButtonClick();
    //     compare_func(selectedSongs[idxs[0]], selectedSongs[idxs[1]]);
    // }



}
async function updateProgressBar(value) {
    const progressBar = document.getElementById("progressBar");
    progressBar.style.width = (value * 100) + "%";
}

async function progress() {
    // 0.0 から 1.0 の値を取得する関数

    let ret = countComparison / referenceCount;
    ret = Math.min(1.0, ret); //最大1.0に上から抑える
    return ret;

    // let fixedNum = 0;
    // // let totalNum = Math.min(selectedSongs.length, numberOfTop);
    // let totalNum = selectedSongs.length;
    // for (let i = 0; i < totalNum; i++) {
    //     if (selectedSongs[i].rank != -1) {
    //         fixedNum++;
    //     }
    // }
    // //立方根で写像したものを進捗として可視化.理由は割合に対して進捗が線形でないから.
    // //本来はlogが正しいはずだが簡易的に立方根で実装.
    // let ret = Math.cbrt(fixedNum / totalNum);
    return ret;
}


/* --------ここからソート詳細------------- */

// 改良版クイックソート. リストAを破壊的にソート
// [start, end)の半開区間で渡す。上位K個のソートを保証
async function quickSortFirstK(A, start, end, K) {
    return new Promise(async resolve => {
        if (end - start > 1) {
            const pivot_idx = await pivotSelection(A, start, end, compare_func);

            // 5領域に分割
            const div_index = await partition_3div(A, start, end, pivot_idx, compare_func);
            const rnd_index = getRandomIntegersInRange(0, 2, 3);
            for (let k = 0; k < 3; k++) {
                let i = rnd_index[k];
                if (i == 1) {
                    // middle領域は順位確定、rankを記録
                    for (let j = div_index[i]; j < div_index[i + 1]; j++) {
                        A[j].rank = div_index[i] + 1;
                        console.log(A[j].song, A[j].rank);
                    }
                    continue; //pivotと等価なものはソートの必要なし
                }
                if (div_index[i] < K) { //区間の開始がK未満のものはまだソートする
                    if (div_index[i + 1] - div_index[i] >= 2) { // 区間長1以下はソート終了
                        await quickSortFirstK(A, div_index[i], div_index[i + 1], K);
                    }
                    else { //ソート終了
                        // rank記録
                        for (let j = div_index[i]; j < div_index[i + 1]; j++) {
                            A[j].rank = div_index[i] + 1;
                            console.log(A[j].song, A[j].rank);
                        }
                        const prog = await progress()
                        await updateProgressBar(prog);
                    }
                } else { //上位K件に該当しないものは順位確定
                    // rank記録
                    for (let j = div_index[i]; j < div_index[i + 1]; j++) {
                        A[j].rank = div_index[i] + 1;
                    }
                    const prog = await progress()
                    await updateProgressBar(prog);
                }
            }
        }
        const prog = await progress()
        await updateProgressBar(prog);
        resolve(A);
    });
}

// pivot選択.[start, end)の3つをランダムに抽出してきて、中央値のインデックスを返す。
// 閾値以下の場合はランダムな一個のインデックスを返す。
async function pivotSelection(A, start, end, compare_func, threshold = 5) {
    async function insertionSort(arr, startIndex, endIndex) {
        return new Promise(async resolve => {
            for (let i = startIndex + 1; i < endIndex; i++) {
                let j = i - 1;
                while (j >= startIndex) {
                    let comp = reuseCompareResult(arr[j], arr[j + 1]);
                    //比較したことがあれば再利用
                    if (comp == undefined) {//比較したことのない要素
                        displaySongs(arr[j], arr[j + 1]);
                        await waitButtonClick();
                        comp = compare_func(arr[j], arr[j + 1])
                        const prog = await progress();
                        await updateProgressBar(prog);
                    }
                    if (comp > 0) {
                        const current_element = arr[j];
                        arr[j] = arr[j + 1];
                        arr[j + 1] = current_element;
                    }
                    else {
                        break;
                    }
                    j--;
                }
            }
            resolve(arr);
        });

    }
    return new Promise(async resolve => {
        if (end - start <= threshold) {
            resolve(getRandomIntegersInRange(start, end - 1, 1));
        }
        else {
            // 3要素のインデックスをランダムに生成
            const rndIdx = getRandomIntegersInRange(start, end - 1, 3);

            // 部分配列をコピーしてソート
            const partialArray = rndIdx.map(index => A[index]);
            // A.slice(start, end);
            const sortedArr = await insertionSort(partialArray, 0, partialArray.length);

            // 中央値のインデックスを求める
            const medianIndex = Math.floor(sortedArr.length / 2);

            // ソートされた部分配列での中央値の要素を取得
            const medianValue = sortedArr[medianIndex];

            // 中央値の要素が元の配列での何番目の要素かを調べる
            const originalIndex = A.indexOf(medianValue);
            console.log("pivot :", medianValue.song)
            resolve(originalIndex);
        }
    })
}


// partition_5divの3領域版
async function partition_3div(A, start, end, pivot_idx, compare_func) {
    return new Promise(async resolve => {
        let left1 = [];
        let middle = [];
        let right1 = [];
        const pivot = A[pivot_idx];
        for (let i = start; i < end; i++) {
            if (i == pivot_idx) {
                middle.push(A[i]);
                continue;
            }

            let result = reuseCompareResult(pivot, A[i]);
            //比較したことがあれば再利用
            if (result == undefined) {//比較したことのない要素
                displaySongs(pivot, A[i]);
                await waitButtonClick();
                result = compare_func(pivot, A[i]);
                const prog = await progress();
                await updateProgressBar(prog);
            }
            switch (result) {
                case 1:
                    left1.push(A[i]);
                    break;
                case 0:
                    middle.push(A[i]);
                    break;
                case -1:
                    right1.push(A[i]);
                    break;
                default:
                    console.log("Error! this choice is out of bound.");
                    break;
            }
        }
        let B = left1.concat(middle); //配列Aの[start, end)の範囲で置き換えるための配列B
        B = B.concat(right1);
        for (let i = start; i < end; i++) {
            A[i] = B[i - start];
        }
        let idxs = [0, 0, 0, 0];
        idxs[0] = start;
        idxs[1] = idxs[0] + left1.length;
        idxs[2] = idxs[1] + middle.length;
        idxs[3] = idxs[2] + right1.length;

        resolve(idxs);
    })
}



// 比較関数
function compare_func(a, b) {
    countComparison++;
    // a, b はsong
    // await waitButtonClick();
    let result = -10;
    switch (choiceHistory) {
        case 2:
            result = -1; // win left-elem
            break;
        case 3:
            result = 0; // draw
            break;
        case 4:
            result = 1; // win right-elem
            break;
        default:
            console.log("Error! choice is out of bound.");
            break;
    }

    // 比較結果を保持
    if (!comparisons.has(a.id)) {
        comparisons.set(a.id, new Map());
    }
    comparisons.get(a.id).set(b.id, -result); // -1だとaの勝ちなので、aはb.idに対して1を記録
    if (!comparisons.has(b.id)) {
        comparisons.set(b.id, new Map());
    }
    comparisons.get(b.id).set(a.id, result); // -1だとaの勝ちなので、bはaに対して-1を記録

    // const result = choiceHistory;
    // クリックの結果をみる
    // console.log(result);
    return result;
}

// 保持された比較結果を再使用可能かを判定
function reuseCompareResult(song1, song2) {
    return comparisons.get(song1.id)?.get(song2.id);
    // 存在しなければundefined, すれば1,0,-1の比較結果
}


/* -----------UI部分------------- */

// 2曲を提示する部分
function updateButtonText(id, newText) {
    const button = document.getElementById(id);
    if (button) {
        button.textContent = newText;
    }
}
function displaySongs(song1, song2) {
    console.log(song1.song, ' vs ', song2.song);
    updateButtonText('2', song1.song);
    updateButtonText('4', song2.song);
}


// ボタンで好みの方を選択したときの結果を更新
function submitPreference(choice) {
    // ここに選択結果を処理するコードを追加できます。
    // 例えば、選択された選択肢と対応する曲を記録したり、
    // サーバーに送信する処理を行うことができます。
    choiceHistory = choice;
    // ここでは選択された選択肢をコンソールに表示する例
    console.log(`選択肢 ${choice} が選ばれました。`);
    return choiceHistory;
}

// 乱数生成. [min, max]閉区間で重複なしのcount個の整数を取り出す
function getRandomIntegersInRange(min, max, count) {
    if (count > max - min + 1) {
        throw new Error('指定された範囲内に十分な整数がありません。');
    }

    const result = [];
    while (result.length < count) {
        const randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!result.includes(randomInt)) {
            result.push(randomInt);
        }
    }

    return result;
}


// Promiseを返す関数
function waitButtonClick() {
    return new Promise((resolve) => {
        const buttons = document.querySelectorAll(".song-box");
        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                resolve();
            });
        });
    });
}


// ソート終了後の処理

// 結果画面をシェアできるように、URLに含ませるためのエンコード
function encodeIds(ids) {
    return ids.map(id => {
        const hex = parseInt(id).toString(16).toUpperCase(); // 16進数に変換し大文字にする
        return hex.padStart(3, '0'); // 3桁に揃える
    }).join('%');
}


function saveResults(songObjects, theme, count) {
    fetch('/save_results', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ songObjects, theme, count })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log('Data saved successfully!');
            } else {
                console.error('Error saving data:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}



// // DBにソート結果を送信
// function submitSortResults(songList, rankList) {
//     const data = {
//         songList: songList,
//         rankList: rankList
//     };

//     fetch('/submit', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(data)
//     })
//         .then(response => response.json())
//         .then(result => {
//             console.log('Success:', result);
//         })
//         .catch(error => {
//             console.error('Error:', error);
//         });
// }




// ソート終了後にResultページへ遷移
function transitionResult(sortedSongObjects) {
    console.log("Total count:", countComparison);

    const sortedIds = sortedSongObjects.map(item => item.id);
    const resultRanks = sortedSongObjects.map(item => item.rank);


    const encodedIds = encodeIds(sortedIds);
    const encodedRanks = encodeIds(resultRanks);
    sessionStorage.setItem('sortedIds', JSON.stringify(sortedIds));
    sessionStorage.setItem('resultRanks', JSON.stringify(resultRanks));

    const queryParam = encodedIds + '?' + encodedRanks + '?' + 'K=' + numberOfTop.toString() + '?theme=' + encodeURIComponent(selectedTheme);
    console.log(queryParam);
    // result.htmlに遷移 
    // FlaskのURLのベースパス
    // const baseUrl = "{{ url_for('result', _external=True) }}";
    // // パラメータをURLに付加
    // const url = baseUrl.replace(/<param>/, queryParam);
    console.log("/result?" + queryParam);

    // ページ遷移直前にデータをサーバーに送信
    saveResults(sortedSongObjects, selectedTheme, countComparison);

    window.location.href = "/result?param=" + queryParam;
}
