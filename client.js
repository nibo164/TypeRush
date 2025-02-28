let socket = io();

// ゲームの初期設定
const canvas = document.getElementById("game_canvas");
const context = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 400;

let isGameRunning = true;
let targetWord, enteredChar, currentIdx;
let isWordSet = false;

document.addEventListener("DOMContentLoaded", () => {
  // ゲーム開始時
  socket.on("startGame_to_client", (data) => {
    document.addEventListener("keydown", handleKeyPress);
    updateWord(data);
    gameLoop();
  });
  // 次の単語を受信
  socket.on("nextWord_to_client", (data) => {
    updateWord(data);
  });
});

function updateWord(data) {
  targetWord = data.targetWord;
  enteredChar = "";
  currentIdx = 0;
  isWordSet = true;
}

function handleKeyPress(event) {
  //文字の正誤判定
  if (event.key == targetWord.romaji[currentIdx]) {
    enteredChar += targetWord.romaji[currentIdx];
    currentIdx++;
  }
  //1単語打ち切ったとき
  if (enteredChar.length == targetWord.romaji.length) {
    isWordSet = false;
    socket.emit("nextWord_to_server");
  }
}

// ゲームの更新処理
function update() {}

// ゲームの描画処理
function draw() {
  context.fillStyle = "black";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // 問題を描画
  context.fillStyle = "white";
  context.font = "40px Arial";
  if (!isWordSet) {
    context.fillText("問題読込中…", 200, 100);
  } else {
    context.fillText(targetWord.jp, 200, 100);
    context.fillText(targetWord.romaji, 200, 150);
    context.fillText(enteredChar + " |", 200, 200);
  }
}

// ゲームループ
function gameLoop() {
  if (isGameRunning) {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }
}
