let express = require("express");
let app = express();
let http = require("http").Server(app);
let io = require("socket.io")(http);
const PORT = process.env.PORT || 7000;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.use(express.static(__dirname));

//接続確立時
io.on("connection", (socket) => {
  console.log("a user connected");

  //ゲーム開始時
  io.emit("startGame_to_client", { targetWord: chooseWord() });

  //次の単語を送信
  socket.on("nextWord_to_server", () => {
    io.emit("nextWord_to_client", { targetWord: chooseWord() });
  });

  //接続切断時
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

//単語リスト
let wordList = [
  "session",
  "player",
  "server",
  "apple",
  "sky",
  "opened",
  "error",
];

function chooseWord() {
  return wordList[parseInt(Math.random() * wordList.length)];
}
