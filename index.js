// index.js
require("dotenv").config();
const express = require("express");
const sql = require("mssql");

const app = express();
const port = process.env.PORT || 3000;
const connStr = process.env.SQL_CONNECTION;

if (!connStr) {
  console.error("ERROR: SQL_CONNECTION is missing");
  process.exit(1);
}

const pool = new sql.ConnectionPool(connStr);
const poolConnect = pool.connect();

pool.on("error", (err) => {
  console.error("SQL pool error", err);
});

app.get("/", async (req, res) => {
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
