const express = require('express');
const path = require('path');
const app = express();
app.use(express.json({ limit: '2mb' }));

// Servir les fichiers statiques du repo
app.use(express.static(path.join(__dirname, '..')));

const OWNER = 'itestmypartner';
const REPO = 'Servant-de-messe-';
const PATH = 'data/news.json';
const BRANCH = 'main';

function getToken(){
  return process.env.NEWS_PUBLISH_TOKEN || process.env.GITHUB_TOKEN || null;
}

app.get('/api/health', (req,res)=> res.json({ status: 'ok', service: 'publish-news' }));

app.post('/api/publish-news', async (req,res)=>{
  try{
    const token = getToken();
    if(!token) return res.status(500).json({ error: 'No publish token configured (NEWS_PUBLISH_TOKEN).' });

    const news = req.body && req.body.news;
    if(!news) return res.status(400).json({ error: 'Missing news payload' });

    const content = JSON.stringify(news, null, 2);
    const b64 = Buffer.from(content, 'utf8').toString('base64');

    const headers = {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'publish-news-service'
    };

    // get existing file to grab sha
    const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}`;
    let sha = null;
    try{
      const getRes = await fetch(getUrl, { headers });
      if(getRes.ok){
        const js = await getRes.json();
        sha = js.sha;
      }
    }catch(e){ /* ignore, we'll create file */ }

    const putUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
    const body = { message: 'Publish news via Render service', content: b64, branch: BRANCH };
    if(sha) body.sha = sha;

    const putRes = await fetch(putUrl, { method: 'PUT', headers: Object.assign({'Content-Type':'application/json'}, headers), body: JSON.stringify(body) });
    const putJson = await putRes.json();
    if(!putRes.ok) return res.status(500).json({ error: putJson });

    return res.json({ ok: true, result: putJson });
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Publish-news service listening on', PORT));

