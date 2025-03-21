let express = require("express");
let fs = require("fs");
let app = express();
let http = require("http").Server(app);
let io = require("socket.io")(http);
const PORT = process.env.PORT || 7000;

//ロビーにいるユーザーリスト
let waitingUsers_lobby = [];

//対戦待ちのユーザーリスト
let waitingUsers_battle = [];

//単語リスト
let json = fs.readFileSync("wordList.json", "utf8");
let allWordList = JSON.parse(json);

const WORDLISTLENGTH = 10;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.use(express.static(__dirname));

//接続確立時
io.on("connection", (socket) => {
  console.log("a user connected");
  socket.emit("connected_to_client");

  //ユーザーログイン時
  socket.on("login_to_server", (data) => {
    console.log(data.userName + "がログインしました");
    socket.userName = data.userName;
    socket.emit("loginSuccess_to_client");
  });

  //ロビー入室時
  socket.on("joinLobby_to_server", () => {
    console.log(socket.userName + "がロビーに入室しました");
    waitingUsers_lobby.push(socket);
    socket.join("lobby");
    socket.emit("lobbyJoined_to_client");
    io.to("lobby").emit("updateLobbyLog_to_client", {
      userName: socket.userName,
      state: "joinedLobby",
    });
  });

  //対戦待ち時
  socket.on("battleWait_to_server", () => {
    console.log(socket.userName + "が対戦待ちになりました");
    io.to("lobby").emit("updateLobbyLog_to_client", {
      userName: socket.userName,
      state: "battleWaiting",
    });
    if (waitingUsers_battle.length > 0) {
      //対戦待ちのユーザーが存在する場合
      let opponent = waitingUsers_battle.shift();

      //対戦待ちから両ユーザーを削除
      waitingUsers_battle = waitingUsers_battle.filter(
        (user) => user.id != socket.id || user.id != opponent.id
      );
      socket.leave("battleWait");
      opponent.leave("battleWait");

      //ルームIDを生成
      let room = "room_" + socket.id + "_" + opponent.id;

      socket.roomId = room;
      opponent.roomId = room;
      socket.opponentName = opponent.userName;
      opponent.opponentName = socket.userName;

      //対戦部屋に入室
      socket.join(room);
      opponent.join(room);
      io.to("lobby").emit("updateLobbyLog_to_client", {
        userName: socket.userName,
        opponentName: opponent.userName,
        state: "battleStarted",
      });

      //ゲーム開始処理
      io.to(room).emit("startGame_to_client", {
        wordList: createWordList(),
        battleProg: 0,
        oppBattleProg: 0,
      });

      console.log(
        socket.userName + "と" + opponent.userName + "が対戦を開始しました"
      );
    } else {
      //対戦待ちのユーザーが存在しない場合
      waitingUsers_battle.push(socket);
      socket.join("battleWait");
    }
  });

  //対戦中ユーザーのいずれかがゲームを終了した場合
  socket.on(socket.id + "finishGame_to_server", () => {
    io.to(socket.roomId).emit("gameResult_to_client", {
      winnerId: socket.id,
    });
    console.log(
      socket.userName + "が" + socket.opponentName + "に勝利しました"
    );
    io.to("lobby").emit("updateLobbyLog_to_client", {
      userName: socket.userName,
      opponentName: socket.opponentName,
      state: "battleFinished",
    });
  });

  //対戦部屋から退出
  socket.on("leaveRoom_to_server", () => {
    socket.leave(socket.roomId);
    delete socket.roomId;
    delete socket.opponentName;
    delete socket.opponentId;
  });

  //接続切断時
  socket.on("disconnect", () => {
    console.log("user disconnected");

    //ロビー、対戦待ちそれぞれのリストからユーザーを削除
    waitingUsers_lobby = waitingUsers_lobby.filter(
      (user) => user.id != socket.id
    );
    waitingUsers_battle = waitingUsers_battle.filter(
      (user) => user.id != socket.id
    );
  });
});

http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

//ランダムな単語を選択
function chooseWord() {
  return allWordList.words[parseInt(Math.random() * allWordList.words.length)];
}

//クライアントに送信する単語リストを作成
function createWordList() {
  let wordList = [];
  for (let i = 0; i < WORDLISTLENGTH; i++) {
    wordList.push(chooseWord());
  }
  return wordList;
}
