const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath) {
  try {
    const text = fs.readFileSync(filePath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // optional local env file
  }
}

loadEnvFile(path.join(__dirname, ".env"));

const nodeEnv = (process.env.NODE_ENV || "development").toLowerCase();
const databaseUrl = (process.env.DATABASE_URL || "").toLowerCase();

const looksLikeDevDb =
  databaseUrl.includes("long-river") ||
  databaseUrl.includes("-dev") ||
  databaseUrl.includes("localhost") ||
  databaseUrl.includes("127.0.0.1");

const isProd =
  nodeEnv === "production" || (databaseUrl.length > 0 && !looksLikeDevDb);

if (isProd) {
  console.log(`
 ██████╗ ██████╗  ██████╗ ██████╗ 
 ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗
 ██████╔╝██████╔╝██║   ██║██║  ██║
 ██╔═══╝ ██╔══██╗██║   ██║██║  ██║
 ██║     ██║  ██║╚██████╔╝██████╔╝
 ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ 
`);
  console.log("⚠️  Iniciando BACKEND de Shamell en modo PRODUCCIÓN...");
  console.log("🗄️  Conectado a base de datos: PRODUCCIÓN");
  console.log("---------------------------------------------------------");
} else {
  console.log(`
 ██████╗  █████╗  ██████╗██╗  ██╗
 ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝
 ██████╔╝███████║██║     █████╔╝ 
 ██╔══██╗██╔══██║██║     ██╔═██╗ 
 ██████╔╝██║  ██║╚██████╗██║  ██╗
 ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
`);
  console.log("⚙️  Iniciando BACKEND de Shamell en modo DEV...");
  console.log("🗄️  Conectado a base de datos: NEON (PRUEBAS)");
  console.log("---------------------------------------------------------");
}
