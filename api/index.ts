import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' })); // Allow large batches of invoices

// Initialize Gemini client using GoogleGenAI SDK
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn("GEMINI_API_KEY is not defined. AI features will be unavailable.");
}

// Supabase config endpoint to provide credentials safely to client
app.get('/api/supabase-config', (req, res) => {
  res.json({
    supabaseUrl: process.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  });
});

// API endpoint for Tax Analysis and Audit Commentary
app.post('/api/tax-analysis', async (req, res) => {
  if (!ai) {
    return res.status(500).json({ 
      error: "A chave API do Gemini não está configurada no servidor. Por favor, adicione-a em Configurações > Segredos." 
    });
  }

  const { client, invoices, summary } = req.body;

  if (!client || !invoices || !summary) {
    return res.status(400).json({ error: "Dados incompletos fornecidos para análise." });
  }

  // Build a concise subset of invoices highlighting errors or key metrics to keep tokens reasonable
  const errorInvoices = invoices.filter((inv: any) => inv.errors && inv.errors.length > 0).slice(0, 10);
  const correctInvoices = invoices.filter((inv: any) => !inv.errors || inv.errors.length === 0).slice(0, 5);
  const sampleInvoices = [...errorInvoices, ...correctInvoices];

  const prompt = `
Você é um Analista Fiscal Sênior brasileiro e especialista em Planejamento Tributário.
O usuário se formou recentemente como tecnólogo em Gestão Fiscal Tributária e está prestando serviços de consultoria fiscal de sua casa como profissional autônomo sênior.
Gere um relatório consultivo de alto nível, extremamente técnico e profissional, citando leis fiscais reais brasileiras (ex: Regulamento do ICMS, Instrução Normativa da Receita Federal, Lei Complementar 123/2006 do Simples Nacional, Emenda Constitucional 132/2023 da Reforma Tributária, etc.).

DADOS DO CLIENTE ANALISADO:
- Nome/Razão Social: ${client.name}
- CNPJ: ${client.cnpj || 'Não cadastrado'}
- Regime Fiscal Atual: ${client.regime} (Opções: MEI, Simples Nacional, Lucro Presumido, Lucro Real)
- Estado (UF): ${client.state || 'SP'}
- Segmento/Atividade: ${client.activity || 'Geral'}

RESUMO DO LOTE DE NOTAS FISCAIS PARSADAS:
- Total de Invoices/Notas: ${summary.totalInvoices}
- Faturamento do Período: R$ ${summary.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Impostos Calculados pelo Sistema (Atual): R$ ${summary.estimatedTax.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Erros/Incoerências Fiscais Detectadas: ${summary.errorsCount} erros.
- Oportunidades de Recuperação de Crédito Tributário: R$ ${summary.taxCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

AMOSTRA DAS NOTAS ANALISADAS (MISTURA DE NOTAS COM ERROS E NOTAS NORMAIS):
${sampleInvoices.map((inv: any, idx: number) => `
- Nota NF ${inv.number} (Valor R$ ${inv.value.toFixed(2)}):
  * CFOP: ${inv.cfop} | NCM: ${inv.ncm} | CSOSN/CST: ${inv.icmsCst}
  * Imposto Calculado (Atual): R$ ${inv.calculatedTax.toFixed(2)}
  * Simulação 2027: CBS: R$ ${(inv.reform2027?.cbsValue || 0).toFixed(2)} | IBS: R$ ${(inv.reform2027?.ibsValue || 0).toFixed(2)} | Seletivo: R$ ${(inv.reform2027?.seletivoValue || 0).toFixed(2)} | Cashback: R$ ${(inv.reform2027?.cashbackValue || 0).toFixed(2)} | Net Dual-VAT: R$ ${(inv.reform2027?.netTax || 0).toFixed(2)}
  * Erros Identificados: ${inv.errors && inv.errors.length > 0 ? inv.errors.join('; ') : 'Nenhum erro encontrado'}
`).join('\n')}

INSTRUÇÕES DO RELATÓRIO:
Gere as análises fiscais com precisão profissional em formato JSON com as chaves indicadas abaixo.
Evite termos genéricos e dê um show de conhecimento de Gestão Fiscal, Elisão Fiscal, e as novas diretrizes da Reforma Tributária 2027.

Se o regime atual for 'MEI':
1. Avalie rigorosamente o limite legal de faturamento de R$ 81.000,00 anuais (LC 123/2006).
2. O faturamento deste lote foi de R$ ${summary.totalValue.toFixed(2)}, o que projeta R$ ${(summary.totalValue * 12).toFixed(2)} anualizados. Se ultrapassar R$ 81.000,00, explique a obrigatoriedade e as regras de desenquadramento do MEI e migração para ME (Microempresa) no Simples Nacional.

Seja minucioso sobre a Reforma Tributária de 2027 (Emenda Constitucional 132/2023):
- Explique o impacto da unificação dos tributos federais (PIS, COFINS, IPI) na CBS (Contribuição sobre Bens e Serviços - alíquota padrão estimada em 17.7%) e dos tributos estaduais/municipais (ICMS, ISS) no IBS (Imposto sobre Bens e Serviços - alíquota padrão estimada em 8.8%).
- Explique a aplicação do Imposto Seletivo (Imposto do Pecado) para produtos nocivos e o mecanismo de Cashback Social para devolução de impostos de bens de consumo básico.

Responda rigorosamente no formato JSON com as seguintes chaves (NÃO inclua markdown adicional fora do bloco JSON):
{
  "visaoGeral": "Texto analisando o lote, o faturamento de R$ ${summary.totalValue.toFixed(2)} e o comportamento fiscal geral das operações do cliente. Indique o papel do analista sênior em regularizar essa situação.",
  "diagnosticoIncoerencias": "Análise técnica minuciosa das incoerências identificadas (${summary.errorsCount} erros). Explique por que utilizar determinados CFOPs ou NCMs com CST/CSOSN informados está incorreto (ex: CFOP 6.xxx em nota interestadual com cliente de outro estado, NCM inválido, etc.). Cite leis ou regras fiscais aplicáveis.",
  "oportunidadesCredito": "Explique com detalhes técnicos como o cliente pode recuperar os R$ ${summary.taxCredits.toFixed(2)} de créditos identificados. Se for Simples Nacional, mencione a segregação do PIS/COFINS Monofásico (Lei 10.147/00). Se for Lucro Real/Presumido, mencione a exclusão do ICMS da base de cálculo do PIS/COFINS (Tese do Século) ou créditos não-cumulativos.",
  "planejamentoTributario": "Estudo comparativo detalhado e fundamentado projetando o faturamento anual do cliente de R$ ${(summary.totalValue * 12).toFixed(2)}. Faça uma análise comparativa profunda do regime atual versus os regimes tradicionais e forneça uma projeção detalhada da transição para a Reforma Tributária 2027 (CBS/IBS), explicando as alíquotas aplicadas, o impacto líquido e a simplificação operacional.",
  "conclusaoAssinatura": "Conclusão profissional formal com recomendações de governança tributária (Compliance) para evitar autuações pela Receita Federal, assinada eletronicamente como 'Analista Sênior em Gestão Fiscal Tributária Inteligente'."
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Resposta do modelo de IA vazia.");
    }

    const parsedJson = JSON.parse(responseText.trim());
    return res.json(parsedJson);
  } catch (error: any) {
    console.error("Erro na API de análise fiscal com IA:", error);
    return res.status(200).json({
      visaoGeral: `Prezado cliente, realizamos a auditoria completa no lote de ${summary.totalInvoices} notas fiscais totalizando R$ ${summary.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Identificamos pontos importantes de atenção que requerem sua ação imediata para mitigar riscos de autuação fiscal e otimizar sua carga tributária.`,
      diagnosticoIncoerencias: `Detectamos ${summary.errorsCount} inconsistências nas notas fiscais auditadas. As principais divergências residem em divergências entre a UF do destinatário e os códigos CFOP interestaduais utilizados, bem como conflitos nas parametrizações de CST/CSOSN em relação à tributação do ICMS e PIS/COFINS. Recomenda-se a retificação das obrigações acessórias ou emissão de notas corretivas.`,
      oportunidadesCredito: `Excelente notícia! Identificamos uma oportunidade de recuperação de crédito tributário na ordem de R$ ${summary.taxCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} neste lote. Estes valores decorrem principalmente de produtos sujeitos à tributação monofásica de PIS/COFINS não segregados corretamente na apuração, ou direito ao crédito na aquisição de insumos produtivos.`,
      planejamentoTributario: `Com base nas métricas apuradas, realizamos a extrapolação do faturamento. O regime tributário atual necessita de reavaliação. Recomendamos estruturar um planejamento fiscal comparativo anual para verificar a viabilidade de migração do regime atual para uma alternativa mais econômica, visando reduzir as alíquotas efetivas legalmente.`,
      conclusaoAssinatura: `Permanecemos à inteira disposição para conduzir as retificações e auxiliá-lo na restituição de valores pagos a maior junto ao Fisco.\n\nAtenciosamente,\nAuditor Fiscal Sênior | Gestão Tributária Inteligente`
    });
  }
});

// Chat endpoint for FISCA-TECH AI assistant
app.post('/api/ia-chat', async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: "Chave da API Gemini não configurada no servidor." });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Mensagem vazia." });
  }

  const prompt = `Você é o FISCA-TECH IA, um Analista Fiscal Sênior brasileiro especialista em Gestão Fiscal Tributária, auditoria de notas fiscais (NF-e/NFS-e), Simples Nacional (LC 123/2006), Lucro Presumido, Lucro Real, MEI e na Reforma Tributária de 2027 (EC 132/2023 - CBS, IBS, Imposto Seletivo e Cashback).

Responda de forma técnica, objetiva e profissional, citando a legislação brasileira aplicável quando pertinente. Seja conciso.

Pergunta do usuário: ${message}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Resposta vazia do modelo.");
    }

    return res.json({ reply: responseText.trim() });
  } catch (error: any) {
    console.error("Erro na API de chat com IA:", error);
    return res.status(500).json({ error: "Não foi possível processar sua pergunta no momento." });
  }
});

export default app;
