// ============================================================
// GERADOR DE NOTAS FISCAIS FICTICIAS (NF-e) — para testar o app
// Roda no Node.js (o mesmo que o "npm run dev" usa). Nao precisa Python.
//
// COMO USAR:
//   node gerar-notas.js
//
// Gera XMLs na pasta "nfes_teste". Por padrao: 30 notas do Simples Nacional.
// ~30% das notas vem com ERRO DE PROPOSITO, para testar se o app detecta:
//   - NCM invalido (6 digitos em vez de 8)
//   - CSOSN errado em produto monofasico
//   - CFOP interestadual (6xxx) em nota interna
// ============================================================

const fs = require('fs');
const path = require('path');

// ---------- CONFIGURACAO (mude aqui se quiser) ----------
const NUM_NOTAS = 30;            // quantas notas gerar
const REGIME = 'simples';        // 'simples' ou 'normal'
const PCT_COM_ERRO = 0.30;       // 30% das notas terao erro proposital
const PASTA = 'nfes_teste';
// --------------------------------------------------------

const PRODUTOS = [
  { nome: 'Notebook 14 polegadas', ncm: '84713019' },
  { nome: 'Mouse optico USB', ncm: '84716053' },
  { nome: 'Teclado USB', ncm: '84716062' },
  { nome: 'Monitor 23 polegadas', ncm: '85285220' },
  { nome: 'Cadeira giratoria', ncm: '94013090' },
  { nome: 'Papel A4 resma', ncm: '48025610' },
  { nome: 'Oleo lubrificante', ncm: '27101932' }, // monofasico (PIS/COFINS)
  { nome: 'Refrigerante lata', ncm: '22021000' }, // monofasico
];

const UFS = { SP: 35, RJ: 33, MG: 31, RS: 43, PR: 41, BA: 29, SC: 42, GO: 52 };

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function escolha(arr) { return arr[rnd(0, arr.length - 1)]; }

function gerarCNPJ() {
  let s = '';
  for (let i = 0; i < 8; i++) s += rnd(0, 9);
  s += '0001';
  s += rnd(0, 9);
  s += rnd(0, 9);
  return s;
}

function gerarIE() {
  let s = '';
  for (let i = 0; i < 12; i++) s += rnd(0, 9);
  return s;
}

function dataEmissao() {
  const d = new Date();
  d.setDate(d.getDate() - rnd(0, 30));
  const iso = d.toISOString().slice(0, 19);
  return iso + '-03:00';
}

function chaveAcesso(cUF, dataEmi, cnpj, serie, nNF) {
  const anoMes = dataEmi.slice(2, 4) + dataEmi.slice(5, 7);
  const cod = String(rnd(10000000, 99999999));
  const serieStr = String(serie).padStart(3, '0');
  const nNFstr = String(nNF).padStart(9, '0');
  const dv = String(rnd(0, 9));
  return `${String(cUF).padStart(2, '0')}${anoMes}${cnpj}550${serieStr}${nNFstr}1${cod}${dv}`;
}

function gerarNFe(nNF, temErro) {
  const uf = escolha(Object.keys(UFS));
  const cUF = UFS[uf];
  const serie = rnd(1, 5);
  const cnpjEmit = gerarCNPJ();
  const ieEmit = gerarIE();
  const cnpjDest = gerarCNPJ();
  const dataEmi = dataEmissao();
  const chave = chaveAcesso(cUF, dataEmi, cnpjEmit, serie, nNF);
  const crt = REGIME === 'simples' ? 1 : 3;

  const numItens = rnd(1, 3);
  let itens = '';
  let totalProd = 0;

  for (let i = 1; i <= numItens; i++) {
    const prod = escolha(PRODUTOS);
    let ncm = prod.ncm;
    let cfop = escolha(['5102', '5405']); // interna (mesmo estado)
    const qtd = (Math.random() * 9 + 1).toFixed(2);
    const vUn = (Math.random() * 490 + 10).toFixed(2);
    const vProd = (parseFloat(qtd) * parseFloat(vUn)).toFixed(2);
    totalProd += parseFloat(vProd);

    // ICMS por regime
    let csosn = escolha(['101', '102', '400', '500']);

    // ---- INJETA ERROS DE PROPOSITO no primeiro item, se marcado ----
    if (temErro && i === 1) {
      const tipoErro = rnd(1, 3);
      if (tipoErro === 1) {
        ncm = ncm.slice(0, 6); // NCM invalido: 6 digitos
      } else if (tipoErro === 2) {
        // produto monofasico com CSOSN errado (deveria ser 500)
        ncm = '27101932';
        csosn = '102';
      } else {
        cfop = '6108'; // CFOP interestadual numa nota interna
      }
    }

    let icmsBloco;
    if (REGIME === 'simples') {
      icmsBloco = `<ICMSSN${csosn}><orig>0</orig><CSOSN>${csosn}</CSOSN></ICMSSN${csosn}>`;
    } else {
      const cst = escolha(['00', '40', '60']);
      icmsBloco = `<ICMS${cst}><orig>0</orig><CST>${cst}</CST></ICMS${cst}>`;
    }

    itens += `
    <det nItem="${i}">
      <prod>
        <cProd>PROD${String(i).padStart(4, '0')}</cProd>
        <cEAN>SEM GTIN</cEAN>
        <xProd>${prod.nome}</xProd>
        <NCM>${ncm}</NCM>
        <CFOP>${cfop}</CFOP>
        <uCom>UN</uCom>
        <qCom>${qtd}</qCom>
        <vUnCom>${vUn}</vUnCom>
        <vProd>${vProd}</vProd>
      </prod>
      <imposto>
        <ICMS>${icmsBloco}</ICMS>
        <PIS><PISNT><CST>49</CST></PISNT></PIS>
        <COFINS><COFINSNT><CST>49</CST></COFINSNT></COFINS>
      </imposto>
    </det>`;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe${chave}" versao="4.00">
    <ide>
      <cUF>${cUF}</cUF>
      <natOp>VENDA DE MERCADORIAS</natOp>
      <mod>55</mod>
      <serie>${serie}</serie>
      <nNF>${nNF}</nNF>
      <dhEmi>${dataEmi}</dhEmi>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <tpAmb>2</tpAmb>
    </ide>
    <emit>
      <CNPJ>${cnpjEmit}</CNPJ>
      <xNome>Emitente Teste ${REGIME} Ltda</xNome>
      <enderEmit><UF>${uf}</UF></enderEmit>
      <IE>${ieEmit}</IE>
      <CRT>${crt}</CRT>
    </emit>
    <dest>
      <CNPJ>${cnpjDest}</CNPJ>
      <xNome>Cliente ${nNF}</xNome>
      <enderDest><UF>${uf}</UF></enderDest>
    </dest>${itens}
    <total>
      <ICMSTot>
        <vProd>${totalProd.toFixed(2)}</vProd>
        <vNF>${totalProd.toFixed(2)}</vNF>
      </ICMSTot>
    </total>
  </infNFe>
</NFe>`;

  return xml;
}

// ---------- GERACAO EM LOTE ----------
const destino = path.join(__dirname, PASTA);
if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });

let comErro = 0;
for (let i = 1; i <= NUM_NOTAS; i++) {
  const temErro = Math.random() < PCT_COM_ERRO;
  if (temErro) comErro++;
  const xml = gerarNFe(i, temErro);
  const nome = `NFe_${String(i).padStart(4, '0')}${temErro ? '_COM_ERRO' : ''}.xml`;
  fs.writeFileSync(path.join(destino, nome), xml, 'utf-8');
}

console.log(`\nPronto! ${NUM_NOTAS} notas geradas na pasta "${PASTA}".`);
console.log(`Dessas, ${comErro} tem erro de proposito (arquivos marcados com _COM_ERRO no nome).`);
console.log(`O app deve detectar esses erros na auditoria.\n`);
