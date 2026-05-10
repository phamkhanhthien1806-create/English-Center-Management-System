// test
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello world. ABC");
});

app.listen(5173, () => {
  console.log("Server đang chạy tại cổng 5173");
});
