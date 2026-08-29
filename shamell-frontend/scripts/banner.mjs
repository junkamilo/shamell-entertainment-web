import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

loadEnvFile(path.join(__dirname, "..", ".env.local"));
loadEnvFile(path.join(__dirname, "..", ".env"));

const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").toLowerCase();
const nodeEnv = (process.env.NODE_ENV || "development").toLowerCase();

const isProd =
  nodeEnv === "production" ||
  (backendUrl.length > 0 &&
    !backendUrl.includes("localhost") &&
    !backendUrl.includes("127.0.0.1") &&
    !backendUrl.includes("-dev") &&
    !backendUrl.includes("backend-dev"));

if (isProd) {
  console.log(`
 ██████╗ ██████╗  ██████╗ ██████╗ 
 ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗
 ██████╔╝██████╔╝██║   ██║██║  ██║
 ██╔═══╝ ██╔══██╗██║   ██║██║  ██║
 ██║     ██║  ██║╚██████╔╝██████╔╝
 ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ 
`);
  console.log("⚠️  Iniciando entorno de PRODUCCIÓN para Shamell...");
  console.log(`🔗 Backend: ${process.env.NEXT_PUBLIC_BACKEND_URL || "(no definido)"}`);
  console.log("---------------------------------------------------------");
} else {
  console.log(`
 ██████╗ ███████╗██╗   ██╗
 ██╔══██╗██╔════╝██║   ██║
 ██║  ██║█████╗  ██║   ██║
 ██║  ██║██╔══╝  ╚██╗ ██╔╝
 ██████╔╝███████╗ ╚████╔╝ 
 ╚═════╝ ╚══════╝  ╚═══╝  
`);
  console.log("🚀 Iniciando entorno de DESARROLLO (DEV) para Shamell...");
  console.log("🔗 Conectado a la base de datos de pruebas.");
  console.log("---------------------------------------------------------");
}
