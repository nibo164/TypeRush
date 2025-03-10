let socket = io();

let canvas, canvasWrapper, context;

let battleProg, oppBattleProg, wordList;

let isGameRunning = true,
  isWordSet = false,
  isNextWordSet = false;
let targetWord, nextTargetWord, enteredChar, currentIdx;

document.addEventListener("DOMContentLoaded", () => {
  //接続確立時
  socket.on("connected_to_client", () => {
    createLoginForm();
  });

  //ログイン成功時
  socket.on("loginSuccess_to_client", () => {
    socket.emit("joinLobby_to_server");
  });

  //ロビー入室時
  socket.on("lobbyJoined_to_client", () => {
    document.getElementsByTagName("h3")[0].innerText = "ロビー";
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
    } else if (data.state == "battleFinished") {
      //対戦終了時
      updateLobbyLog(data.userName + "が" + data.opponentName + "に勝利！");
    }
  });

  // 対戦開始
  socket.on("startGame_to_client", (data) => {
    document.getElementById("lobby_log").style.display = "none";
    document.getElementsByTagName("h3")[0].innerText = "対戦中";
    document.getElementById("battle_wait_button").remove();
    createGameCanvas();
    document.addEventListener("keydown", handleKeyPress);
    initBattleProg(data);
    updateWord(data);
    gameLoop();
  });

  //対戦結果受信
  socket.on("gameResult_to_client", (data) => {
    isGameRunning = false;
    if (data.winnerId == socket.id) {
      alert("勝ちました！");
    } else {
      alert("負けました…");
    }

    //ゲーム描画領域を非表示
    document.getElementById("canvas_wrapper").style.display = "none";

    //対戦部屋から退出
    socket.emit("leaveRoom_to_server");

    //ロビーに戻る
    socket.emit("joinLobby_to_server");
  });
});

function updateWord(data) {
  targetWord = data.wordList[data.battleProg];
  isWordSet = true;
  if (battleProg == wordList.length - 1)
    //最後の単語の場合
    nextTargetWord = { jp: "------", romaji: "------" };
  else nextTargetWord = data.wordList[data.battleProg + 1];
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
    battleProg++;
    if (battleProg == wordList.length) {
      //ゲーム終了をサーバーに通知
      socket.emit(socket.id + "finishGame_to_server");
    } else {
      updateWord({ wordList: wordList, battleProg: battleProg });
    }
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
  if (document.getElementById("login_form") == null) {
    let loginForm = document.createElement("form");
    loginForm.id = "login_form";
    loginForm.name = "loginForm";
    let userNameLabel = document.createElement("label");
    userNameLabel.innerText = "user name";
    userNameLabel.htmlFor = "userName";
    let userNameInput = document.createElement("input");
    userNameInput.type = "text";
    userNameInput.name = "userName";
    let loginButton = document.createElement("button");
    loginButton.type = "button";
    loginButton.id = "login_button";
    loginButton.className = "button";
    loginButton.innerText = "ログイン";
    loginButton.onclick = login;
    loginForm.appendChild(userNameLabel);
    loginForm.appendChild(userNameInput);
    loginForm.appendChild(loginButton);
    document.body.appendChild(loginForm);
  }
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
  if (document.getElementById("canvas_wrapper") != null) {
    document.getElementById("canvas_wrapper").style.display = "block";
  } else {
    (canvas = document.createElement("canvas")), (canvas.id = "game_canvas");
    (canvasWrapper = document.createElement("div")),
      (canvasWrapper.id = "canvas_wrapper");
    context = canvas.getContext("2d");
    canvasWrapper.appendChild(canvas);
    document.body.appendChild(canvasWrapper);
    (canvas.width = 800), (canvas.height = 400);
  }
}

//ロビーのログを作成
function createLobbyLog() {
  if (document.getElementById("lobby_log") != null) {
    document.getElementById("lobby_log").style.display = "block";
  } else {
    let log = document.createElement("ul");
    log.id = "lobby_log";
    document.body.appendChild(log);
  }
}

//ロビーのログを更新
function updateLobbyLog(message) {
  if (document.getElementById("lobby_log") != null) {
    let log = document.getElementById("lobby_log");
    let li = document.createElement("li");
    li.innerText = message;
    log.appendChild(li);
  }
}

//対戦待ちボタンの作成
function createBattleWaitButton() {
  if (document.getElementById("battle_wait_button") == null) {
    let button = document.createElement("button");
    button.id = "battle_wait_button";
    button.className = "button";
    button.innerText = "対戦相手を待つ";
    button.onclick = battleWait;
    document.body.appendChild(button);
  }
}

//対戦相手待ち処理
function battleWait() {
  document.getElementsByTagName("h3")[0].innerText = "対戦相手を待っています…";
  document.getElementById("battle_wait_button").style.display = "none";
  socket.emit("battleWait_to_server");
}

//対戦情報の初期化
function initBattleProg(data) {
  battleProg = data.battleProg;
  oppBattleProg = data.oppBattleProg;
  wordList = data.wordList;
  isGameRunning = true;
}
