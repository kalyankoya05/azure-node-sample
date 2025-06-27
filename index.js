// index.js
require("dotenv").config();
const express = require("express");
const sql = require("mssql");

const app = express();
const port = process.env.PORT || 3000;
const dbConnString = process.env.SQL_CONNECTION;

if (!dbConnString) {
  console.error("ERROR: SQL_CONNECTION is not defined");
  process.exit(1);
}

// Create a connection pool
const pool = new sql.ConnectionPool(dbConnString);
const poolConnect = pool.connect();

pool.on("error", (err) => {
  console.error("SQL Pool Error", err);
});

app.get("/", async (req, res) => {
  try {
    // Ensure pool is connected
    await poolConnect;

    // Simple query
    const result = await pool
      .request()
      .query("SELECT TOP 1 name FROM sys.databases");

    res.send(`
      <h1>Azure Node Sample</h1>
      <p>Your Azure SQL server has at least this database:</p>
      <pre>${JSON.stringify(result.recordset, null, 2)}</pre>
    `);
  } catch (err) {
    console.error("DB error", err);
    res.status(500).send("Database error: " + err.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
