require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./routes/auth");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/", authRoutes);

app.get("/dashboard", (req, res) => {
  if (!req.cookies.userId) return res.redirect("/login");
  res.render("pages/dashboard", { title: "Dashboard" });
});

app.listen(3000, () => console.log("Server chạy tại http://localhost:3000"));
