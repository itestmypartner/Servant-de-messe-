const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();

// Configuration
const OWNER = 'itestmypartner';
const REPO = 'Servant-de-messe-';
const NEWS_PATH = 'data/news.json';
const INSCRIPTIONS_PATH = 'data/inscriptions.json';
const FORMATIONS_PATH = 'data/formations.json';
const MEMBRES_PATH = 'data/membres-formation.json';
const CONFIG_PATH = 'data/config.json';
const BRANCH = 'main';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '200700';

// Headers de sécurité HTTP de base
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  // Données de mineurs : jamais servies comme fichier statique
  if (req.path.startsWith('/data/membres')) return res.status(404).end();
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '2mb' }));

// Servir les fichiers statiques du repo
app.use(express.static(path.join(__dirname, '..')));

// Simple in-memory rate limiter pour prévenir le spam
const ipRequestCounts = new Map();
function rateLimiter(windowMs, maxRequests) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = ipRequestCounts.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + windowMs;
    } else {
      entry.count += 1;
    }
    ipRequestCounts.set(ip, entry);

    if (entry.count > maxRequests) {
      return res.status(429).json({ error: 'Trop de requêtes. Veuillez patienter quelques minutes.' });
    }
    next();
  };
}

// Middleware d'authentification admin (vérifie d'abord un hash personnalisé
// stocké dans data/config.json, sinon retombe sur ADMIN_PASSWORD env)
async function requireAdminAuth(req, res, next) {
  const providedPassword = req.headers['x-admin-password'] || (req.body && req.body.publishPassword);
  if (!providedPassword) {
    return res.status(401).json({ error: 'Accès non autorisé : mot de passe admin requis.' });
  }
  try {
    if (await verifyAdminPassword(providedPassword)) return next();
  } catch (err) {
    console.error('Erreur vérification mot de passe admin:', err);
  }
  return res.status(401).json({ error: 'Accès non autorisé : mot de passe admin invalide.' });
}

function sha256(str) {
  return crypto.createHash('sha256').update(String(str)).digest('hex');
}

// Cache court du hash personnalisé (évite un appel GitHub à chaque requête)
let adminHashCache = { at: 0, hash: null };

async function getAdminPasswordHash() {
  const token = getToken();
  if (!token) return null;
  if (Date.now() - adminHashCache.at < 60 * 1000) return adminHashCache.hash;
  try {
    const cfg = await readRepoJsonAny(CONFIG_PATH, token);
    adminHashCache = {
      at: Date.now(),
      hash: (cfg.data && typeof cfg.data === 'object' && cfg.data.adminPasswordHash) || null
    };
  } catch (err) {
    adminHashCache = { at: Date.now(), hash: null };
  }
  return adminHashCache.hash;
}

async function verifyAdminPassword(password) {
  const hash = await getAdminPasswordHash();
  if (hash) return sha256(password) === hash;
  return password === ADMIN_PASSWORD;
}

function getToken(){
  return process.env.NEWS_PUBLISH_TOKEN || process.env.GITHUB_TOKEN || null;
}

function githubHeaders(token){
  return {
    Authorization: 'token ' + token,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'publish-news-service'
  };
}

// Lecture d'un fichier JSON du repo (tableau OU objet)
async function readRepoJsonAny(filePath, token){
  const headers = githubHeaders(token);
  const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}?ref=${BRANCH}`;
  const getRes = await fetch(getUrl, { headers });

  if(getRes.status === 404){
    return { exists: false, sha: null, data: null };
  }
  if(!getRes.ok){
    const err = await getRes.text();
    throw new Error('GitHub read failed: ' + err);
  }

  const payload = await getRes.json();
  const decoded = Buffer.from(payload.content || '', 'base64').toString('utf8');
  let parsed = null;
  if(decoded.trim()){
    parsed = JSON.parse(decoded);
  }
  return { exists: true, sha: payload.sha, data: parsed };
}

async function readRepoJson(filePath, token){
  const result = await readRepoJsonAny(filePath, token);
  if(!result.exists){
    return { exists: false, sha: null, data: [] };
  }
  if(!Array.isArray(result.data)){
    throw new Error('Stored JSON is not an array');
  }
  return result;
}

async function writeRepoJson(filePath, data, commitMessage, token, sha){
  const headers = Object.assign({ 'Content-Type': 'application/json' }, githubHeaders(token));
  const content = JSON.stringify(data, null, 2);
  const b64 = Buffer.from(content, 'utf8').toString('base64');
  const putUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;
  const body = { message: commitMessage, content: b64, branch: BRANCH };
  if(sha){
    body.sha = sha;
  }
  const putRes = await fetch(putUrl, { method: 'PUT', headers, body: JSON.stringify(body) });
  const putJson = await putRes.json();
  if(!putRes.ok){
    throw new Error(typeof putJson === 'string' ? putJson : JSON.stringify(putJson));
  }
  return putJson;
}

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'publish-news' }));

// Publication d'actualités (authentifié)
app.post('/api/publish-news', requireAdminAuth, async (req, res) => {
  try{
    const token = getToken();
    if(!token) return res.status(500).json({ error: 'Token GitHub non configuré sur le serveur (NEWS_PUBLISH_TOKEN).' });

    const news = req.body && req.body.news;
    if(!Array.isArray(news)) return res.status(400).json({ error: 'Données actualités invalides.' });

    const existing = await readRepoJson(NEWS_PATH, token);
    const result = await writeRepoJson(NEWS_PATH, news, 'Publish news via Render service', token, existing.sha);
    return res.json({ ok: true, result });
  }catch(err){
    console.error('Erreur /api/publish-news:', err);
    return res.status(500).json({ error: 'Erreur lors de la publication des actualités.' });
  }
});

// Récupération des inscriptions (authentifié pour protéger les données de mineurs)
app.get('/api/inscriptions', requireAdminAuth, async (req, res) => {
  try{
    const token = getToken();
    if(!token) return res.status(500).json({ error: 'Token GitHub non configuré sur le serveur (NEWS_PUBLISH_TOKEN).' });
    const existing = await readRepoJson(INSCRIPTIONS_PATH, token);
    return res.json({ ok: true, inscriptions: existing.data });
  }catch(err){
    console.error('Erreur GET /api/inscriptions:', err);
    return res.status(500).json({ error: 'Impossible de lire les inscriptions.' });
  }
});

// Soumission publique d'inscription (avec rate limit et validation stricte)
app.post('/api/inscriptions', rateLimiter(10 * 60 * 1000, 10), async (req, res) => {
  try{
    const token = getToken();
    if(!token) return res.status(500).json({ error: 'Token GitHub non configuré sur le serveur (NEWS_PUBLISH_TOKEN).' });
    const input = req.body && req.body.inscription;
    if(!input || typeof input !== 'object'){
      return res.status(400).json({ error: 'Payload inscription manquant ou invalide.' });
    }

    // Assainissement des champs texte
    const nom = String(input.nom || '').trim().slice(0, 50);
    const prenom = String(input.prenom || '').trim().slice(0, 50);
    const tel = String(input.tel || '').trim().slice(0, 20);
    const age = Number(input.age || 0);

    if(!nom || !prenom || !tel || !Number.isFinite(age) || age < 6 || age > 25){
      return res.status(400).json({ error: 'Informations d\'inscription invalides.' });
    }

    const existing = await readRepoJson(INSCRIPTIONS_PATH, token);
    const nowIso = new Date().toISOString();
    const inscription = {
      id: String(input.id || (nowIso + '-' + Math.floor(Math.random() * 100000))),
      nom,
      prenom,
      age: Math.round(age),
      tel,
      date: String(input.date || new Date().toLocaleString('fr-FR')),
      createdAt: String(input.createdAt || nowIso)
    };

    const updated = existing.data.concat([inscription]);
    await writeRepoJson(INSCRIPTIONS_PATH, updated, 'Add inscription via public form', token, existing.sha);
    return res.json({ ok: true, inscription });
  }catch(err){
    console.error('Erreur POST /api/inscriptions:', err);
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'inscription.' });
  }
});

// Mise à jour de la liste complète des inscriptions (authentifié)
app.put('/api/inscriptions', requireAdminAuth, async (req, res) => {
  try{
    const token = getToken();
    if(!token) return res.status(500).json({ error: 'Token GitHub non configuré sur le serveur (NEWS_PUBLISH_TOKEN).' });
    const inscriptions = req.body && req.body.inscriptions;
    if(!Array.isArray(inscriptions)){
      return res.status(400).json({ error: 'Données inscriptions invalides.' });
    }
    const existing = await readRepoJson(INSCRIPTIONS_PATH, token);
    await writeRepoJson(INSCRIPTIONS_PATH, inscriptions, 'Sync inscriptions from admin', token, existing.sha);
    return res.json({ ok: true, count: inscriptions.length });
  }catch(err){
    console.error('Erreur PUT /api/inscriptions:', err);
    return res.status(500).json({ error: 'Erreur lors de la synchronisation des inscriptions.' });
  }
});

// ==================== FORMATIONS (planning des samedis) ====================

// Lecture publique du planning de formation
app.get('/api/formations', async (req, res) => {
  try{
    const token = getToken();
    if(!token) return res.status(500).json({ error: 'Token GitHub non configuré sur le serveur (NEWS_PUBLISH_TOKEN).' });
    const existing = await readRepoJsonAny(FORMATIONS_PATH, token);
    const data = (existing.data && typeof existing.data === 'object' && !Array.isArray(existing.data)) ? existing.data : {};
    return res.json({
      ok: true,
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
      trainers: Array.isArray(data.trainers) ? data.trainers : []
    });
  }catch(err){
    console.error('Erreur GET /api/formations:', err);
    return res.status(500).json({ error: 'Impossible de lire le planning de formation.' });
  }
});

// Synchronisation complète du planning (authentifié)
app.put('/api/formations', requireAdminAuth, async (req, res) => {
  try{
    const token = getToken();
    if(!token) return res.status(500).json({ error: 'Token GitHub non configuré sur le serveur (NEWS_PUBLISH_TOKEN).' });

    const sessions = req.body && req.body.sessions;
    const trainers = req.body && req.body.trainers;
    if(!Array.isArray(sessions) || sessions.length > 2000 || !Array.isArray(trainers) || trainers.length > 200){
      return res.status(400).json({ error: 'Données formations invalides.' });
    }

    const cleanSessions = sessions.map(s => ({
      id: String(s.id || ('sess_' + Date.now())).slice(0, 60),
      date: String(s.date || '').slice(0, 10),
      startTime: String(s.startTime || '').slice(0, 5),
      endTime: String(s.endTime || '').slice(0, 5),
      level: String(s.level || 'Tous').slice(0, 30),
      topic: String(s.topic || '').slice(0, 200),
      trainer: String(s.trainer || '').slice(0, 80),
      location: String(s.location || '').slice(0, 120),
      objectives: String(s.objectives || '').slice(0, 500)
    })).filter(s => s.date && s.topic);

    const cleanTrainers = trainers.map(t => ({
      id: String(t.id || ('tr_' + Date.now())).slice(0, 60),
      name: String(t.name || '').slice(0, 80),
      role: String(t.role || 'Formateur').slice(0, 80),
      tel: String(t.tel || '').slice(0, 25)
    })).filter(t => t.name);

    const existing = await readRepoJsonAny(FORMATIONS_PATH, token);
    const payload = { sessions: cleanSessions, trainers: cleanTrainers };
    await writeRepoJson(FORMATIONS_PATH, payload, 'Sync formations schedule', token, existing.sha);
    return res.json({ ok: true, count: cleanSessions.length });
  }catch(err){
    console.error('Erreur PUT /api/formations:', err);
    return res.status(500).json({ error: 'Erreur lors de la synchronisation du planning.' });
  }
});

// ==================== MEMBRES : SERVANTS & PRÉSENCES (authentifié) ====================

const NIVEAUX_VALIDES = ['', 'Postulant', 'Samuel', 'Tarcisius', 'Augustin'];
const STATUTS_PRESENCE = ['P', 'A', 'R', 'E'];

app.get('/api/formations/membres', requireAdminAuth, async (req, res) => {
  try{
    const token = getToken();
    if(!token) return res.status(500).json({ error: 'Token GitHub non configuré sur le serveur (NEWS_PUBLISH_TOKEN).' });
    const existing = await readRepoJsonAny(MEMBRES_PATH, token);
    const data = (existing.data && typeof existing.data === 'object' && !Array.isArray(existing.data)) ? existing.data : {};
    return res.json({
      ok: true,
      servants: Array.isArray(data.servants) ? data.servants : [],
      presences: (data.presences && typeof data.presences === 'object') ? data.presences : {}
    });
  }catch(err){
    console.error('Erreur GET /api/formations/membres:', err);
    return res.status(500).json({ error: 'Impossible de lire la liste des servants.' });
  }
});

app.put('/api/formations/membres', requireAdminAuth, async (req, res) => {
  try{
    const token = getToken();
    if(!token) return res.status(500).json({ error: 'Token GitHub non configuré sur le serveur (NEWS_PUBLISH_TOKEN).' });

    const servants = req.body && req.body.servants;
    const presences = req.body && req.body.presences;
    if(!Array.isArray(servants) || servants.length > 1000 || !presences || typeof presences !== 'object' || Array.isArray(presences)){
      return res.status(400).json({ error: 'Données membres invalides.' });
    }

    const cleanServants = servants.map(s => ({
      id: String(s.id || ('sv_' + Date.now())).slice(0, 60),
      nom: String(s.nom || '').trim().slice(0, 80),
      niveau: NIVEAUX_VALIDES.includes(s.niveau) ? s.niveau : '',
      tel: String(s.tel || '').trim().slice(0, 25),
      note: String(s.note || '').trim().slice(0, 200),
      actif: s.actif !== false
    })).filter(s => s.nom);

    const ids = new Set(cleanServants.map(s => s.id));
    const cleanPresences = {};
    Object.keys(presences).slice(0, 3000).forEach(sessionId => {
      const row = presences[sessionId];
      if(!row || typeof row !== 'object') return;
      const cleanRow = {};
      Object.keys(row).forEach(servantId => {
        if(ids.has(servantId) && STATUTS_PRESENCE.includes(row[servantId])) cleanRow[servantId] = row[servantId];
      });
      if(Object.keys(cleanRow).length) cleanPresences[String(sessionId).slice(0, 60)] = cleanRow;
    });

    const existing = await readRepoJsonAny(MEMBRES_PATH, token);
    await writeRepoJson(MEMBRES_PATH, { servants: cleanServants, presences: cleanPresences }, 'Sync servants & presences', token, existing.sha);
    return res.json({ ok: true, count: cleanServants.length });
  }catch(err){
    console.error('Erreur PUT /api/formations/membres:', err);
    return res.status(500).json({ error: 'Erreur lors de la synchronisation des servants.' });
  }
});

// ==================== AUTHENTIFICATION ADMIN ====================

// Vérification du mot de passe (rate limité contre le brute-force)
app.post('/api/admin/verify', rateLimiter(10 * 60 * 1000, 30), async (req, res) => {
  try{
    const password = req.body && req.body.password;
    if(password && await verifyAdminPassword(password)){
      return res.json({ ok: true });
    }
    return res.status(401).json({ error: 'Mot de passe incorrect.' });
  }catch(err){
    console.error('Erreur /api/admin/verify:', err);
    return res.status(500).json({ error: 'Erreur de vérification.' });
  }
});

// Changement du mot de passe admin (stocké en hash dans data/config.json)
app.post('/api/admin/change-password', rateLimiter(10 * 60 * 1000, 10), async (req, res) => {
  try{
    const currentPassword = req.body && req.body.currentPassword;
    const newPassword = req.body && req.body.newPassword;
    if(!newPassword || String(newPassword).length < 4 || String(newPassword).length > 64){
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir entre 4 et 64 caractères.' });
    }
    if(!(await verifyAdminPassword(currentPassword))){
      return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
    }
    const token = getToken();
    if(!token) return res.status(500).json({ error: 'Token GitHub non configuré sur le serveur (NEWS_PUBLISH_TOKEN).' });

    const existing = await readRepoJsonAny(CONFIG_PATH, token);
    const config = Object.assign({}, (existing.data && typeof existing.data === 'object') ? existing.data : {}, {
      adminPasswordHash: sha256(newPassword),
      updatedAt: new Date().toISOString()
    });
    await writeRepoJson(CONFIG_PATH, config, 'Update admin password hash', token, existing.sha);
    adminHashCache = { at: 0, hash: null };
    return res.json({ ok: true });
  }catch(err){
    console.error('Erreur /api/admin/change-password:', err);
    return res.status(500).json({ error: 'Erreur lors du changement de mot de passe.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Publish-news service listening on port', PORT));
