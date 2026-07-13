import { TaxClient, TaxRuleConfig, TaxInvoice, FiscalBatch, TaxRegime } from './types';

export const INITIAL_CLIENTS: TaxClient[] = [];

// Regras Fiscais básicas para validação automatizada de CFOP e NCM
export const CFOP_DATABASE: Record<string, { desc: string; type: 'entrada' | 'saida'; scope: 'estadual' | 'interestadual' }> = {
  // Saídas (Vendas/Serviços)
  '5101': { desc: 'Venda de produção do estabelecimento (Interna)', type: 'saida', scope: 'estadual' },
  '5102': { desc: 'Venda de mercadoria adquirida de terceiros (Interna)', type: 'saida', scope: 'estadual' },
  '5403': { desc: 'Venda de produção com Substituição Tributária (Interna)', type: 'saida', scope: 'estadual' },
  '5405': { desc: 'Venda de mercadoria adquirida de terceiros com ST (Interna)', type: 'saida', scope: 'estadual' },
  '5933': { desc: 'Prestação de serviço tributado pelo ISSQN (Interna)', type: 'saida', scope: 'estadual' },
  
  '6101': { desc: 'Venda de produção do estabelecimento (Interestadual)', type: 'saida', scope: 'interestadual' },
  '6102': { desc: 'Venda de mercadoria adquirida de terceiros (Interestadual)', type: 'saida', scope: 'interestadual' },
  '6403': { desc: 'Venda de produção com ST (Interestadual)', type: 'saida', scope: 'interestadual' },
  '6404': { desc: 'Venda de mercadoria com ST (Interestadual)', type: 'saida', scope: 'interestadual' },
  '6933': { desc: 'Prestação de serviço tributado pelo ISSQN (Interestadual)', type: 'saida', scope: 'interestadual' },

  // Entradas (Compras/Insumos)
  '1101': { desc: 'Compra para industrialização (Interna)', type: 'entrada', scope: 'estadual' },
  '1102': { desc: 'Compra para comercialização (Interna)', type: 'entrada', scope: 'estadual' },
  '1403': { desc: 'Compra para comercialização com ST (Interna)', type: 'entrada', scope: 'estadual' },
  
  '2101': { desc: 'Compra para industrialização (Interestadual)', type: 'entrada', scope: 'interestadual' },
  '2102': { desc: 'Compra para comercialização (Interestadual)', type: 'entrada', scope: 'interestadual' },
  '2403': { desc: 'Compra para comercialização com ST (Interestadual)', type: 'entrada', scope: 'interestadual' },
};

// NCMs que possuem Alíquota Zero ou Tributação Monofásica de PIS/COFINS (Oportunidades de Crédito ou Redução para Simples Nacional)
export const MONOFASICOS_NCM_PREFIXES = [
  '3003', '3004', // Medicamentos
  '3303', '3304', '3305', '3306', '3307', // Cosméticos e Perfumaria
  '8708', // Autopeças (Excelente para o Cliente 2!)
  '2201', '2202', '2203', // Bebidas (Água, Refri, Cerveja)
  '4011', '4012', // Pneus
];

// NCMs sujeitos a Substituição Tributária (ST) no ICMS
export const ST_NCM_PREFIXES = [
  '8708', // Peças automotivas
  '2203', // Bebidas alcoólicas
  '1806', // Chocolates
  '2402', // Cigarros
  '3402', // Detergentes e saneantes
];

// Amostras de XML representativos de NF-e e NFS-e para alimentar o sistema se o usuário não tiver arquivos locais
export const SAMPLE_XML_FILES = [
  {
    fileName: 'NFe_1024_VendaMercadoria_SP_OK.xml',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260712345678000190550010000010241000001024" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>00001024</cNF>
        <natOp>Venda de mercadoria adquirida de terceiros</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>1024</nNF>
        <dhEmi>2026-07-01T10:00:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
      </ide>
      <emit>
        <CNPJ>12345678000190</CNPJ>
        <xNome>Mercado Silva &amp; Alimentos Ltda</xNome>
        <enderEmit>
          <UF>SP</UF>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>99888777000166</CNPJ>
        <xNome>Supermercado Centro-Oeste Ltda</xNome>
        <enderDest>
          <UF>SP</UF>
        </enderDest>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>PROD-001</cProd>
          <xProd>Arroz Agulhinha Tipo 1 5kg</xProd>
          <NCM>10063011</NCM>
          <CFOP>5102</CFOP>
          <uCom>PCT</uCom>
          <qCom>150.0000</qCom>
          <vUnCom>24.5000</vUnCom>
          <vProd>3675.00</vProd>
        </prod>
        <imposto>
          <ICMS>
            <ICMSSN102>
              <orig>0</orig>
              <CSOSN>102</CSOSN>
            </ICMSSN102>
          </ICMS>
          <PIS>
            <PISOutr>
              <CST>99</CST>
              <vBC>3675.00</vBC>
              <pPIS>0.00</pPIS>
              <vPIS>0.00</vPIS>
            </PISOutr>
          </PIS>
          <COFINS>
            <COFINSOutr>
              <CST>99</CST>
              <vBC>3675.00</vBC>
              <pCOFINS>0.00</pCOFINS>
              <vCOFINS>0.00</vCOFINS>
            </COFINSOutr>
          </COFINS>
        </imposto>
      </det>
    </infNFe>
  </NFe>
</nfeProc>`
  },
  {
    fileName: 'NFe_1025_Venda_Erro_UF.xml',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260712345678000190550010000010251000001025" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>00001025</cNF>
        <natOp>Venda de mercadorias interestadual</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>1025</nNF>
        <dhEmi>2026-07-02T11:15:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>2</idDest>
      </ide>
      <emit>
        <CNPJ>12345678000190</CNPJ>
        <xNome>Mercado Silva &amp; Alimentos Ltda</xNome>
        <enderEmit>
          <UF>SP</UF>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>55444333000122</CNPJ>
        <xNome>Panificadora Horizonte S/A</xNome>
        <enderDest>
          <UF>MG</UF>
        </enderDest>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>PROD-005</cProd>
          <xProd>Farinha de Trigo Especial 1kg</xProd>
          <NCM>11010010</NCM>
          <CFOP>5102</CFOP> <!-- ERRO DE CFOP! Destino é MG, deveria ser CFOP interestadual 6102! -->
          <uCom>FD</uCom>
          <qCom>50.0000</qCom>
          <vUnCom>45.0000</vUnCom>
          <vProd>2250.00</vProd>
        </prod>
        <imposto>
          <ICMS>
            <ICMSSN102>
              <orig>0</orig>
              <CSOSN>102</CSOSN>
            </ICMSSN102>
          </ICMS>
        </imposto>
      </det>
    </infNFe>
  </NFe>
</nfeProc>`
  },
  {
    fileName: 'NFe_1026_Autopeças_Monofasico_Oportunidade.xml',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe31260745678901000112550010000010261000001026" versao="4.00">
      <ide>
        <cUF>31</cUF>
        <cNF>00001026</cNF>
        <natOp>Venda autopeças</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>1026</nNF>
        <dhEmi>2026-07-03T09:00:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
      </ide>
      <emit>
        <CNPJ>45678901000112</CNPJ>
        <xNome>AutoPeças Federal Distribuidora Ltda</xNome>
        <enderEmit>
          <UF>MG</UF>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>11222333000155</CNPJ>
        <xNome>Mecanica Rapida BH Ltda</xNome>
        <enderDest>
          <UF>MG</UF>
        </enderDest>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>PEC-099</cProd>
          <xProd>Amortecedor Dianteiro Cofap Super</xProd>
          <NCM>87088000</NCM> <!-- PIS/COFINS Monofásico + Substituição Tributária de ICMS -->
          <CFOP>5102</CFOP> <!-- ERRO DE CFOP! NCM de autopeças sujeito a ST deveria ser CFOP 5405 e CSOSN 500/CST 60! -->
          <uCom>UN</uCom>
          <qCom>20.0000</qCom>
          <vUnCom>280.0000</vUnCom>
          <vProd>5600.00</vProd>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST> <!-- ERRO! CST deveria ser 60 (ST cobrado anteriormente), pois amortecedor é ST em MG! -->
              <modBC>3</modBC>
              <vBC>5600.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>1008.00</vICMS>
            </ICMS00>
            <PIS>
              <PISAliq>
                <CST>01</CST> <!-- ERRO! Autopeças é Monofásico (CST 04), pagou PIS duplicado desnecessariamente! Oportunidade de crédito/estorno! -->
                <vBC>5600.00</vBC>
                <pPIS>0.65</pPIS>
                <vPIS>36.40</vPIS>
              </PISAliq>
            </PIS>
            <COFINS>
              <COFINSAliq>
                <CST>01</CST> <!-- ERRO! Autopeças é Monofásico (CST 04). Pagou COFINS desnecessário! -->
                <vBC>5600.00</vBC>
                <pCOFINS>3.00</pCOFINS>
                <vCOFINS>168.00</vCOFINS>
              </COFINSAliq>
            </COFINS>
          </ICMS>
        </imposto>
      </det>
    </infNFe>
  </NFe>
</nfeProc>`
  },
  {
    fileName: 'NFSe_512_ConsultoriaTI_RJ.xml',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<tc:EnviarLoteRpsEnvio xmlns:tc="http://www.abrasf.org.br/nfse.xsd">
  <tc:LoteRps>
    <tc:NumeroLote>12</tc:NumeroLote>
    <tc:Cnpj>78912345000134</tc:Cnpj>
    <tc:InscricaoMunicipal>88776655</tc:InscricaoMunicipal>
    <tc:QuantidadeRps>1</tc:QuantidadeRps>
    <tc:ListaRps>
      <tc:Rps>
        <tc:InfRps>
          <tc:IdentificacaoRps>
            <tc:Numero>512</tc:Numero>
            <tc:Serie>A</tc:Serie>
            <tc:Tipo>1</tc:Tipo>
          </tc:IdentificacaoRps>
          <tc:DataEmissao>2026-07-05T14:00:00</tc:DataEmissao>
          <tc:NaturezaOperacao>1</tc:NaturezaOperacao>
          <tc:OptanteSimplesNacional>2</tc:OptanteSimplesNacional> <!-- Não optante -->
          <tc:Prestador>
            <tc:Cnpj>78912345000134</tc:Cnpj>
            <tc:RazaoSocial>Tech Soluções em Sistemas S.A.</tc:RazaoSocial>
          </tc:Prestador>
          <tc:Tomador>
            <tc:IdentificacaoTomador>
              <tc:CpfCnpj>
                <tc:Cnpj>99888111000122</tc:Cnpj>
              </tc:CpfCnpj>
            </tc:IdentificacaoTomador>
            <tc:RazaoSocial>Banco Financeiro do Brasil S.A.</tc:RazaoSocial>
          </tc:Tomador>
          <tc:Servico>
            <tc:Valores>
              <tc:ValorServicos>12500.00</tc:ValorServicos>
              <tc:ValorDeducoes>0.00</tc:ValorDeducoes>
              <tc:ValorPis>206.25</tc:ValorPis> <!-- Lucro Real: PIS 1.65% -->
              <tc:ValorCofins>950.00</tc:ValorCofins> <!-- Lucro Real: COFINS 7.60% -->
              <tc:Aliquota>5.00</tc:Aliquota> <!-- ISS 5% -->
              <tc:ValorIss>625.00</tc:ValorIss>
            </tc:Valores>
            <tc:ItemListaServico>01.01</tc:ItemListaServico> <!-- Análise e Desenvolvimento de Sistemas -->
            <tc:Discriminacao>Prestação de serviços de consultoria técnica em arquitetura de cloud, desenvolvimento back-end e análise de dados para integração com sistema Pix.</tc:Discriminacao>
            <tc:CodigoMunicipio>3304557</tc:CodigoMunicipio> <!-- Rio de Janeiro -->
          </tc:Servico>
        </tc:InfRps>
      </tc:Rps>
    </tc:ListaRps>
  </tc:LoteRps>
</tc:EnviarLoteRpsEnvio>`
  }
];

// Função que calcula impostos e audita notas baseado no regime
export function auditInvoices(invoices: Partial<TaxInvoice>[], regime: TaxRegime, clientState: string): TaxInvoice[] {
  const totalBatchValue = invoices.reduce((sum, i) => sum + (i.value || 0), 0);

  return invoices.map((inv, idx) => {
    const number = inv.number || `MOCK-${100 + idx}`;
    const date = inv.date || new Date().toISOString().split('T')[0];
    const issuerName = inv.issuerName || 'Cliente Autônomo S.A.';
    const issuerCnpj = inv.issuerCnpj || '00.000.000/0001-00';
    const recipientName = inv.recipientName || 'Comprador Final Ltda';
    const recipientCnpj = inv.recipientCnpj || '99.999.999/0001-99';
    const value = inv.value || 1000;
    const cfop = inv.cfop || '5102';
    const ncm = inv.ncm || '00000000';
    const icmsCst = inv.icmsCst || (regime === 'Simples Nacional' || regime === 'MEI' ? '102' : '00');
    const pisCst = inv.pisCst || '01';
    const cofinsCst = inv.cofinsCst || '01';

    const errors: string[] = [];
    let calculatedTax = 0;
    let credits = 0;

    // 1. Validar CFOP estadual/interestadual vs destinatário
    // Se o cliente (emissor) está em um estado, e o destinatário é de outro
    const destState = inv.recipientCnpj ? 'MG' : clientState; // simplificação
    const isInterestadual = clientState !== destState;
    
    if (cfop.startsWith('5') && isInterestadual) {
      errors.push(`CFOP ${cfop} é para operações internas, mas o destinatário é de ${destState} (Deveria iniciar com 6)`);
    } else if (cfop.startsWith('6') && !isInterestadual) {
      errors.push(`CFOP ${cfop} é interestadual, mas o destinatário está na mesma UF (${destState}) (Deveria iniciar with 5)`);
    }

    // 2. Verificar NCM inválida (menos de 8 dígitos ou vazia)
    const cleanedNcm = ncm.replace(/\D/g, '');
    if (cleanedNcm.length !== 8) {
      errors.push(`NCM ${ncm} inválido. Deve possuir 8 dígitos numéricos.`);
    }

    // 3. Verificar tributação monofásica e Substituição Tributária (ST)
    const ncmPrefix4 = cleanedNcm.substring(0, 4);
    const isMonofasico = MONOFASICOS_NCM_PREFIXES.includes(ncmPrefix4);
    const isSt = ST_NCM_PREFIXES.includes(ncmPrefix4);

    // Auditoria específica do regime
    if (regime === 'MEI') {
      // Regras de MEI
      if (value > 6750) {
        errors.push(`Faturamento em nota única (R$ ${value.toFixed(2)}) ultrapassa o limite mensal proporcional do MEI (R$ 6.750,00).`);
      }
      if (totalBatchValue > 6750 && idx === 0) {
        errors.push(`Faturamento total do lote (R$ ${totalBatchValue.toFixed(2)}) ultrapassou o limite mensal proporcional do MEI (R$ 6.750,00). Risco de desenquadramento!`);
      }
      if (totalBatchValue > 81000 && idx === 0) {
        errors.push(`Faturamento total do lote (R$ ${totalBatchValue.toFixed(2)}) ultrapassou o limite anual do MEI (R$ 81.000,00). Desenquadramento retroativo obrigatório!`);
      }
      
      // MEI não paga imposto por nota emitida (paga DAS-MEI fixo), logo a alíquota por nota é zero
      calculatedTax = 0;

    } else if (regime === 'Simples Nacional') {
      // No Simples Nacional, se o produto é monofásico (PIS/COFINS), deve-se segregar a receita no DAS para não pagar duas vezes!
      if (isMonofasico) {
        if (pisCst === '01' || cofinsCst === '01' || icmsCst === '102') {
          errors.push(`Produto monofásico (NCM ${ncm}) faturado com CSOSN ${icmsCst}. Deveria ser CSOSN 500 para deduzir PIS/COFINS no Simples Nacional.`);
          // Oportunidade de crédito calculada baseada na alíquota de PIS/COFINS do simples (aprox 1.98% de economia)
          credits += value * 0.0198;
        }
      }
      
      if (isSt && icmsCst === '102') {
        errors.push(`Produto sujeito a Substituição Tributária (ST) faturado com CSOSN 102. Deveria ser CSOSN 500 (ICMS retido anteriormente).`);
        credits += value * 0.0125; // Crédito estimado por imposto pago em duplicidade
      }

      // Alíquota média do Simples Nacional (ex: Anexo I faixa 2/3 = ~6.8%)
      calculatedTax = value * 0.068;

    } else if (regime === 'Lucro Presumido') {
      // Lucro Presumido: PIS (0.65%), COFINS (3.0%). ICMS varia por UF (ex: 18%)
      let pisRate = 0.0065;
      let cofinsRate = 0.03;
      let icmsRate = 0.18;

      if (isMonofasico) {
        if (pisCst === '01' || cofinsCst === '01') {
          errors.push(`NCM ${ncm} é Monofásico de PIS/COFINS, mas foi tributado com CST ${pisCst}/${cofinsCst}. Deveria ser CST 04 (Alíquota Zero/Isento na saída).`);
          credits += value * (0.0065 + 0.03); // Totalmente recuperável!
        }
        pisRate = 0;
        cofinsRate = 0;
      }

      if (isSt) {
        if (icmsCst === '00') {
          errors.push(`NCM ${ncm} possui Substituição Tributária (ST), mas o ICMS foi pago normalmente (CST 00). Deveria usar CST 60.`);
          credits += value * 0.04; // Diferença de imposto recuperável
        }
        icmsRate = 0;
      }

      calculatedTax = value * (pisRate + cofinsRate + icmsRate + 0.048); // +4.8% IRPJ/CSLL estimado

    } else if (regime === 'Lucro Real') {
      // Lucro Real: PIS (1.65%), COFINS (7.6%). Permite créditos em compras!
      let pisRate = 0.0165;
      let cofinsRate = 0.076;
      let icmsRate = 0.18;

      // Auditoria de créditos em notas de Entrada
      const isEntrada = cfop.startsWith('1') || cfop.startsWith('2');
      if (isEntrada) {
        // Notas de compra dão direito a crédito se forem insumos
        credits += value * (0.0165 + 0.076); // Crédito de PIS/COFINS de 9.25% no Lucro Real!
        calculatedTax = 0; // Entrada não gera imposto a pagar direto, gera crédito!
      } else {
        if (isMonofasico) {
          if (pisCst === '01' || cofinsCst === '01') {
            errors.push(`Venda de Monofásico (NCM ${ncm}) no Lucro Real cobrando PIS/COFINS integral. Deveria usar CST 04 (Saída com Alíquota Zero).`);
            credits += value * (0.0165 + 0.076); // 9.25% recuperável!
          }
          pisRate = 0;
          cofinsRate = 0;
        }

        if (isSt && icmsCst === '00') {
          errors.push(`Venda de item com ST (NCM ${ncm}) tributada integralmente de ICMS (CST 00). Deveria ser CST 60.`);
          icmsRate = 0;
        }

        calculatedTax = value * (pisRate + cofinsRate + icmsRate + 0.05); // +5% IRPJ/CSLL estimado sob lucro
      }
    }

    // --- SIMULAÇÃO DA REFORMA TRIBUTÁRIA 2027 (CBS/IBS/IS) ---
    // PIS/COFINS extintos. CBS = 17.7%, IBS = 8.8%.
    let cbsRate = 0.177;
    let ibsRate = 0.088;
    let isApplied = false;
    let isValue = 0;
    let cashbackValue = 0;

    // Alimentos da cesta básica (Arroz, trigo) e medicamentos têm alíquota zero (100% de redução)
    const isCestaBasicaOrMed = ncmPrefix4 === '1006' || ncmPrefix4 === '1101' || ncmPrefix4 === '3004' || ncmPrefix4 === '1901';
    // Produtos de higiene básica (ex: pasta de dente 3306) têm 60% de redução (alíquota correspondente a 40% do padrão)
    const isHigieneReduzida = ncmPrefix4 === '3306';
    // Bebidas alcoólicas, refrigerantes, tabaco e cosméticos de luxo têm Imposto Seletivo (IS) de 1.5%
    const isHarmfulCategory = ncmPrefix4 === '2202' || ncmPrefix4 === '2203' || ncmPrefix4 === '2402' || ncmPrefix4 === '3303' || ncmPrefix4 === '3304';

    if (isCestaBasicaOrMed) {
      cbsRate = 0;
      ibsRate = 0;
      cashbackValue = 0; // Alíquota zero, logo não há imposto pago a devolver
    } else if (isHigieneReduzida) {
      cbsRate = 0.177 * 0.40;
      ibsRate = 0.088 * 0.40;
      // Cashback de 20% do imposto pago para baixa renda em itens de higiene
      cashbackValue = (value * cbsRate + value * ibsRate) * 0.20;
    } else {
      if (isHarmfulCategory) {
        isApplied = true;
        isValue = value * 0.015; // Imposto seletivo de 1.5%
      }
      // Itens normais podem ter pequeno cashback estimado se vendidos para consumidor final (estimativa média)
      if (cfop === '5102' || cfop === '6102') {
        cashbackValue = (value * cbsRate + value * ibsRate) * 0.05; // 5% de cashback médio estimado
      }
    }

    const cbsValue = value * cbsRate;
    const ibsValue = value * ibsRate;
    const netTax = cbsValue + ibsValue + isValue - cashbackValue;

    return {
      id: inv.id || `inv-${idx + 1}-${Math.random().toString(36).substr(2, 5)}`,
      number,
      date,
      issuerName,
      issuerCnpj,
      recipientName,
      recipientCnpj,
      value,
      cfop,
      ncm,
      icmsCst,
      pisCst,
      cofinsCst,
      calculatedTax,
      errors,
      credits,
      taxRegime: regime,
      reform2027: {
        cbsValue,
        ibsValue,
        isApplied,
        isValue,
        cashbackValue,
        netTax: Math.max(0, netTax)
      }
    };
  });
}

// ==============================================================================
// 45 BLOCKS TAX MOTOR - LOCAL SIMULATION ENGINES (PROD-READY REPLICA OF SUPABASE)
// ==============================================================================

// 1. Simples Nacional Bracket Simulator
export function calculateSimplesNacionalLocal(
  anexo: string,
  revenue12m: number,
  value: number,
  salary12m?: number
) {
  let anexoFinal = anexo;
  let factorR = 0;
  let factorRAltered = false;

  // Fator R Logic (LC 123/2006): Anexo III vs Anexo V
  if (salary12m !== undefined && (anexo === 'III' || anexo === 'V')) {
    factorR = revenue12m > 0 ? salary12m / revenue12m : 0;
    anexoFinal = factorR >= 0.28 ? 'III' : 'V';
    factorRAltered = anexoFinal !== anexo;
  }

  // Brackets definitions matching simples_nacional_faixas
  const brackets: Record<string, { limit: number; rate: number; deduct: number }[]> = {
    'I': [
      { limit: 180000, rate: 0.04, deduct: 0 },
      { limit: 360000, rate: 0.073, deduct: 5940 },
      { limit: 720000, rate: 0.095, deduct: 13860 },
      { limit: 1800000, rate: 0.107, deduct: 22500 },
      { limit: 3600000, rate: 0.143, deduct: 87300 },
      { limit: 4800000, rate: 0.19, deduct: 378000 }
    ],
    'II': [
      { limit: 180000, rate: 0.045, deduct: 0 },
      { limit: 360000, rate: 0.079, deduct: 5940 },
      { limit: 720000, rate: 0.10, deduct: 13860 },
      { limit: 1800000, rate: 0.112, deduct: 22500 },
      { limit: 3600000, rate: 0.147, deduct: 85500 },
      { limit: 4800000, rate: 0.30, deduct: 720000 }
    ],
    'III': [
      { limit: 180000, rate: 0.06, deduct: 0 },
      { limit: 360000, rate: 0.112, deduct: 9360 },
      { limit: 720000, rate: 0.135, deduct: 17640 },
      { limit: 1800000, rate: 0.16, deduct: 35640 },
      { limit: 3600000, rate: 0.21, deduct: 125640 },
      { limit: 4800000, rate: 0.33, deduct: 648000 }
    ],
    'IV': [
      { limit: 180000, rate: 0.045, deduct: 0 },
      { limit: 360000, rate: 0.09, deduct: 8100 },
      { limit: 720000, rate: 0.102, deduct: 12420 },
      { limit: 1800000, rate: 0.14, deduct: 39780 },
      { limit: 3600000, rate: 0.22, deduct: 183780 },
      { limit: 4800000, rate: 0.33, deduct: 828000 }
    ],
    'V': [
      { limit: 180000, rate: 0.155, deduct: 0 },
      { limit: 360000, rate: 0.18, deduct: 4500 },
      { limit: 720000, rate: 0.195, deduct: 9900 },
      { limit: 1800000, rate: 0.205, deduct: 17100 },
      { limit: 3600000, rate: 0.23, deduct: 62100 },
      { limit: 4800000, rate: 0.305, deduct: 540000 }
    ]
  };

  const list = brackets[anexoFinal] || brackets['III'];
  let b = list[0];
  let faIndex = 1;
  for (let i = 0; i < list.length; i++) {
    if (revenue12m <= list[i].limit) {
      b = list[i];
      faIndex = i + 1;
      break;
    }
    if (i === list.length - 1) {
      b = list[i];
      faIndex = 6;
    }
  }

  // Formula Efetiva: ((RBT12 * Aliquota Nominal) - Parcela a Deduzir) / RBT12
  let effectiveRate = ((revenue12m * b.rate) - b.deduct) / revenue12m;
  if (effectiveRate < 0) effectiveRate = 0;

  const dueValue = value * effectiveRate;

  return {
    anexo_original: anexo,
    anexo_utilizado: anexoFinal,
    anexo_alterado_por_fator_r: factorRAltered,
    fator_r: factorR,
    faixa: faIndex,
    receita_bruta_12m: revenue12m,
    aliquota_nominal: b.rate,
    aliquota_nominal_pct: b.rate * 100,
    valor_deduzir: b.deduct,
    aliquota_efetiva: effectiveRate,
    aliquota_efetiva_pct: Number((effectiveRate * 100).toFixed(4)),
    valor_nota: value,
    valor_simples_devido: Number(dueValue.toFixed(2)),
    fundamento_legal: 'LC 123/2006, art. 18'
  };
}

// 2. MEI DAS & Limit Checker (Bloco 6)
export function calculateMeiLocal(
  activity: string,
  revenueMonth: number,
  revenueYear: number,
  openingDateStr: string,
  competenceStr: string
) {
  const openingDate = new Date(openingDateStr);
  const compDate = new Date(competenceStr);
  const compYear = compDate.getFullYear();

  // Proportional months calculator
  let activeMonths = 12;
  if (openingDate.getFullYear() === compYear) {
    activeMonths = 12 - openingDate.getMonth();
  }

  const limitAnual = 81000;
  const limitProportional = (limitAnual / 12) * activeMonths;
  const toleranceLimit = limitProportional * 1.20;

  let situacao = 'dentro_limite';
  let alertMsg = null;

  if (revenueYear <= limitProportional) {
    situacao = 'dentro_limite';
  } else if (revenueYear <= toleranceLimit) {
    situacao = 'excesso_ate_20';
    alertMsg = 'DAS complementar devido sobre o excedente. Migração para ME em janeiro do ano seguinte.';
  } else {
    situacao = 'excesso_acima_20';
    alertMsg = 'DESENQUADRAMENTO RETROATIVO OBRIGATÓRIO — recalcular tributos como ME desde janeiro do ano corrente.';
  }

  // DAS-MEI values for 2026: INSS R$ 81.05 + ICMS R$ 1.00 + ISS R$ 5.00
  const inss = 81.05;
  const icms = (activity === 'comercio_industria' || activity === 'comercio_e_servico') ? 1.00 : 0;
  const iss = (activity === 'servico' || activity === 'comercio_e_servico') ? 5.00 : 0;
  const dasDevido = inss + icms + iss;

  return {
    competencia: competenceStr,
    tipo_atividade: activity,
    das_devido: Number(dasDevido.toFixed(2)),
    composicao_das: { inss, icms, iss },
    receita_mes: revenueMonth,
    receita_acumulada_ano: revenueYear,
    meses_ativos_no_ano: activeMonths,
    limite_proporcional: limitProportional,
    percentual_do_limite_usado: Number(((revenueYear / limitProportional) * 100).toFixed(2)),
    situacao,
    alerta: alertMsg,
    fundamento_legal: 'LC 123/2006, art. 18-A (SIMEI)'
  };
}

// 3. Lucro Presumido Engine (Bloco 7/12)
export function calculateLucroPresumidoLocal(
  activity: string,
  revenueMonth: number,
  isProduct: boolean,
  stateOrig: string = 'SP',
  stateDest: string = 'SP',
  issRate: number = 5.0
) {
  // Presunção rates mapping
  const rates: Record<string, { irpj: number; csll: number }> = {
    'comercio': { irpj: 0.08, csll: 0.12 },
    'industria': { irpj: 0.08, csll: 0.12 },
    'servico_geral': { irpj: 0.32, csll: 0.32 },
    'revenda_combustivel': { irpj: 0.016, csll: 0.12 }
  };

  const currentRates = rates[activity] || rates['servico_geral'];

  // Federal taxes
  const baseIrpj = revenueMonth * currentRates.irpj;
  const baseCsll = revenueMonth * currentRates.csll;

  const irpjNormal = baseIrpj * 0.15;
  // IRPJ additional: 10% on monthly base > 20000
  const irpjAdditional = baseIrpj > 20000 ? (baseIrpj - 20000) * 0.10 : 0;

  const csll = baseCsll * 0.09;
  const pis = revenueMonth * 0.0065; // cumulativo
  const cofins = revenueMonth * 0.03; // cumulativo

  const totalFederal = irpjNormal + irpjAdditional + csll + pis + cofins;

  let icms = 0;
  let iss = 0;

  if (isProduct) {
    const icmsRate = calculateIcmsInterestadualRateLocal(stateOrig, stateDest);
    icms = revenueMonth * (icmsRate / 100);
  } else {
    iss = revenueMonth * (issRate / 100);
  }

  const totalGeral = totalFederal + icms + iss;

  return {
    receita_bruta_mes: revenueMonth,
    irpj: {
      base_presumida: baseIrpj,
      valor: Number(irpjNormal.toFixed(2)),
      adicional: Number(irpjAdditional.toFixed(2))
    },
    csll: {
      base_presumida: baseCsll,
      valor: Number(csll.toFixed(2))
    },
    pis: Number(pis.toFixed(2)),
    cofins: Number(cofins.toFixed(2)),
    icms: isProduct ? { aliquota_pct: calculateIcmsInterestadualRateLocal(stateOrig, stateDest), valor: Number(icms.toFixed(2)) } : null,
    iss: !isProduct ? { aliquota_pct: issRate, valor: Number(iss.toFixed(2)) } : null,
    total_tributos_federais: Number(totalFederal.toFixed(2)),
    total_geral_devido: Number(totalGeral.toFixed(2)),
    fundamento_legal: 'Lei 9.249/1995 (Presunção); Lei 9.718/1998 (PIS/COFINS)'
  };
}

// Helper for interestadual ICMS (Bloco 1)
export function calculateIcmsInterestadualRateLocal(stateOrig: string, stateDest: string) {
  if (stateOrig === stateDest) {
    if (stateDest === 'RJ') return 22.0; // 20% internal + 2% FECP Bloco 28
    if (stateDest === 'AL') return 20.0; // 19% internal + 1% FECOEP Bloco 29
    if (stateDest === 'SP' || stateDest === 'MG') return 18.0;
    return 18.0;
  }
  // South/Southeast (excluding ES) -> North/Northeast/Central-West/ES is 7%
  const southSoutheast = ['SP', 'RJ', 'MG', 'PR', 'RS', 'SC'];
  if (southSoutheast.includes(stateOrig) && stateOrig !== 'ES' && !southSoutheast.includes(stateDest)) {
    return 7.0;
  }
  return 12.0;
}

// 4. Lucro Real Engine (Bloco 8)
export function calculateLucroRealLocal(
  profitContabil: number,
  revenue: number,
  additions: number = 0,
  exclusions: number = 0,
  previousLosses: number = 0,
  pisCredit: number = 0,
  cofinsCredit: number = 0,
  months: number = 3 // Standard quarter
) {
  const profitAjustadoIrpj = profitContabil + additions - exclusions;
  
  // 30% Tax Loss Offset Cap (Trava dos 30% - Lei 9.065/1995)
  let lossesCompensated = 0;
  if (profitAjustadoIrpj > 0 && previousLosses > 0) {
    const maxOffset = profitAjustadoIrpj * 0.30;
    lossesCompensated = Math.min(previousLosses, maxOffset);
  }

  const baseIrpj = Math.max(0, profitAjustadoIrpj - lossesCompensated);
  const baseCsll = Math.max(0, profitContabil + additions - exclusions - lossesCompensated);

  const irpjNormal = baseIrpj * 0.15;
  const limitAdditional = 20000 * months;
  const irpjAdditional = baseIrpj > limitAdditional ? (baseIrpj - limitAdditional) * 0.10 : 0;

  const csll = baseCsll * 0.09;

  // PIS/COFINS Non-cumulative (1.65% and 7.60%)
  const debitPis = revenue * 0.0165;
  const debitCofins = revenue * 0.076;

  const pisAPagar = Math.max(0, debitPis - pisCredit);
  const cofinsAPagar = Math.max(0, debitCofins - cofinsCredit);

  const totalGeral = irpjNormal + irpjAdditional + csll + pisAPagar + cofinsAPagar;

  return {
    lucro_contabil_informado: profitContabil,
    lucro_ajustado_irpj: profitAjustadoIrpj,
    prejuizo_fiscal: {
      acumulado_anterior: previousLosses,
      compensado_neste_periodo: Number(lossesCompensated.toFixed(2)),
      remanescente: Number((previousLosses - lossesCompensated).toFixed(2)),
      trava_30pct_aplicada: 0.30
    },
    irpj: {
      base: Number(baseIrpj.toFixed(2)),
      valor: Number(irpjNormal.toFixed(2)),
      adicional: Number(irpjAdditional.toFixed(2))
    },
    csll: {
      base: Number(baseCsll.toFixed(2)),
      valor: Number(csll.toFixed(2))
    },
    pis: {
      debito: Number(debitPis.toFixed(2)),
      credito: pisCredit,
      a_pagar: Number(pisAPagar.toFixed(2))
    },
    cofins: {
      debito: Number(debitCofins.toFixed(2)),
      credito: cofinsCredit,
      a_pagar: Number(cofinsAPagar.toFixed(2))
    },
    total_geral_devido: Number(totalGeral.toFixed(2)),
    fundamento_legal: 'Lei 9.430/1996; Lei 9.065/1995 (Trava 30%)'
  };
}

// 5. DIFAL Simulator (Bloco 9/28/35/36)
export function calculateDifalLocal(
  stateOrig: string,
  stateDest: string,
  value: number,
  isFinalConsumer: boolean,
  useDoubleBase: boolean = false
) {
  if (stateOrig === stateDest) {
    return { error: 'DIFAL não se aplica a operações internas' };
  }

  if (!isFinalConsumer) {
    return {
      aplica_difal: false,
      motivo: 'DIFAL se aplica apenas a consumidor final não-contribuinte'
    };
  }

  const rateDestObj = getIcmsCompleteRateLocal(stateDest);
  const rateDest = rateDestObj.rate;
  const fecpDest = rateDestObj.fecp;
  
  const rateOrig = calculateIcmsInterestadualRateLocal(stateOrig, stateDest);

  if (rateDest <= rateOrig) {
    return {
      aplica_difal: true,
      difal_valor: 0,
      fcp_valor: 0,
      total_recolher: 0,
      status_revisao: 'pendente_revisao',
      motivo_revisao: `Alíquota destino (${rateDest}%) menor ou igual à interestadual (${rateOrig}%). Zerado por segurança.`
    };
  }

  let baseDifal = value;
  let difalValue = 0;

  if (useDoubleBase) {
    // Double Base ("por dentro" - Bloco 35)
    const icmsInterestadual = value * (rateOrig / 100);
    baseDifal = (value - icmsInterestadual) / (1 - (rateDest / 100));
    difalValue = (baseDifal * (rateDest / 100)) - icmsInterestadual;
  } else {
    // Single Base
    baseDifal = value;
    difalValue = baseDifal * (rateDest - rateOrig) / 100;
  }

  const fcpValue = baseDifal * (fecpDest / 100);
  const total = difalValue + fcpValue;

  return {
    aplica_difal: true,
    uf_origem: stateOrig,
    uf_destino: stateDest,
    usou_base_dupla: useDoubleBase,
    valor_operacao: value,
    base_difal: Number(baseDifal.toFixed(2)),
    aliquota_interna_destino_pct: rateDest,
    aliquota_interestadual_pct: rateOrig,
    diferencial_aliquota_pct: rateDest - rateOrig,
    difal_valor: Number(Math.max(0, difalValue).toFixed(2)),
    fcp_valor: Number(fcpValue.toFixed(2)),
    total_recolher: Number(Math.max(0, total).toFixed(2)),
    status_revisao: useDoubleBase ? 'pendente_revisao' : 'aprovado',
    fundamento_legal: 'EC 87/2015; LC 190/2022'
  };
}

// 6. ICMS-ST Simulator with Adjusted MVA (Bloco 28)
export function calculateIcmsStLocal(
  ncm: string,
  cest: string,
  stateDest: string,
  value: number,
  icmsProprio: number,
  ipi: number = 0,
  freight: number = 0,
  expenses: number = 0,
  mvaManual: number | null = null,
  stateOrig: string | null = null
) {
  let mvaOriginal = 0.40; // Default illustrative 40%
  if (mvaManual !== null) {
    mvaOriginal = mvaManual;
  } else if (ncm.startsWith('8708')) {
    mvaOriginal = 0.36; // Auto-peças ST SP/MG
  }

  let mvaUtilizado = mvaOriginal;
  let mvaAjustado = false;
  let rateInterestadual = 12.0;

  const rateDestObj = getIcmsCompleteRateLocal(stateDest);
  const rateDestTotal = rateDestObj.rate + rateDestObj.fecp;

  if (stateOrig !== null && stateOrig !== stateDest) {
    rateInterestadual = calculateIcmsInterestadualRateLocal(stateOrig, stateDest);
    // Adjusted MVA Formula (Convênio ICMS 142/2018)
    mvaUtilizado = ((1 + mvaOriginal) * (1 - rateInterestadual / 100) / (1 - rateDestTotal / 100)) - 1;
    mvaAjustado = true;
  }

  const baseSt = (value + ipi + freight + expenses) * (1 + mvaUtilizado);
  const icmsStBruto = baseSt * (rateDestTotal / 100);
  const icmsStAPagar = icmsStBruto - icmsProprio;

  return {
    ncm,
    cest,
    uf_origem: stateOrig,
    uf_destino: stateDest,
    mva_original_pct: mvaOriginal * 100,
    mva_utilizado_pct: Number((mvaUtilizado * 100).toFixed(2)),
    mva_foi_ajustado: mvaAjustado,
    base_st: Number(baseSt.toFixed(2)),
    aliquota_interna_destino_pct: rateDestTotal,
    icms_st_bruto: Number(icmsStBruto.toFixed(2)),
    icms_proprio_debito: icmsProprio,
    icms_st_a_recolher: Number(Math.max(0, icmsStAPagar).toFixed(2)),
    status_revisao: mvaManual !== null ? 'pendente_revisao' : 'aprovado',
    fundamento_legal: 'Convênio ICMS 142/2018'
  };
}

// ICMS complete rates with FECP (Blocos 28, 29)
export function getIcmsCompleteRateLocal(uf: string) {
  const table: Record<string, { rate: number; fecp: number }> = {
    'SP': { rate: 18.0, fecp: 0 },
    'MG': { rate: 18.0, fecp: 0 },
    'RJ': { rate: 20.0, fecp: 2.0 }, // Bloco 28 FECP RJ
    'AL': { rate: 19.0, fecp: 1.0 }, // Bloco 29 FECOEP AL
    'PR': { rate: 19.5, fecp: 0 }, // FECOP embutido Bloco 29
    'BA': { rate: 20.5, fecp: 0 }  // FUNCEP embutido Bloco 29
  };
  return table[uf] || { rate: 18.0, fecp: 0 };
}

// 7. Federal Retention (CSRF & IRRF - Bloco 30)
export function calculateFederalRetentionLocal(
  value: number,
  isSimples: boolean = false,
  hasCsrf: boolean = true,
  hasIrrf15: boolean = false
) {
  let pis = 0;
  let cofins = 0;
  let csll = 0;
  let csrfTotal = 0;
  let irrf = 0;
  let status = 'aprovado';
  let motivo = '';

  if (isSimples) {
    motivo = 'Prestador optante pelo Simples Nacional — dispensado de retenção por determinação legal.';
  } else {
    // CSRF threshold of R$ 215.05 (Lei 10.833/2003)
    if (hasCsrf && value > 215.05) {
      pis = value * 0.0065;
      cofins = value * 0.03;
      csll = value * 0.01;
      csrfTotal = pis + cofins + csll;
    } else if (hasCsrf) {
      motivo = 'Valor abaixo do limite de dispensa (R$215,05) — sem retenção CSRF.';
    }

    if (hasIrrf15) {
      irrf = value * 0.015;
      status = 'pendente_revisao';
      motivo = (motivo ? motivo + ' | ' : '') + 'IRRF de 1,5% aplicado — confirme se o serviço se enquadra no art. 647 do RIR/2018.';
    }
  }

  return {
    valor_servico: value,
    prestador_optante_simples: isSimples,
    pis_retido: Number(pis.toFixed(2)),
    cofins_retido: Number(cofins.toFixed(2)),
    csll_retido: Number(csll.toFixed(2)),
    csrf_total: Number(csrfTotal.toFixed(2)),
    irrf_retido: Number(irrf.toFixed(2)),
    total_retido: Number((csrfTotal + irrf).toFixed(2)),
    valor_liquido_a_pagar: Number((value - csrfTotal - irrf).toFixed(2)),
    status_revisao: status,
    motivo_revisao: motivo || null,
    fundamento_legal: 'Lei 10.833/2003, art. 30-31 (CSRF)'
  };
}

// 8. INSS Retention (Cessão de Mão de Obra - Bloco 32)
export function calculateInssRetentionLocal(
  value: number,
  isSimples: boolean = false,
  isAnexoIv: boolean = false,
  isMei: boolean = false,
  materialDeduction: number = 0
) {
  if (isSimples && !isAnexoIv) {
    return {
      valor_bruto_nota: value,
      valor_retido: 0,
      status_revisao: 'aprovado',
      motivo_revisao: 'Prestador optante pelo Simples Nacional fora do Anexo IV — isento desta retenção.',
      fundamento_legal: 'Lei 8.212/1991, art. 31'
    };
  }

  const base = value - materialDeduction;
  const rate = isMei ? 0.035 : 0.11; // 3.5% MEI vs 11% standard
  const retido = base * rate;
  const isDispensado = retido <= 10.00; // threshold R$ 10

  let status = 'aprovado';
  let motivo = '';

  if (isDispensado) {
    motivo = 'Valor retido igual ou abaixo do limite de dispensa (R$10,00) — retenção não exigida.';
  }
  if (materialDeduction > 0) {
    status = 'pendente_revisao';
    motivo = (motivo ? motivo + ' | ' : '') + 'Dedução de materiais aplicada — confirme se está discriminada no contrato e na nota.';
  }

  return {
    valor_bruto_nota: value,
    valor_materiais_deduzido: materialDeduction,
    base_retencao: base,
    aliquota_pct: rate * 100,
    prestador_e_mei: isMei,
    valor_retido: Number(retido.toFixed(2)),
    dispensado_limite_minimo: isDispensado,
    valor_liquido_a_pagar: Number((value - (isDispensado ? 0 : retido)).toFixed(2)),
    status_revisao: status,
    motivo_revisao: motivo || null,
    fundamento_legal: 'Lei 8.212/1991, art. 31'
  };
}

// 9. ISS Municipal Validations (Bloco 31)
export function validateIssRateLocal(rate: number, serviceCode?: string) {
  const isExcecao = serviceCode === '7.02' || serviceCode === '7.05' || serviceCode === '16.01';
  if (rate > 5.0) {
    return {
      valido: false,
      motivo: 'Alíquota acima do teto constitucional de 5% (LC 116/2003, art. 8º, II).'
    };
  }
  if (rate < 2.0 && !isExcecao) {
    return {
      valido: false,
      motivo: 'Alíquota abaixo do piso constitucional de 2% (LC 116/2003, art. 8º-A).'
    };
  }
  return {
    valido: true,
    e_excecao_ao_piso: isExcecao,
    fundamento_legal: 'LC 116/2003, art. 8º e 8º-A'
  };
}

// 10. Automated Test Suite (Roda todos os 9 testes do Bloco 37)
export interface FiscalTestResult {
  teste: string;
  esperado: string;
  obtido: string;
  passou: boolean;
}

export function runLocalTestSuite(): FiscalTestResult[] {
  const results: FiscalTestResult[] = [];

  // Teste 1: Simples Nacional alíquota efetiva Anexo III
  try {
    const res = calculateSimplesNacionalLocal('III', 200000.00, 10000.00);
    results.push({
      teste: 'Simples Nacional - alíquota efetiva Anexo III',
      esperado: '6.52',
      obtido: res.aliquota_efetiva_pct.toString(),
      passou: Math.abs(res.aliquota_efetiva_pct - 6.52) < 0.05
    });
  } catch (e: any) {
    results.push({ teste: 'Simples Nacional - alíquota efetiva Anexo III', esperado: '6.52', obtido: e.message, passou: false });
  }

  // Teste 2: MEI DAS comércio/indústria 2026
  try {
    const res = calculateMeiLocal('comercio_industria', 5000.00, 35000.00, '2026-01-01', '2026-06-01');
    results.push({
      teste: 'MEI - DAS comércio/indústria 2026',
      esperado: '82.05',
      obtido: res.das_devido.toString(),
      passou: res.das_devido === 82.05
    });
  } catch (e: any) {
    results.push({ teste: 'MEI - DAS comércio/indústria 2026', esperado: '82.05', obtido: e.message, passou: false });
  }

  // Teste 3: Lucro Presumido IRPJ
  try {
    const res = calculateLucroPresumidoLocal('comercio', 50000.00, true, 'SP', 'SP');
    results.push({
      teste: 'Lucro Presumido - IRPJ',
      esperado: '600',
      obtido: res.irpj.valor.toString(),
      passou: res.irpj.valor === 600
    });
  } catch (e: any) {
    results.push({ teste: 'Lucro Presumido - IRPJ', esperado: '600', obtido: e.message, passou: false });
  }

  // Teste 4: Lucro Presumido CSLL
  try {
    const res = calculateLucroPresumidoLocal('comercio', 50000.00, true, 'SP', 'SP');
    results.push({
      teste: 'Lucro Presumido - CSLL',
      esperado: '540',
      obtido: res.csll.valor.toString(),
      passou: res.csll.valor === 540
    });
  } catch (e: any) {
    results.push({ teste: 'Lucro Presumido - CSLL', esperado: '540', obtido: e.message, passou: false });
  }

  // Teste 5: Lucro Real IRPJ basic 15%
  try {
    const res = calculateLucroRealLocal(100000.00, 500000.00, 0, 0, 0, 3000, 15000, 3);
    results.push({
      teste: 'Lucro Real - IRPJ (15% básico)',
      esperado: '15000',
      obtido: res.irpj.valor.toString(),
      passou: res.irpj.valor === 15000
    });
  } catch (e: any) {
    results.push({ teste: 'Lucro Real - IRPJ (15% básico)', esperado: '15000', obtido: e.message, passou: false });
  }

  // Teste 6: Lucro Real IRPJ additional 10%
  try {
    const res = calculateLucroRealLocal(100000.00, 500000.00, 0, 0, 0, 3000, 15000, 3);
    results.push({
      teste: 'Lucro Real - IRPJ adicional (10% acima do limite)',
      esperado: '4000',
      obtido: res.irpj.adicional.toString(),
      passou: res.irpj.adicional === 4000
    });
  } catch (e: any) {
    results.push({ teste: 'Lucro Real - IRPJ adicional (10% acima do limite)', esperado: '4000', obtido: e.message, passou: false });
  }

  // Teste 7: Lucro Real CSLL
  try {
    const res = calculateLucroRealLocal(100000.00, 500000.00, 0, 0, 0, 3000, 15000, 3);
    results.push({
      teste: 'Lucro Real - CSLL',
      esperado: '9000',
      obtido: res.csll.valor.toString(),
      passou: res.csll.valor === 9000
    });
  } catch (e: any) {
    results.push({ teste: 'Lucro Real - CSLL', esperado: '9000', obtido: e.message, passou: false });
  }

  // Teste 8: ICMS RJ alíquota efetiva total com FECP (20% + 2% = 22%)
  try {
    const res = getIcmsCompleteRateLocal('RJ');
    const total = res.rate + res.fecp;
    results.push({
      teste: 'ICMS RJ - alíquota efetiva total com FECP',
      esperado: '22',
      obtido: total.toString(),
      passou: total === 22
    });
  } catch (e: any) {
    results.push({ teste: 'ICMS RJ - alíquota efetiva total com FECP', esperado: '22', obtido: e.message, passou: false });
  }

  // Teste 9: Retenção federal CSRF total (4.65% de R$ 1.000)
  try {
    const res = calculateFederalRetentionLocal(1000.00, false, true, true);
    results.push({
      teste: 'Retenção federal - CSRF total (4,65%)',
      esperado: '46.5',
      obtido: res.csrf_total.toString(),
      passou: res.csrf_total === 46.50
    });
  } catch (e: any) {
    results.push({ teste: 'Retenção federal - CSRF total (4,65%)', esperado: '46.5', obtido: e.message, passou: false });
  }

  // Teste 10: Retenção INSS 11% padrão sobre R$ 5.000
  try {
    const res = calculateInssRetentionLocal(5000.00);
    results.push({
      teste: 'Retenção INSS - 11% padrão',
      esperado: '550',
      obtido: res.valor_retido.toString(),
      passou: res.valor_retido === 550
    });
  } catch (e: any) {
    results.push({ teste: 'Retenção INSS - 11% padrão', esperado: '550', obtido: e.message, passou: false });
  }

  return results;
}

