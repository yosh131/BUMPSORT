
// グローバル変数
let selectedSongs = [];
// let songList = [];
let numberOfTop = 0;
let songObjects = [];



// クエリパラメータをデコードする
function decodeQueryParameters(queryString) {
    // ?で分割してリストを取得
    const lists = queryString.split('?');

    // 各リストを%で分割し、16進数を10進数に変換
    return lists.map(list => {
        return list.split('%').map(hex => parseInt(hex, 16).toString());
    });
}

// クエリパラメータをそのまま取得する関数
function getRawQueryParam(param) {
    // クエリ文字列全体を取得
    var query = window.location.search;
    // 特定のパラメータを含む部分を抽出
    var paramValue = query.match(new RegExp(param + '=([^&]*)'));
    return paramValue ? paramValue[1] : null;
}

// "param"という名前のクエリパラメータを取得
var rawParamValue = getRawQueryParam('param');
let decodes = decodeQueryParameters(rawParamValue);
console.log(decodes);

const selectedIds = decodes[0];
const resultRanks = decodes[1];
const partsNumOfTop = rawParamValue.split('=');
numberOfTop = parseInt(partsNumOfTop[1]);
const selectedTheme = decodeURIComponent(partsNumOfTop[2]);

// ページロード時にCSVを読み込む
window.onload = loadCSV();


// CSVファイルをShift-JISで読み込む関数
async function loadCSV() {
    await fetch('static/songdata/songs.csv')  // 読み込むCSVファイルのパス
        .then(response => response.arrayBuffer())
        .then(buffer => {
            const decoder = new TextDecoder('shift-jis');
            const text = decoder.decode(new Uint8Array(buffer));
            // Parse時に、指定のIDだけ抜き出す
            songObjects = parseCSV(text, selectedIds);
            // Rank情報を付与し直す
            for (let i = 0; i < songObjects.length; i++) {
                songObjects[i].rank = resultRanks[i];
            }

            selectedSongs = songObjects; //ソート部と変数を合わせるために暫定処理

        });
    showResult(selectedSongs);
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
    // selectedIdsの順序に従ってsongObjsを並び替える
    songObjs.sort((a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id));

    return songObjs;
}


// Tableでランキングを表示
function showResult(songList) {

    // 疑似的なページ遷移

    // Twitterにシェアボタンを表示
    const TwitterDiv = document.getElementById('Twitter-share');
    TwitterDiv.style.display = 'block'


    // トップに戻るボタンの機能付与
    document.getElementById('backToHomeBtn').addEventListener('click', function () {
        window.location.href = '/';  // トップページにリダイレクト
    });


    // HTMLの要素を取得
    const themeContainer = document.getElementById('theme_container');

    // テンプレートリテラルを使ってHTMLを生成
    themeContainer.innerHTML = `<h2 class="center">テーマ:${selectedTheme} </h2>`;

    // let songListContainer = document.getElementById("result-box");


    // 文字列から "「" と "」" を削除する関数
    function removeBrackets(str) {
        return str.replace(/["「」]/g, ''); // "「" と "」" を削除
    }


    function createRankingList(songList) {
        const rankingListContainer = document.getElementById('ranking-list');

        songList.forEach(item => {
            // ranking対象外のものはスキップ
            if (item.rank == -1 || item.rank > numberOfTop) {
                return; // continue と同じ処理。
            }
            // ランキングカードの要素を作成
            const rankingCard = document.createElement('div');
            rankingCard.className = 'ranking-card';
            if (item.rank <= 3) {
                rankingCard.classList.add('top-3');
            }

            // ランク要素を作成
            const rankElement = document.createElement('div');
            rankElement.className = 'rank';
            rankElement.textContent = item.rank;

            // タイトル要素を作成
            const titleElement = document.createElement('div');
            titleElement.className = 'title';
            titleElement.textContent = item.song;

            // アルバム要素を作成
            const albumElement = document.createElement('div');
            albumElement.className = 'album';
            albumElement.textContent = item.album;

            // ランキングカードに要素を追加
            rankingCard.appendChild(rankElement);
            rankingCard.appendChild(titleElement);
            rankingCard.appendChild(albumElement);

            // ランキングリストにカードを追加
            rankingListContainer.appendChild(rankingCard);
        });
    }

    // 関数を呼び出してランキングリストを作成
    createRankingList(songList);


    // function createTableHead() {
    //     const tableHead = document.getElementById("table-head");
    //     const headRow = document.createElement("tr");
    //     const rankHeader = document.createElement("th");
    //     const titleHeader = document.createElement("th");
    //     const albumHeader = document.createElement("th");

    //     rankHeader.textContent = "順位";
    //     titleHeader.textContent = "曲名";
    //     albumHeader.textContent = "Album";

    //     headRow.appendChild(rankHeader);
    //     headRow.appendChild(titleHeader);
    //     headRow.appendChild(albumHeader);

    //     tableHead.appendChild(headRow);
    // }

    // function createTableBody() {
    //     const tableBody = document.getElementById("song-list");

    //     songList.forEach(song => {
    //         if (song.rank == -1 || song.rank > numberOfTop) {
    //             return; // continue と同じ処理。
    //         }
    //         const row = document.createElement("tr");
    //         const rankCell = document.createElement("td");
    //         const titleCell = document.createElement("td");
    //         const albumCell = document.createElement("td");

    //         rankCell.textContent = song.rank;
    //         titleCell.textContent = song.song;
    //         albumCell.textContent = removeBrackets(song.album);

    //         if (song.rank <= 3) {
    //             rankCell.classList.add("top-3");
    //             titleCell.classList.add("top-3");
    //             albumCell.classList.add("top-3");
    //             // rankCell.classList.add("special-rank");
    //             // titleCell.classList.add("special-title");
    //             // albumCell.classList.add("special-album");
    //         }

    //         row.appendChild(rankCell);
    //         row.appendChild(titleCell);
    //         row.appendChild(albumCell);

    //         tableBody.appendChild(row);
    //     });
    // }

    // createTableHead();
    // createTableBody();

    // 円グラフ描画

    // アルバム数を集計
    const albumCount = {};
    var songlength = 0;
    songList.forEach(song => {
        if (song.rank == -1 || song.rank > numberOfTop) {
            return; // continue と同じ処理。
        }
        if (albumCount[song.album]) {
            albumCount[song.album]++;
            songlength++;
        } else {
            albumCount[song.album] = 1;
            songlength++;
        }
    });
    console.assert(songlength > 0);
    if (songlength == 0) songlength = 1;


    const keys = Object.keys(albumCount);

    // 新しい文字列の配列を生成
    const modifiedKeys = keys.map(removeBrackets);

    var albumCountRatio = Object.values(albumCount);
    for (i = 0; i < albumCountRatio.length; i++) {
        albumCountRatio[i] = albumCountRatio[i] / songlength * 100;
    }

    //Todo:　小数の第何位までで切りたい！！！！！！！
    //Todo:　円グラフの位置と大きさ調整
    //Todo:　円グラフのラベル（数値）を重ねて表示。
    //Todo:　場合分けして、Top10まで、Top20まで、とかで円グラフ作る。

    // ドーナツ型の円グラフのデータ
    const data = {
        labels: modifiedKeys,
        datasets: [{
            // data: Object.values(albumCount),
            data: albumCountRatio,
            backgroundColor: [
                '#E57373', // カラー1
                '#F06292', // カラー2
                '#BA68C8', // カラー3
                '#9575CD', // カラー4
                '#7986CB', // カラー5
                '#64B5F6', // カラー6
                '#4FC3F7', // カラー7
                '#4DD0E1', // カラー8
                '#81C784', // カラー9
                '#AED581', // カラー10
                '#FFD54F', // カラー11
                '#FFB74D'  // カラー12
            ],
        }]
    };

    // ドーナツ型の円グラフを描画
    // const ctx = document.getElementById('donutChart').getContext('2d');
    // new Chart(ctx, {
    //     type: 'doughnut',
    //     data: data,
    // });


    // chartContainer要素のサイズを調整
    // const chartContainer = document.getElementById('chartContainer');
    // chartContainer.style.width = '128px';
    // chartContainer.style.height = '128px';
    // ctx.canvas.parentNode.style.height = "128px";
    // ctx.canvas.parentNode.style.width = "128px";
}




// Twitterにシェア機能
function shareOnTwitter() {
    // Twitterシェアボタンの内容を更新
    const twitterShareBtn = document.getElementById('twitterShareBtn');
    const currentUrl = window.location.href;
    console.log(currentUrl);
    // TOPページに戻る機能

    // 上位曲をTweetに含ませる
    const sortedSongTitles = selectedSongs.map(item => item.song);

    let shareText = `#BUMPSORT 結果! \n`
    shareText += `テーマ：${selectedTheme}\n`;
    shareText += `1位：${sortedSongTitles[0]}\n`;
    shareText += `2位：${sortedSongTitles[1]}\n`;
    shareText += `3位：${sortedSongTitles[2]}\n`;

    shareText += `全ての結果はこちら　⇒　` + currentUrl;

    // ここに機能追加したい
    // sortedSongTitlesの中の上位のいくつかを、下記のフォーマットで並べたい
    // 1位: hogehoge
    // 2位: fugafuga
    // …
    // 全ての結果はこちら⇒ https://~


    const twitterURL = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    twitterShareBtn.href = twitterURL;

    // Twitterウィンドウを開く
    window.open(twitterURL, '_blank');
}
