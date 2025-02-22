let express = require("express");
let app = express();
let http = require("http").Server(app);
let io = require("socket.io")(http);
const PORT = process.env.PORT || 7000;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
