const REQUIRED_ENV = [
  "GROQ_API_KEY",
  "RAPIDAPI_KEY",
  "TAVILY_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const DEFAULT_DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function validateEnv(requiredVars = REQUIRED_ENV) {
  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}`
    );
  }
}

function getAllowedOrigins() {
  const configured = process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || "";
  const origins = configured
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : DEFAULT_DEV_ORIGINS;
}

function buildCorsOptions() {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "OPTIONS"],
  };
}

module.exports = {
  REQUIRED_ENV,
  validateEnv,
  getAllowedOrigins,
  buildCorsOptions,
};
