// index.js
require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const connStr = process.env.SQL_CONNECTION;

if (!connStr) {
  console.error("ERROR: SQL_CONNECTION is missing");
  process.exit(1);
}

const pool = new sql.ConnectionPool(connStr);
const poolConnect = pool.connect();
pool.on("error", err => console.error("SQL pool error", err));

// Serve your login form
app.get("/login", (_, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

// Display actual DB contents on the home page
app.get("/", async (req, res) => {
  try {
    await poolConnect;

    // 1) Show the database name
    const dbNameResult = await pool.request()
      .query("SELECT DB_NAME() AS name");
    const dbName = dbNameResult.recordset[0].name;

    // 2) Read all rows from your Users table
    const usersResult = await pool.request()
      .query("SELECT UserId, UserName, UserPass FROM Users");

    // 3) Build an HTML page
    let html = `
      <h1>Connected to database: ${dbName}</h1>
      <h2>All Users</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr>
            <th>UserId</th>
            <th>UserName</th>
            <th>UserPass</th>
          </tr>
        </thead>
        <tbody>
    `;
    usersResult.recordset.forEach(row => {
      html += `
        <tr>
          <td>${row.UserId}</td>
          <td>${row.UserName}</td>
          <td>${row.UserPass}</td>
        </tr>
      `;
    });
    html += `
        </tbody>
      </table>
    `;

    res.send(html);
  } catch (err) {
    console.error("DB query error", err);
    res.status(500).send("Database error: " + err.message);
  }
});

app.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`);
});
