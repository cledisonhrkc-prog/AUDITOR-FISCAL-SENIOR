const fs=require("fs");const path=require("path");
const NOTAS=15,PCT_ERRO=0.35,PASTA="nfes_teste_industria";
const PRODUTOS=[{nome:"Cadeira de madeira fabricada",ncm:"94013000",ipi:"5.00"},{nome:"Mesa de escritorio fabricada",ncm:"94033000",ipi:"5.00"},{nome:"Parafuso de aco fabricado",ncm:"73181500",ipi:"10.00"},{nome:"Chapa de aco laminada",ncm:"72085200",ipi:"5.00"},{nome:"Embalagem plastica fabricada",ncm:"39232990",ipi:"10.00"},{nome:"Componente eletronico montado",ncm:"85340011",ipi:"15.00"}];
const UFS={SP:35,RJ:33,MG:31,RS:43,PR:41,SC:42};
function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function esc(x){return x[rnd(0,x.length-1)];}
function cnpj(){let s="";for(let i=0;i<8;i++)s+=rnd(0,9);s+="0001";s+=rnd(0,9);s+=rnd(0,9);return s;}
function ie(){let s="";for(let i=0;i<12;i++)s+=rnd(0,9);return s;}
function dataEmi(){const d=new Date();d.setDate(d.getDate()-rnd(0,30));return d.toISOString().slice(0,19)+"-03:00";}
function chave(cUF,de,cn,se,n){const am=de.slice(2,4)+de.slice(5,7);return String(cUF).padStart(2,"0")+am+cn+"550"+String(se).padStart(3,"0")+String(n).padStart(9,"0")+"1"+String(rnd(10000000,99999999))+String(rnd(0,9));}
function nfe(n,erro){const uf=esc(Object.keys(UFS)),cUF=UFS[uf],se=rnd(1,5),ce=cnpj(),cd=cnpj(),de=dataEmi(),ch=chave(cUF,de,ce,se,n);const ni=rnd(1,2);let itens="",tot=0;
for(let i=1;i<=ni;i++){const p=esc(PRODUTOS);let ncm=p.ncm,cfop="5101",ipiCST="50",ipiAliq=p.ipi;const q=(rnd(1,20)).toFixed(2),vu=(Math.random()*490+50).toFixed(2),vp=(q*vu).toFixed(2);tot+=parseFloat(vp);
if(erro&&i===1){const t=rnd(1,3);if(t===1)cfop="5102";else if(t===2){ipiCST="99";ipiAliq="0.00";}else ncm=ncm.slice(0,6);}
itens+="\n    <det nItem=\""+i+"\"><prod><cProd>IND"+i+"</cProd><cEAN>SEM GTIN</cEAN><xProd>"+p.nome+"</xProd><NCM>"+ncm+"</NCM><CFOP>"+cfop+"</CFOP><uCom>UN</uCom><qCom>"+q+"</qCom><vUnCom>"+vu+"</vUnCom><vProd>"+vp+"</vProd></prod><imposto><ICMS><ICMS00><orig>0</orig><CST>00</CST></ICMS00></ICMS><IPI><cEnq>999</cEnq><IPITrib><CST>"+ipiCST+"</CST><vBC>"+vp+"</vBC><pIPI>"+ipiAliq+"</pIPI><vIPI>"+(vp*ipiAliq/100).toFixed(2)+"</vIPI></IPITrib></IPI><PIS><PISAliq><CST>01</CST><vBC>"+vp+"</vBC><pPIS>1.65</pPIS><vPIS>"+(vp*0.0165).toFixed(2)+"</vPIS></PISAliq></PIS><COFINS><COFINSAliq><CST>01</CST><vBC>"+vp+"</vBC><pCOFINS>7.60</pCOFINS><vCOFINS>"+(vp*0.076).toFixed(2)+"</vCOFINS></COFINSAliq></COFINS></imposto></det>";}
return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<NFe xmlns=\"http://www.portalfiscal.inf.br/nfe\"><infNFe Id=\"NFe"+ch+"\" versao=\"4.00\"><ide><cUF>"+cUF+"</cUF><natOp>VENDA DE PRODUCAO DO ESTABELECIMENTO</natOp><mod>55</mod><serie>"+se+"</serie><nNF>"+n+"</nNF><dhEmi>"+de+"</dhEmi><tpNF>1</tpNF><idDest>1</idDest><tpAmb>2</tpAmb></ide><emit><CNPJ>"+ce+"</CNPJ><xNome>Industria Fabril Ltda</xNome><enderEmit><UF>"+uf+"</UF></enderEmit><IE>"+ie()+"</IE><CRT>3</CRT></emit><dest><CNPJ>"+cd+"</CNPJ><xNome>Cliente "+n+"</xNome><enderDest><UF>"+uf+"</UF></enderDest></dest>"+itens+"\n    <total><ICMSTot><vProd>"+tot.toFixed(2)+"</vProd><vNF>"+tot.toFixed(2)+"</vNF></ICMSTot></total></infNFe></NFe>";}
const dest=path.join(__dirname,PASTA);if(!fs.existsSync(dest))fs.mkdirSync(dest,{recursive:true});let ce=0;
for(let n=1;n<=NOTAS;n++){const e=Math.random()<PCT_ERRO;if(e)ce++;fs.writeFileSync(path.join(dest,"NFe_industria_"+String(n).padStart(4,"0")+(e?"_COM_ERRO":"")+".xml"),nfe(n,e),"utf-8");}
console.log("\nPronto! "+NOTAS+" notas de INDUSTRIA na pasta "+PASTA+" ("+ce+" com erro).");
console.log("TESTE: sistema reconhece INDUSTRIA (CFOP 5101, IPI destacado) ou trata como comercio?\n");
