import { NextResponse } from "next/server";

interface SimulationRequest {
  code: string;
  payload: string;
}

interface SimulationResult {
  success: boolean;
  message: string;
  details: string;
  severity: string;
}

// SQL injection payload patterns
const sqlInjectionPatterns = [
  "' OR",
  "' or",
  "'OR",
  "'or",
  "' --",
  "'--",
  "' =",
  "'=",
  "1=1",
  "1' OR '1'='1",
  "'; DROP",
  "'; drop",
  "UNION SELECT",
  "union select",
  "admin'--",
  "admin' --",
];

// Patterns that indicate vulnerable string concatenation in code
const vulnerableCodePatterns = [
  /["']\s*\+\s*\w+\s*\+\s*["']/,     // "..." + variable + "..."
  /\$\{.*\}/,                          // template literal interpolation
  /concat\s*\(/i,                      // .concat() usage
];

// Patterns that indicate the code has been fixed (parameterized)
const secureCodePatterns = [
  /\?\s*,/,                            // ? placeholders
  /\$\d+/,                             // $1, $2 parameterized
  /prepare\s*\(/i,                     // prepared statements
  /execute\s*\(\s*\w+\s*,\s*\[/i,     // db.execute(query, [params])
  /parameterized/i,                    // mentions parameterized
];

function detectSqlInjection(code: string, payload: string): SimulationResult {
  const payloadLower = payload.toLowerCase().trim();

  // Check if the payload matches known SQL injection patterns
  const isInjectionPayload = sqlInjectionPatterns.some((pattern) =>
    payloadLower.includes(pattern.toLowerCase())
  );

  if (!isInjectionPayload) {
    return {
      success: false,
      message: "Exploit failed - payload is not a recognized attack pattern",
      details: "The input you provided does not contain SQL injection patterns. Try payloads like: admin' -- or ' OR '1'='1",
      severity: "NONE",
    };
  }

  // Check if the code uses secure patterns
  const isSecure = secureCodePatterns.some((pattern) => pattern.test(code));

  if (isSecure) {
    return {
      success: false,
      message: "Exploit failed - code is secure!",
      details: "The code uses parameterized queries or prepared statements. The SQL injection payload was safely handled and did not affect the query structure.",
      severity: "FIXED",
    };
  }

  // Check if the code contains vulnerable concatenation
  const isVulnerable = vulnerableCodePatterns.some((pattern) =>
    pattern.test(code)
  );

  if (isVulnerable) {
    // Simulate what the injected query would look like
    const simulatedQuery =
      "SELECT * FROM users WHERE username = '" +
      payload +
      "' AND password = 'anything'";

    return {
      success: true,
      message: "Login bypassed - SQL Injection successful!",
      details: "The code uses string concatenation to build SQL queries. Your payload was injected directly into the query:\n\n" + simulatedQuery,
      severity: "CRITICAL",
    };
  }

  return {
    success: false,
    message: "Exploit failed - input properly handled",
    details: "The code does not appear to contain obvious string concatenation vulnerabilities for the given payload.",
    severity: "NONE",
  };
}

export async function POST(req: Request) {
  try {
    const body: SimulationRequest = await req.json();
    const { code, payload } = body;

    if (!code || !payload) {
      return NextResponse.json(
        { error: "Code and payload are required." },
        { status: 400 }
      );
    }

    // Run simulation
    const result = detectSqlInjection(code, payload);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Simulation Error:", error);
    return NextResponse.json(
      { error: "Simulation failed." },
      { status: 500 }
    );
  }
}
