export type TaxRegime = 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'MEI';

export interface TaxClient {
  id: string;
  name: string;
  cnpj: string;
  regime: TaxRegime;
  state: string; // SP, RJ, MG, etc. (importante para CFOP)
  city: string;
  activity: string; // Comércio, Indústria, Serviços
  createdAt: string;
}

export interface InvoiceProduct {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  cfop: string;
  ncm: string;
  icmsCst: string; // ex: 102, 500 para Simples; 00, 40, 60 para Presumido/Real
  pisCst: string;
  cofinsCst: string;
}

export interface TaxInvoice {
  id: string;
  number: string;
  date: string;
  issuerName: string;
  issuerCnpj: string;
  recipientName: string;
  recipientCnpj: string;
  value: number;
  cfop: string;
  ncm: string;
  icmsCst: string;
  pisCst: string;
  cofinsCst: string;
  calculatedTax: number;
  errors: string[];
  credits: number;
  taxRegime: TaxRegime;
  products?: InvoiceProduct[];
  reform2027?: {
    cbsValue: number;
    ibsValue: number;
    isApplied: boolean;
    isValue: number;
    cashbackValue: number;
    netTax: number;seletivoValue: number;
    ibsRate: number;
    cbsRate: number;
  };
}

export interface AuditSummary {
  totalInvoices: number;
  totalValue: number;
  estimatedTax: number;
  errorsCount: number;
  taxCredits: number;
}

export interface AIAnalysisResult {
  visaoGeral: string;
  diagnosticoIncoerencias: string;
  oportunidadesCredito: string;
  planejamentoTributario: string;
  conclusaoAssinatura: string;
}

export interface FiscalBatch {
  id: string;
  clientId: string;
  clientName: string;
  clientRegime: TaxRegime;
  date: string;
  totalInvoices: number;
  totalValue: number;
  estimatedTax: number;
  errorsCount: number;
  taxCredits: number;
  invoices: TaxInvoice[];
  aiAnalysis?: AIAnalysisResult;
  status: 'Processado' | 'Analisado com IA' | 'Pendente';
  reform2027Summary?: {
    totalCbs: number;
    totalIbs: number;
    totalIs: number;
    totalCashback: number;
    netTax: number;
    savingsVsCurrent: number;
  };
}

export interface TaxRuleConfig {
  id: string;
  name: string;
  regime: TaxRegime;
  cfop: string;
  ncmPrefix: string;
  expectedCst: string;
  pisRate: number; // decimal (ex: 0.0165 para 1.65%)
  cofinsRate: number; // decimal (ex: 0.076 para 7.6%)
  icmsRate: number; // decimal
  hasSt: boolean; // Substituição Tributária
  description: string;
}
