const express = require('express');
const path = require('path');
const app = express();
app.use(express.json({ limit: '2mb' }));

// Servir les fichiers statiques du repo
app.use(express.static(path.join(__dirname, '..')));

const OWNER = 'itestmypartner';
const REPO = 'Servant-de-messe-';
const NEWS_PATH = 'data/news.json';
const INSCRIPTIONS_PATH = 'data/inscriptions.json';
const BRANCH = 'main';

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

async function readRepoJson(filePath, token){
  const headers = githubHeaders(token);
  const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}?ref=${BRANCH}`;
  const getRes = await fetch(getUrl, { headers });

  if(getRes.status === 404){
    return { exists: false, sha: null, data: [] };
  }
  if(!getRes.ok){
    const err = await getRes.text();
    throw new Error('GitHub read failed: ' + err);
  }

  const payload = await getRes.json();
  const decoded = Buffer.from(payload.content || '', 'base64').toString('utf8');
  let parsed = [];
  if(decoded.trim()){
    parsed = JSON.parse(decoded);
  }
  if(!Array.isArray(parsed)){
    throw new Error('Stored JSON is not an array');
  }
  return { exists: true, sha: payload.sha, data: parsed };
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

app.get('/api/health', (req,res)=> res.json({ status: 'ok', service: 'publish-news' }));

app.post('/api/publish-news', async (req,res)=>{
  try{
    const token = getToken();
    if(!token) return res.status(500).json({ error: 'No publish token configured (NEWS_PUBLISH_TOKEN).' });

    const news = req.body && req.body.news;
    if(!Array.isArray(news)) return res.status(400).json({ error: 'Missing news payload' });

    const existing = await readRepoJson(NEWS_PATH, token);
    const result = await writeRepoJson(NEWS_PATH, news, 'Publish news via Render service', token, existing.sha);
    return res.json({ ok: true, result });
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

app.get('/api/inscriptions', async (req,res)=>{
  try{
    const token = getToken();
    if(!token) return res.status(500).json({ error: 'No publish token configured (NEWS_PUBLISH_TOKEN).' });
    const existing = await readRepoJson(INSCRIPTIONS_PATH, token);
    return res.json({ ok: true, inscriptions: existing.data });
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

app.post('/api/inscriptions', async (req,res)=>{
  try{
    const token = getToken();
    if(!token) return res.status(500).json({ error: 'No publish token configured (NEWS_PUBLISH_TOKEN).' });
    const input = req.body && req.body.inscription;
    if(!input || typeof input !== 'object'){
      return res.status(400).json({ error: 'Missing inscription payload' });
    }
    const nom = String(input.nom || '').trim();
    const prenom = String(input.prenom || '').trim();
    const tel = String(input.tel || '').trim();
    const age = Number(input.age || 0);
    if(!nom || !prenom || !tel || !Number.isFinite(age) || age <= 0){
      return res.status(400).json({ error: 'Invalid inscription fields' });
    }

    const existing = await readRepoJson(INSCRIPTIONS_PATH, token);
    const nowIso = new Date().toISOString();
    const inscription = {
      id: String(input.id || nowIso + '-' + Math.floor(Math.random() * 100000)),
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
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

app.put('/api/inscriptions', async (req,res)=>{
  try{
    const token = getToken();
    if(!token) return res.status(500).json({ error: 'No publish token configured (NEWS_PUBLISH_TOKEN).' });
    const inscriptions = req.body && req.body.inscriptions;
    if(!Array.isArray(inscriptions)){
      return res.status(400).json({ error: 'Missing inscriptions payload' });
    }
    const existing = await readRepoJson(INSCRIPTIONS_PATH, token);
    await writeRepoJson(INSCRIPTIONS_PATH, inscriptions, 'Sync inscriptions from admin', token, existing.sha);
    return res.json({ ok: true, count: inscriptions.length });
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Publish-news service listening on', PORT));
