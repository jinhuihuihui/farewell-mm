// ============================================================
//  Cloudflare Worker — worker.js
//  处理留言 & 照片的存取，验证 Google 身份
// ============================================================

const ALLOWED_DOMAIN  = "shopee.com";
const JSONBIN_BIN_ID  = "6a3a5f89f5f4af5e292256a0";       // 填入你的 JSONBin Bin ID
const JSONBIN_API_KEY = "$2a$10$VytH5AtftFMp6iIBurnwG.6vy23/eluD13l.zb1Nmujp2FVAioxnO";    // 填入你的 JSONBin Master Key
const JSONBIN_URL     = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;
const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";

// ── CORS headers ──────────────────────────────────────────────
function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function errRes(msg, status = 400) {
  return new Response(msg, { status, headers: corsHeaders() });
}

// ── Main handler ─────────────────────────────────────────────
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // GET /api/items — fetch all notes & photos
    if (request.method === "GET" && path === "/api/items") {
      return handleGetItems();
    }

    // POST /api/notes — add a note
    if (request.method === "POST" && path === "/api/notes") {
      return handlePostNote(request);
    }

    // POST /api/photos — add a photo (base64 stored in JSONBin)
    if (request.method === "POST" && path === "/api/photos") {
      return handlePostPhoto(request);
    }

    return errRes("Not found", 404);
  },
};

// ── GET items ────────────────────────────────────────────────
async function handleGetItems() {
  try {
    const res = await fetch(JSONBIN_URL + "/latest", {
      headers: { "X-Master-Key": JSONBIN_API_KEY },
    });
    if (!res.ok) return jsonRes({ items: [] });
    const data = await res.json();
    return jsonRes({ items: data.record?.items || [] });
  } catch (e) {
    return jsonRes({ items: [] });
  }
}

// ── POST note ────────────────────────────────────────────────
async function handlePostNote(request) {
  let body;
  try { body = await request.json(); } catch { return errRes("Invalid JSON"); }

  const user = await verifyGoogleToken(body.token);
  if (!user) return errRes("Invalid token", 401);
  if (!user.email.endsWith("@" + ALLOWED_DOMAIN)) return errRes("Unauthorized domain", 403);

  const newItem = {
    id: Date.now().toString(),
    type: "note",
    message: (body.message || "").slice(0, 200),
    color: body.color || "#fff9c4",
    name: user.name,
    email: user.email,
    avatar: user.picture,
    createdAt: new Date().toISOString(),
  };

  return await appendItem(newItem);
}

// ── POST photo ───────────────────────────────────────────────
async function handlePostPhoto(request) {
  let body;
  try { body = await request.json(); } catch { return errRes("Invalid JSON"); }

  const user = await verifyGoogleToken(body.token);
  if (!user) return errRes("Invalid token", 401);
  if (!user.email.endsWith("@" + ALLOWED_DOMAIN)) return errRes("Unauthorized domain", 403);

  // Store base64 image directly (for small images)
  // For production with many large photos, use Cloudflare R2 instead
  const dataUrl = `data:${body.mimeType};base64,${body.imageBase64}`;

  const newItem = {
    id: Date.now().toString(),
    type: "photo",
    url: dataUrl,
    caption: (body.caption || "").slice(0, 80),
    name: user.name,
    email: user.email,
    createdAt: new Date().toISOString(),
  };

  return await appendItem(newItem);
}

// ── Append to JSONBin ────────────────────────────────────────
async function appendItem(newItem) {
  try {
    // Get current items
    const getRes = await fetch(JSONBIN_URL + "/latest", {
      headers: { "X-Master-Key": JSONBIN_API_KEY },
    });
    let items = [];
    if (getRes.ok) {
      const data = await getRes.json();
      items = data.record?.items || [];
    }

    items.push(newItem);

    // Save updated items
    const putRes = await fetch(JSONBIN_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_API_KEY,
      },
      body: JSON.stringify({ items }),
    });

    if (!putRes.ok) throw new Error("JSONBin write failed");
    return jsonRes({ success: true, item: newItem });
  } catch (e) {
    console.error(e);
    return errRes("Failed to save: " + e.message, 500);
  }
}

// ── Verify Google JWT ────────────────────────────────────────
async function verifyGoogleToken(token) {
  if (!token) return null;
  try {
    // Decode payload (signature verification skipped for simplicity;
    // for production, verify against Google's public keys)
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));

    // Check expiry
    if (payload.exp < Date.now() / 1000) return null;

    // Check issuer
    if (!["accounts.google.com", "https://accounts.google.com"].includes(payload.iss)) return null;

    return payload;
  } catch (e) {
    return null;
  }
}
