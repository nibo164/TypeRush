let socket = io();

// ゲームの初期設定
const canvas = document.getElementById("game");
const context = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 300;

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
  if (event.key == targetWord[currentIdx]) {
    enteredChar += targetWord[currentIdx];
    currentIdx++;
  }
  //1単語打ち切ったとき
  if (enteredChar.length == targetWord.length) {
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
    context.fillText("お題: " + targetWord, 200, 100);
    context.fillText(enteredChar + " |", 200, 150);
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
