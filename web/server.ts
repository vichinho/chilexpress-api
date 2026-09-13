/**
 * Servidor web simple para consultar el tracking de Chilexpress.
 *
 * - Mantiene un REGISTRO de OT de la empresa en data/ots.json (la API de
 *   Chilexpress no permite listar "todos los envios por RUT", asi que se
 *   registran las OT que interesan y se consulta su estado).
 * - Las subscription keys viven SOLO en el servidor; el navegador nunca las ve.
 *
 * Uso:
 *   npm run web
 *   -> abre http://localhost:3000
 */
import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { ChilexpressClient, normalizeTracking, ChilexpressError } from "../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const OTS_FILE = join(DATA_DIR, "ots.json");
const PORT = Number(process.env.PORT ?? 3000);

const client = new ChilexpressClient();

// ---------------------------------------------------------------------------
// Registro de OT (persistencia simple en archivo JSON)
// ---------------------------------------------------------------------------
interface OtRecord {
  ot: string;
  note?: string;
  addedAt: string;
  lastCheckedAt?: string;
  lastStatusCode?: number | null;
  lastStatus?: string;
}

async function readOts(): Promise<OtRecord[]> {
  try {
    const raw = await readFile(OTS_FILE, "utf8");
    return JSON.parse(raw) as OtRecord[];
  } catch {
    return [];
  }
}

async function writeOts(list: OtRecord[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(OTS_FILE, JSON.stringify(list, null, 2), "utf8");
}

async function trackAndUpdate(rec: OtRecord): Promise<OtRecord> {
  const res = await client.tracking.getByTrackingNumber(rec.ot);
  const n = normalizeTracking(rec.ot, res);
  return {
    ...rec,
    lastCheckedAt: new Date().toISOString(),
    lastStatusCode: n.statusCode,
    lastStatus: n.ok ? n.currentStatus : n.statusText,
  };
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

/** Consulta puntual de una OT (sin registrarla). */
app.get("/api/track/:ot", async (req, res) => {
  try {
    const envelope = await client.tracking.getByTrackingNumber(req.params.ot);
    res.json(normalizeTracking(req.params.ot, envelope));
  } catch (err) {
    res.status(502).json({ error: err instanceof ChilexpressError ? err.message : String(err) });
  }
});

/** Lista el registro de OT con su ultimo estado conocido. */
app.get("/api/ots", async (_req, res) => {
  res.json(await readOts());
});

/** Agrega una OT al registro y la consulta al momento. */
app.post("/api/ots", async (req, res) => {
  const ot = String(req.body?.ot ?? "").trim();
  const note = req.body?.note ? String(req.body.note) : undefined;
  if (!ot) return res.status(400).json({ error: "Falta el numero de OT." });

  const list = await readOts();
  if (list.some((r) => r.ot === ot)) {
    return res.status(409).json({ error: "Esa OT ya esta registrada." });
  }

  let rec: OtRecord = { ot, note, addedAt: new Date().toISOString() };
  try {
    rec = await trackAndUpdate(rec);
  } catch {
    /* si falla la consulta, igual se registra; se reintenta al actualizar */
  }
  list.unshift(rec);
  await writeOts(list);
  res.status(201).json(rec);
});

/** Reconsulta el estado de todas las OT registradas. */
app.post("/api/ots/refresh", async (_req, res) => {
  const list = await readOts();
  const updated: OtRecord[] = [];
  for (const rec of list) {
    try {
      updated.push(await trackAndUpdate(rec));
    } catch {
      updated.push(rec);
    }
  }
  await writeOts(updated);
  res.json(updated);
});

/** Elimina una OT del registro. */
app.delete("/api/ots/:ot", async (req, res) => {
  const list = await readOts();
  await writeOts(list.filter((r) => r.ot !== req.params.ot));
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`\n🚚 Chilexpress web en http://localhost:${PORT}`);
  console.log(`   Ambiente: ${client.config.environment}\n`);
});
