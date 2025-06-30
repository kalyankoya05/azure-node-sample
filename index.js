// index.js
require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// build a MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// middleware
app.use(express.urlencoded({ extended: true }));

// login form
app.get("/login", (_, res) => res.sendFile(path.join(__dirname, "login.html")));

// handle login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) AS cnt FROM Users WHERE UserName = ? AND UserPass = ?",
      [username, password]
    );
    if (rows[0].cnt > 0) {
      res.redirect("/");
    } else {
      res
        .status(401)
        .send('<h2>Invalid credentials</h2><a href="/login">Try again</a>');
    }
  } catch (err) {
    console.error("DB error", err);
    res.status(500).send("Server error");
  }
});

// home – show actual DB name & user list
app.get("/", async (_, res) => {
  try {
    // 1) get current database
    const [dbInfo] = await pool.query("SELECT DATABASE() AS name");
    const dbName = dbInfo[0].name;

    // 2) list all users
    const [users] = await pool.query(
      "SELECT UserId, UserName, UserPass FROM Users"
    );

    // 3) render a simple HTML table
    let html = `<h1>Connected to database: ${dbName}</h1>
                <h2>Users</h2>
                <table border="1" cellpadding="5">
                  <thead>
                    <tr><th>ID</th><th>UserName</th><th>Password</th></tr>
                  </thead><tbody>`;
    for (let u of users) {
      html += `<tr>
                 <td>${u.UserId}</td>
                 <td>${u.UserName}</td>
                 <td>${u.UserPass}</td>
               </tr>`;
    }
    html += "</tbody></table>";
    res.send(html);
  } catch (err) {
    console.error("DB error", err);
    res.status(500).send("Database error");
  }
});

app.listen(port, () => console.log(`App running: http://localhost:${port}`));
