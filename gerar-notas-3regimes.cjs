const fs = require("fs");
const path = require("path");
const NOTAS_POR_REGIME = 15;
const PCT_COM_ERRO = 0.30;
const PASTA = "nfes_teste";
const PRODUTOS = [
  { nome: "Notebook 14 polegadas", ncm: "84713019", mono: false },
  { nome: "Mouse optico USB", ncm: "84716053", mono: false },
  { nome: "Monitor 23 polegadas", ncm: "85285220", mono: false },
  { nome: "Papel A4 resma", ncm: "48025610", mono: false },
  { nome: "Oleo lubrificante", ncm: "27101932", mono: true },
  { nome: "Refrigerante lata", ncm: "22021000", mono: true },
];
const UFS = { SP:35, RJ:33, MG:31, RS:43, PR:41, BA:29, SC:42, GO:52 };
const REGIMES = [
  { chave:"simples", crt:1, nome:"Simples Nacional" },
  { chave:"presumido", crt:3, nome:"Lucro Presumido" },
  { chave:"real", crt:3, nome:"Lucro Real" },
];
function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function esc(x){return x[rnd(0,x.length-1)];}
function cnpj(){let s="";for(let i=0;i<8;i++)s+=rnd(0,9);s+="0001";s+=rnd(0,9);s+=rnd(0,9);return s;}
function ie(){let s="";for(let i=0;i<12;i++)s+=rnd(0,9);return s;}
function dataEmi(){const d=new Date();d.setDate(d.getDate()-rnd(0,30));return d.toISOString().slice(0,19)+"-03:00";}
function chave(cUF,de,cn,se,n){const am=de.slice(2,4)+de.slice(5,7);return String(cUF).padStart(2,"0")+am+cn+"550"+String(se).padStart(3,"0")+String(n).padStart(9,"0")+"1"+String(rnd(10000000,99999999))+String(rnd(0,9));}
function pisCofins(r){
  if(r.chave==="simples")return "<PIS><PISNT><CST>49</CST></PISNT></PIS><COFINS><COFINSNT><CST>49</CST></COFINSNT></COFINS>";
  const pa=r.chave==="presumido"?"0.65":"1.65", ca=r.chave==="presumido"?"3.00":"7.60";
  return "<PIS><PISAliq><CST>01</CST><vBC>100.00</vBC><pPIS>"+pa+"</pPIS><vPIS>1.00</vPIS></PISAliq></PIS><COFINS><COFINSAliq><CST>01</CST><vBC>100.00</vBC><pCOFINS>"+ca+"</pCOFINS><vCOFINS>3.00</vCOFINS></COFINSAliq></COFINS>";
}
function nfe(r,n,erro){
  const uf=esc(Object.keys(UFS)),cUF=UFS[uf],se=rnd(1,5),ce=cnpj(),cd=cnpj(),de=dataEmi(),ch=chave(cUF,de,ce,se,n);
  const ni=rnd(1,3);let itens="",tot=0;
  for(let i=1;i<=ni;i++){
    let p=esc(PRODUTOS),ncm=p.ncm,cfop=esc(["5102","5405"]);
    const q=(Math.random()*9+1).toFixed(2),vu=(Math.random()*490+10).toFixed(2),vp=(q*vu).toFixed(2);tot+=parseFloat(vp);
    let csosn=esc(["101","102","400","500"]),cst=esc(["00","40","60"]);
    if(erro&&i===1){const t=rnd(1,3);if(t===1)ncm=ncm.slice(0,6);else if(t===2){p=PRODUTOS.find(x=>x.mono);ncm=p.ncm;if(r.crt===1)csosn="102";else cst="00";}else cfop="6108";}
    let icms=r.crt===1?"<ICMSSN"+csosn+"><orig>0</orig><CSOSN>"+csosn+"</CSOSN></ICMSSN"+csosn+">":"<ICMS"+cst+"><orig>0</orig><CST>"+cst+"</CST></ICMS"+cst+">";
    itens+="\n    <det nItem=\""+i+"\"><prod><cProd>P"+i+"</cProd><cEAN>SEM GTIN</cEAN><xProd>"+p.nome+"</xProd><NCM>"+ncm+"</NCM><CFOP>"+cfop+"</CFOP><uCom>UN</uCom><qCom>"+q+"</qCom><vUnCom>"+vu+"</vUnCom><vProd>"+vp+"</vProd></prod><imposto><ICMS>"+icms+"</ICMS>"+pisCofins(r)+"</imposto></det>";
  }
  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<NFe xmlns=\"http://www.portalfiscal.inf.br/nfe\"><infNFe Id=\"NFe"+ch+"\" versao=\"4.00\"><ide><cUF>"+cUF+"</cUF><natOp>VENDA</natOp><mod>55</mod><serie>"+se+"</serie><nNF>"+n+"</nNF><dhEmi>"+de+"</dhEmi><tpNF>1</tpNF><idDest>1</idDest><tpAmb>2</tpAmb></ide><emit><CNPJ>"+ce+"</CNPJ><xNome>Emitente "+r.nome+"</xNome><enderEmit><UF>"+uf+"</UF></enderEmit><IE>"+ie()+"</IE><CRT>"+r.crt+"</CRT></emit><dest><CNPJ>"+cd+"</CNPJ><xNome>Cliente "+n+"</xNome><enderDest><UF>"+uf+"</UF></enderDest></dest>"+itens+"\n    <total><ICMSTot><vProd>"+tot.toFixed(2)+"</vProd><vNF>"+tot.toFixed(2)+"</vNF></ICMSTot></total></infNFe></NFe>";
}
const dest=path.join(__dirname,PASTA);if(!fs.existsSync(dest))fs.mkdirSync(dest,{recursive:true});
let n=1;const res={};
for(const r of REGIMES){let ce=0;for(let k=0;k<NOTAS_POR_REGIME;k++){const e=Math.random()<PCT_COM_ERRO;if(e)ce++;fs.writeFileSync(path.join(dest,"NFe_"+r.chave+"_"+String(n).padStart(4,"0")+(e?"_COM_ERRO":"")+".xml"),nfe(r,n,e),"utf-8");n++;}res[r.nome]={total:NOTAS_POR_REGIME,ce};}
console.log("\nPronto! "+(n-1)+" notas na pasta "+PASTA+"\n");
for(const[nm,r]of Object.entries(res))console.log("  "+nm+": "+r.total+" notas ("+r.ce+" com erro)");
console.log("\nNome do arquivo diz o regime. Importe e valide cada um.\n");
