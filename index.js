// index.js
require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const connStr = process.env.SQL_CONNECTION;

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

if (!connStr) {
  console.error("ERROR: SQL_CONNECTION is missing");
  process.exit(1);
}

const pool = new sql.ConnectionPool(connStr);
const poolConnect = pool.connect();

pool.on("error", (err) => {
  console.error("SQL pool error", err);
});

// GET /login → serve the HTML form
app.get("/login", (_, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/amazon", (_, res) => {
  res.sendFile(path.join(__dirname, "amazon.html"));
});

// POST /login → check credentials in your Users table
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("u", sql.VarChar(50), username)
      .input("p", sql.VarChar(50), password)
      .query(
        "SELECT COUNT(*) AS cnt FROM Users WHERE UserName = @u AND UserPass = @p"
      );

    if (result.recordset[0].cnt > 0) {
      // on success, redirect to home
      res.redirect("/");
    } else {
      res
        .status(401)
        .send("<h2>Invalid credentials</h2><a href='/login'>Try again</a>");
    }
  } catch (err) {
    console.error("DB query error", err);
    res.status(500).send("Server error");
  }
});

// GET / → your existing DB-name page
app.get("/", async (_, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query("SELECT DB_NAME() AS name");
    res.send(`<h1>Connected to ${result.recordset[0].name}</h1>`);
  } catch (err) {
    console.error("DB query error", err);
    res.status(500).send("Database error: " + err.message);
  }
});

app.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`);
});
