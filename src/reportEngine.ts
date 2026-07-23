import { TaxInvoice, FiscalBatch } from './types';

/* =====================================================================
   MOTOR DE ANÁLISE DO RELATÓRIO
   ---------------------------------------------------------------------
   Transforma os erros em texto livre (invoice.errors) em achados
   estruturados, agrupa por tipo, calcula impacto financeiro e monta
   um plano de ação priorizado.

   Funciona SEM IA. A IA (Gemini) continua sendo um complemento opcional.

   BASE LEGAL VERIFICADA EM: 23/07/2026
   Fontes consultadas: LC 214/2025 (regulamenta a EC 132/2023), LC 227/2026,
   LC 123/2006 art. 18 §4º-A, Resolução CGSN 140/2018, Lei 10.147/2000,
   Lei 10.485/2002, Lei 13.097/2015, Ajuste SINIEF 07/2005, Convênio ICMS
   142/2018, Decreto 11.158/2022 (TIPI), CTN arts. 138 e 168.

   Constante VIGENCIA_BASE_LEGAL abaixo registra a data da verificação e é
   impressa no rodapé do relatório para rastreabilidade.
   ===================================================================== */

export const VIGENCIA_BASE_LEGAL = {
  verificadoEm: '23/07/2026',
  fontes: [
    'LC 214/2025 — institui IBS, CBS e Imposto Seletivo (regulamenta a EC 132/2023)',
    'LC 227/2026 — contencioso administrativo do IBS',
    'LC 123/2006, art. 18, §4º-A e Resolução CGSN 140/2018 — Simples Nacional',
    'Lei 10.147/2000, Lei 10.485/2002, Lei 13.097/2015 — regimes monofásicos',
    'Convênio ICMS 142/2018 — substituição tributária',
    'Ajuste SINIEF 07/2005 — Carta de Correção Eletrônica',
    'Decreto 11.158/2022 — TIPI',
    'CTN, arts. 138 e 168 — denúncia espontânea e prescrição',
  ],
  observacao:
    'Referências verificadas na data acima. A legislação tributária é dinâmica; ' +
    'o sistema registra a data de verificação para rastreabilidade do parecer.',
};

export type Severidade = 'critico' | 'alto' | 'medio' | 'baixo';

export interface CatalogoRegra {
  codigo: string;
  titulo: string;
  severidade: Severidade;
  causaRaiz: string;
  baseLegal: string;
  risco: string;
  acao: string;
  prazo: string;
  responsavel: string;
}

/* ---------------------------------------------------------------------
   CATÁLOGO DE REGRAS
   Edite aqui para ajustar textos, base legal, prazos e ações.
   --------------------------------------------------------------------- */
export const CATALOGO_REGRAS: Record<string, CatalogoRegra> = {
  NCM_INVALIDO: {
    codigo: 'NCM_INVALIDO',
    titulo: 'NCM inválido ou incompleto',
    severidade: 'alto',
    causaRaiz:
      'Cadastro de produto incompleto no ERP. O NCM foi digitado manualmente sem validação de formato, ou migrado de sistema legado sem tratamento.',
    baseLegal:
      'Decreto 11.158/2022 (TIPI) — a NCM deve conter 8 dígitos. Art. 12, IV do Convênio S/Nº de 1970 e Manual de Orientação do Contribuinte (MOC) da NF-e exigem NCM válido no campo prod/NCM.',
    risco:
      'Rejeição da NF-e pela SEFAZ, glosa de crédito pelo destinatário e enquadramento tributário incorreto — as alíquotas de IPI, PIS/COFINS, ICMS-ST e a identificação de produtos monofásicos dependem diretamente da NCM. Com a NT 2025.002 e os novos campos de CST e cClassTrib da Reforma Tributária, o NCM passou a determinar também o enquadramento de IBS/CBS, ampliando o impacto do erro.',
    acao:
      'Corrigir o cadastro do produto com a NCM de 8 dígitos conforme a TIPI vigente (Decreto 11.158/2022). ATENÇÃO: a Carta de Correção Eletrônica NÃO pode ser usada para alterar NCM — o Ajuste SINIEF 07/2005 veda a correção de campos que alterem o cálculo do imposto. Se a nota estiver dentro da janela de cancelamento e a mercadoria não tiver circulado, cancelar e reemitir. Fora do prazo, emitir nota de devolução (entrada) e reemitir a operação com o NCM correto. Retificar a EFD ICMS/IPI e a EFD Contribuições do período.',
    prazo:
      'Cancelamento: 24h da autorização (padrão após a unificação parcial de 2026; alguns estados admitem até 168h). Após esse prazo, o caminho é a nota de devolução. Correção do cadastro: imediata, para estancar novas ocorrências.',
    responsavel: 'Cadastro / Fiscal',
  },

  CFOP_INTERNO_EM_INTERESTADUAL: {
    codigo: 'CFOP_INTERNO_EM_INTERESTADUAL',
    titulo: 'CFOP interno usado em operação interestadual',
    severidade: 'critico',
    causaRaiz:
      'Parametrização de CFOP fixa no cadastro do produto ou da operação, sem considerar a UF do destinatário. O sistema aplica o mesmo CFOP independentemente do destino.',
    baseLegal:
      'Convênio S/Nº de 1970, Anexo II (Códigos Fiscais de Operações e Prestações). CFOPs do grupo 5.000 destinam-se a operações internas; grupo 6.000, a interestaduais.',
    risco:
      'Recolhimento de ICMS a alíquota incorreta, ausência de apuração do Diferencial de Alíquotas (EC 87/2015, regulamentada pela LC 190/2022) e divergência entre a NF-e e a EFD ICMS/IPI. A inconsistência é detectável no cruzamento automático da SEFAZ, sujeitando a empresa a autuação, multa e juros.',
    acao:
      'Revisar a regra de determinação de CFOP no ERP para considerar a UF de origem e destino. Reapurar o ICMS e o DIFAL das operações afetadas e retificar a EFD do período.',
    prazo:
      'Retificação da EFD: até o último dia do 3º mês subsequente (regra geral, verificar a UF).',
    responsavel: 'Fiscal / TI',
  },

  CFOP_INTERESTADUAL_EM_INTERNO: {
    codigo: 'CFOP_INTERESTADUAL_EM_INTERNO',
    titulo: 'CFOP interestadual usado em operação interna',
    severidade: 'alto',
    causaRaiz:
      'Mesma origem do caso anterior: CFOP fixo no cadastro, sem lógica de UF. Aqui o efeito é inverso — operação dentro do estado marcada como interestadual.',
    baseLegal:
      'Convênio S/Nº de 1970, Anexo II. Operações internas exigem CFOP do grupo 5.000.',
    risco:
      'Aplicação de alíquota interestadual (7% ou 12%) onde caberia a interna, gerando recolhimento a menor de ICMS e passivo fiscal.',
    acao:
      'Corrigir a parametrização de CFOP e reapurar a diferença de ICMS. Recolher a diferença com denúncia espontânea, se aplicável, para afastar a multa de ofício.',
    prazo:
      'Denúncia espontânea: antes do início de qualquer procedimento fiscalizatório (art. 138 do CTN).',
    responsavel: 'Fiscal / TI',
  },

  MONOFASICO_SIMPLES_CSOSN: {
    codigo: 'MONOFASICO_SIMPLES_CSOSN',
    titulo: 'Produto monofásico sem segregação de receita no Simples Nacional',
    severidade: 'critico',
    causaRaiz:
      'O produto está cadastrado sem a marcação de tributação monofásica de PIS/COFINS. A classificação monofásica decorre do NCM e da lei aplicável, não do nome comercial do produto — cadastros migrados ou preenchidos manualmente costumam perder essa informação. Sem ela, o PGDAS-D não segrega a receita e a empresa recolhe PIS/COFINS que já foram pagos pelo fabricante ou importador.',
    baseLegal:
      'Lei 10.147/2000, art. 2º (higiene pessoal, medicamentos e cosméticos — alíquota global de 12,50% na indústria/importação e alíquota zero na revenda); Lei 10.485/2002 (autopeças, pneus e veículos); Lei 13.097/2015 (bebidas frias). LC 123/2006, art. 18, §4º-A, I, com a redação dada pela LC 128/2008, e Resolução CGSN 140/2018 — autorizam a segregação de receitas no PGDAS-D. Solução de Consulta COSIT 225/2017 confirma o entendimento da Receita Federal.',
    risco:
      'Pagamento em duplicidade de PIS/COFINS dentro do DAS. É perda financeira direta, recuperável nos últimos 5 anos.',
    acao:
      'Marcar o produto como monofásico no cadastro, vinculando a classificação ao NCM conforme a lei aplicável, e utilizar CSOSN 500. Retificar o PGDAS-D dos períodos afetados segregando a receita. ATENÇÃO: a jurisprudência exige que a segregação contábil seja PRÉVIA ao pleito de exclusão — a escrituração deve estar regularizada antes do pedido, sob pena de indeferimento. Apurado o indébito, solicitar restituição ou compensação via PER/DCOMP.',
    prazo:
      'Prescrição de 5 anos contados do pagamento indevido (art. 168, I do CTN c/c LC 118/2005).',
    responsavel: 'Fiscal / Contabilidade',
  },

  ST_SIMPLES_CSOSN: {
    codigo: 'ST_SIMPLES_CSOSN',
    titulo: 'Produto com ICMS-ST sem segregação no Simples Nacional',
    severidade: 'alto',
    causaRaiz:
      'Produto sujeito a Substituição Tributária cadastrado sem essa marcação. O ICMS já foi retido pelo substituto na etapa anterior, mas o sistema tributa novamente na saída.',
    baseLegal:
      'Convênio ICMS 142/2018 (regras gerais da ST). LC 123/2006, art. 18, §4º-A, I — receitas com ICMS-ST devem ser segregadas no PGDAS-D.',
    risco:
      'Recolhimento em duplicidade do ICMS dentro do DAS. Valor recuperável.',
    acao:
      'Marcar o produto como sujeito a ST no cadastro (vinculando CEST e NCM) e utilizar CSOSN 500. Retificar o PGDAS-D dos períodos afetados segregando a receita de ICMS-ST. A escrituração deve estar regularizada antes do pedido de restituição. Apurar o indébito e pleitear restituição ou compensação.',
    prazo: 'Prescrição de 5 anos contados do pagamento indevido (art. 168, I do CTN c/c LC 118/2005).',
    responsavel: 'Fiscal / Contabilidade',
  },

  MONOFASICO_CST_INCORRETO: {
    codigo: 'MONOFASICO_CST_INCORRETO',
    titulo: 'Monofásico tributado com CST de PIS/COFINS incorreto',
    severidade: 'critico',
    causaRaiz:
      'CST de PIS/COFINS parametrizado como tributação integral (01) para produto cuja tributação se encerra na etapa anterior.',
    baseLegal:
      'Lei 10.147/2000, art. 2º; Lei 10.485/2002; Lei 13.097/2015. Tabela 4.3.3 do Guia Prático da EFD Contribuições: CST 04 identifica operação tributável monofásica com alíquota zero na revenda. A classificação decorre do NCM constante da TIPI.',
    risco:
      'Pagamento indevido de PIS/COFINS integral. Divergência entre a NF-e e a EFD Contribuições.',
    acao:
      'Ajustar o CST para 04 no cadastro. Retificar a EFD Contribuições e a DCTF dos períodos afetados. Apurar o indébito e pleitear a restituição via PER/DCOMP.',
    prazo: 'Prescrição de 5 anos. Retificação da EFD Contribuições conforme IN vigente.',
    responsavel: 'Fiscal / Contabilidade',
  },

  ST_CST_INCORRETO: {
    codigo: 'ST_CST_INCORRETO',
    titulo: 'Produto com ST tributado integralmente de ICMS',
    severidade: 'alto',
    causaRaiz:
      'CST de ICMS parametrizado como 00 (tributação integral) para item cujo imposto já foi retido por substituição tributária.',
    baseLegal:
      'Convênio ICMS 142/2018 (normas gerais da substituição tributária e disciplina do CEST). Tabela B do Convênio S/Nº de 1970: CST 60 identifica mercadoria cujo ICMS foi cobrado anteriormente por substituição tributária.',
    risco:
      'Recolhimento em duplicidade de ICMS e inconsistência na EFD ICMS/IPI.',
    acao:
      'Corrigir o CST para 60 no cadastro. Reapurar o ICMS do período e retificar a EFD. Avaliar pedido de restituição do valor pago a maior.',
    prazo: 'Retificação da EFD e prescrição de 5 anos para o indébito.',
    responsavel: 'Fiscal',
  },

  MEI_LIMITE_NOTA: {
    codigo: 'MEI_LIMITE_NOTA',
    titulo: 'Nota isolada acima do limite proporcional do MEI',
    severidade: 'medio',
    causaRaiz:
      'Emissão de nota de valor elevado sem controle do teto de faturamento do MEI.',
    baseLegal:
      'LC 123/2006, art. 18-A, §1º e Resolução CGSN 140/2018 — limite anual de R$ 81.000,00 para o MEI.',
    risco:
      'Indício de ultrapassagem do limite. Se confirmado no acumulado, gera desenquadramento.',
    acao:
      'Monitorar o faturamento acumulado do ano. Se a projeção ultrapassar o teto, planejar a migração para Microempresa antes do desenquadramento compulsório.',
    prazo: 'Acompanhamento mensal.',
    responsavel: 'Contabilidade',
  },

  MEI_LIMITE_LOTE: {
    codigo: 'MEI_LIMITE_LOTE',
    titulo: 'Faturamento do período acima do limite do MEI',
    severidade: 'critico',
    causaRaiz:
      'Crescimento do faturamento sem revisão do enquadramento tributário.',
    baseLegal:
      'LC 123/2006, art. 18-A e Resolução CGSN 140/2018, arts. 115 a 117 (desenquadramento).',
    risco:
      'Desenquadramento retroativo do MEI, com recolhimento dos tributos como ME desde o início do ano ou do mês seguinte à ultrapassagem, conforme o percentual excedido.',
    acao:
      'Comunicar o desenquadramento no Portal do Simples Nacional e apurar a diferença de tributos devida. Revisar o planejamento tributário para o novo enquadramento.',
    prazo:
      'Comunicação até o último dia útil do mês subsequente à ultrapassagem.',
    responsavel: 'Contabilidade',
  },

  REFORMA_CST_AUSENTE: {
    codigo: 'REFORMA_CST_AUSENTE',
    titulo: 'Campos de IBS/CBS ausentes ou incompletos na NF-e',
    severidade: 'alto',
    causaRaiz:
      'Emissor não atualizado para o leiaute da Nota Técnica 2025.002, que incluiu os grupos de IBS, CBS e Imposto Seletivo, além dos campos CST e cClassTrib, no XML da NF-e.',
    baseLegal:
      'LC 214/2025 (institui IBS, CBS e IS, regulamentando a EC 132/2023) e Nota Técnica 2025.002 da NF-e, que definiu os campos obrigatórios do novo modelo. Regulamentos da CBS e do IBS publicados em abril de 2026.',
    risco:
      'Rejeição da NF-e a partir da obrigatoriedade plena dos campos. Em 2026 o período é de adaptação, mas a partir de 2027 a CBS entra em vigor integral e a ausência dos grupos impede a apuração e o aproveitamento de créditos.',
    acao:
      'Atualizar o emissor de NF-e para o leiaute da NT 2025.002. Revisar o cadastro de produtos e serviços atribuindo CST e cClassTrib corretos. Validar as notas em ambiente de homologação antes da obrigatoriedade.',
    prazo:
      '2026 é ano de adaptação (alíquotas-teste de CBS 0,9% e IBS 0,1%, arts. 343 e 346 da LC 214/2025, compensáveis com PIS/COFINS). A CBS entra em vigor integral em 2027.',
    responsavel: 'TI / Fiscal',
  },

  REFORMA_SIMPLES_TRANSICAO: {
    codigo: 'REFORMA_SIMPLES_TRANSICAO',
    titulo: 'Optante pelo Simples Nacional — avaliar impacto da transição',
    severidade: 'medio',
    causaRaiz:
      'A empresa permanece no Simples Nacional sem simulação comparativa frente ao novo modelo de IBS/CBS. Optantes pelo Simples ingressam no novo sistema apenas em 2027.',
    baseLegal:
      'LC 214/2025 e EC 132/2023. Regime específico do Simples Nacional na transição, com direito de opção pelo regime regular de IBS/CBS.',
    risco:
      'Perda de competitividade: no Simples Nacional o adquirente aproveita crédito limitado de IBS/CBS. Em cadeias B2B, isso pode tornar a empresa menos atrativa que concorrentes do regime regular.',
    acao:
      'Simular a carga tributária nos dois cenários (permanência no Simples versus opção pelo regime regular de IBS/CBS) considerando o perfil de clientes. Revisar a política comercial e o posicionamento de preço antes de 2027.',
    prazo:
      'Decisão a ser tomada até o final de 2026, antes da entrada da CBS em vigor integral em 2027.',
    responsavel: 'Contabilidade / Direção',
  },

  OUTRO: {
    codigo: 'OUTRO',
    titulo: 'Divergência fiscal identificada',
    severidade: 'medio',
    causaRaiz: 'Inconsistência detectada pelo motor de auditoria. Requer análise individual.',
    baseLegal: 'A definir conforme a natureza da divergência.',
    risco: 'A avaliar caso a caso.',
    acao: 'Analisar a ocorrência e definir o tratamento aplicável.',
    prazo: 'A definir.',
    responsavel: 'Fiscal',
  },
};

/* ---------------------------------------------------------------------
   CLASSIFICADOR
   Converte a mensagem de erro em texto livre num código de regra.
   --------------------------------------------------------------------- */
export function classificarErro(mensagem: string): string {
  const m = mensagem.toLowerCase();

  if (m.includes('ncm') && m.includes('inválido')) return 'NCM_INVALIDO';
  if (m.includes('cfop') && m.includes('operações internas')) return 'CFOP_INTERNO_EM_INTERESTADUAL';
  if (m.includes('cfop') && m.includes('interestadual, mas')) return 'CFOP_INTERESTADUAL_EM_INTERNO';
  if (m.includes('monofásico') && m.includes('csosn')) return 'MONOFASICO_SIMPLES_CSOSN';
  if (m.includes('substituição tributária') && m.includes('csosn')) return 'ST_SIMPLES_CSOSN';
  if (m.includes('monofásico') && m.includes('cst')) return 'MONOFASICO_CST_INCORRETO';
  if (m.includes('substituição tributária') && m.includes('cst')) return 'ST_CST_INCORRETO';
  if (m.includes('nota única') && m.includes('mei')) return 'MEI_LIMITE_NOTA';
  if (m.includes('faturamento total do lote')) return 'MEI_LIMITE_LOTE';

  return 'OUTRO';
}

/* ---------------------------------------------------------------------
   ESTRUTURAS DE SAÍDA
   --------------------------------------------------------------------- */
export interface AchadoDetalhado {
  numeroNota: string;
  dataNota: string;
  emitente: string;
  destinatario: string;
  valorNota: number;
  ncm: string;
  cfop: string;
  cstIcms: string;
  mensagem: string;
  codigoRegra: string;
  creditoNota: number;
}

export interface GrupoAchados {
  regra: CatalogoRegra;
  ocorrencias: number;
  notasAfetadas: string[];
  valorEnvolvido: number;
  creditoEstimado: number;
  exemplos: AchadoDetalhado[];
}

export interface AcaoPlano {
  ordem: number;
  titulo: string;
  severidade: Severidade;
  ocorrencias: number;
  impacto: number;
  acao: string;
  prazo: string;
  responsavel: string;
  baseLegal: string;
}

export interface AnaliseRelatorio {
  totalNotas: number;
  notasComErro: number;
  notasConformes: number;
  percentualConformidade: number;
  totalOcorrencias: number;
  valorTotalLote: number;
  valorEmNotasComErro: number;
  creditoRecuperavel: number;
  impostoEstimado: number;
  grupos: GrupoAchados[];
  planoAcao: AcaoPlano[];
  achados: AchadoDetalhado[];
  contagemPorSeveridade: Record<Severidade, number>;
}

const PESO_SEVERIDADE: Record<Severidade, number> = {
  critico: 4,
  alto: 3,
  medio: 2,
  baixo: 1,
};

/* ---------------------------------------------------------------------
   ANÁLISE PRINCIPAL
   --------------------------------------------------------------------- */
export function analisarLote(batch: FiscalBatch): AnaliseRelatorio {
  const invoices: TaxInvoice[] = batch.invoices || [];
  const achados: AchadoDetalhado[] = [];
  const mapaGrupos = new Map<string, GrupoAchados>();

  let valorEmNotasComErro = 0;
  let notasComErro = 0;

  invoices.forEach((inv) => {
    const erros = inv.errors || [];
    if (erros.length > 0) {
      notasComErro += 1;
      valorEmNotasComErro += inv.value || 0;
    }

    erros.forEach((mensagem) => {
      const codigo = classificarErro(mensagem);
      const regra = CATALOGO_REGRAS[codigo] || CATALOGO_REGRAS.OUTRO;

      const achado: AchadoDetalhado = {
        numeroNota: inv.number,
        dataNota: inv.date,
        emitente: inv.issuerName,
        destinatario: inv.recipientName,
        valorNota: inv.value || 0,
        ncm: inv.ncm,
        cfop: inv.cfop,
        cstIcms: inv.icmsCst,
        mensagem,
        codigoRegra: codigo,
        creditoNota: inv.credits || 0,
      };
      achados.push(achado);

      const grupo = mapaGrupos.get(codigo);
      if (grupo) {
        grupo.ocorrencias += 1;
        if (!grupo.notasAfetadas.includes(inv.number)) {
          grupo.notasAfetadas.push(inv.number);
          grupo.valorEnvolvido += inv.value || 0;
        }
        if (grupo.exemplos.length < 5) grupo.exemplos.push(achado);
      } else {
        mapaGrupos.set(codigo, {
          regra,
          ocorrencias: 1,
          notasAfetadas: [inv.number],
          valorEnvolvido: inv.value || 0,
          creditoEstimado: 0,
          exemplos: [achado],
        });
      }
    });
  });

  // Crédito por grupo: rateia o crédito da nota entre as regras que geram crédito
  const REGRAS_COM_CREDITO = [
    'MONOFASICO_SIMPLES_CSOSN',
    'ST_SIMPLES_CSOSN',
    'MONOFASICO_CST_INCORRETO',
    'ST_CST_INCORRETO',
  ];

  invoices.forEach((inv) => {
    const credito = inv.credits || 0;
    if (credito <= 0) return;

    const codigosDaNota = (inv.errors || [])
      .map(classificarErro)
      .filter((c) => REGRAS_COM_CREDITO.includes(c));

    if (codigosDaNota.length === 0) return;

    const fatia = credito / codigosDaNota.length;
    codigosDaNota.forEach((codigo) => {
      const grupo = mapaGrupos.get(codigo);
      if (grupo) grupo.creditoEstimado += fatia;
    });
  });

  const grupos = Array.from(mapaGrupos.values()).sort((a, b) => {
    const pesoA = PESO_SEVERIDADE[a.regra.severidade];
    const pesoB = PESO_SEVERIDADE[b.regra.severidade];
    if (pesoA !== pesoB) return pesoB - pesoA;
    return b.ocorrencias - a.ocorrencias;
  });

  const planoAcao: AcaoPlano[] = grupos.map((g, i) => ({
    ordem: i + 1,
    titulo: g.regra.titulo,
    severidade: g.regra.severidade,
    ocorrencias: g.ocorrencias,
    impacto: g.creditoEstimado,
    acao: g.regra.acao,
    prazo: g.regra.prazo,
    responsavel: g.regra.responsavel,
    baseLegal: g.regra.baseLegal,
  }));

  const contagemPorSeveridade: Record<Severidade, number> = {
    critico: 0,
    alto: 0,
    medio: 0,
    baixo: 0,
  };
  grupos.forEach((g) => {
    contagemPorSeveridade[g.regra.severidade] += g.ocorrencias;
  });

  const totalNotas = invoices.length;
  const notasConformes = totalNotas - notasComErro;

  return {
    totalNotas,
    notasComErro,
    notasConformes,
    percentualConformidade:
      totalNotas > 0 ? Number(((notasConformes / totalNotas) * 100).toFixed(1)) : 100,
    totalOcorrencias: achados.length,
    valorTotalLote: batch.totalValue || 0,
    valorEmNotasComErro,
    creditoRecuperavel: batch.taxCredits || 0,
    impostoEstimado: batch.estimatedTax || 0,
    grupos,
    planoAcao,
    achados,
    contagemPorSeveridade,
  };
}

/* ---------------------------------------------------------------------
   UTILITÁRIOS DE APRESENTAÇÃO
   --------------------------------------------------------------------- */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function rotuloSeveridade(s: Severidade): string {
  const mapa: Record<Severidade, string> = {
    critico: 'Crítico',
    alto: 'Alto',
    medio: 'Médio',
    baixo: 'Baixo',
  };
  return mapa[s];
}

/**
 * Texto do sumário executivo, gerado a partir dos números reais do lote.
 * Não depende de IA.
 */
export function montarSumarioExecutivo(
  a: AnaliseRelatorio,
  nomeCliente: string,
  regime: string
): string {
  const partes: string[] = [];

  partes.push(
    `Foram auditados ${a.totalNotas} documentos fiscais do contribuinte ${nomeCliente}, ` +
      `enquadrado no regime ${regime}, totalizando R$ ${formatarMoeda(a.valorTotalLote)} em operações.`
  );

  if (a.notasComErro === 0) {
    partes.push(
      'Não foram identificadas divergências de classificação fiscal nos documentos analisados. ' +
        'O lote apresenta conformidade integral frente às regras verificadas.'
    );
    return partes.join(' ');
  }

  partes.push(
    `Identificamos ${a.totalOcorrencias} ocorrência(s) distribuída(s) em ${a.notasComErro} ` +
      `documento(s), o que representa um índice de conformidade de ${a.percentualConformidade}%. ` +
      `O valor envolvido nas notas com divergência soma R$ ${formatarMoeda(a.valorEmNotasComErro)}.`
  );

  if (a.contagemPorSeveridade.critico > 0) {
    partes.push(
      `Há ${a.contagemPorSeveridade.critico} ocorrência(s) classificada(s) como CRÍTICA(S), ` +
        'que demandam tratamento prioritário por representarem risco direto de autuação ou perda financeira.'
    );
  }

  if (a.creditoRecuperavel > 0) {
    partes.push(
      `Foi mapeado um potencial de recuperação de R$ ${formatarMoeda(a.creditoRecuperavel)} ` +
        'referente a tributos recolhidos em duplicidade, passível de restituição ou compensação ' +
        'observado o prazo prescricional de 5 anos.'
    );
  }

  const primeira = a.planoAcao[0];
  if (primeira) {
    partes.push(
      `A ação de maior prioridade é o tratamento da ocorrência "${primeira.titulo}" ` +
        `(${primeira.ocorrencias} incidência(s)), sob responsabilidade da área ${primeira.responsavel}.`
    );
  }

  return partes.join(' ');
}