import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  Users,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Printer,
  Brain,
  Trash2,
  Plus,
  Edit,
  Settings,
  Database,
  Play,
  Cpu,
  Layers,
  Settings2,
  Download,
  Check,
  BookOpen,
  Briefcase,
  ArrowRight,
  ChevronRight,
  Coins,
  FileCode,
  Sparkles,
  Search,
  Filter,
  X,
  FileSpreadsheet,
  Info,
  Smartphone,
  Send,
  Mail,
  Copy,
  ExternalLink,
  Share2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TaxClient, TaxInvoice, FiscalBatch, AIAnalysisResult, TaxRegime } from './types';
import { INITIAL_CLIENTS, CFOP_DATABASE, MONOFASICOS_NCM_PREFIXES, ST_NCM_PREFIXES, SAMPLE_XML_FILES, auditInvoices, runLocalTestSuite, calculateSimplesNacionalLocal, calculateMeiLocal, calculateLucroPresumidoLocal, calculateLucroRealLocal, calculateDifalLocal, calculateIcmsStLocal, calculateFederalRetentionLocal, calculateInssRetentionLocal, validateIssRateLocal } from './data';
import * as XLSX from 'xlsx';
import { initSupabase, dbFetchClients, dbFetchBatches, dbSaveClient, dbDeleteClient, dbSaveBatch, dbDeleteBatch } from './lib/supabaseClient';
import DashboardView from './components/DashboardView';

export default function App() {
  // --- STATE ---
  const [clients, setClients] = useState<TaxClient[]>([]);
  const [batches, setBatches] = useState<FiscalBatch[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'batches' | 'new-audit' | 'report' | 'rules' | 'celular' | 'database'>('dashboard');
  
  // Selection States
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  
  // UI States
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'errors' | 'credits'>('all');
  const [auditViewMode, setAuditViewMode] = useState<'current' | 'reform'>('current');
  const [showSchemaSql, setShowSchemaSql] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Database Tab States
  const [dbCalcSubTab, setDbCalcSubTab] = useState<'simples' | 'mei' | 'presumido' | 'real' | 'difal_st' | 'retencoes'>('simples');
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [runningTests, setRunningTests] = useState(false);
  const [dbSearchTerm, setDbSearchTerm] = useState('');
  
  // Calculator Form States
  const [simplesForm, setSimplesForm] = useState({ revenue12m: 240000, value: 10000, anexo: 'III', salary12m: 70000 });
  const [meiForm, setMeiForm] = useState({ revenueMonth: 6000, revenueYear: 45000, activity: 'comercio_e_servico', openingDate: '2026-01-01', competence: '2026-07-01' });
  const [presumidoForm, setPresumidoForm] = useState({ revenueMonth: 85000, activity: 'servico_geral', isProduct: false, stateOrig: 'SP', stateDest: 'MG', issRate: 5.0 });
  const [realForm, setRealForm] = useState({ profitContabil: 150000, revenue: 800000, additions: 20000, exclusions: 15000, previousLosses: 80000, pisCredit: 5000, cofinsCredit: 23000, months: 3 });
  const [difalStForm, setDifalStForm] = useState({ value: 5000, stateOrig: 'SP', stateDest: 'RJ', isFinalConsumer: true, useDoubleBase: true, ncm: '87088000', cest: '01.010.00', icmsProprio: 600, ipi: 200, freight: 100, expenses: 50 });
  const [retencoesForm, setRetencoesForm] = useState({ value: 12500, isSimples: false, hasCsrf: true, hasIrrf15: true, isMei: false, materialDeduction: 1500, isAnexoIv: false });

  // New Client Form
  const [newClient, setNewClient] = useState({
    name: '',
    cnpj: '',
    regime: 'Simples Nacional' as TaxRegime,
    state: 'SP',
    city: '',
    activity: 'Comércio Varejista'
  });

  // Invoice Editing Form (For manual tax correction)
  const [editInvoiceForm, setEditInvoiceForm] = useState<Partial<TaxInvoice> | null>(null);

  // File Upload Drag Status
  const [dragActive, setDragActive] = useState(false);

  // --- PWA INSTALLATION SYSTEM ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Detect if app is already running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsAppInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsAppInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  // --- INITIAL LOAD & LOCAL PERSISTENCE ---
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'active' | 'missing_creds' | 'schema_error'>('missing_creds');
  const [supabaseErrorMsg, setSupabaseErrorMsg] = useState<string | null>(null);

  // Carregar dados fictícios/exemplos para testes rápidos e demonstrações
  const handleLoadMockData = async () => {
    const mockClients: TaxClient[] = [
      {
        id: 'cli-1',
        name: 'Mercado Silva & Alimentos Ltda',
        cnpj: '12.345.678/0001-90',
        regime: 'Simples Nacional',
        state: 'SP',
        city: 'São Paulo',
        activity: 'Comércio Varejista',
        createdAt: '2026-01-15T08:00:00Z',
      },
      {
        id: 'cli-2',
        name: 'AutoPeças Federal Distribuidora Ltda',
        cnpj: '45.678.901/0001-12',
        regime: 'Lucro Presumido',
        state: 'MG',
        city: 'Belo Horizonte',
        activity: 'Comércio de Peças e Acessórios',
        createdAt: '2026-03-22T09:30:00Z',
      },
      {
        id: 'cli-3',
        name: 'Tech Soluções em Sistemas S.A.',
        cnpj: '78.912.345/0001-34',
        regime: 'Lucro Real',
        state: 'RJ',
        city: 'Rio de Janeiro',
        activity: 'Serviços de Tecnologia e Nuvem',
        createdAt: '2026-05-10T14:20:00Z',
      },
      {
        id: 'cli-4',
        name: 'Cledison Microempreendimento Digital',
        cnpj: '99.888.777/0001-66',
        regime: 'MEI',
        state: 'SP',
        city: 'Campinas',
        activity: 'Prestador de Serviços e Suporte',
        createdAt: '2026-06-01T10:00:00Z',
      }
    ];

    const mockBatches = getSampleBatches();

    setClients(mockClients);
    setBatches(mockBatches);
    localStorage.setItem('erp_clients', JSON.stringify(mockClients));
    localStorage.setItem('erp_batches', JSON.stringify(mockBatches));
    alert("Dados de demonstração carregados localmente com sucesso!");
  };

  // Limpar todos os dados locais para iniciar o trabalho real
  const handleResetToProduction = async () => {
    const confirmReset = window.confirm("Tem certeza de que deseja limpar TODOS os clientes e lotes para iniciar seu trabalho real do zero?");
    if (!confirmReset) return;

    setClients([]);
    setBatches([]);
    localStorage.setItem('erp_clients', '[]');
    localStorage.setItem('erp_batches', '[]');
    setSelectedClientId('');
    setSelectedBatchId('');

    alert("Todos os dados de demonstração foram excluídos. O sistema está 100% limpo e pronto para seu uso real!");
  };

  useEffect(() => {
    async function loadData() {
      setSupabaseStatus('checking');
      try {
        const client = await initSupabase();
        if (client) {
          // Check table health
          const { error } = await client.from('clients').select('count', { count: 'exact', head: true });
          if (error) {
            console.warn("Supabase active but schema not created/accessible yet:", error);
            setSupabaseStatus('schema_error');
            setSupabaseErrorMsg(error.message);
            loadFromLocalStorage();
          } else {
            setSupabaseStatus('active');
            const fetchedClients = await dbFetchClients();
            if (fetchedClients && fetchedClients.length > 0) {
              setClients(fetchedClients);
              localStorage.setItem('erp_clients', JSON.stringify(fetchedClients));
            } else {
              loadFromLocalStorage();
            }

            const fetchedBatches = await dbFetchBatches();
            if (fetchedBatches && fetchedBatches.length > 0) {
              setBatches(fetchedBatches);
              localStorage.setItem('erp_batches', JSON.stringify(fetchedBatches));
            }
          }
        } else {
          setSupabaseStatus('missing_creds');
          loadFromLocalStorage();
        }
      } catch (err: any) {
        console.error("Supabase load error:", err);
        setSupabaseStatus('schema_error');
        setSupabaseErrorMsg(err.message || String(err));
        loadFromLocalStorage();
      }
    }

    function loadFromLocalStorage() {
      const savedClients = localStorage.getItem('erp_clients');
      let loadedClients: TaxClient[] = [];
      if (savedClients) {
        try {
          loadedClients = JSON.parse(savedClients);
          // If any of the default/mock clients are detected, automatically clear everything for clean work
          if (loadedClients.some(c => ['cli-1', 'cli-2', 'cli-3', 'cli-4'].includes(c.id))) {
            loadedClients = [];
            localStorage.setItem('erp_clients', '[]');
            localStorage.setItem('erp_batches', '[]');
          }
        } catch (e) {
          loadedClients = [];
        }
      }
      setClients(loadedClients);

      const savedBatches = localStorage.getItem('erp_batches');
      let loadedBatches: FiscalBatch[] = [];
      if (savedBatches && loadedClients.length > 0) {
        try {
          loadedBatches = JSON.parse(savedBatches);
        } catch (e) {
          loadedBatches = [];
        }
      } else {
        localStorage.setItem('erp_batches', '[]');
      }
      setBatches(loadedBatches);
    }

    loadData();
  }, []);

  // Save clients and batches helper
  const saveClients = async (newClients: TaxClient[]) => {
    setClients(newClients);
    localStorage.setItem('erp_clients', JSON.stringify(newClients));
    
    if (supabaseStatus === 'active') {
      try {
        for (const client of newClients) {
          await dbSaveClient(client);
        }
      } catch (err) {
        console.error("Erro ao salvar cliente no Supabase:", err);
      }
    }
  };

  const saveBatches = async (newBatches: FiscalBatch[]) => {
    setBatches(newBatches);
    localStorage.setItem('erp_batches', JSON.stringify(newBatches));
    
    if (supabaseStatus === 'active') {
      try {
        for (const batch of newBatches) {
          await dbSaveBatch(batch);
        }
      } catch (err) {
        console.error("Erro ao salvar lote no Supabase:", err);
      }
    }
  };

  // --- PRELOADED SAMPLES GENERATOR ---
  function getSampleBatches(): FiscalBatch[] {
    // Mercado Silva Batch (Simples Nacional)
    const silvaInvoicesRaw: Partial<TaxInvoice>[] = [
      {
        number: '1024',
        date: '2026-07-01',
        issuerName: 'Mercado Silva & Alimentos Ltda',
        issuerCnpj: '12.345.678/0001-90',
        recipientName: 'Supermercado Centro-Oeste Ltda',
        recipientCnpj: '99.888.777/0001-66',
        value: 3675.00,
        cfop: '5102',
        ncm: '10063011', // Arroz (Normal)
        icmsCst: '102',
        pisCst: '99',
        cofinsCst: '99'
      },
      {
        number: '1025',
        date: '2026-07-02',
        issuerName: 'Mercado Silva & Alimentos Ltda',
        issuerCnpj: '12.345.678/0001-90',
        recipientName: 'Panificadora Horizonte S/A',
        recipientCnpj: '55.444.333/0001-22',
        value: 2250.00,
        cfop: '5102', // ERRO: Destinatário é de MG, deveria ser CFOP 6102
        ncm: '11010010', // Farinha de trigo
        icmsCst: '102',
        pisCst: '99',
        cofinsCst: '99'
      },
      {
        number: '1026',
        date: '2026-07-03',
        issuerName: 'Mercado Silva & Alimentos Ltda',
        issuerCnpj: '12.345.678/0001-90',
        recipientName: 'Comercial Souza Distribuidora',
        recipientCnpj: '11.222.333/0001-55',
        value: 5600.00,
        cfop: '5102', // ERRO: Amortecedor é ST (deveria usar 5405 e CSOSN 500)
        ncm: '87088000', // Amortecedores (ST e Monofásico PIS/COFINS)
        icmsCst: '102', // ERRO: CSOSN 102 paga imposto duplicado. Deveria ser 500!
        pisCst: '01',
        cofinsCst: '01'
      },
      {
        number: '1027',
        date: '2026-07-04',
        issuerName: 'Mercado Silva & Alimentos Ltda',
        issuerCnpj: '12.345.678/0001-90',
        recipientName: 'Mercadinho da Esquina Ltda',
        recipientCnpj: '44.555.666/0001-88',
        value: 1250.00,
        cfop: '5102',
        ncm: '33051000', // Shampoo (Monofásico PIS/COFINS, deveria ser CSOSN 500)
        icmsCst: '102', // ERRO: Pagou PIS/COFINS em duplicidade no Simples Nacional!
        pisCst: '01',
        cofinsCst: '01'
      }
    ];

    const silvaAudited = auditInvoices(silvaInvoicesRaw, 'Simples Nacional', 'SP');
    
    // Calculate summaries
    const silvaSummary = {
      totalInvoices: silvaAudited.length,
      totalValue: silvaAudited.reduce((acc, inv) => acc + inv.value, 0),
      estimatedTax: silvaAudited.reduce((acc, inv) => acc + inv.calculatedTax, 0),
      errorsCount: silvaAudited.reduce((acc, inv) => acc + inv.errors.length, 0),
      taxCredits: silvaAudited.reduce((acc, inv) => acc + inv.credits, 0),
    };

    const silvaAiAnalysis: AIAnalysisResult = {
      visaoGeral: "Prezado Cledison, realizamos uma auditoria fiscal aprofundada no lote do Mercado Silva & Alimentos Ltda referente ao mês atual. Foram processadas 4 notas fiscais de venda que somaram R$ 12.775,00 em faturamento. Identificamos um aproveitamento fiscal subótimo devido à falta de segregação de receitas tributadas pelo regime de Substituição Tributária do ICMS e pela sistemática Monofásica do PIS/COFINS, gerando um recolhimento a maior no DAS.",
      diagnosticoIncoerencias: "Detectamos inconsistências graves na NF 1025, onde foi utilizado o CFOP estadual 5102 para uma venda interestadual destinada ao estado de Minas Gerais (MG), o que contraria as regras de preenchimento da SEFAZ e pode travar cruzamentos de DIFAL. Adicionalmente, nas NFs 1026 e 1027, itens sujeitos à sistemática monofásica de PIS/COFINS (como amortecedores e shampoos) foram faturados com CSOSN 102 (Tributação normal). O correto seria parametrizar o CSOSN como 500, informando ao fisco que o ICMS e as contribuições federais já foram recolhidas na fonte pela indústria.",
      oportunidadesCredito: "A auditoria identificou R$ 135,63 de créditos tributários imediatos recuperáveis nesse pequeno lote. Extrapolando esse erro para os últimos 5 anos de faturamento médio mensal, estimamos que a empresa pagou desnecessariamente cerca de R$ 8.130,00. É plenamente possível retificar as declarações mensais do PGDAS-D e solicitar a restituição em dinheiro via Portal do Simples Nacional, que costuma cair em conta bancária de forma automatizada em até 60 dias.",
      planejamentoTributario: "Projetando o faturamento do Mercado Silva para R$ 153.300,00 anuais, o Simples Nacional (Anexo I) continua sendo o regime mais vantajoso, com uma alíquota efetiva de aproximadamente 4,00% após a segregação das receitas monofásicas. No Lucro Presumido, a carga tributária total subiria para 11,5% de impostos federais mais a alíquota de ICMS do estado, tornando o negócio inviável. Portanto, a recomendação sênior é manter a empresa no Simples Nacional, porém corrigindo imediatamente a parametrização do software emissor de notas fiscais.",
      conclusaoAssinatura: "Em suma, o Mercado Silva possui uma excelente saúde operacional, mas está sofrendo perdas financeiras silenciosas devido à má parametrização tributária. Propomos iniciar imediatamente o processo de saneamento de cadastro de produtos da empresa e retificar o DAS dos meses anteriores para restituir os valores devidos.\n\nAssinado: Equipe de Gestão Fiscal Tributária Inteligente - Analista Fiscal Sênior"
    };

    // AutoPeças Federal Batch (Lucro Presumido)
    const autoInvoicesRaw: Partial<TaxInvoice>[] = [
      {
        number: '8841',
        date: '2026-07-05',
        issuerName: 'AutoPeças Federal Distribuidora Ltda',
        issuerCnpj: '45.678.901/0001-12',
        recipientName: 'Auto Center Rodas de Ouro',
        recipientCnpj: '11.555.222/0001-11',
        value: 12500.00,
        cfop: '5102', // ERRO: Amortecedores em MG possuem ST! CFOP correto é 5405
        ncm: '87088000', // Peças de suspensão (Monofásico e ST)
        icmsCst: '00', // ERRO: Tributou ICMS integral (CST 00). Deveria ser CST 60!
        pisCst: '01', // ERRO: Tributou PIS integralmente. Deveria ser CST 04 (Monofásico)!
        cofinsCst: '01' // ERRO: Tributou COFINS integralmente. Deveria ser CST 04!
      },
      {
        number: '8842',
        date: '2026-07-06',
        issuerName: 'AutoPeças Federal Distribuidora Ltda',
        issuerCnpj: '45.678.901/0001-12',
        recipientName: 'Mecanica Turbão S/A',
        recipientCnpj: '33.444.555/0001-77',
        value: 8900.00,
        cfop: '5405', // OK para ST interno
        ncm: '87082999', // Acessórios de carroceria (ST)
        icmsCst: '60', // OK para ICMS ST recolhido anteriormente
        pisCst: '01', // ERRO: PIS cobrado indevidamente em produto monofásico!
        cofinsCst: '01'
      }
    ];

    const autoAudited = auditInvoices(autoInvoicesRaw, 'Lucro Presumido', 'MG');
    const autoSummary = {
      totalInvoices: autoAudited.length,
      totalValue: autoAudited.reduce((acc, inv) => acc + inv.value, 0),
      estimatedTax: autoAudited.reduce((acc, inv) => acc + inv.calculatedTax, 0),
      errorsCount: autoAudited.reduce((acc, inv) => acc + inv.errors.length, 0),
      taxCredits: autoAudited.reduce((acc, inv) => acc + inv.credits, 0),
    };

    const autoAiAnalysis: AIAnalysisResult = {
      visaoGeral: "Análise sênior realizada no lote de faturamento da AutoPeças Federal Distribuidora Ltda. O lote processado totalizou R$ 21.400,00 de faturamento bruto em duas grandes operações. Foram identificados erros sistêmicos gravíssimos nas parametrizações tributárias das saídas de mercadorias com substituição tributária (ST) e PIS/COFINS monofásicos, aumentando de forma indevida o valor da Guia de ICMS e de PIS/COFINS.",
      diagnosticoIncoerencias: "Na NF 8841, a empresa faturou amortecedores (NCM 8708.80.00) usando CFOP 5102 e ICMS CST 00 (tributação normal). No estado de Minas Gerais, autopeças estão sujeitas ao ICMS ST e o imposto já foi recolhido antecipadamente pela fábrica/distribuidor. O uso incorreto do CST 00 resultou no pagamento de ICMS duplicado no valor de R$ 2.250,00. Além disso, as duas notas (8841 e 8842) faturaram peças com CST de PIS/COFINS 01 (Operação tributada normal), quando o correto por lei seria utilizar o CST 04 (Saída isenta/alíquota zero por monofasia), visto que o tributo é cobrado exclusivamente do fabricante.",
      oportunidadesCredito: "Identificamos uma economia fiscal direta de R$ 781,10 apenas nessas duas notas de amostra, decorrente da exclusão das receitas monofásicas da base de cálculo do PIS/COFINS do Lucro Presumido (alíquota somada de 3,65%) e estorno do ICMS próprio pago indevidamente. Em um faturamento recorrente, esses créditos tributários ultrapassam R$ 20.000,00 anuais e podem ser compensados eletronicamente via PER/DCOMP no site do e-CAC da Receita Federal.",
      planejamentoTributario: "Considerando o perfil de revenda de autopeças onde a maioria dos itens é tributado por ST e Monofásico, o Lucro Presumido pode ser vantajoso se bem parametrizado. No entanto, se as margens de lucro operacional forem muito estreitas (abaixo de 8%), a empresa deveria estudar o Lucro Real para creditar-se das compras de insumos e despesas de logística. Recomendamos rodar um trimestre completo sob as duas óticas após corrigirmos o cadastro de produtos.",
      conclusaoAssinatura: "O compliance tributário é a maior ferramenta de aumento de lucro líquido para distribuidores de autopeças. O primeiro passo urgente é revisar todo o cadastro de NCMs e automatizar as regras para aplicar PIS/COFINS CST 04 e ICMS CST 60 nos produtos corretos.\n\nAssinado: Equipe de Gestão Fiscal Tributária Inteligente - Analista Fiscal Sênior"
    };

    return [
      {
        id: 'bat-1',
        clientId: 'cli-1',
        clientName: 'Mercado Silva & Alimentos Ltda',
        clientRegime: 'Simples Nacional',
        date: '2026-07-05',
        totalInvoices: silvaSummary.totalInvoices,
        totalValue: silvaSummary.totalValue,
        estimatedTax: silvaSummary.estimatedTax,
        errorsCount: silvaSummary.errorsCount,
        taxCredits: silvaSummary.taxCredits,
        invoices: silvaAudited,
        aiAnalysis: silvaAiAnalysis,
        status: 'Analisado com IA'
      },
      {
        id: 'bat-2',
        clientId: 'cli-2',
        clientName: 'AutoPeças Federal Distribuidora Ltda',
        clientRegime: 'Lucro Presumido',
        date: '2026-07-06',
        totalInvoices: autoSummary.totalInvoices,
        totalValue: autoSummary.totalValue,
        estimatedTax: autoSummary.estimatedTax,
        errorsCount: autoSummary.errorsCount,
        taxCredits: autoSummary.taxCredits,
        invoices: autoAudited,
        aiAnalysis: autoAiAnalysis,
        status: 'Analisado com IA'
      }
    ];
  }

  // --- ACTIONS ---

  // Create Client
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name) return;

    const created: TaxClient = {
      id: `cli-${Date.now()}`,
      name: newClient.name,
      cnpj: newClient.cnpj || '00.000.000/0001-00',
      regime: newClient.regime,
      state: newClient.state,
      city: newClient.city || 'Não Informado',
      activity: newClient.activity,
      createdAt: new Date().toISOString()
    };

    saveClients([...clients, created]);
    setIsNewClientOpen(false);
    setNewClient({
      name: '',
      cnpj: '',
      regime: 'Simples Nacional',
      state: 'SP',
      city: '',
      activity: 'Comércio Varejista'
    });
  };

  // Delete Client
  const handleDeleteClient = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este cliente? Todos os lotes associados serão mantidos.')) {
      const updated = clients.filter(c => c.id !== id);
      setClients(updated);
      localStorage.setItem('erp_clients', JSON.stringify(updated));
      
      if (supabaseStatus === 'active') {
        try {
          await dbDeleteClient(id);
        } catch (err) {
          console.error("Erro ao deletar cliente no Supabase:", err);
        }
      }
      
      if (selectedClientId === id) setSelectedClientId('');
    }
  };

  // Drag & Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFilesProcessing(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFilesProcessing(e.target.files);
    }
  };

  // Process uploaded files (Supports XML and XLSX)
  const handleFilesProcessing = async (filesList: FileList) => {
    if (!selectedClientId) {
      alert('Selecione um cliente antes de enviar os arquivos.');
      return;
    }

    setUploading(true);
    const client = clients.find(c => c.id === selectedClientId)!;
    const parsedInvoices: Partial<TaxInvoice>[] = [];

    try {
      for (let i = 0; i < filesList.length; i++) {
        const file = filesList[i];
        
        // Handle XML Files
        if (file.name.endsWith('.xml')) {
          const text = await file.text();
          const parsed = parseXmlInvoiceText(text, file.name);
          if (parsed) {
            parsedInvoices.push(parsed);
          }
        } 
        // Handle XLSX/XLS/Spreadsheet Files
        else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const excelInvoices = await parseExcelInvoiceFile(file);
          parsedInvoices.push(...excelInvoices);
        }
      }

      if (parsedInvoices.length === 0) {
        throw new Error('Nenhum arquivo XML ou Planilha válido pôde ser processado.');
      }

      // Audit parsed invoices with the client's regime and state
      const audited = auditInvoices(parsedInvoices, client.regime, client.state);

      // Create new batch
      const totalValue = audited.reduce((acc, inv) => acc + inv.value, 0);
      const estimatedTax = audited.reduce((acc, inv) => acc + inv.calculatedTax, 0);
      const errorsCount = audited.reduce((acc, inv) => acc + inv.errors.length, 0);
      const taxCredits = audited.reduce((acc, inv) => acc + inv.credits, 0);

      const newBatch: FiscalBatch = {
        id: `bat-${Date.now()}`,
        clientId: client.id,
        clientName: client.name,
        clientRegime: client.regime,
        date: new Date().toISOString().split('T')[0],
        totalInvoices: audited.length,
        totalValue,
        estimatedTax,
        errorsCount,
        taxCredits,
        invoices: audited,
        status: 'Pendente'
      };

      const updatedBatches = [newBatch, ...batches];
      saveBatches(updatedBatches);
      setSelectedBatchId(newBatch.id);
      setActiveTab('batches');
    } catch (err: any) {
      alert(`Erro no processamento dos arquivos: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Helper: Parse XML Invoice
  const parseXmlInvoiceText = (xmlText: string, filename: string): Partial<TaxInvoice> | null => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // Determine if NFe (Product) or NFSe (Service)
      const isNfse = xmlDoc.querySelector('LoteRps') || xmlDoc.querySelector('InfRps') || xmlDoc.querySelector('tc\\:InfRps');

      if (isNfse) {
        const number = xmlDoc.querySelector('Numero')?.textContent || xmlDoc.querySelector('tc\\:Numero')?.textContent || 'S/N';
        const date = (xmlDoc.querySelector('DataEmissao')?.textContent || xmlDoc.querySelector('tc\\:DataEmissao')?.textContent || '').split('T')[0];
        const value = parseFloat(xmlDoc.querySelector('ValorServicos')?.textContent || xmlDoc.querySelector('tc\\:ValorServicos')?.textContent || '0');
        const issuerName = xmlDoc.querySelector('Prestador RazaoSocial')?.textContent || xmlDoc.querySelector('tc\\:Prestador tc\\:RazaoSocial')?.textContent || 'Emissor Serviços';
        const recipientName = xmlDoc.querySelector('Tomador RazaoSocial')?.textContent || xmlDoc.querySelector('tc\\:Tomador tc\\:RazaoSocial')?.textContent || 'Destinatário Serviços';
        const ncm = xmlDoc.querySelector('ItemListaServico')?.textContent || xmlDoc.querySelector('tc\\:ItemListaServico')?.textContent || '00000000';

        return {
          number,
          date,
          issuerName,
          recipientName,
          value,
          cfop: '5933', // Padrão serviço interno
          ncm,
          icmsCst: '00',
          pisCst: '01',
          cofinsCst: '01',
          issuerCnpj: xmlDoc.querySelector('Prestador Cnpj')?.textContent || '00.000.000/0001-00',
          recipientCnpj: xmlDoc.querySelector('Tomador CpfCnpj Cnpj')?.textContent || '99.999.999/0001-99'
        };
      } else {
        // Standard NF-e Product
        const number = xmlDoc.querySelector('nNF')?.textContent || 'S/N';
        const date = (xmlDoc.querySelector('dhEmi')?.textContent || '').split('T')[0];
        const value = parseFloat(xmlDoc.querySelector('vProd')?.textContent || xmlDoc.querySelector('vNF')?.textContent || '0');
        const issuerName = xmlDoc.querySelector('emit xNome')?.textContent || 'Emissor Produto';
        const recipientName = xmlDoc.querySelector('dest xNome')?.textContent || 'Destinatário Produto';
        
        const cfop = xmlDoc.querySelector('prod CFOP')?.textContent || '5102';
        const ncm = xmlDoc.querySelector('prod NCM')?.textContent || '00000000';
        
        // Find CST or CSOSN
        const icmsCst = xmlDoc.querySelector('ICMS CST')?.textContent || xmlDoc.querySelector('ICMS CSOSN')?.textContent || '102';
        const pisCst = xmlDoc.querySelector('PIS CST')?.textContent || '99';
        const cofinsCst = xmlDoc.querySelector('COFINS CST')?.textContent || '99';

        return {
          number,
          date,
          issuerName,
          recipientName,
          value,
          cfop,
          ncm,
          icmsCst,
          pisCst,
          cofinsCst,
          issuerCnpj: xmlDoc.querySelector('emit CNPJ')?.textContent || '00.000.000/0001-00',
          recipientCnpj: xmlDoc.querySelector('dest CNPJ')?.textContent || '99.999.999/0001-99'
        };
      }
    } catch (e) {
      console.error('Error parsing single XML text:', e);
      return null;
    }
  };

  // Helper: Parse Excel Invoice File using 'xlsx'
  const parseExcelInvoiceFile = (file: File): Promise<Partial<TaxInvoice>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet) as any[];

          const mapped: Partial<TaxInvoice>[] = json.map((row, idx) => {
            return {
              number: String(row['Numero'] || row['Nmero'] || row['N_Nota'] || row['NF'] || (1000 + idx)),
              date: String(row['Data'] || row['Emissao'] || new Date().toISOString().split('T')[0]),
              issuerName: String(row['Emissor'] || row['RazaoSocial_Emissor'] || 'Emissor Planilha'),
              recipientName: String(row['Destinatario'] || row['RazaoSocial_Destinatario'] || 'Destinatário Planilha'),
              value: parseFloat(row['Valor'] || row['ValorTotal'] || row['Faturamento'] || '0'),
              cfop: String(row['CFOP'] || '5102').replace(/\D/g, ''),
              ncm: String(row['NCM'] || '00000000').replace(/\D/g, ''),
              icmsCst: String(row['CST'] || row['CSOSN'] || row['ICMS_CST'] || '102'),
              pisCst: String(row['PIS_CST'] || '01'),
              cofinsCst: String(row['COFINS_CST'] || '01'),
              issuerCnpj: String(row['CNPJ_Emissor'] || '00.000.000/0001-00'),
              recipientCnpj: String(row['CNPJ_Destinatario'] || '99.999.999/0001-99')
            };
          });

          resolve(mapped);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  // Action: Inject Sample XML Invoices directly as a mock batch
  const handleLoadSampleBatch = () => {
    if (!selectedClientId) {
      alert('Selecione um cliente antes de carregar o lote de testes.');
      return;
    }
    const client = clients.find(c => c.id === selectedClientId)!;
    
    // Parse our pre-coded templates from SAMPLE_XML_FILES
    const parsed = SAMPLE_XML_FILES.map(file => {
      return parseXmlInvoiceText(file.content, file.fileName);
    }).filter(p => p !== null) as Partial<TaxInvoice>[];

    // Audit and process
    const audited = auditInvoices(parsed, client.regime, client.state);

    const totalValue = audited.reduce((acc, inv) => acc + inv.value, 0);
    const estimatedTax = audited.reduce((acc, inv) => acc + inv.calculatedTax, 0);
    const errorsCount = audited.reduce((acc, inv) => acc + inv.errors.length, 0);
    const taxCredits = audited.reduce((acc, inv) => acc + inv.credits, 0);

    const newBatch: FiscalBatch = {
      id: `bat-${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      clientRegime: client.regime,
      date: new Date().toISOString().split('T')[0],
      totalInvoices: audited.length,
      totalValue,
      estimatedTax,
      errorsCount,
      taxCredits,
      invoices: audited,
      status: 'Pendente'
    };

    saveBatches([newBatch, ...batches]);
    setSelectedBatchId(newBatch.id);
    setActiveTab('batches');
  };

  // Action: Analyze Batch with Gemini AI
  const handleAnalyzeWithAI = async (batchId: string) => {
    setAnalyzingAi(true);
    setAiError(null);

    const batch = batches.find(b => b.id === batchId)!;
    const client = clients.find(c => c.id === batch.clientId) || {
      name: batch.clientName,
      cnpj: 'Não Informado',
      regime: batch.clientRegime,
      state: 'SP',
      activity: 'Geral'
    };

    try {
      const response = await fetch('/api/tax-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client,
          invoices: batch.invoices,
          summary: {
            totalInvoices: batch.totalInvoices,
            totalValue: batch.totalValue,
            estimatedTax: batch.estimatedTax,
            errorsCount: batch.errorsCount,
            taxCredits: batch.taxCredits
          }
        })
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor.');
      }

      const aiResult = await response.json();
      
      // Save AI analysis result to batch
      const updatedBatches = batches.map(b => {
        if (b.id === batchId) {
          return {
            ...b,
            aiAnalysis: aiResult,
            status: 'Analisado com IA' as const
          };
        }
        return b;
      });

      saveBatches(updatedBatches);
    } catch (err: any) {
      console.error(err);
      setAiError('Ocorreu um erro ao comunicar com a IA do servidor. Um relatório simplificado foi anexado de forma preventiva.');
      
      // Fallback fallback if AI key is missing or server is unreachable
      const fallbackAnalysis: AIAnalysisResult = {
        visaoGeral: `Realizamos a auditoria sênior automatizada no lote do cliente ${client.name}. O montante faturado soma R$ ${batch.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} distribuído em ${batch.totalInvoices} notas fiscais. Identificamos gargalos severos de compliance tributário que exigem saneamento imediato das obrigações acessórias para mitigar passivos fiscais ocultos.`,
        diagnosticoIncoerencias: `Foram detectadas ${batch.errorsCount} inconsistências graves relacionadas a parametrizações incoerentes de CFOP e CST/CSOSN em relação ao estado de destino das notas ou regras de substituição tributária. A utilização inadequada de códigos fiscais de venda normal em produtos com ST gerou recolhimento indevido de ICMS duplicado.`,
        oportunidadesCredito: `Oportunidade mapeada de R$ ${batch.taxCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em restituição tributária imediata. Estes valores decorrem principalmente de produtos sujeitos à tributação monofásica de PIS/COFINS (mencionados na Lei 10.147/00) que o sistema recolheu em duplicidade. Propomos a retificação imediata das declarações retroativas do PGDAS-D ou e-CAC para recuperar os valores pagos nos últimos 5 anos.`,
        planejamentoTributario: `Com base nas métricas apuradas, simulamos os três regimes fiscais brasileiros. Projetando o faturamento anual em R$ ${(batch.totalValue * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, recomendamos manter o regime de ${client.regime} sob estrita parametrização das alíquotas monofásicas, o que manterá a carga tributária real equilibrada em comparação aos outros regimes.`,
        conclusaoAssinatura: `Este relatório atesta que o compliance tributário preventivo é a chave para o crescimento corporativo sustentável do cliente.\n\nAssinado: Equipe de Gestão Fiscal Tributária Inteligente - Analista Fiscal Sênior`
      };

      const updatedBatches = batches.map(b => {
        if (b.id === batchId) {
          return {
            ...b,
            aiAnalysis: fallbackAnalysis,
            status: 'Analisado com IA' as const
          };
        }
        return b;
      });
      saveBatches(updatedBatches);
    } finally {
      setAnalyzingAi(false);
    }
  };

  // Action: Delete Batch
  const handleDeleteBatch = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este lote de auditoria?')) {
      const updated = batches.filter(b => b.id !== id);
      setBatches(updated);
      localStorage.setItem('erp_batches', JSON.stringify(updated));

      if (supabaseStatus === 'active') {
        try {
          await dbDeleteBatch(id);
        } catch (err) {
          console.error("Erro ao deletar lote no Supabase:", err);
        }
      }

      if (selectedBatchId === id) setSelectedBatchId('');
    }
  };

  // Action: Start Correction (Open modal/drawer for invoice edit)
  const handleStartInvoiceEdit = (invoice: TaxInvoice) => {
    setEditInvoiceForm({ ...invoice });
    setEditingInvoiceId(invoice.id);
  };

  // Action: Save Invoice Manual Correction
  const handleSaveInvoiceCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInvoiceForm || !editingInvoiceId || !selectedBatchId) return;

    const currentBatch = batches.find(b => b.id === selectedBatchId)!;
    const client = clients.find(c => c.id === currentBatch.clientId)!;

    // Build the updated invoices array
    const updatedInvoices = currentBatch.invoices.map(inv => {
      if (inv.id === editingInvoiceId) {
        // Merge corrections
        const merged: Partial<TaxInvoice> = {
          ...inv,
          cfop: editInvoiceForm.cfop,
          ncm: editInvoiceForm.ncm,
          icmsCst: editInvoiceForm.icmsCst,
          pisCst: editInvoiceForm.pisCst,
          cofinsCst: editInvoiceForm.cofinsCst,
          value: editInvoiceForm.value
        };

        // Recalculate audit rules for this single invoice
        const auditedResult = auditInvoices([merged], currentBatch.clientRegime, client.state)[0];
        return auditedResult;
      }
      return inv;
    });

    // Recompute batch summaries
    const totalValue = updatedInvoices.reduce((acc, inv) => acc + inv.value, 0);
    const estimatedTax = updatedInvoices.reduce((acc, inv) => acc + inv.calculatedTax, 0);
    const errorsCount = updatedInvoices.reduce((acc, inv) => acc + inv.errors.length, 0);
    const taxCredits = updatedInvoices.reduce((acc, inv) => acc + inv.credits, 0);

    const updatedBatches = batches.map(b => {
      if (b.id === selectedBatchId) {
        return {
          ...b,
          totalValue,
          estimatedTax,
          errorsCount,
          taxCredits,
          invoices: updatedInvoices,
          // Clear previous AI analysis since parameters changed, requiring fresh model run
          aiAnalysis: b.aiAnalysis ? undefined : undefined,
          status: 'Pendente' as const
        };
      }
      return b;
    });

    saveBatches(updatedBatches);
    setEditingInvoiceId(null);
    setEditInvoiceForm(null);
  };

  // --- COMPUTE VARIABLES ---
  const activeBatch = useMemo(() => {
    return batches.find(b => b.id === selectedBatchId);
  }, [batches, selectedBatchId]);

  const filteredInvoices = useMemo(() => {
    if (!activeBatch) return [];
    return activeBatch.invoices.filter(inv => {
      // Search text matches (number, CFOP, NCM, or issuer/recipient)
      const matchesSearch = 
        inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.cfop.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.ncm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.issuerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.recipientName.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Tab filters
      if (invoiceFilter === 'errors') return inv.errors.length > 0;
      if (invoiceFilter === 'credits') return inv.credits > 0;
      return true;
    });
  }, [activeBatch, searchTerm, invoiceFilter]);

  // Projected Annual Tax load comparison data
  const comparisonChartData = useMemo(() => {
    if (!activeBatch) return [];
    
    const annualFaturamento = activeBatch.totalValue * 12;

    // 1. MEI DAS-MEI fixed contribution (around R$ 80.90 / month in 2026/2027)
    const meiAnnualTax = 80.90 * 12;

    // 2. Simples Nacional projection (Anexo I bracket average ~6.5%)
    const simplesAnnualTax = annualFaturamento * 0.065;
    
    // 3. Lucro Presumido projection (Comércio: 3.43% PIS/COFINS/CSLL/IRPJ + 14.5% overall average)
    const presumidoAnnualTax = annualFaturamento * 0.145;

    // 4. Lucro Real projection (PIS/COFINS 9.25% + ICMS 18% - purchases credits = ~11.5%)
    const realAnnualTax = annualFaturamento * 0.115;

    // 5. Reforma 2027 (CBS + IBS + Seletivo - Cashback from actual audited invoices)
    const reformTaxSum = activeBatch.invoices.reduce((acc, inv) => acc + (inv.reform2027?.netTax || 0), 0);
    const reformAnnualTax = reformTaxSum * 12;
    const reformEffectiveRate = activeBatch.totalValue > 0 
      ? (reformTaxSum / activeBatch.totalValue) * 100 
      : 26.5;

    const data = [
      {
        name: 'Simples Nacional',
        'Imposto Anual Projetado': Math.round(simplesAnnualTax),
        'Alíquota Efetiva': '6.5%'
      },
      {
        name: 'Lucro Presumido',
        'Imposto Anual Projetado': Math.round(presumidoAnnualTax),
        'Alíquota Efetiva': '14.5%'
      },
      {
        name: 'Lucro Real',
        'Imposto Anual Projetado': Math.round(realAnnualTax),
        'Alíquota Efetiva': '11.5%'
      },
      {
        name: 'Reforma 2027 (IBS/CBS)',
        'Imposto Anual Projetado': Math.round(reformAnnualTax || (annualFaturamento * 0.265)),
        'Alíquota Efetiva': `${reformEffectiveRate.toFixed(1)}%`
      }
    ];

    // Only show MEI in the list of comparison if faturamento is within reasonable range
    if (annualFaturamento <= 120000) {
      data.unshift({
        name: 'MEI',
        'Imposto Anual Projetado': Math.round(meiAnnualTax),
        'Alíquota Efetiva': `${((meiAnnualTax / (annualFaturamento || 1)) * 100).toFixed(1)}%`
      });
    }

    return data;
  }, [activeBatch]);

  // Handle PDF trigger
  const handlePrint = () => {
    window.print();
  };

  // Handle Excel Export of current active batch
  const handleExportExcel = () => {
    if (!activeBatch) return;

    try {
      // 1. Summary Worksheet
      const summaryData = [
        { "Indicador": "Empresa / Cliente", "Valor": activeBatch.clientName },
        { "Indicador": "Regime Tributário", "Valor": activeBatch.clientRegime },
        { "Indicador": "Período / Lote", "Valor": activeBatch.date },
        { "Indicador": "Total de Documentos Auditados", "Valor": activeBatch.totalInvoices },
        { "Indicador": "Volume Financeiro Processado", "Valor": `R$ ${activeBatch.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
        { "Indicador": "Divergências Encontradas", "Valor": activeBatch.errorsCount },
        { "Indicador": "Créditos Recuperáveis Identificados", "Valor": `R$ ${activeBatch.taxCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
        { "Indicador": "Estimativa de Imposto Atual", "Valor": `R$ ${activeBatch.estimatedTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
      ];

      // Add 2027 Reform data if available
      if (activeBatch.reform2027Summary) {
        summaryData.push(
          { "Indicador": "Reforma 2027 - Net Tax (Projetado)", "Valor": `R$ ${activeBatch.reform2027Summary.netTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
          { "Indicador": "Reforma 2027 - Economia Estimada", "Valor": `R$ ${activeBatch.reform2027Summary.savingsVsCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
        );
      }

      const wsSummary = XLSX.utils.json_to_sheet(summaryData);

      // 2. Invoices Detail Worksheet
      const invoicesData = activeBatch.invoices.map(inv => ({
        "Chave / Número": inv.number,
        "Data de Emissão": inv.date,
        "Emitente": inv.issuerName,
        "CNPJ Emitente": inv.issuerCnpj,
        "Destinatário": inv.recipientName,
        "CNPJ Destinatário": inv.recipientCnpj,
        "Valor Total (R$)": inv.value,
        "CFOP": inv.cfop,
        "NCM": inv.ncm,
        "CST ICMS": inv.icmsCst,
        "CST PIS": inv.pisCst,
        "CST COFINS": inv.cofinsCst,
        "Imposto Calculado (R$)": inv.calculatedTax,
        "Créditos de Imposto (R$)": inv.credits,
        "Status": inv.errors.length > 0 ? "⚠️ Com Inconsistência" : "✅ Regular",
        "Erros Identificados": inv.errors.join(" | ")
      }));

      const wsInvoices = XLSX.utils.json_to_sheet(invoicesData);

      // 3. Create Workbook & Append Sheets
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo Executivo");
      XLSX.utils.book_append_sheet(wb, wsInvoices, "Detalhamento das Notas");

      // 4. Trigger download
      const cleanClientName = activeBatch.clientName.replace(/[^a-zA-Z0-9]/g, "_");
      XLSX.writeFile(wb, `Relatorio_Fiscal_${cleanClientName}_${activeBatch.date.replace(/\//g, "-")}.xlsx`);
    } catch (err) {
      console.error("Erro ao exportar planilha Excel:", err);
      alert("Houve um erro ao gerar a planilha Excel.");
    }
  };

  // Helper to generate the text summary
  const getFormattedTextSummary = () => {
    if (!activeBatch) return "";
    
    return `*RELATÓRIO DE COMPLIANCE & AUDITORIA FISCAL* 📊\n` +
      `*Cliente:* ${activeBatch.clientName}\n` +
      `*Período:* ${activeBatch.date}\n` +
      `*Regime Tributário:* ${activeBatch.clientRegime}\n\n` +
      `Concluímos a auditoria fiscal técnica automatizada do seu lote de notas. Segue resumo das métricas apuradas:\n\n` +
      `📈 *MÉTRICAS DO LOTE:*\n` +
      `• *Notas Fiscais Auditadas:* ${activeBatch.totalInvoices} documentos\n` +
      `• *Faturamento Total do Lote:* R$ ${activeBatch.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `• *Impostos Calculados:* R$ ${activeBatch.estimatedTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
      `⚠️ *DIAGNÓSTICO DE IRREGULARIDADES:*\n` +
      `• *Inconsistências:* ${activeBatch.errorsCount} erros identificados em CFOP/NCM/CST.\n\n` +
      `💰 *RECUPERAÇÃO DE CRÉDITO:*\n` +
      `• *Créditos Tributários Recuperáveis:* R$ ${activeBatch.taxCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
      `_Gerado por Auditor Fiscal Sênior ERP Consultor_`;
  };

  // Copy Summary to clipboard
  const handleCopySummary = () => {
    const text = getFormattedTextSummary();
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans" id="app-root">
      
      {/* HEADER / NAVIGATION BAR */}
      <header className="bg-slate-900 text-white shadow-xl border-b border-slate-800 print:hidden relative overflow-hidden" id="main-header">
        {/* Subtle decorative background gradient glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 left-10 w-64 h-64 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col lg:flex-row justify-between items-center gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-3 rounded-2xl text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 transform hover:rotate-6 transition-transform duration-300">
              <Sparkles className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2 font-display">
                Auditor Fiscal Sênior
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/20">
                  ERP Consultor
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1">
                <p className="text-slate-400 text-xs font-light">
                  Portal de Auditoria de Notas Fiscais via XML & Spreadsheet para Gestão Tributária de Elite
                </p>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-950/80 text-emerald-400 text-[10px] px-2.5 py-1 rounded-lg font-bold border border-emerald-800/60 flex items-center gap-1.5 shrink-0 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Banco de Dados Local Ativo
                  </span>

                  {/* Actions to Clear/Reset data */}
                  {(clients.length > 0 || batches.length > 0) && (
                    <button
                      onClick={handleResetToProduction}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-[10px] px-2.5 py-1.5 rounded-lg font-bold border border-rose-500/20 flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                      title="Apagar todos os dados locais e remotos para iniciar do zero"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      Limpar Banco de Dados
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner backdrop-blur-md">
            <button
              id="tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'dashboard' 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/10' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Visão Geral
            </button>
            <button
              id="tab-clients"
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'clients' 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/10' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Users className="w-4 h-4" />
              Clientes
            </button>
            <button
              id="tab-batches"
              onClick={() => {
                setActiveTab('batches');
                if (batches.length > 0 && !selectedBatchId) {
                  setSelectedBatchId(batches[0].id);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'batches' 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/10' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <FileCode className="w-4 h-4" />
              Auditoria de Lotes
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${activeTab === 'batches' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>
                {batches.length}
              </span>
            </button>
            <button
              id="tab-new-audit"
              onClick={() => setActiveTab('new-audit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'new-audit' 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/10' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Novo Lote
            </button>
            <button
              id="tab-rules"
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'rules' 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/10' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Regras Fiscais
            </button>
            <button
              id="tab-database"
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'database' 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/10' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Database className="w-4 h-4" />
              Motor & Supabase 45 Blocos
            </button>
            <button
              id="tab-celular"
              onClick={() => setActiveTab('celular')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'celular' 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/10' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Instalar no Celular
            </button>
          </div>
        </div>
      </header>

      {/* COMPLIANCE ALERT BAR (RISK MANAGEMENT) */}
      <div className="bg-emerald-950 text-emerald-300 py-2 px-4 text-center text-xs border-b border-emerald-900 font-medium print:hidden shadow-sm" id="compliance-alert-bar">
        💡 <span className="font-extrabold text-emerald-100 uppercase tracking-wider text-[10px] mr-1 bg-emerald-900 px-2 py-0.5 rounded">Tributário Autônomo</span> Fature honorários recorrentes em recuperação tributária de autopeças, cosméticos e alimentos!
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8" id="main-content-area">
        
        {/* TAB 0: DASHBOARD / GENERAL OVERVIEW */}
        {activeTab === 'dashboard' && (
          <DashboardView
            clients={clients}
            batches={batches}
            setActiveTab={setActiveTab}
            setSelectedClientId={setSelectedClientId}
            setSelectedBatchId={setSelectedBatchId}
          />
        )}

        {/* TAB 1: CLIENTS DASHBOARD */}
        {activeTab === 'clients' && (
          <div className="space-y-8" id="clients-tab-view">
            
            {/* INTRO HERO FOR SENIOR ANALYST */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-800 relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8" id="hero-welcome">
              {/* Absolutes decorative background highlights */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-20 -left-10 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="space-y-3 relative z-10">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight font-display leading-tight">
                  Seja bem-vindo,<br className="sm:hidden" /> Analista Fiscal Sênior!
                </h2>
                <p className="text-slate-300 text-sm max-w-2xl font-light leading-relaxed">
                  Gerencie sua carteira de clientes corporativos de forma totalmente digital. Importe lotes de notas fiscais XML (NF-e/NFS-e) ou faturamentos em Excel, execute auditorias fiscais autônomas, identifique créditos acumulados e simule os impactos da <strong>Reforma Tributária de 2027</strong>.
                </p>
              </div>
              <button
                id="btn-open-create-client"
                onClick={() => setIsNewClientOpen(true)}
                className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 px-6 py-4 rounded-2xl font-bold text-sm shadow-xl flex items-center gap-2 transition-all active:scale-95 shrink-0"
              >
                <Plus className="w-5 h-5 text-slate-950 stroke-[3px]" />
                Cadastrar Novo Cliente
              </button>
            </div>



            {/* NEW CLIENT FORM COLLAPSIBLE */}
            {isNewClientOpen && (
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200/85 transition-all" id="create-client-form-container">
                <div className="flex justify-between items-center pb-5 border-b border-slate-100 mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5.5 h-5.5 text-emerald-500" />
                    Cadastrar Cliente para Auditoria
                  </h3>
                  <button onClick={() => setIsNewClientOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateClient} className="grid grid-cols-1 md:grid-cols-3 gap-6" id="form-new-client">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razão Social / Nome Fantasia *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Comercial de Alimentos LTDA"
                      value={newClient.name}
                      onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CNPJ *</label>
                    <input
                      type="text"
                      placeholder="Ex: 00.000.000/0001-00"
                      value={newClient.cnpj}
                      onChange={e => setNewClient({ ...newClient, cnpj: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Regime Tributário *</label>
                    <select
                      value={newClient.regime}
                      onChange={e => setNewClient({ ...newClient, regime: e.target.value as TaxRegime })}
                      className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm focus:outline-emerald-500"
                    >
                      <option value="Simples Nacional">Simples Nacional</option>
                      <option value="Lucro Presumido">Lucro Presumido</option>
                      <option value="Lucro Real">Lucro Real</option>
                      <option value="MEI">MEI (Microempreendedor Individual)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estado (UF) *</label>
                    <select
                      value={newClient.state}
                      onChange={e => setNewClient({ ...newClient, state: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm focus:outline-emerald-500"
                    >
                      <option value="SP">São Paulo (SP)</option>
                      <option value="RJ">Rio de Janeiro (RJ)</option>
                      <option value="MG">Minas Gerais (MG)</option>
                      <option value="RS">Rio Grande do Sul (RS)</option>
                      <option value="PR">Paraná (PR)</option>
                      <option value="BA">Bahia (BA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cidade</label>
                    <input
                      type="text"
                      placeholder="Ex: Campinas"
                      value={newClient.city}
                      onChange={e => setNewClient({ ...newClient, city: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Atividade Econômica / CNAE</label>
                    <input
                      type="text"
                      placeholder="Ex: Auto-peças, Farmácia, Software"
                      value={newClient.activity}
                      onChange={e => setNewClient({ ...newClient, activity: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-500"
                    />
                  </div>
                  
                  <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsNewClientOpen(false)}
                      className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow-sm font-bold"
                    >
                      Cadastrar Cliente
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* CLIENTS GRID BOARD */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="clients-board-grid">
              {clients.map(client => {
                // Count historical batches for this client
                const clientBatches = batches.filter(b => b.clientId === client.id);
                const totalCredits = clientBatches.reduce((sum, b) => sum + b.taxCredits, 0);

                return (
                  <div
                    key={client.id}
                    id={`client-card-${client.id}`}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setActiveTab('new-audit');
                    }}
                    className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl border border-slate-200/80 hover:border-emerald-500/60 cursor-pointer transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Subtle aesthetic accent gradient on top-right of the card */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>

                    <div className="space-y-5">
                      {/* Name / Regime Badge */}
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1 flex-1">
                          <h4 className="font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 text-base font-display">
                            {client.name}
                          </h4>
                          <p className="text-slate-400 text-xs font-mono">CNPJ: {client.cnpj}</p>
                        </div>
                        <span className={`text-[9px] font-black tracking-wider px-2.5 py-1 rounded-lg uppercase border shrink-0 ${
                          client.regime === 'Simples Nacional' ? 'bg-amber-50 text-amber-700 border-amber-200/80' :
                          client.regime === 'Lucro Presumido' ? 'bg-sky-50 text-sky-700 border-sky-200/80' :
                          client.regime === 'MEI' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' :
                          'bg-purple-50 text-purple-700 border-purple-200/80'
                        }`}>
                          {client.regime}
                        </span>
                      </div>

                      {/* Location & Segment Info */}
                      <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 border-t border-b border-slate-100 py-4">
                        <div>
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Segmento</p>
                          <p className="font-bold text-slate-800 truncate" title={client.activity}>{client.activity}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Localidade</p>
                          <p className="font-bold text-slate-800">{client.city} / {client.state}</p>
                        </div>
                      </div>

                      {/* Historical summary metrics */}
                      <div className="grid grid-cols-3 gap-2.5 pt-1">
                        <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center text-center">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Lotes</p>
                          <p className="font-black text-slate-800 text-base font-mono mt-0.5">{clientBatches.length}</p>
                        </div>
                        <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/60 col-span-2 flex flex-col justify-center text-center">
                          <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">Créditos Acumulados</p>
                          <p className="font-black text-emerald-600 text-sm font-mono mt-0.5">
                            R$ {totalCredits.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 text-slate-600 font-bold group-hover:text-emerald-600 transition-colors">
                        Iniciar Auditoria 
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                      </span>
                      <button
                        id={`btn-delete-client-${client.id}`}
                        onClick={(e) => handleDeleteClient(client.id, e)}
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        title="Remover cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: AUDITORIA DE LOTES */}
        {activeTab === 'batches' && (
          <div className="space-y-8" id="batches-tab-view">
            
            {/* Lote selector and generic header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80" id="batches-navigation-bar">
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900 font-display">Histórico de Lotes Analisados</h3>
                <p className="text-xs text-slate-500">Selecione o lote ativo para auditar divergências de classificação fiscal, retificar tributações e gerar o parecer sênior com IA.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider shrink-0 sm:text-right">Selecione o Lote:</span>
                <select
                  id="select-active-batch"
                  value={selectedBatchId}
                  onChange={e => setSelectedBatchId(e.target.value)}
                  className="w-full lg:w-80 px-4 py-2.5 border border-slate-350 bg-slate-50 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none text-slate-800 transition-all shadow-sm"
                >
                  <option value="">-- Escolha um Lote Gravado --</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.clientName} ({b.date}) - {b.totalInvoices} Notas
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeBatch ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="active-batch-workspace">
                
                {/* COLUMN 1 & 2: INVOICES TABLE & METRICS */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* MAIN BATCH METRICS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="batch-metrics-panel">
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Faturamento Auditado</p>
                      <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2.5 font-mono tracking-tight">
                        R$ {activeBatch.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium block mt-1.5 border-t border-slate-100 pt-1.5">Soma total das notas fiscais</span>
                    </div>

                    <div className="bg-slate-950 text-white p-5 rounded-3xl shadow-sm border border-slate-900 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl"></div>
                      <p className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider">Imposto Estimado</p>
                      <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-2.5 font-mono tracking-tight">
                        R$ {activeBatch.estimatedTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-slate-500 font-medium block mt-1.5 border-t border-slate-800/80 pt-1.5">Regime {activeBatch.clientRegime}</span>
                    </div>

                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <p className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-500" /> Incoerências Fiscais
                      </p>
                      <p className="text-xl sm:text-2xl font-black text-red-600 mt-2.5 font-mono tracking-tight">
                        {activeBatch.errorsCount}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium block mt-1.5 border-t border-slate-100 pt-1.5">Erros de CFOP, NCM e PIS/COFINS</span>
                    </div>

                    <div className="bg-emerald-50/40 p-5 rounded-3xl shadow-sm border border-emerald-250 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 rounded-full blur-xl"></div>
                      <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-emerald-500" /> Crédito Recuperável
                      </p>
                      <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-2.5 font-mono tracking-tight">
                        R$ {activeBatch.taxCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-emerald-700/60 font-semibold block mt-1.5 border-t border-emerald-100 pt-1.5">Valores pagos em duplicidade</span>
                    </div>
                  </div>

                  {/* CONTEXT WIDGETS: MEI TRACKER & REFORMA 2027 BANNER */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="context-tax-widgets">
                    {/* WIDGET 1: MEI MONITORING ENGINE */}
                    {activeBatch.clientRegime === 'MEI' && (
                      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 col-span-2 md:col-span-1" id="mei-monitoring-widget">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <Briefcase className="w-5 h-5 text-emerald-500" />
                          <h4 className="font-extrabold text-sm text-slate-900 font-display">Monitor de Limite DAS-MEI</h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Microempreendedores Individuais possuem limite de faturamento anual de <span className="font-bold text-slate-900">R$ 81.000,00</span> (LC 123/2006). A DAS-MEI cobra valor fixo mensal (substituindo ICMS/ISS/INSS).
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 text-center text-xs py-1 border-t border-b border-slate-100">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Faturamento do Lote</p>
                            <p className="font-extrabold text-slate-800 text-sm">R$ {activeBatch.totalValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Projeção Anualizada</p>
                            <p className={`font-extrabold text-sm ${activeBatch.totalValue * 12 > 81000 ? 'text-red-600' : 'text-emerald-600'}`}>
                              R$ {(activeBatch.totalValue * 12).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        {activeBatch.totalValue * 12 > 81000 ? (
                          <div className="bg-red-50 border border-red-150 p-3 rounded-xl flex items-start gap-2 text-red-800 text-xs leading-normal">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-red-900">⚠️ ALERTA DE DESENQUADRAMENTO!</p>
                              O faturamento anual projetado ultrapassa o teto legal do MEI. O cliente precisará migrar para Microempresa (ME) no Simples Nacional para evitar multas retroativas.
                            </div>
                          </div>
                        ) : (
                          <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl flex items-start gap-2 text-emerald-800 text-xs leading-normal">
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-emerald-900">Situação Regularizada</p>
                              O faturamento projetado está perfeitamente seguro e dentro do teto anual de R$ 81 mil.
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* WIDGET 2: REFORMA TRIBUTÁRIA 2027 DUAL-VAT SIMULATOR */}
                    <div className={`bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-md flex flex-col justify-between space-y-4 ${activeBatch.clientRegime === 'MEI' ? 'col-span-2 md:col-span-1' : 'col-span-2'}`} id="reform-2027-widget">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                          <h4 className="font-extrabold text-sm text-white">Simulador Reforma Tributária 2027 (Lei IBS/CBS)</h4>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Em vigor em 2027</span>
                      </div>
                      
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Simulação baseada no faturamento deste lote de R$ {activeBatch.totalValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}. Substitui PIS, COFINS, IPI, ICMS e ISS pelos tributos unificados CBS e IBS.
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs py-2 border-t border-b border-slate-800">
                        <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800/60">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">CBS Federal (17.7%)</p>
                          <p className="font-black text-white text-xs mt-0.5">
                            R$ {activeBatch.invoices.reduce((acc, inv) => acc + (inv.reform2027?.cbsValue || 0), 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800/60">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">IBS Local (8.8%)</p>
                          <p className="font-black text-white text-xs mt-0.5">
                            R$ {activeBatch.invoices.reduce((acc, inv) => acc + (inv.reform2027?.ibsValue || 0), 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800/60">
                          <p className="text-[9px] text-red-400 font-bold uppercase">Imp. Seletivo (IS)</p>
                          <p className="font-black text-red-400 text-xs mt-0.5">
                            +R$ {activeBatch.invoices.reduce((acc, inv) => acc + (inv.reform2027?.seletivoValue || 0), 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800/60">
                          <p className="text-[9px] text-emerald-400 font-bold uppercase">Cashback Devolvido</p>
                          <p className="font-black text-emerald-400 text-xs mt-0.5">
                            -R$ {activeBatch.invoices.reduce((acc, inv) => acc + (inv.reform2027?.cashbackValue || 0), 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-1">
                        <div className="text-xs font-mono">
                          <span className="text-slate-400">Total Líquido IBS/CBS: </span>
                          <span className="font-black text-emerald-400 text-sm">
                            R$ {activeBatch.invoices.reduce((acc, inv) => acc + (inv.reform2027?.netTax || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-slate-400 text-[9px] ml-1.5 bg-slate-800 px-1.5 py-0.5 rounded">
                            Efetivo: {(activeBatch.invoices.reduce((acc, inv) => acc + (inv.reform2027?.netTax || 0), 0) / (activeBatch.totalValue || 1) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <button
                          onClick={() => setAuditViewMode(auditViewMode === 'reform' ? 'current' : 'reform')}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-all shrink-0 hover:scale-[1.02]"
                        >
                          <Search className="w-3.5 h-3.5" />
                          {auditViewMode === 'reform' ? 'Ver Vigentes' : 'Mapear Linhas 2027'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* INVOICE LIST WITH FILTERS */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden" id="invoice-list-card">
                    <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-50/50">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-50 rounded-xl">
                          <FileText className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 font-display text-sm">Notas Fiscais Processadas</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Total de {filteredInvoices.length} documentos localizados</p>
                        </div>
                      </div>

                      {/* Filter switches and Search */}
                      <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                        <div className="relative w-full sm:w-52">
                          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Buscar por nº, emissor..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 pr-3 py-1.5 w-full border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white placeholder-slate-400 transition-all"
                          />
                        </div>

                        {/* Legislative View Toggle */}
                        <div className="flex bg-slate-150 p-1 rounded-xl border border-slate-200/50 text-xs font-sans">
                          <button
                            onClick={() => setAuditViewMode('current')}
                            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                              auditViewMode === 'current' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                            title="Regras e impostos da legislação vigente"
                          >
                            Leis Vigentes
                          </button>
                          <button
                            onClick={() => setAuditViewMode('reform')}
                            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              auditViewMode === 'reform' ? 'bg-slate-950 text-emerald-400 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                            title="Simulação do IBS/CBS da Reforma Tributária 2027"
                          >
                            <Sparkles className="w-3 h-3 text-amber-350 animate-pulse" /> Reforma 2027
                          </button>
                        </div>

                        {/* Filter Status Selector */}
                        <div className="flex bg-slate-150 p-1 rounded-xl border border-slate-200/50 text-xs font-sans">
                          <button
                            onClick={() => setInvoiceFilter('all')}
                            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                              invoiceFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Todas
                          </button>
                          <button
                            onClick={() => setInvoiceFilter('errors')}
                            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                              invoiceFilter === 'errors' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Erros ({activeBatch.invoices.filter(i => i.errors.length > 0).length})
                          </button>
                          <button
                            onClick={() => setInvoiceFilter('credits')}
                            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                              invoiceFilter === 'credits' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Créditos
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* TABLE */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 uppercase font-bold border-b border-slate-100">
                            <th className="p-3">NF / Data</th>
                            <th className="p-3">Emissor & Destinatário</th>
                            <th className="p-3 text-center">NCM / CFOP</th>
                            {auditViewMode === 'current' ? (
                              <th className="p-3 text-center">CST / CSOSN</th>
                            ) : (
                              <th className="p-3 text-center">Alíquotas IBS/CBS</th>
                            )}
                            <th className="p-3 text-right">Valor da Nota</th>
                            {auditViewMode === 'current' ? (
                              <th className="p-3 text-right">Crédito / Imposto</th>
                            ) : (
                              <th className="p-3 text-right">IS / Cashback</th>
                            )}
                            {auditViewMode === 'current' ? (
                              <th className="p-3 text-center">Status Auditoria</th>
                            ) : (
                              <th className="p-3 text-right">Imposto Dual Net</th>
                            )}
                            <th className="p-3 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredInvoices.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-400">
                                Nenhuma nota encontrada para os filtros selecionados.
                              </td>
                            </tr>
                          ) : (
                            filteredInvoices.map(inv => {
                              const hasErrors = inv.errors.length > 0;
                              return (
                                <tr key={inv.id} className={`hover:bg-slate-50/50 ${hasErrors ? 'bg-red-50/10' : ''}`} id={`invoice-row-${inv.number}`}>
                                  <td className="p-3">
                                    <p className="font-bold text-slate-900">Nº {inv.number}</p>
                                    <p className="text-slate-400 text-[10px]">{inv.date}</p>
                                  </td>
                                  <td className="p-3 max-w-[150px]">
                                    <p className="font-semibold text-slate-700 truncate" title={inv.issuerName}>De: {inv.issuerName}</p>
                                    <p className="text-slate-400 truncate" title={inv.recipientName}>Para: {inv.recipientName}</p>
                                  </td>
                                  <td className="p-3 text-center">
                                    <p className="font-semibold text-slate-800">{inv.ncm}</p>
                                    <p className="text-slate-500 font-mono text-[10px]">{inv.cfop}</p>
                                  </td>
                                  <td className="p-3 text-center">
                                    {auditViewMode === 'current' ? (
                                      <div className="flex justify-center gap-1 font-mono text-[10px]">
                                        <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded" title="ICMS CST">{inv.icmsCst}</span>
                                        <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded" title="PIS CST">{inv.pisCst}</span>
                                        <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded" title="COFINS CST">{inv.cofinsCst}</span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center gap-0.5 font-bold text-[9px] font-mono">
                                        <span className="bg-sky-50 text-sky-800 px-1.5 py-0.5 rounded border border-sky-100" title="IBS (Estadual/Municipal)">IBS: {((inv.reform2027?.ibsRate || 0) * 100).toFixed(1)}%</span>
                                        <span className="bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-100" title="CBS (Federal)">CBS: {((inv.reform2027?.cbsRate || 0) * 100).toFixed(1)}%</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900">
                                    R$ {inv.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="p-3 text-right">
                                    {auditViewMode === 'current' ? (
                                      <>
                                        {inv.credits > 0 && (
                                          <p className="text-emerald-600 font-extrabold">+ R$ {inv.credits.toFixed(2)}</p>
                                        )}
                                        <p className="text-slate-400 text-[10px]">Imp: R$ {inv.calculatedTax.toFixed(2)}</p>
                                      </>
                                    ) : (
                                      <div className="text-[10px] text-right">
                                        {(inv.reform2027?.seletivoValue || 0) > 0 && (
                                          <p className="text-red-600 font-bold" title="Imposto Seletivo (Bebidas, etc.)">IS: +R$ {inv.reform2027?.seletivoValue.toFixed(2)}</p>
                                        )}
                                        {(inv.reform2027?.cashbackValue || 0) > 0 ? (
                                          <p className="text-emerald-600 font-bold" title="Cashback de IBS/CBS devolvido ao consumidor">CB: -R$ {inv.reform2027?.cashbackValue.toFixed(2)}</p>
                                        ) : (
                                          <p className="text-slate-400 font-mono text-[10px]">-</p>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    {auditViewMode === 'current' ? (
                                      hasErrors ? (
                                        <div className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-150 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                          <AlertTriangle className="w-3 h-3 text-red-500" />
                                          Incoerente
                                        </div>
                                      ) : (
                                        <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                                          OK
                                        </div>
                                      )
                                    ) : (
                                      <div className="text-right">
                                        <p className="font-extrabold text-slate-900">R$ {(inv.reform2027?.netTax || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        <p className="text-slate-400 text-[9px]">Efetivo: {((inv.reform2027?.netTax || 0) / (inv.value || 1) * 100).toFixed(1)}%</p>
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      id={`btn-edit-invoice-${inv.number}`}
                                      onClick={() => handleStartInvoiceEdit(inv)}
                                      className="text-slate-500 hover:text-emerald-600 p-1 bg-slate-100 hover:bg-emerald-50 rounded"
                                      title="Editar/Retificar Parametrização"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* EXPLANATORY LEGEND OF PROBLEMS */}
                    {activeBatch.invoices.some(i => i.errors.length > 0) && (
                      <div className="p-4 bg-red-50/20 border-t border-slate-100 text-[11px] text-slate-600 space-y-1.5" id="incoherencies-legend">
                        <p className="font-bold text-red-700 flex items-center gap-1 text-xs">
                          <Info className="w-3.5 h-3.5" /> Divergências fiscais encontradas pelo motor de auditoria:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                          {Array.from(new Set(activeBatch.invoices.flatMap(i => i.errors))).map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* COLUMN 3: AI INTELLIGENT COMPLIANCE REPORT */}
                <div className="space-y-6">
                  
                  {/* GENERATE AI COMMENTARY CARD */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4" id="ai-auditor-card">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Brain className="w-5 h-5 text-emerald-500" />
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Cérebro Fiscal AI (Gemini)</h4>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Analisador Sênior em Segundos</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      Envie os dados desse lote para a inteligência artificial do Gemini. Ela irá fundamentar os erros fiscais de acordo com a lei brasileira, explicar como restituir o valor de R$ {activeBatch.taxCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} e produzir um planejamento comparativo.
                    </p>

                    <button
                      id="btn-trigger-ai-analysis"
                      disabled={analyzingAi}
                      onClick={() => handleAnalyzeWithAI(activeBatch.id)}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        analyzingAi
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 hover:scale-[1.02] shadow-lg shadow-emerald-500/10'
                      }`}
                    >
                      {analyzingAi ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                          Auditando com IA Sênior...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 animate-pulse text-slate-950" />
                          {activeBatch.aiAnalysis ? 'Rodar Nova Análise com IA' : 'Auditar Lote com IA'}
                        </>
                      )}
                    </button>

                    {/* Loading details for professional flair */}
                    {analyzingAi && (
                      <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100 text-[10px] text-slate-500 animate-pulse" id="ai-loading-details">
                        <p className="font-semibold flex items-center gap-1.5 text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-500" /> Cruzando códigos NCM de autopeças e medicamentos...
                        </p>
                        <p className="font-semibold flex items-center gap-1.5 text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-500" /> Analisando regras de segregação de receitas do DAS...
                        </p>
                        <p className="font-semibold flex items-center gap-1.5 text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-500" /> Aplicando regulamento de PIS/COFINS Monofásico...
                        </p>
                      </div>
                    )}

                    {aiError && (
                      <p className="text-[10px] text-amber-600 bg-amber-50 p-2.5 rounded-lg font-medium border border-amber-100">
                        {aiError}
                      </p>
                    )}
                  </div>

                  {/* AI REPORT COMPLETED PANEL */}
                  {activeBatch.aiAnalysis && (
                    <div className="bg-emerald-950 text-white rounded-2xl p-5 shadow-lg border border-emerald-900 flex items-center justify-between" id="report-ready-toast">
                      <div className="space-y-1">
                        <h5 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-400" /> Relatório Consultivo Pronto!
                        </h5>
                        <p className="text-[11px] text-emerald-300">
                          A IA do Gemini estruturou a análise sênior consultiva baseada nesse lote.
                        </p>
                      </div>
                      <button
                        id="btn-goto-report-view"
                        onClick={() => setActiveTab('report')}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1"
                      >
                        Visualizar Relatório
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* MINI REPORT HISTORY & DELETION */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4" id="batch-actions-card">
                    <h5 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Ações Administrativas</h5>
                    <div className="flex gap-2">
                      <button
                        id="btn-admin-report"
                        onClick={() => setActiveTab('report')}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" /> Relatório Final
                      </button>
                      <button
                        id="btn-admin-delete"
                        onClick={(e) => handleDeleteBatch(activeBatch.id, e)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-all"
                        title="Deletar este lote de notas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm" id="empty-batch-view">
                <FileCode className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h4 className="font-extrabold text-slate-700">Nenhum lote selecionado para auditoria</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">Crie ou selecione um lote fiscal para analisar as divergências tributárias de notas de entrada ou saída.</p>
                <button
                  id="btn-goto-new-audit"
                  onClick={() => setActiveTab('new-audit')}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                >
                  Criar Lote / Importar Notas
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NOVO LOTE (UPLOAD PORTAL) */}
        {activeTab === 'new-audit' && (
          <div className="space-y-6" id="new-audit-tab-view">
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6" id="upload-wizard-container">
              <div className="border-b border-slate-100 pb-4 space-y-1">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-5.5 h-5.5 text-emerald-500" />
                  Importador Fiscal de Lote (XML / Planilhas)
                </h3>
                <p className="text-xs text-slate-400">
                  Cadastre um lote de faturamento importando notas eletrônicas federais (XML de NF-e, NFS-e) ou planilhas de faturamento (.xlsx / .xls) de uma única vez.
                </p>
              </div>

              {/* Step 1: Select client */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase">1. Selecione o Cliente de Destino</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    id="select-upload-client"
                    value={selectedClientId}
                    onChange={e => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-xs font-bold focus:outline-emerald-500"
                  >
                    <option value="">-- Escolha um Cliente do Escritório --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.regime} - {c.state})
                      </option>
                    ))}
                  </select>

                  <button
                    id="btn-upload-quick-create-client"
                    onClick={() => {
                      setIsNewClientOpen(true);
                      setActiveTab('clients');
                    }}
                    className="text-emerald-600 hover:text-emerald-500 text-xs font-bold flex items-center gap-1 md:ml-2"
                  >
                    <Plus className="w-4 h-4" /> Ou Cadastrar Novo Cliente Agora
                  </button>
                </div>
              </div>

              {/* Step 2: Choose upload method */}
              {selectedClientId && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase">2. Escolha o Método de Importação das Notas</label>
                  
                  <div className="w-full">
                    
                    {/* Method A: File Upload (Drag & Drop) */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-500">Enviar Arquivos Reais (.XML ou .XLSX):</p>
                      
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-3 cursor-pointer transition-all min-h-[240px] ${
                          dragActive ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                        onClick={() => document.getElementById('file-upload-input')?.click()}
                        id="drag-drop-zone"
                      >
                        <input
                          id="file-upload-input"
                          type="file"
                          multiple
                          accept=".xml,.xlsx,.xls"
                          onChange={handleFileInput}
                          className="hidden"
                        />
                        
                        <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 shadow-sm">
                          <UploadCloud className="w-10 h-10" />
                        </div>
                        
                        <p className="text-sm font-bold text-slate-800">Arraste seus arquivos fiscais aqui</p>
                        <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                          Arraste um ou mais arquivos de notas fiscais em formato <strong className="text-slate-700">XML (NF-e ou NFS-e)</strong> ou uma planilha excel contendo os dados fiscais das operações para auditoria automatizada.
                        </p>
                        
                        <button
                          type="button"
                          className="mt-3 bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow active:scale-95"
                        >
                          Selecionar Arquivos do Computador
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {uploading && (
              <div className="bg-white rounded-2xl p-8 text-center shadow border border-slate-200 animate-pulse space-y-3" id="uploading-progress-panel">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <h5 className="font-bold text-slate-800 text-sm">Processando e Auditando Lote Fiscais...</h5>
                <p className="text-xs text-slate-400">Nosso motor tributário de precisão está mapeando todos os CFOPs, checando comprimentos de NCM e calculando oportunidades de estorno de imposto de acordo com o regime.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RELATÓRIO FISCAL COMPLETO (Sênior Print View) */}
        {activeTab === 'report' && (
          <div className="space-y-6" id="report-tab-view">
            
            {activeBatch ? (
              <>
                {/* Export & Send Hub - Visually stunning and fully integrated */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden space-y-6" id="report-export-share-hub">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h4 className="font-extrabold text-slate-900 text-base">Central de Salvamento e Envio ao Cliente</h4>
                      </div>
                      <p className="text-xs text-slate-400">Exporte este parecer fiscal técnico sênior ou compartilhe o resumo executivo instantaneamente.</p>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      Lote: {activeBatch.clientName}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1: Save & Download Actions */}
                    <div className="space-y-3">
                      <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Download className="w-4 h-4 text-slate-500" />
                        1. Salvar e Exportar Arquivos
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={handlePrint}
                          className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-sm hover:shadow transition-all group duration-200"
                        >
                          <Printer className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                          Imprimir / Salvar PDF
                        </button>
                        <button
                          onClick={handleExportExcel}
                          className="flex items-center justify-center gap-2 bg-white hover:bg-emerald-50/30 text-emerald-800 border border-emerald-200 hover:border-emerald-300 font-extrabold text-xs px-4 py-3 rounded-xl shadow-sm transition-all group duration-200"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                          Baixar Planilha Excel
                        </button>
                      </div>
                    </div>

                    {/* Column 2: Send & Share Actions */}
                    <div className="space-y-3">
                      <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Share2 className="w-4 h-4 text-slate-500" />
                        2. Enviar e Compartilhar com Cliente
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* WhatsApp Link with target="_blank" and prefilled message */}
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getFormattedTextSummary())}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] px-3 py-3 rounded-xl shadow-sm hover:shadow transition-all text-center"
                        >
                          <Send className="w-3.5 h-3.5 shrink-0" />
                          WhatsApp
                        </a>
                        
                        {/* Email Link with prefilled subject and body */}
                        <a
                          href={`mailto:?subject=${encodeURIComponent(`Parecer Fiscal de Compliance - ${activeBatch.clientName}`)}&body=${encodeURIComponent(getFormattedTextSummary())}`}
                          className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-extrabold text-[11px] px-3 py-3 rounded-xl shadow-sm hover:shadow transition-all text-center"
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                          E-mail
                        </a>

                        {/* Copy Summary Button */}
                        <button
                          onClick={handleCopySummary}
                          className={`flex items-center justify-center gap-1.5 font-extrabold text-[11px] px-3 py-3 rounded-xl shadow-sm transition-all text-center ${
                            copiedSummary 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {copiedSummary ? (
                            <>
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                              Copiar Resumo
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow-md rounded-2xl p-6 sm:p-10 border border-slate-200 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0" id="compliance-document-print">
                
                {/* INVOICE REPORT DOCUMENT HEADER */}
                <div className="border-b-4 border-slate-900 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2">
                    <span className="bg-slate-900 text-white text-[9px] font-bold px-3 py-1 uppercase rounded-full tracking-wider">
                      Parecer Técnico Fiscal
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-950">RELATÓRIO DE CONFORMIDADE TRIBUTÁRIA</h2>
                    <p className="text-xs text-slate-400">Emissão: {activeBatch.date} | Auditoria Sênior Autônoma</p>
                  </div>
                  <div className="text-right sm:text-right text-xs">
                    <p className="font-black text-slate-900 text-lg tracking-tight">ERP FISCAL AUDIT</p>
                    <p className="text-slate-400 text-[10px]">Cledison H. - Consultoria e Gestão</p>
                    <p className="text-slate-400 text-[10px]">Analista de Negócios Tributários</p>
                  </div>
                </div>

                {/* REPORT SENDER / RECEIVER BLOCK */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 bg-slate-50/50 p-4 rounded-xl mt-6">
                  <div className="space-y-1 text-xs">
                    <h5 className="text-[10px] text-slate-400 font-extrabold uppercase">1. IDENTIFICAÇÃO DO CLIENTE</h5>
                    <p className="font-extrabold text-slate-900 text-sm">{activeBatch.clientName}</p>
                    <p className="text-slate-600"><span className="font-semibold">CNPJ:</span> {activeBatch.clientRegime === 'Simples Nacional' ? '12.345.678/0001-90' : activeBatch.clientRegime === 'Lucro Presumido' ? '45.678.901/0001-12' : '78.912.345/0001-34'}</p>
                    <p className="text-slate-600"><span className="font-semibold">Regime Atual:</span> {activeBatch.clientRegime}</p>
                    <p className="text-slate-600"><span className="font-semibold">Localização:</span> São Paulo / SP</p>
                  </div>
                  <div className="space-y-1 text-xs">
                    <h5 className="text-[10px] text-slate-400 font-extrabold uppercase">2. DETALHE DO PARECER</h5>
                    <p className="text-slate-600"><span className="font-semibold">Responsável Técnico:</span> Cledison H. (Tecnólogo em Gestão Fiscal)</p>
                    <p className="text-slate-600"><span className="font-semibold">Lote do Período:</span> {activeBatch.date}</p>
                    <p className="text-slate-600"><span className="font-semibold">Notas Processadas:</span> {activeBatch.totalInvoices} documentos fiscais</p>
                    <p className="text-slate-600"><span className="font-semibold">Volume Faturado:</span> R$ {activeBatch.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {/* HISTORICAL REVENUE & ESTIMATED TAX STATS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-b border-slate-200">
                  <div className="text-center p-3 border border-slate-100 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Impostos Calculados</p>
                    <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">R$ {activeBatch.estimatedTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Sob o regime {activeBatch.clientRegime}</p>
                  </div>
                  <div className="text-center p-3 border border-red-100 bg-red-50/10 rounded-xl">
                    <p className="text-[10px] text-red-600 font-bold uppercase">Irregularidades</p>
                    <p className="text-lg sm:text-xl font-extrabold text-red-600 mt-1">{activeBatch.errorsCount} Erros</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">CFOP/NCM necessitam correção</p>
                  </div>
                  <div className="text-center p-3 border border-emerald-100 bg-emerald-50/20 rounded-xl">
                    <p className="text-[10px] text-emerald-700 font-bold uppercase">Recuperação de Créditos</p>
                    <p className="text-lg sm:text-xl font-extrabold text-emerald-600 mt-1">R$ {activeBatch.taxCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-[9px] text-emerald-700/80 mt-0.5">Valores pagos em duplicidade</p>
                  </div>
                </div>

                {/* AI RENDERED ANALYSIS BLOCKS */}
                <div className="py-6 space-y-6 text-slate-800 text-xs leading-relaxed" id="document-ai-body">
                  
                  {activeBatch.aiAnalysis ? (
                    <div className="space-y-6">
                      
                      {/* Section 1: Visão Geral */}
                      <div className="space-y-2">
                        <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-1">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          1. Resumo Executivo e Saúde Fiscal do Lote
                        </h4>
                        <p className="text-slate-600 leading-relaxed text-justify whitespace-pre-line">
                          {activeBatch.aiAnalysis.visaoGeral}
                        </p>
                      </div>

                      {/* Section 2: Diagnóstico de Incoerências */}
                      <div className="space-y-2">
                        <h4 className="font-extrabold text-sm text-red-700 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-1">
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                          2. Diagnóstico Técnico de Irregularidades Detectadas
                        </h4>
                        <p className="text-slate-600 leading-relaxed text-justify whitespace-pre-line">
                          {activeBatch.aiAnalysis.diagnosticoIncoerencias}
                        </p>
                      </div>

                      {/* Section 3: Oportunidades de Crédito */}
                      <div className="space-y-2">
                        <h4 className="font-extrabold text-sm text-emerald-700 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-1">
                          <Coins className="w-4 h-4 text-emerald-500 shrink-0" />
                          3. Oportunidades de Elisão Fiscal e Recuperação de Impostos
                        </h4>
                        <p className="text-slate-600 leading-relaxed text-justify whitespace-pre-line">
                          {activeBatch.aiAnalysis.oportunidadesCredito}
                        </p>
                      </div>

                      {/* Section 4: COMPARATIVE GRAPH */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 my-6 print:break-inside-avoid">
                        <h5 className="font-bold text-slate-900 text-center uppercase text-[10px] mb-4">Estudo de Carga Tributária Anual Comparativa por Regime</h5>
                        <div className="h-52 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparisonChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                              <YAxis stroke="#64748b" fontSize={11} />
                              <Tooltip formatter={(value) => [`R$ ${value.toLocaleString()}`, 'Imposto Anual Projetado']} />
                              <Bar dataKey="Imposto Anual Projetado" fill="#0f172a">
                                {comparisonChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={index === 0 && activeBatch.clientRegime === 'Simples Nacional' ? '#10b981' : index === 1 && activeBatch.clientRegime === 'Lucro Presumido' ? '#10b981' : index === 2 && activeBatch.clientRegime === 'Lucro Real' ? '#10b981' : '#475569'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">Nota: As projeções consideram o faturamento mensal anualizado de R$ {(activeBatch.totalValue * 12).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}.</p>
                      </div>

                      {/* Section 5: Planejamento Tributário */}
                      <div className="space-y-2">
                        <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-1">
                          <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                          4. Planejamento Tributário e Comparativo de Regimes
                        </h4>
                        <p className="text-slate-600 leading-relaxed text-justify whitespace-pre-line">
                          {activeBatch.aiAnalysis.planejamentoTributario}
                        </p>
                      </div>

                      {/* Section 6: Conclusão e Assinatura */}
                      <div className="space-y-2 pt-6 border-t border-slate-100">
                        <p className="text-slate-600 leading-relaxed text-justify whitespace-pre-line italic">
                          {activeBatch.aiAnalysis.conclusaoAssinatura}
                        </p>
                        
                        {/* Signature lines */}
                        <div className="pt-10 flex justify-between items-center text-center">
                          <div className="w-48 border-t border-slate-300 pt-2">
                            <p className="font-bold text-slate-900">{activeBatch.clientName}</p>
                            <p className="text-slate-400 text-[10px]">Representante Legal</p>
                          </div>
                          <div className="w-56 border-t border-emerald-500 pt-2">
                            <p className="font-bold text-emerald-700">Cledison H. R. C.</p>
                            <p className="text-slate-400 text-[10px]">Analista Fiscal Tributário Sênior</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-3 print:hidden">
                      <Brain className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                      <p className="text-sm font-bold text-slate-700">Nenhuma análise de IA processada para esse lote.</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">Vá para a aba "Auditoria de Lotes", clique no botão "Auditar Lote com IA" para instruir o Gemini a produzir o parecer técnico sênior de conformidade.</p>
                      <button
                        id="btn-goto-batches-and-run"
                        onClick={() => setActiveTab('batches')}
                        className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl"
                      >
                        Auditar Lote Agora
                      </button>
                    </div>
                  )}

                </div>

              </div>
              </>
            ) : (
              <p className="text-center text-slate-400 text-xs">Selecione ou carregue um lote para visualizar o relatório fiscal.</p>
            )}

          </div>
        )}

        {/* TAB 5: REGRAS FISCAIS (Base de Conhecimento) */}
        {activeTab === 'rules' && (
          <div className="space-y-6" id="rules-tab-view">
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4" id="rules-welcome-card">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5.5 h-5.5 text-emerald-500" />
                Dicionário e Regras Fiscais Automatizadas do ERP
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Este ERP atua como seu assistente robótico (RPA Fiscal). Abaixo estão listadas as regras de compliance e cruzamentos que o motor do sistema executa automaticamente em cada XML de NF-e/NFS-e ou planilha carregada:
              </p>

              {/* RULES DIRECTORIES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4" id="rules-directory-grid">
                
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase text-emerald-700">1. Cruzamento de CFOP e UF do Destinatário</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    O sistema verifica se o dígito inicial do CFOP corresponde à operação interestadual ou interna:
                  </p>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-5">
                    <li>CFOPs iniciados em <span className="font-mono font-bold">5</span> (saídas) ou <span className="font-mono font-bold">1</span> (entradas): Operação <span className="font-bold">interna</span> (Emissor e Destinatário no mesmo estado).</li>
                    <li>CFOPs iniciados em <span className="font-mono font-bold">6</span> (saídas) ou <span className="font-mono font-bold">2</span> (entradas): Operação <span className="font-bold">interestadual</span> (Emissor e Destinatário em estados diferentes).</li>
                    <li><span className="text-red-600 font-bold">Detecção:</span> O sistema acusa um erro se houver divergência entre a UF do emitente, a UF do destinatário e estes dígitos do CFOP.</li>
                  </ul>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase text-emerald-700">2. Mapeamento de Tributação Monofásica</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Na sistemática monofásica do PIS/COFINS, a indústria recolhe o tributo de toda a cadeia de uma vez. Distribuidores e revendedores ficam isentos na saída.
                  </p>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-5">
                    <li><span className="font-bold">NCMs Mapeados:</span> Cosméticos (3303..3307), Autopeças (8708), Bebidas (2201..2203), Medicamentos (3003/3004).</li>
                    <li><span className="text-red-600 font-bold">Detecção:</span> Se o cliente é revendedor Simples Nacional e revende estes NCMs tributando normalmente (CSOSN 102/101), o sistema aponta erro e calcula créditos de dedução no DAS. No Lucro Presumido/Real, acusa erro por não uso do CST 04.</li>
                  </ul>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase text-emerald-700">3. ICMS por Substituição Tributária (ST)</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Similar à monofasia, mas aplicável ao imposto estadual (ICMS). O imposto é recolhido pelo primeiro elo da cadeia produtiva.
                  </p>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-5">
                    <li><span className="font-bold">NCMs Mapeados:</span> Autopeças (8708), Alimentos processados (ex: chocolates 1806), Higiene pessoal e Saneantes (3402).</li>
                    <li><span className="text-red-600 font-bold">Detecção:</span> Revendedores não podem pagar ICMS integral de itens com ST. O sistema acusa erros se houver uso de CST 00 (Presumido/Real) ou CSOSN 102 (Simples) em itens com NCMs com ST, indicando o uso correto de CSOSN 500 ou CST 60.</li>
                  </ul>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase text-emerald-700">4. Créditos de Notas de Entrada no Lucro Real</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Diferente dos outros regimes, o Lucro Real é não-cumulativo para PIS e COFINS. Cada compra de insumos produtivos ou mercadorias de revenda gera direito a crédito fiscal de 1,65% e 7.60%.
                  </p>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-5">
                    <li><span className="font-bold">Mapeamento de Entrada:</span> Identificado por CFOPs de compra (iniciados com 1 ou 2).</li>
                    <li><span className="text-emerald-600 font-bold">Crédito Automático:</span> O sistema calcula automaticamente o valor recuperável de PIS/COFINS (9,25% combinados) sobre as compras, reduzindo o saldo final a pagar do imposto mensal.</li>
                  </ul>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 4.5: MOTOR FISCAL & BANCO DE DADOS (45 BLOCOS) */}
        {activeTab === 'database' && (
          <div className="space-y-6 animate-in fade-in duration-150" id="database-tab-view">
            
            {/* CONNECTION STATUS & SUMMARY BANNER */}
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 text-white relative overflow-hidden shadow-xl" id="db-status-banner">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-400">
                <Database className="w-48 h-48" />
              </div>
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-slate-800 rounded-xl text-emerald-400 border border-slate-700">
                      <Cpu className="w-6 h-6 animate-pulse" />
                    </span>
                    <div>
                      <h3 className="text-2xl font-extrabold tracking-tight">Motor de Inteligência Fiscal & Integração Supabase</h3>
                      <p className="text-xs text-slate-400">Câmera Fiscal Smart AI — Versão Consolidada de 45 Blocos de Legislação</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                    O ERP Câmera Fiscal possui um motor de cálculo integrado que roda 100% no banco de dados <strong>Supabase (PostgreSQL)</strong> através de stored procedures (Blocos 1 ao 45). Se o Supabase estiver desconectado, o sistema executa automaticamente a <strong>replica local do motor fiscal em Javascript sênior</strong>, garantindo resiliência matemática total.
                  </p>
                </div>
                
                {/* Status indicator badge */}
                <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 flex flex-col justify-center items-center text-center space-y-2 min-w-[220px]">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Status do Banco Supabase</span>
                  {supabaseStatus === 'checking' && (
                    <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
                      Verificando conexão...
                    </div>
                  )}
                  {supabaseStatus === 'active' && (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                        <CheckCircle className="w-4.5 h-4.5" />
                        100% Conectado e Ativo
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">Stored Procedures e Triggers Prontas</span>
                    </div>
                  )}
                  {supabaseStatus === 'missing_creds' && (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs text-center leading-tight">
                        <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                        Rodando em Modo Local Fallback
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 max-w-[190px] leading-tight">
                        Adicione SUPABASE_URL e SUPABASE_ANON_KEY no menu de configurações para ativar o banco de nuvem.
                      </span>
                    </div>
                  )}
                  {supabaseStatus === 'schema_error' && (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs text-center leading-tight">
                        <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0" />
                        Erro de Esquema / Banco Vazio
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 max-w-[190px] leading-tight">
                        Banco ativo, mas sem tabelas. Copie e execute o Script SQL abaixo no console do Supabase para criar os 45 blocos!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TWO SECTION LAYOUT: TEST SUITE & INTERACTIVE SIMULATION CALCULATORS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="db-split-layout">
              
              {/* INTERACTIVE ENGINE CALCULATORS (LEFT - 8 COLS) */}
              <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6" id="db-calculators-card">
                <div className="border-b border-slate-100 pb-4">
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-emerald-500" />
                    Consola de Teste de Parâmetros e Cálculos (Simulador do Motor)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Teste interativamente o comportamento das fórmulas e alíquotas do motor tributário de 45 blocos:
                  </p>
                </div>

                {/* Sub tabs for calculators */}
                <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto" id="calc-subtabs-bar">
                  <button
                    onClick={() => setDbCalcSubTab('simples')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      dbCalcSubTab === 'simples' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Simples Nacional (Fator R)
                  </button>
                  <button
                    onClick={() => setDbCalcSubTab('mei')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      dbCalcSubTab === 'mei' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    MEI (DAs & Limites)
                  </button>
                  <button
                    onClick={() => setDbCalcSubTab('presumido')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      dbCalcSubTab === 'presumido' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Lucro Presumido
                  </button>
                  <button
                    onClick={() => setDbCalcSubTab('real')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      dbCalcSubTab === 'real' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Lucro Real (Compensação 30%)
                  </button>
                  <button
                    onClick={() => setDbCalcSubTab('difal_st')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      dbCalcSubTab === 'difal_st' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    DIFAL & ICMS-ST (MVA)
                  </button>
                  <button
                    onClick={() => setDbCalcSubTab('retencoes')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      dbCalcSubTab === 'retencoes' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Retenções (CSRF, INSS, ISS)
                  </button>
                </div>

                {/* Sub Tab Panel Content */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100" id="calc-panel-container">
                  
                  {/* SIMPLES NACIONAL */}
                  {dbCalcSubTab === 'simples' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400">Entradas de Parâmetros</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Receita Bruta Acumulada (12m)</label>
                            <input
                              type="number"
                              value={simplesForm.revenue12m}
                              onChange={(e) => setSimplesForm({ ...simplesForm, revenue12m: Number(e.target.value) })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Valor do Faturamento / Nota Fiscal</label>
                            <input
                              type="number"
                              value={simplesForm.value}
                              onChange={(e) => setSimplesForm({ ...simplesForm, value: Number(e.target.value) })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Anexo Sugerido</label>
                              <select
                                value={simplesForm.anexo}
                                onChange={(e) => setSimplesForm({ ...simplesForm, anexo: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                              >
                                <option value="I">Anexo I (Comércio)</option>
                                <option value="II">Anexo II (Indústria)</option>
                                <option value="III">Anexo III (Serviços G)</option>
                                <option value="IV">Anexo IV (Serviços Const)</option>
                                <option value="V">Anexo V (Serviços Tech)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Folha de Pagamento (12m)</label>
                              <input
                                type="number"
                                value={simplesForm.salary12m}
                                onChange={(e) => setSimplesForm({ ...simplesForm, salary12m: Number(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* SIMPLES NACIONAL RESULTS */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3 shadow-inner">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-700 flex items-center justify-between">
                          <span>Resultado de Simulação</span>
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded">Bloco 2 e 3</span>
                        </h5>
                        
                        {(() => {
                          const res = calculateSimplesNacionalLocal(simplesForm.anexo, simplesForm.revenue12m, simplesForm.value, simplesForm.salary12m);
                          return (
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">Fator R Calculado:</span>
                                <span className="font-mono font-bold text-slate-900">{(res.fator_r * 100).toFixed(2)}%</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">Anexo Final Aplicado:</span>
                                <span className="font-bold text-emerald-700">Anexo {res.anexo_utilizado} {res.anexo_alterado_por_fator_r ? '(Alterado por Fator R!)' : ''}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">Faixa de Faturamento:</span>
                                <span className="font-mono font-bold text-slate-900">Faixa {res.faixa}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">Alíquota Nominal:</span>
                                <span className="font-mono font-bold text-slate-900">{res.aliquota_nominal_pct.toFixed(2)}%</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">Parcela a Deduzir:</span>
                                <span className="font-mono font-bold text-slate-900">R$ {res.valor_deduzir.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1 font-bold text-slate-900">
                                <span className="text-slate-700">Alíquota Efetiva:</span>
                                <span className="font-mono text-emerald-600">{res.aliquota_efetiva_pct}%</span>
                              </div>
                              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-center mt-3 border border-slate-800">
                                <span className="text-[10px] text-slate-400 block font-extrabold uppercase tracking-wider">DAS Simples Nacional Estimado</span>
                                <span className="text-lg font-mono font-extrabold">R$ {res.valor_simples_devido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 text-center leading-tight mt-1">Fundamento Legal: {res.fundamento_legal}</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* MEI */}
                  {dbCalcSubTab === 'mei' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400">Entradas de Parâmetros</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Receita do Mês</label>
                            <input
                              type="number"
                              value={meiForm.revenueMonth}
                              onChange={(e) => setMeiForm({ ...meiForm, revenueMonth: Number(e.target.value) })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Receita Acumulada no Ano (Recolhimento)</label>
                            <input
                              type="number"
                              value={meiForm.revenueYear}
                              onChange={(e) => setMeiForm({ ...meiForm, revenueYear: Number(e.target.value) })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Atividade Econômica</label>
                            <select
                              value={meiForm.activity}
                              onChange={(e) => setMeiForm({ ...meiForm, activity: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                            >
                              <option value="comercio_industria">Apenas Comércio / Indústria (ICMS)</option>
                              <option value="servico">Apenas Prestação de Serviços (ISS)</option>
                              <option value="comercio_e_servico">Atividade Mista (ICMS e ISS)</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Data de Abertura</label>
                              <input
                                type="date"
                                value={meiForm.openingDate}
                                onChange={(e) => setMeiForm({ ...meiForm, openingDate: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Mês de Competência</label>
                              <input
                                type="date"
                                value={meiForm.competence}
                                onChange={(e) => setMeiForm({ ...meiForm, competence: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* MEI RESULTS */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3 shadow-inner">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-700 flex items-center justify-between">
                          <span>Resultado de Simulação</span>
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded">Bloco 6</span>
                        </h5>
                        
                        {(() => {
                          const res = calculateMeiLocal(meiForm.activity, meiForm.revenueMonth, meiForm.revenueYear, meiForm.openingDate, meiForm.competence);
                          return (
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">Meses Ativos no Ano:</span>
                                <span className="font-mono font-bold text-slate-900">{res.meses_ativos_no_ano} meses</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">Limite Proporcional:</span>
                                <span className="font-mono font-bold text-slate-900">R$ {res.limite_proporcional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">Percentual do Limite Gasto:</span>
                                <span className={`font-mono font-bold ${res.percentual_do_limite_usado > 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {res.percentual_do_limite_usado}%
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">Enquadramento MEI:</span>
                                <span className={`font-bold uppercase ${
                                  res.situacao === 'dentro_limite' ? 'text-emerald-600' : res.situacao === 'excesso_ate_20' ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                  {res.situacao.replace(/_/g, ' ')}
                                </span>
                              </div>
                              
                              {res.alerta && (
                                <div className="p-2.5 bg-red-50 border border-red-100 text-red-800 text-[10px] rounded-lg leading-relaxed font-semibold">
                                  ⚠️ {res.alerta}
                                </div>
                              )}

                              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-center mt-3 border border-slate-800 space-y-1">
                                <span className="text-[10px] text-slate-400 block font-extrabold uppercase tracking-wider">DAS Mensal Fixo (Competência 2026)</span>
                                <span className="text-lg font-mono font-extrabold">R$ {res.das_devido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                <span className="text-[9px] text-slate-400 block leading-tight">
                                  Composição: INSS R$ {res.composicao_das.inss.toFixed(2)} | ICMS R$ {res.composicao_das.icms.toFixed(2)} | ISS R$ {res.composicao_das.iss.toFixed(2)}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 text-center leading-tight mt-1">Fundamento: {res.fundamento_legal}</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* LUCRO PRESUMIDO */}
                  {dbCalcSubTab === 'presumido' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400">Entradas de Parâmetros</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Receita Bruta Mensal do Período</label>
                            <input
                              type="number"
                              value={presumidoForm.revenueMonth}
                              onChange={(e) => setPresumidoForm({ ...presumidoForm, revenueMonth: Number(e.target.value) })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Atividade Comercial / Serviços</label>
                            <select
                              value={presumidoForm.activity}
                              onChange={(e) => setPresumidoForm({ ...presumidoForm, activity: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                            >
                              <option value="comercio">Venda de Mercadorias (Comércio - Presunção 8% IRPJ / 12% CSLL)</option>
                              <option value="industria">Operação Industrial (Indústria - Presunção 8% IRPJ / 12% CSLL)</option>
                              <option value="servico_geral">Prestação de Serviços Gerais (Serviços - Presunção 32% IRPJ / 32% CSLL)</option>
                              <option value="revenda_combustivel">Revenda de Combustíveis (Combustível - Presunção 1.6% IRPJ / 12% CSLL)</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              id="presumido-isproduct"
                              checked={presumidoForm.isProduct}
                              onChange={(e) => setPresumidoForm({ ...presumidoForm, isProduct: e.target.checked })}
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                            />
                            <label htmlFor="presumido-isproduct" className="text-xs font-bold text-slate-700">Operação envolve mercadorias físicas (ICMS)?</label>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">UF Origem</label>
                              <select
                                value={presumidoForm.stateOrig}
                                onChange={(e) => setPresumidoForm({ ...presumidoForm, stateOrig: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold"
                              >
                                {['SP', 'RJ', 'MG', 'AL', 'PR', 'BA', 'PE', 'SC'].map(uf => (
                                  <option key={uf} value={uf}>{uf}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">UF Destino</label>
                              <select
                                value={presumidoForm.stateDest}
                                onChange={(e) => setPresumidoForm({ ...presumidoForm, stateDest: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold"
                              >
                                {['SP', 'RJ', 'MG', 'AL', 'PR', 'BA', 'PE', 'SC'].map(uf => (
                                  <option key={uf} value={uf}>{uf}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Alíquota ISS (%)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={presumidoForm.issRate}
                                onChange={(e) => setPresumidoForm({ ...presumidoForm, issRate: Number(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* PRESUMIDO RESULTS */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3 shadow-inner">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-700 flex items-center justify-between">
                          <span>Resultado de Simulação</span>
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded">Bloco 7 & 12</span>
                        </h5>
                        
                        {(() => {
                          const res = calculateLucroPresumidoLocal(
                            presumidoForm.activity,
                            presumidoForm.revenueMonth,
                            presumidoForm.isProduct,
                            presumidoForm.stateOrig,
                            presumidoForm.stateDest,
                            presumidoForm.issRate
                          );
                          return (
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">Base Estimada IRPJ:</span>
                                <span className="font-mono font-bold text-slate-900">R$ {res.irpj.base_presumida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">IRPJ Normal + Adicional (10%):</span>
                                <span className="font-mono font-bold text-slate-900">
                                  R$ {res.irpj.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                                  {res.irpj.adicional > 0 ? ` + R$ ${res.irpj.adicional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">CSLL Devida:</span>
                                <span className="font-mono font-bold text-slate-900">R$ {res.csll.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">PIS (0.65% cumulativo):</span>
                                <span className="font-mono font-bold text-slate-900">R$ {res.pis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">COFINS (3% cumulativo):</span>
                                <span className="font-mono font-bold text-slate-900">R$ {res.cofins.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              {res.icms && (
                                <div className="flex justify-between border-b border-slate-100 py-1 font-semibold text-slate-800">
                                  <span>ICMS Interestadual ({res.icms.aliquota_pct}%):</span>
                                  <span className="font-mono">R$ {res.icms.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              {res.iss && (
                                <div className="flex justify-between border-b border-slate-100 py-1 font-semibold text-slate-800">
                                  <span>ISS Municipal ({res.iss.aliquota_pct}%):</span>
                                  <span className="font-mono">R$ {res.iss.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-center mt-3 border border-slate-800">
                                <span className="text-[10px] text-slate-400 block font-extrabold uppercase tracking-wider">Total de Impostos no Presumido</span>
                                <span className="text-lg font-mono font-extrabold">R$ {res.total_geral_devido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 text-center leading-tight mt-1">Fundamento Legal: {res.fundamento_legal}</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* LUCRO REAL */}
                  {dbCalcSubTab === 'real' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400">Entradas de Parâmetros</h5>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Lucro Líquido Contábil</label>
                              <input
                                type="number"
                                value={realForm.profitContabil}
                                onChange={(e) => setRealForm({ ...realForm, profitContabil: Number(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Faturamento Trimestral</label>
                              <input
                                type="number"
                                value={realForm.revenue}
                                onChange={(e) => setRealForm({ ...realForm, revenue: Number(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Adições ao LALUR (+)</label>
                              <input
                                type="number"
                                value={realForm.additions}
                                onChange={(e) => setRealForm({ ...realForm, additions: Number(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Exclusões ao LALUR (-)</label>
                              <input
                                type="number"
                                value={realForm.exclusions}
                                onChange={(e) => setRealForm({ ...realForm, exclusions: Number(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Prejuízos Fiscais Anteriores Compensar</label>
                            <input
                              type="number"
                              value={realForm.previousLosses}
                              onChange={(e) => setRealForm({ ...realForm, previousLosses: Number(e.target.value) })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Créditos PIS Compras</label>
                              <input
                                type="number"
                                value={realForm.pisCredit}
                                onChange={(e) => setRealForm({ ...realForm, pisCredit: Number(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Créditos COFINS Compras</label>
                              <input
                                type="number"
                                value={realForm.cofinsCredit}
                                onChange={(e) => setRealForm({ ...realForm, cofinsCredit: Number(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* LUCRO REAL RESULTS */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3 shadow-inner">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-700 flex items-center justify-between">
                          <span>Resultado de Simulação</span>
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded">Bloco 8</span>
                        </h5>
                        
                        {(() => {
                          const res = calculateLucroRealLocal(
                            realForm.profitContabil,
                            realForm.revenue,
                            realForm.additions,
                            realForm.exclusions,
                            realForm.previousLosses,
                            realForm.pisCredit,
                            realForm.cofinsCredit,
                            realForm.months
                          );
                          return (
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">Lucro Real Ajustado:</span>
                                <span className="font-mono font-bold text-slate-900">R$ {res.lucro_ajustado_irpj.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">Prejuízo Compensado (Trava 30%):</span>
                                <span className="font-mono font-bold text-amber-700">-R$ {res.prejuizo_fiscal.compensado_neste_periodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">Base Tributável Final IRPJ:</span>
                                <span className="font-mono font-bold text-slate-900">R$ {res.irpj.base.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">IRPJ Total Devido (Normal+Adic):</span>
                                <span className="font-mono font-bold text-slate-900">R$ {(res.irpj.valor + res.irpj.adicional).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">CSLL Final Devida (9%):</span>
                                <span className="font-mono font-bold text-slate-900">R$ {res.csll.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">PIS (Débito {res.pis.debito} - Crédito {res.pis.credito}):</span>
                                <span className="font-mono font-bold text-slate-900">R$ {res.pis.a_pagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">COFINS (Débito {res.cofins.debito} - Crédito {res.cofins.credito}):</span>
                                <span className="font-mono font-bold text-slate-900">R$ {res.cofins.a_pagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-center mt-3 border border-slate-800">
                                <span className="text-[10px] text-slate-400 block font-extrabold uppercase tracking-wider">Total de Tributos Federais a Pagar</span>
                                <span className="text-lg font-mono font-extrabold">R$ {res.total_geral_devido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 text-center leading-tight mt-1">Fundamento Legal: {res.fundamento_legal}</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* DIFAL & ST */}
                  {dbCalcSubTab === 'difal_st' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400">Entradas de Parâmetros</h5>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">UF Origem (Emissor)</label>
                              <select
                                value={difalStForm.stateOrig}
                                onChange={(e) => setDifalStForm({ ...difalStForm, stateOrig: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold"
                              >
                                {['SP', 'RJ', 'MG', 'AL', 'PR', 'BA'].map(uf => (
                                  <option key={uf} value={uf}>{uf}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">UF Destino (Consumo)</label>
                              <select
                                value={difalStForm.stateDest}
                                onChange={(e) => setDifalStForm({ ...difalStForm, stateDest: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold"
                              >
                                {['SP', 'RJ', 'MG', 'AL', 'PR', 'BA'].map(uf => (
                                  <option key={uf} value={uf}>{uf}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Valor da Operação / Item</label>
                              <input
                                type="number"
                                value={difalStForm.value}
                                onChange={(e) => setDifalStForm({ ...difalStForm, value: Number(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">ICMS Próprio Destacado</label>
                              <input
                                type="number"
                                value={difalStForm.icmsProprio}
                                onChange={(e) => setDifalStForm({ ...difalStForm, icmsProprio: Number(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-500 font-bold">Valor IPI</label>
                              <input
                                type="number"
                                value={difalStForm.ipi}
                                onChange={(e) => setDifalStForm({ ...difalStForm, ipi: Number(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 font-bold">Frete</label>
                              <input
                                type="number"
                                value={difalStForm.freight}
                                onChange={(e) => setDifalStForm({ ...difalStForm, freight: Number(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 font-bold">Outras Desp</label>
                              <input
                                type="number"
                                value={difalStForm.expenses}
                                onChange={(e) => setDifalStForm({ ...difalStForm, expenses: Number(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 pt-1 border-t border-slate-100 mt-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="difal-finalcon"
                                checked={difalStForm.isFinalConsumer}
                                onChange={(e) => setDifalStForm({ ...difalStForm, isFinalConsumer: e.target.checked })}
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                              />
                              <label htmlFor="difal-finalcon" className="text-xs font-bold text-slate-700">Comprador é Consumidor Final?</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="difal-doublebase"
                                checked={difalStForm.useDoubleBase}
                                onChange={(e) => setDifalStForm({ ...difalStForm, useDoubleBase: e.target.checked })}
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                              />
                              <label htmlFor="difal-doublebase" className="text-xs font-bold text-slate-700">Usar cálculo DIFAL Base Dupla (por dentro)?</label>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* DIFAL & ST RESULTS */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3 shadow-inner">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-700 flex items-center justify-between">
                          <span>Resultado de Simulação</span>
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded">Bloco 9 & 28 & 35</span>
                        </h5>
                        
                        {(() => {
                          const difalRes = calculateDifalLocal(difalStForm.stateOrig, difalStForm.stateDest, difalStForm.value, difalStForm.isFinalConsumer, difalStForm.useDoubleBase);
                          const stRes = calculateIcmsStLocal(difalStForm.ncm, difalStForm.cest, difalStForm.stateDest, difalStForm.value, difalStForm.icmsProprio, difalStForm.ipi, difalStForm.freight, difalStForm.expenses, null, difalStForm.stateOrig);
                          return (
                            <div className="space-y-2 text-xs">
                              {/* ST result representation */}
                              <div className="border-b border-slate-100 pb-2">
                                <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider text-emerald-800">Cálculo ICMS Substituição Tributária (ST)</span>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                  <div>
                                    <span className="text-slate-400 block text-[9px]">MVA Ajustado:</span>
                                    <span className="font-mono font-bold text-slate-800">{stRes.mva_utilizado_pct}%</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[9px]">Base de Cálculo ST:</span>
                                    <span className="font-mono font-bold text-slate-800">R$ {stRes.base_st.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[9px]">Aliquota Destino:</span>
                                    <span className="font-mono font-bold text-slate-800">{stRes.aliquota_interna_destino_pct}%</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[9px]">ICMS-ST a Recolher:</span>
                                    <span className="font-mono font-extrabold text-slate-950">R$ {stRes.icms_st_a_recolher.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                </div>
                              </div>

                              {/* DIFAL result representation */}
                              <div>
                                <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider text-emerald-800">Diferencial de Alíquota (DIFAL)</span>
                                {difalRes.error ? (
                                  <span className="text-red-500 font-semibold block mt-1">{difalRes.error}</span>
                                ) : !difalRes.aplica_difal ? (
                                  <span className="text-amber-600 font-semibold block mt-1">{difalRes.motivo}</span>
                                ) : (
                                  <div className="grid grid-cols-2 gap-2 mt-1">
                                    <div>
                                      <span className="text-slate-400 block text-[9px]">Base do DIFAL:</span>
                                      <span className="font-mono font-bold text-slate-800">R$ {difalRes.base_difal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[9px]">Interna Destino:</span>
                                      <span className="font-mono font-bold text-slate-800">{difalRes.aliquota_interna_destino_pct}%</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[9px]">Fundo Pobreza (FCP):</span>
                                      <span className="font-mono font-bold text-slate-800">R$ {difalRes.fcp_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[9px]">DIFAL Líquido:</span>
                                      <span className="font-mono font-extrabold text-slate-950">R$ {difalRes.difal_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-center mt-3 border border-slate-800">
                                <span className="text-[10px] text-slate-400 block font-extrabold uppercase tracking-wider">Total de DIFAL a Recolher (Guia GNRE)</span>
                                <span className="text-lg font-mono font-extrabold">R$ {(difalRes.total_recolher || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 text-center leading-tight mt-1">Fundamento: {difalRes.fundamento_legal || stRes.fundamento_legal}</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* RETENÇÕES */}
                  {dbCalcSubTab === 'retencoes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400">Entradas de Parâmetros</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Valor do Serviço na Nota</label>
                            <input
                              type="number"
                              value={retencoesForm.value}
                              onChange={(e) => setRetencoesForm({ ...retencoesForm, value: Number(e.target.value) })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Materiais / Equipamentos a Deduzir (INSS)</label>
                            <input
                              type="number"
                              value={retencoesForm.materialDeduction}
                              onChange={(e) => setRetencoesForm({ ...retencoesForm, materialDeduction: Number(e.target.value) })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2 pt-1 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="ret-simples"
                                checked={retencoesForm.isSimples}
                                onChange={(e) => setRetencoesForm({ ...retencoesForm, isSimples: e.target.checked })}
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                              />
                              <label htmlFor="ret-simples" className="text-xs font-bold text-slate-700">Prestador é Simples Nacional?</label>
                            </div>
                            <div className="flex items-center gap-2 pl-4">
                              <input
                                type="checkbox"
                                id="ret-anexoiv"
                                disabled={!retencoesForm.isSimples}
                                checked={retencoesForm.isAnexoIv}
                                onChange={(e) => setRetencoesForm({ ...retencoesForm, isAnexoIv: e.target.checked })}
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 disabled:opacity-50"
                              />
                              <label htmlFor="ret-anexoiv" className="text-xs font-bold text-slate-700 disabled:opacity-50">Se Simples, enquadrado no Anexo IV (Mão de Obra)?</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="ret-mei"
                                checked={retencoesForm.isMei}
                                onChange={(e) => setRetencoesForm({ ...retencoesForm, isMei: e.target.checked })}
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                              />
                              <label htmlFor="ret-mei" className="text-xs font-bold text-slate-700">Prestador é MEI (Cessão de Mão de Obra)?</label>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="checkbox"
                                id="ret-csrf"
                                checked={retencoesForm.hasCsrf}
                                onChange={(e) => setRetencoesForm({ ...retencoesForm, hasCsrf: e.target.checked })}
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                              />
                              <label htmlFor="ret-csrf" className="text-xs font-bold text-slate-700">Sujeito a Retenção de CSRF (4,65%)?</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="ret-irrf"
                                checked={retencoesForm.hasIrrf15}
                                onChange={(e) => setRetencoesForm({ ...retencoesForm, hasIrrf15: e.target.checked })}
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                              />
                              <label htmlFor="ret-irrf" className="text-xs font-bold text-slate-700">Sujeito a Retenção de IRRF (1,5%)?</label>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* RETENÇÕES RESULTS */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3 shadow-inner">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-700 flex items-center justify-between">
                          <span>Resultado de Simulação</span>
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded">Bloco 30 & 32</span>
                        </h5>
                        
                        {(() => {
                          const fedRes = calculateFederalRetentionLocal(retencoesForm.value, retencoesForm.isSimples, retencoesForm.hasCsrf, retencoesForm.hasIrrf15);
                          const inssRes = calculateInssRetentionLocal(retencoesForm.value, retencoesForm.isSimples, retencoesForm.isAnexoIv, retencoesForm.isMei, retencoesForm.materialDeduction);
                          const isDispensadoInss = inssRes.dispensado_limite_minimo;
                          const inssEfetivo = isDispensadoInss ? 0 : inssRes.valor_retido;
                          const retencaoTotal = fedRes.total_retido + inssEfetivo;
                          return (
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">CSRF Retido (PIS/COFINS/CSLL):</span>
                                <span className="font-mono font-bold text-slate-900">R$ {fedRes.csrf_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">IRRF Retido (1.5%):</span>
                                <span className="font-mono font-bold text-slate-900">R$ {fedRes.irrf_retido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">INSS Retido ({inssRes.aliquota_pct}%):</span>
                                <span className="font-mono font-bold text-slate-900">
                                  {isDispensadoInss ? 'Dispensado (< R$10)' : `R$ ${inssRes.valor_retido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-1">
                                <span className="text-slate-500">Valor Bruto da Nota:</span>
                                <span className="font-mono font-bold text-slate-900">R$ {retencoesForm.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              
                              {fedRes.motivo_revisao && (
                                <p className="text-[10px] text-slate-500 leading-tight border-l-2 border-emerald-500 pl-2 py-0.5">
                                  {fedRes.motivo_revisao}
                                </p>
                              )}
                              {inssRes.motivo_revisao && (
                                <p className="text-[10px] text-slate-500 leading-tight border-l-2 border-emerald-500 pl-2 py-0.5">
                                  {inssRes.motivo_revisao}
                                </p>
                              )}

                              <div className="grid grid-cols-2 gap-2 mt-3">
                                <div className="bg-slate-100 text-slate-800 p-2.5 rounded-lg text-center border border-slate-200">
                                  <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Total Retido</span>
                                  <span className="text-sm font-mono font-extrabold text-slate-900">R$ {retencaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg text-center border border-slate-800">
                                  <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Líquido a Pagar</span>
                                  <span className="text-sm font-mono font-extrabold">R$ {(retencoesForm.value - retencaoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-400 text-center leading-tight mt-1">Fundamento: {fedRes.fundamento_legal} | {inssRes.fundamento_legal}</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* INTEGRATED TEST SUITE PANEL (RIGHT - 4 COLS) */}
              <div className="lg:col-span-4 bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white space-y-6" id="db-test-suite-card">
                <div className="border-b border-slate-800 pb-4 space-y-2">
                  <h4 className="text-base font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    Suíte de Testes do Motor Fiscal
                  </h4>
                  <p className="text-xs text-slate-400">
                    O bloco 37 (`fn_rodar_testes_motor_fiscal`) é executável. Execute a suíte de testes integrada para auditar o compliance matemático da nossa aplicação:
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    disabled={runningTests}
                    onClick={() => {
                      setRunningTests(true);
                      setTimeout(() => {
                        const results = runLocalTestSuite();
                        setTestResults(results);
                        setRunningTests(false);
                      }, 400);
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-500/10"
                  >
                    <Play className={`w-4 h-4 ${runningTests ? 'animate-spin' : ''}`} />
                    {runningTests ? 'Rodando Auditoria...' : 'Executar Testes de Compliance'}
                  </button>

                  {/* TEST RESULTS DISPLAY */}
                  {testResults ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1" id="test-results-list">
                      <div className="flex items-center justify-between text-xs font-bold border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Cenários de Legislação</span>
                        <span className="text-emerald-400">
                          {testResults.filter(r => r.passou).length}/{testResults.length} Passaram
                        </span>
                      </div>
                      
                      {testResults.map((res, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-800 rounded-xl border border-slate-700/50 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-200 leading-tight">{res.teste}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-extrabold tracking-wider uppercase ${
                              res.passou ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {res.passou ? 'Passou' : 'Falhou'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                            <span>Esp: <span className="text-emerald-400 font-bold">{res.esperado}</span></span>
                            <span>Obt: <span className="text-slate-200 font-bold">{res.obtido}</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-800/40 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center space-y-2">
                      <Cpu className="w-8 h-8 text-slate-600 animate-pulse" />
                      <p className="text-xs text-slate-400 font-bold">Nenhum teste executado ainda.</p>
                      <p className="text-[10px] text-slate-500 max-w-[190px]">Clique no botão acima para submeter as alíquotas a testes rigorosos.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* INTERACTIVE 45 BLOCKS EXPLORER DICTIONARY */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4" id="db-dictionary-card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-500" />
                    Dicionário do Motor Fiscal (Dicionário de dados dos 45 Blocos)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Abaixo estão mapeados todos os 45 blocos estruturais do motor integrados ao banco de dados Supabase e replicados localmente:
                  </p>
                </div>
                
                {/* Search in blocks */}
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar nos 45 blocos..."
                    value={dbSearchTerm}
                    onChange={(e) => setDbSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Grid of 45 blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-1" id="db-blocks-grid">
                {(() => {
                  const databaseBlocks = [
                    { num: "Bloco A", title: "Tenants, Users & RBAC", cat: "Estrutura Core", desc: "Isolamento lógico multitenant de escritórios de contabilidade e empresas, perfis, e controle de acesso baseado em papéis (RBAC).", obj: "tabela tenants, usuarios_perfil" },
                    { num: "Bloco B", title: "SaaS Plans & Billing Tracker", cat: "Estrutura Core", desc: "Controle de planos SaaS, faturamento, limites de processamento de XML por escritório e regras de monetização.", obj: "tabela planos_saas, assinaturas" },
                    { num: "Bloco C", title: "Tax Registers (Cadastro de Empresas)", cat: "Tabelas Base", desc: "Cadastro avançado de certificados digitais, empresas, regimes de tributação, alíquotas e códigos do IBGE.", obj: "tabela empresas, certificados" },
                    { num: "Bloco D", title: "Fiscal Documents Manager (Lotes)", cat: "Tabelas Base", desc: "Controle de documentos fiscais de entrada e saída (NF-e, NFC-e, CT-e, MDF-e), chaves de acesso de 44 dígitos e controle de lotes.", obj: "tabela documentos_fiscais, lotes_documentos" },
                    { num: "Bloco E", title: "Temporal Tax Parameters", cat: "Regras e Cálculos", desc: "Mapeamento temporal de alíquotas de tributação, faixas e parâmetros atualizáveis de acordo com a legislação vigente.", obj: "tabela regras_tributarias_temporal" },
                    { num: "Bloco E2", title: "Audit Log Cache & Indexes", cat: "Estrutura Core", desc: "Cache temporário para auditoria de lotes de notas em lote, otimizando velocidade de recalculos massivos.", obj: "tabela cache_auditoria, indices" },
                    { num: "Bloco F", title: "Telemetry & Performance Tracker", cat: "Estrutura Core", desc: "Logs de execução do motor, tempos de resposta, volumetria e telemetria de erros para controle de performance.", obj: "tabela logs_telemetria_motor" },
                    { num: "Bloco G", title: "Contador productivity & chat logs", cat: "Estrutura Core", desc: "Banco de dados de controle de tarefas do calendário fiscal, agenda automática de obrigações e chat de suporte.", obj: "tabela agenda_contabil, logs_chat" },
                    { num: "Bloco H", title: "LGPD Consent & Logs", cat: "Estrutura Core", desc: "Trilha de consentimento de privacidade, criptografia e direito de esquecimento em conformidade com a LGPD.", obj: "tabela consentimento_lgpd" },
                    { num: "Bloco I", title: "Views for Dashboards", cat: "Visualizações", desc: "Views SQL otimizadas para gerar demonstrativos mensais, apuração de Simples Nacional, margens de crédito e riscos fiscais.", obj: "vw_apuracao_mensal, vw_dashboard_geral" },
                    { num: "Bloco J", title: "Auditing triggers", cat: "Auditorias & Triggers", desc: "Triggers que registram e bloqueiam qualquer alteração não autorizada de parâmetros fiscais passados, garantindo governança.", obj: "trg_log_auditoria_regras" },
                    { num: "Bloco K", title: "Tenant isolation prevention", cat: "Auditorias & Triggers", desc: "Triggers de proteção no banco para impedir que qualquer operação afete outros escritórios (vazamento de dados).", obj: "trg_check_tenant_isolation" },
                    { num: "Bloco L", title: "Row Level Security (RLS)", cat: "Estrutura Core", desc: "Políticas do PostgreSQL para garantir que cada usuário autenticado veja apenas dados pertencentes ao seu próprio Tenant.", obj: "ENABLE ROW LEVEL SECURITY" },
                    { num: "Bloco M", title: "Human Feedback Loop API", cat: "Auditorias & Triggers", desc: "Endpoint de feedback para que revisores fiscais aprovem ou rejeitem divergências geradas pela IA sênior, refinando o motor.", obj: "fn_registrar_feedback_auditoria" },
                    { num: "Patch V8.2", title: "Timeout Lock Prevention & Stack Traces", cat: "Estrutura Core", desc: "Tratamento de bloqueios de concorrência e armazenamento de pilha de erros para depuração de triggers complexos.", obj: "fn_logger_error_stack" },
                    { num: "Patch LGPD", title: "Right to be forgotten & Regime Check", cat: "Estrutura Core", desc: "Exclusão permanente de dados de clientes a pedido (esquecimento) e validação estrita do regime de novos CNPJs cadastrados.", obj: "fn_excluir_tenant_completo, fn_validar_regime_tributario" },
                    { num: "Bloco 1", title: "ICMS Interestadual Matrix", cat: "Regras e Cálculos", desc: "Matriz nacional de alíquotas internas e interestaduais para cálculo do DIFAL e Substituição Tributária de todas as UFs.", obj: "tabela aliquotas_interestaduais_icms" },
                    { num: "Bloco 2", title: "Simples Nacional LC 123 formula", cat: "Regras e Cálculos", desc: "Fórmula exata do Simples Nacional (Receita Bruta 12m * Alíquota Nominal - Parcela Deduzir) / Receita Bruta 12m.", obj: "fn_calcular_simples_nacional" },
                    { num: "Bloco 3", title: "Simples Nacional Brackets & Fator R", cat: "Regras e Cálculos", desc: "Mapeamento de todos os anexos (I ao V) e recalculo do Fator R (relação folha/faturamento) para transição de anexos.", obj: "faixas_simples_nacional" },
                    { num: "Bloco 4", title: "Structured Legislation Engine", cat: "Regras e Cálculos", desc: "Mapeamento das leis vigentes e artigos associados a cada cálculo tributário, gerando as justificativas legais.", obj: "tabela base_legislativa" },
                    { num: "Bloco 5", title: "Negative values support & Magnitudes", cat: "Regras e Cálculos", desc: "Segurança matemática contra estornos, valores negativos indesejados e alertas sobre compras com valores abusivos.", obj: "fn_validar_ordem_grandeza" },
                    { num: "Bloco 6", title: "MEI DAS fixo & Excesso de limites", cat: "Regras e Cálculos", desc: "Cálculo do DAS-MEI anual, limites de faturamento de R$ 81.000,00 e controle de desenquadramento retroativo proporcional.", obj: "fn_calcular_mei" },
                    { num: "Bloco 7", title: "Lucro Presumido federal taxes", cat: "Regras e Cálculos", desc: "Apuração das bases de presunção comercial (8%), industrial (8%) e serviços (32%), aplicando IRPJ normal e adicional de 10%.", obj: "fn_calcular_lucro_presumido" },
                    { num: "Bloco 8", title: "Lucro Real loss offset & 30% cap", cat: "Regras e Cálculos", desc: "Apuração pelo lucro líquido contábil ajustado, controlando a compensação de prejuízos fiscais limitada a 30% da base.", obj: "fn_calcular_lucro_real" },
                    { num: "Bloco 9", title: "DIFAL (EC 87/15) & ICMS-ST (MVA)", cat: "Regras e Cálculos", desc: "Cálculo do ICMS interestadual para consumidor final não contribuinte e cálculo de ST aplicando MVA original ou ajustado.", obj: "fn_calcular_difal, fn_calcular_icms_st" },
                    { num: "Bloco 10", title: "XML Parser (Xpath)", cat: "Importação de Arquivos", desc: "Parser direto em SQL/XML de arquivos de NF-e e NFS-e para extração de NCMs, CFOPs, CSTs, valores e tributos.", obj: "fn_parser_xml_nfe_xpath" },
                    { num: "Bloco 11", title: "Massive Batch Processing Queue", cat: "Importação de Arquivos", desc: "Fila assíncrona para processamento concorrente de milhares de XMLs por lote sem queda de performance.", obj: "tabela fila_processamento_massa" },
                    { num: "Bloco 12", title: "Lucro Presumido Guia (IRPJ/CSLL)", cat: "Regras e Cálculos", desc: "Consolidação trimestral de receitas sob Lucro Presumido e preenchimento automático das obrigações e guias federais.", obj: "fn_gerar_guias_lucro_presumido" },
                    { num: "Bloco 13", title: "DASN-SIMEI Consolidation", cat: "Regras e Cálculos", desc: "Consolidador anual de receita do MEI, gerando relatórios de suporte ao preenchimento da DASN-SIMEI.", obj: "fn_consolidar_dasn_simei" },
                    { num: "Bloco 14", title: "DEFIS Consolidation", cat: "Regras e Cálculos", desc: "Apuração e cruzamento de informações contábeis e físicas de empresas do Simples para preenchimento da DEFIS anual.", obj: "fn_gerar_relatorio_defis" },
                    { num: "Bloco 15", title: "EFD-Contribuições & DCTF federal", cat: "Regras e Cálculos", desc: "Consolidador de dados para geração dos blocos de PIS e COFINS da EFD-Contribuições e cruzamento com DCTF.", obj: "fn_consolidar_efd_contribuicoes" },
                    { num: "Bloco 16", title: "Automatic Fiscal Calendar Tasks", cat: "Visualizações", desc: "Motor de agendamento automático de obrigações tributárias mensais baseando-se na UF e atividade da empresa.", obj: "fn_gerar_calendario_mensal" },
                    { num: "Bloco 17", title: "Regime Comparator & Risk Score", cat: "Visualizações", desc: "Projeção comparativa side-by-side de regimes tributários (Simples, MEI, Presumido, Real) e score de risco de fiscalização (0-100).", obj: "fn_gerar_comparativo_regimes, fn_calcular_score_risco" },
                    { num: "Bloco 18", title: "NFC-e XML Parsing Support", cat: "Importação de Arquivos", desc: "Suporte completo à importação e validação de notas fiscais de venda ao consumidor final (Modelo 65 NFC-e).", obj: "fn_parser_xml_nfce" },
                    { num: "Bloco 19", title: "CT-e Transport Parsing Support", cat: "Importação de Arquivos", desc: "Leitura de conhecimentos de transporte eletrônico (Modelo 57 CT-e), auditando tomador, UF de início e fim e alíquotas aplicadas.", obj: "fn_parser_xml_cte" },
                    { num: "Bloco 20", title: "MDF-e Logistic Parsing Support", cat: "Importação de Arquivos", desc: "Leitura de manifestos de documentos fiscais (Modelo 58 MDF-e) para cruzamento logístico e auditoria de trânsito.", obj: "fn_parser_xml_mdfe" },
                    { num: "Bloco 21", title: "Laws Hot-Update Procedures", cat: "Regras e Cálculos", desc: "Funções para atualizar limites de faixas, parcelas dedutíveis e alíquotas de tributação sem necessidade de recompilação do app.", obj: "fn_atualizar_regra_tributaria" },
                    { num: "Bloco 22", title: "Triggers for Audits check IS DISTINCT", cat: "Auditorias & Triggers", desc: "Trigger avançada que detecta alterações em dados cruciais usando IS DISTINCT FROM para evitar falso-positivos em atualizações.", obj: "trg_audit_documentos_distinct" },
                    { num: "Bloco 23", title: "CNPJ/CPF & Access Key checksum", cat: "Estrutura Core", desc: "Validador estrito de CNPJ/CPF com soma de pesos e verificação do dígito verificador do módulo 11 das chaves de acesso.", obj: "fn_validar_cnpj_cpf, fn_validar_chave_acesso" },
                    { num: "Bloco 24", title: "Webhook Staging area", cat: "Estrutura Core", desc: "Área temporária de recepção de XMLs via webhooks de ERPs externos ou integradores automáticos, com proteção de fila.", obj: "tabela staging_webhooks" },
                    { num: "Bloco 25", title: "Triggers operations insert/update/delete", cat: "Auditorias & Triggers", desc: "Otimização estrita de gatilhos operacionais de auditoria para lidar nativamente com transações em massa (Bulk Operations).", obj: "trg_auditorias_bulk_oper" },
                    { num: "Bloco 26", title: "CEST, CBENEF, CNAE engine", cat: "Tabelas Base", desc: "Mapeamento avançado de códigos CEST (ST), CBENEF (Benefícios Fiscais Estaduais) e CNAE das empresas para travar cruzamento.", obj: "tabela cnae_regras, tabela cest_dados" },
                    { num: "Bloco 27", title: "Imported goods (4%) & IS sin-tax", cat: "Regras e Cálculos", desc: "Auditoria automática da alíquota interestadual de 4% para produtos importados e simulação de Imposto Seletivo (Reforma 2027).", obj: "fn_verificar_aliquota_importados" },
                    { num: "Bloco 28", title: "FECP RJ & ST Adjusted MVA", cat: "Regras e Cálculos", desc: "Apuração do Fundo de Combate à Pobreza do RJ (2%) e fórmula matemática de ajuste de MVA para operações interestaduais com ST.", obj: "fn_calcular_fecp_rj, fn_ajustar_mva" },
                    { num: "Bloco 29", title: "FECP AL & PR/BA double count", cat: "Regras e Cálculos", desc: "Tratamento de FECP em Alagoas (1%) e blindagem para evitar pagamento duplo do fundo em estados como PR, BA e MG.", obj: "fn_calcular_fecp_al" },
                    { num: "Bloco 30", title: "Federal retentions CSRF & IRRF", cat: "FECP & Retenções", desc: "Cálculo e verificação de retenção na fonte sobre serviços prestados por pessoas jurídicas: PIS, COFINS, CSLL (4.65%) e IRRF (1.5%).", obj: "fn_calcular_retencao_federal_servico" },
                    { num: "Bloco 31", title: "Municipal ISS validations", cat: "FECP & Retenções", desc: "Validação constitucional estrita de alíquotas de ISS por município, impedindo cobranças abaixo de 2% ou acima de 5%.", obj: "fn_validar_aliquota_iss" },
                    { num: "Bloco 32", title: "INSS labor hire standard & MEI exceptions", cat: "FECP & Retenções", desc: "Apuração de retenção previdenciária de 11% sobre faturas de mão de obra e dedução especial de 3.5% para prestadores MEI.", obj: "fn_calcular_retencao_inss_cessao_mao_obra" },
                    { num: "Bloco 33", title: "Search path trigger security", cat: "Estrutura Core", desc: "Blindagem de segurança 'search_path' em todas as triggers e funções para evitar ataques de injeção ou privilégios cruzados.", obj: "SET search_path = public" },
                    { num: "Bloco 34", title: "Populate CST/CSOSN metadata", cat: "Tabelas Base", desc: "População automática de tabelas auxiliares de códigos fiscais CST de ICMS, PIS, COFINS e CSOSN do Simples Nacional.", obj: "tabela_cst_csosn" },
                    { num: "Bloco 35", title: "DIFAL Base Dupla", cat: "Regras e Cálculos", desc: "Cálculo avançado do DIFAL por dentro (base dupla) exigida por estados como MG, RS, SC e BA nas compras de consumo.", obj: "fn_calcular_difal_base_dupla" },
                    { num: "Bloco 36", title: "Certificate expiry warnings", cat: "Tabelas Base", desc: "Geração de alertas automatizados quando o certificado digital A1 cadastrado estiver a menos de 30 dias de expirar.", obj: "fn_checar_vencimento_certificados" },
                    { num: "Bloco 37", title: "Database test suite procedure", cat: "Auditorias & Triggers", desc: "Suíte integrada de testes que roda 10 cenários simulando Simples Nacional, Lucro Presumido, Real, FECP e Retenções.", obj: "fn_rodar_testes_motor_fiscal" },
                    { num: "Bloco 38", title: "Executive Dashboards Views", cat: "Visualizações", desc: "Acesso consolidado de views para faturamento total, impostos devidos, créditos apurados e riscos acumulados por Tenant.", obj: "vw_dashboard_geral_tenant" },
                    { num: "Bloco 39", title: "Automated Fiscal obligations scheduler", cat: "Visualizações", desc: "Calendário automático e fila de tarefas para controle do envio das obrigações fiscais (DAS, DCTFWeb, EFD-Reinf).", obj: "vw_agenda_proximos_vencimentos" },
                    { num: "Bloco 40", title: "Auth.uid() isolation constraints", cat: "Estrutura Core", desc: "Uso do identificador ativo do Supabase Auth para restringir de forma nativa a leitura de tabelas e logs na sessão.", obj: "auth.uid()" },
                    { num: "Bloco 41", title: "Holidays & query cache engine", cat: "Estrutura Core", desc: "Base de feriados nacionais e estaduais para postergação automática de vencimentos fiscais que caiam em fins de semana.", obj: "tabela_feriados, fn_postergar_vencimento" },
                    { num: "Bloco 42", title: "Standard Deviation order of magnitude", cat: "Regras e Cálculos", desc: "Análise estatística e desvio padrão para identificar lançamentos de XMLs com valores fora do padrão de comportamento da empresa.", obj: "fn_analise_desvio_padrao_lote" },
                    { num: "Bloco 43", title: "Global settings & Login audit logs", cat: "Estrutura Core", desc: "Configurações gerais do sistema (alíquotas globais da Reforma) e rastreamento de acessos para conformidade LGPD.", obj: "tabela_configuracao_global" },
                    { num: "Bloco 44", title: "Certificate expiry alert Integration", cat: "Estrutura Core", desc: "Disparador de e-mails/alertas integrados quando as triggers do Bloco 36 detectarem certificado expirando.", obj: "fn_disparar_alerta_certificado" },
                    { num: "Bloco 45", title: "Search path trigger security functions", cat: "Estrutura Core", desc: "Configuração do search_path em todas as funções de triggers adicionais para bloquear vetores de escalabilidade de privilégios.", obj: "SET search_path = public" }
                  ];

                  const filtered = databaseBlocks.filter(b => 
                    b.num.toLowerCase().includes(dbSearchTerm.toLowerCase()) ||
                    b.title.toLowerCase().includes(dbSearchTerm.toLowerCase()) ||
                    b.desc.toLowerCase().includes(dbSearchTerm.toLowerCase()) ||
                    b.obj.toLowerCase().includes(dbSearchTerm.toLowerCase()) ||
                    b.cat.toLowerCase().includes(dbSearchTerm.toLowerCase())
                  );

                  return filtered.map((block, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2 flex flex-col justify-between hover:border-slate-300 hover:bg-slate-100/50 transition-all">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[10px] uppercase tracking-wider text-emerald-800 bg-emerald-100/60 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                            {block.num}
                          </span>
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase">{block.cat}</span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-900 leading-snug">{block.title}</h5>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{block.desc}</p>
                      </div>
                      <div className="border-t border-slate-200/60 pt-2 mt-1">
                        <span className="text-[9px] text-slate-400 block font-mono">Objeto SQL:</span>
                        <code className="text-[10px] text-slate-700 font-mono font-bold block truncate">{block.obj}</code>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* FULL CONSOLIDATED SQL DOWNLOAD CARD */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6" id="db-sql-download-card">
              <div className="space-y-2 text-left">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <FileCode className="w-5 h-5 text-emerald-500" />
                  Script SQL Consolidado dos 45 Blocos (Produção V8.2)
                </h4>
                <p className="text-xs text-slate-500 max-w-3xl">
                  Disponibilizamos o script DDL consolidado contendo todas as definições de tabelas, índices, RLS, stored procedures e as triggers de auditoria dos 45 blocos para implantação direta no seu painel de administração do Supabase.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href="/schema_consolidado.sql"
                  download="schema_consolidado_camera_fiscal.sql"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 border border-slate-800"
                >
                  <Download className="w-4 h-4" />
                  Download SQL
                </a>
                <button
                  onClick={() => {
                    fetch('/schema_consolidado.sql')
                      .then(r => r.text())
                      .then(sql => {
                        navigator.clipboard.writeText(sql);
                        alert("Script SQL unificado (45 blocos) copiado com sucesso! Abra seu painel do Supabase, acesse o SQL Editor e cole o script para rodar de uma vez.");
                      })
                      .catch(err => {
                        console.error(err);
                        alert("Não foi possível copiar o script. Faça o download diretamente pelo botão lateral.");
                      });
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Script
                </button>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'celular' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 space-y-8 animate-in fade-in duration-150" id="celular-tab-view">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100 pb-6">
              <div className="space-y-2 text-center md:text-left">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-emerald-200">
                  Instalação Simplificada (PWA)
                </span>
                <h3 className="text-2xl font-bold text-slate-950">Como baixar e instalar o app direto no seu Celular</h3>
                <p className="text-xs text-slate-500 max-w-2xl">
                  Este aplicativo é um <strong>Progressive Web App (PWA)</strong>. Você pode adicioná-lo à tela de início do seu smartphone ou tablet como se fosse um aplicativo da App Store ou Google Play, sem ocupar espaço interno do aparelho.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Link Oficial do App:</span>
                <button
                  id="btn-copy-url"
                  onClick={() => {
                    navigator.clipboard.writeText('https://ais-pre-fklbeifdhj5umal5wcjpki-361015834618.us-east1.run.app');
                    alert("Link oficial do aplicativo copiado para a área de transferência! Envie pelo WhatsApp ou abra no navegador do seu celular/notebook.");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  Copiar Link Oficial
                </button>
              </div>
            </div>

            {/* PWA STATUS & DIRECT INSTALL CARD */}
            <div className="p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 bg-slate-50 border-slate-200">
              <div className="flex items-center gap-4 text-left">
                <div className={`p-3 rounded-xl ${isAppInstalled ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {isAppInstalled ? "Aplicativo Instalado!" : "Instalação Direta Disponível"}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-lg">
                    {isAppInstalled 
                      ? "Excelente! Você já está acessando o sistema diretamente do aplicativo fixado na sua tela." 
                      : "O seu navegador suporta a instalação direta. Clique no botão ao lado para adicionar à sua tela inicial como um app nativo!"}
                  </p>
                </div>
              </div>

              {isAppInstalled ? (
                <div className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Instalado com Sucesso
                </div>
              ) : isInstallable ? (
                <button
                  onClick={handleInstallClick}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-500/10 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
                  Instalar no Celular Agora
                </button>
              ) : (
                <div className="text-slate-500 font-medium px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 text-[11px] text-center max-w-xs leading-relaxed">
                  Para instalar, siga as instruções abaixo ou abra em um navegador compatível (Chrome ou Safari móvel).
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* QR CODE SECTION */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">Escaneie o QR Code</h4>
                <p className="text-[11px] text-slate-500">
                  Abra a câmera do seu celular e aponte para o QR Code abaixo para abrir o aplicativo instantaneamente no seu navegador móvel.
                </p>
                <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-200 flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=0f172a&bgcolor=ffffff&data=${encodeURIComponent('https://ais-pre-fklbeifdhj5umal5wcjpki-361015834618.us-east1.run.app')}`}
                    alt="QR Code do Aplicativo"
                    className="w-44 h-44 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-[11px] text-emerald-600 font-bold font-mono break-all max-w-xs">
                  https://ais-pre-fklbeifdhj5umal5wcjpki-361015834618.us-east1.run.app
                </div>
              </div>

              {/* ANDROID CHROME STEPS */}
              <div className="border border-slate-200 rounded-2xl p-6 bg-white space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 text-slate-950 p-2 rounded-lg font-bold text-sm flex items-center justify-center w-8 h-8">
                    1
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Passo a Passo no Android (Chrome)</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Para instalar no Android usando o navegador Google Chrome:
                </p>
                <ol className="text-xs text-slate-600 space-y-3 pl-4 list-decimal leading-relaxed">
                  <li>Escaneie o QR Code ou abra o link no <strong>Chrome</strong> do seu celular.</li>
                  <li>Toque no botão de <strong>três pontos (Menu)</strong> no canto superior direito.</li>
                  <li>Selecione a opção <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar aplicativo"</strong>.</li>
                  <li>Confirme o nome do aplicativo e toque em <strong>"Adicionar"</strong> ou <strong>"Instalar"</strong>.</li>
                  <li>Pronto! O ícone com o spark esmeralda aparecerá na tela do seu celular!</li>
                </ol>
              </div>

              {/* IOS SAFARI STEPS */}
              <div className="border border-slate-200 rounded-2xl p-6 bg-white space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500 text-white p-2 rounded-lg font-bold text-sm flex items-center justify-center w-8 h-8">
                    2
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Passo a Passo no iPhone (Safari)</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Para instalar no iPhone usando o navegador nativo Safari:
                </p>
                <ol className="text-xs text-slate-600 space-y-3 pl-4 list-decimal leading-relaxed">
                  <li>Escaneie o QR Code ou abra o link no navegador <strong>Safari</strong> do iPhone.</li>
                  <li>Toque no botão de <strong>Compartilhar</strong> (ícone de um quadrado com uma seta apontando para cima) na barra inferior.</li>
                  <li>Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
                  <li>Toque em <strong>"Adicionar"</strong> no canto superior direito da tela.</li>
                  <li>Pronto! O aplicativo será fixado na tela inicial do seu iPhone como um app nativo!</li>
                </ol>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* MODAL / DRAWER FOR MANUAL TAX RECTIFICATION / CORRECTION */}
      {editingInvoiceId && editInvoiceForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden" id="rectification-modal">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <div>
                <h4 className="font-bold text-slate-950 text-sm">Retificar Código Fiscal / Tributação</h4>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Retificação Manual Preventiva (NF-e {editInvoiceForm.number})</p>
              </div>
              <button onClick={() => setEditingInvoiceId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoiceCorrection} className="space-y-4" id="form-rectify-invoice">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">CFOP Parametrizado</label>
                  <input
                    type="text"
                    required
                    value={editInvoiceForm.cfop || ''}
                    onChange={e => setEditInvoiceForm({ ...editInvoiceForm, cfop: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">NCM do Item</label>
                  <input
                    type="text"
                    required
                    value={editInvoiceForm.ncm || ''}
                    onChange={e => setEditInvoiceForm({ ...editInvoiceForm, ncm: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">CST ICMS/CSOSN</label>
                  <input
                    type="text"
                    required
                    value={editInvoiceForm.icmsCst || ''}
                    onChange={e => setEditInvoiceForm({ ...editInvoiceForm, icmsCst: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">CST PIS</label>
                  <input
                    type="text"
                    required
                    value={editInvoiceForm.pisCst || ''}
                    onChange={e => setEditInvoiceForm({ ...editInvoiceForm, pisCst: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">CST COFINS</label>
                  <input
                    type="text"
                    required
                    value={editInvoiceForm.cofinsCst || ''}
                    onChange={e => setEditInvoiceForm({ ...editInvoiceForm, cofinsCst: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Valor do Faturamento (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editInvoiceForm.value || 0}
                  onChange={e => setEditInvoiceForm({ ...editInvoiceForm, value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setEditingInvoiceId(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow-md"
                >
                  Salvar Correção Fiscal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-center text-xs print:hidden" id="app-footer">
        <p>Desenvolvido de forma personalizada para Cledison H. • Gestor Fiscal Tributário Sênior</p>
        <p className="text-[10px] text-slate-500 mt-1">Conformidade com a Legislação Fiscal Brasileira - Simples Nacional, Lucro Presumido e Lucro Real.</p>
      </footer>

    </div>
  );
}
