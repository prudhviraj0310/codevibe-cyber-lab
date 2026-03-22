export const fileContents: Record<string, string> = {
  "login.js": `// ⚠️ VULNERABLE CODE — For Educational Purposes Only
// This code demonstrates a SQL Injection vulnerability.
// NEVER use string concatenation to build SQL queries!

function login(user, pass) {
  // 🔴 VULNERABLE: Direct string concatenation
  const query = "SELECT * FROM users WHERE username = '" + user + "' AND password = '" + pass + "'";
  return query;
}

// Example attack:
// login("admin' --", "anything")
// This would produce:
// SELECT * FROM users WHERE username = 'admin' --' AND password = 'anything'
// The -- comments out the password check!

// ✅ SAFE VERSION using parameterized queries:
// function loginSafe(user, pass) {
//   const query = "SELECT * FROM users WHERE username = ? AND password = ?";
//   return db.execute(query, [user, pass]);
// }

console.log(login("admin", "password123"));
console.log("\\n--- Try an injection ---");
console.log(login("admin' --", "anything"));
`,

  "server.js": `// ⚠️ VULNERABLE SERVER — For Educational Purposes Only
// This Express server has multiple security issues.

const express = require("express");
const app = express();

// 🔴 VULNERABILITY 1: No input validation
app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  // Directly using user input in database query
  const query = \`SELECT * FROM users WHERE id = \${userId}\`;
  res.json({ query });
});

// 🔴 VULNERABILITY 2: Sensitive data in response
app.get("/debug", (req, res) => {
  res.json({
    dbPassword: process.env.DB_PASSWORD,
    apiKey: process.env.API_KEY,
    nodeEnv: process.env.NODE_ENV,
  });
});

// 🔴 VULNERABILITY 3: No rate limiting
app.post("/login", (req, res) => {
  // No protection against brute-force attacks
  const { username, password } = req.body;
  // ... authentication logic
});

// 🔴 VULNERABILITY 4: CORS misconfiguration
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  next();
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});

// ✅ LEARNING POINTS:
// 1. Always validate and sanitize user input
// 2. Never expose environment variables
// 3. Implement rate limiting (e.g., express-rate-limit)
// 4. Configure CORS properly with specific origins
// 5. Use helmet.js for security headers
`,
};
