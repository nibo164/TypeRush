let socket = io();

let canvas, canvasWrapper, context;

let isGameRunning = true,
  isWordSet = false,
  isNextWordSet = false,
  isPlayerReady = false;
let targetWord, nextTargetWord, enteredChar, currentIdx;

document.addEventListener("DOMContentLoaded", () => {
  //接続確立時
  socket.on("connected_to_client", () => {
    createLoginForm();
  });

  //ログイン成功時
  socket.on("loginSuccess_to_client", (data) => {
    socket.emit("joinLobby_to_server", { userName: data.userName });
  });

  //ロビー入室時
  socket.on("lobbyJoined_to_client", () => {
    document.getElementsByTagName("h1")[0].innerText = "ロビー";
    createLobbyLog();
    createBattleWaitButton();
  });

  //ロビーのログ更新
  socket.on("updateLobbyLog_to_client", (data) => {
    if (data.state == "joinedLobby") {
      //ロビー入室時
      updateLobbyLog(data.userName + "がロビーに入室しました");
    } else if (data.state == "battleWaiting") {
      //対戦待ち時
      updateLobbyLog(data.userName + "が対戦相手を待っています");
    } else if (data.state == "battleStarted") {
      //対戦開始時
      updateLobbyLog(
        data.userName + "と" + data.opponentName + "が対戦を開始しました"
      );
    }
  });

  // 対戦開始
  socket.on("startGame_to_client", (data) => {
    document.getElementById("lobby_log").style.display = "none";
    document.getElementsByTagName("h1")[0].innerText = "対戦中";
    document.getElementById("battle_wait_button").style.display = "none";
    createGameCanvas();
    document.addEventListener("keydown", handleKeyPress);
    nextTargetWord = data.nextTargetWord;
    updateWord(data);
    gameLoop();
  });

  // 次の単語を受信
  socket.on("nextWord_to_client", (data) => {
    updateWord(data);
  });
});

function updateWord(data) {
  targetWord = nextTargetWord;
  isWordSet = true;
  nextTargetWord = data.targetWord;
  isNextWordSet = true;
  enteredChar = "";
  currentIdx = 0;
}

function handleKeyPress(event) {
  //文字の正誤判定
  if (event.key == targetWord.romaji[currentIdx]) {
    enteredChar += targetWord.romaji[currentIdx];
    currentIdx++;
  }
  //1単語打ち切ったとき
  if (enteredChar.length == targetWord.romaji.length) {
    (isWordSet = false), (isNextWordSet = false);
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
    context.fillText("問題読込中…", 200, 150);
  } else {
    context.fillText(targetWord.jp, 200, 150);
    context.fillText(targetWord.romaji, 200, 200);
    context.fillText(enteredChar + "|", 200, 250);
  }
  context.font = "25px Arial";
  if (!isNextWordSet) {
    context.fillText("問題読込中…", 200, 330);
  } else {
    context.fillText("NEXT => " + nextTargetWord.jp, 200, 330);
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

// ログインフォームの作成
function createLoginForm() {
  let loginForm = document.createElement("form");
  loginForm.id = "login_form";
  loginForm.name = "loginForm";
  let userNameInput = document.createElement("input");
  userNameInput.type = "text";
  userNameInput.name = "userName";
  let loginButton = document.createElement("button");
  loginButton.type = "button";
  loginButton.innerText = "ログイン";
  loginButton.onclick = login;
  loginForm.appendChild(userNameInput);
  loginForm.appendChild(loginButton);
  document.body.appendChild(loginForm);
}

// ログイン処理
function login() {
  let form = document.forms.loginForm;
  let userName = form.elements.userName.value;
  if (userName == "") {
    alert("ユーザー名を入力してください");
  } else {
    document.getElementById("login_form").style.display = "none";
    socket.emit("login_to_server", { userName: userName });
  }
}

//ゲーム描画領域の作成
function createGameCanvas() {
  (canvas = document.createElement("canvas")), (canvas.id = "game_canvas");
  (canvasWrapper = document.createElement("div")),
    (canvasWrapper.id = "canvas_wrapper");
  context = canvas.getContext("2d");
  canvasWrapper.appendChild(canvas);
  document.body.appendChild(canvasWrapper);
  (canvas.width = 800), (canvas.height = 400);
}

//ロビーのログを作成
function createLobbyLog() {
  let log = document.createElement("ul");
  log.id = "lobby_log";
  document.body.appendChild(log);
}

//ロビーのログを更新
function updateLobbyLog(message) {
  let log = document.getElementById("lobby_log");
  let li = document.createElement("li");
  li.innerText = message;
  log.appendChild(li);
}

//対戦待ちボタンの作成
function createBattleWaitButton() {
  let button = document.createElement("button");
  button.id = "battle_wait_button";
  button.innerText = "対戦相手を待つ";
  button.onclick = battleWait;
  document.body.appendChild(button);
}

//対戦相手待ち処理
function battleWait() {
  document.getElementsByTagName("h1")[0].innerText = "対戦相手を待っています…";
  document.getElementById("battle_wait_button").style.display = "none";
  socket.emit("battleWait_to_server");
}
