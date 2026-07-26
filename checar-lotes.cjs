const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const env = {};
fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
});

const url = env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.log('(!) Faltando URL ou KEY no .env');
  process.exit(1);
}

const endpoint = url.replace(/\/$/, '') + '/rest/v1/lotes_documentos?select=*&order=created_at.desc&limit=5';

fetch(endpoint, {
  headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
})
  .then(r => r.json())
  .then(data => {
    if (!Array.isArray(data)) {
      console.log('(!) Resposta inesperada:');
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    console.log('(OK) Conectou. Ultimos ' + data.length + ' lote(s):');
    data.forEach((lote, i) => {
      console.log('--- Lote ' + (i + 1) + ' ---');
      console.log('  id: ' + (lote.id || lote.lote_id || '(sem id)'));
      console.log('  criado: ' + (lote.created_at || '(sem data)'));
      console.log('  campos: ' + Object.keys(lote).join(', '));
    });
  })
  .catch(e => console.log('(!) Erro: ' + e.message));
