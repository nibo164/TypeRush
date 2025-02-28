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
    socket.emit("loginSuccess_to_client", { userName: data.userName });
  });

  //ロビー入室時
  socket.on("joinLobby_to_server", (data) => {
    console.log(data.userName + "がロビーに入室しました");
    waitingUsers_lobby.push(socket);
    socket.join("lobby");
    socket.emit("lobbyJoined_to_client");
    io.to("lobby").emit("updateLobbyLog_to_client", {
      userName: data.userName,
      state: "joinedLobby",
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
        let room = "room_" + socket.userName + "_" + opponent.userName;
        socket.join(room);
        opponent.join(room);
        io.to("lobby").emit("updateLobbyLog_to_client", {
          userName: socket.userName,
          opponentName: opponent.userName,
          state: "battleStarted",
        });

        //ゲーム開始処理
        io.to(room).emit("startGame_to_client", {
          targetWord: chooseWord(),
          nextTargetWord: chooseWord(),
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
  });

  /*
  //ゲーム開始
  socket.emit("startGame_to_client", {
    targetWord: chooseWord(),
    nextTargetWord: chooseWord(),
  });
  */
  //次の単語を送信
  socket.on("nextWord_to_server", () => {
    socket.emit("nextWord_to_client", { targetWord: chooseWord() });
  });

  //接続切断時
  socket.on("disconnect", () => {
    console.log("user disconnected");

    //ロビー、対戦待ちそれぞれのリストからユーザーを削除
    waitingUsers_lobby = waitingUsers_lobby.filter(
      (user) => user.userName != socket.userName
    );
    waitingUsers_battle = waitingUsers_battle.filter(
      (user) => user.userName != socket.userName
    );
  });
});

http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

//単語リスト
let json = fs.readFileSync("wordList.json", "utf8");
let wordList = JSON.parse(json);

function chooseWord() {
  return wordList.words[parseInt(Math.random() * wordList.words.length)];
}
