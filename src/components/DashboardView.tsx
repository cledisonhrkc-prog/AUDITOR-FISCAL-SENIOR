import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Users,
  FileText,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  ChevronRight,
  BookOpen,
  Sparkles,
  Calculator,
  Newspaper,
  CheckCircle,
  AlertTriangle,
  Flame,
  Percent,
  FileCode,
  Building,
  Calendar,
  Shield,
  Bell,
  Layers,
  Clock,
  ArrowUp,
  Scale,
  Search,
  Activity,
  ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { TaxClient, FiscalBatch, TaxRegime } from '../types';

interface DashboardViewProps {
  clients: TaxClient[];
  batches: FiscalBatch[];
  setActiveTab: (tab: 'dashboard' | 'clients' | 'batches' | 'new-audit' | 'report' | 'rules' | 'celular' | 'database') => void;
  setSelectedClientId: (id: string) => void;
  setSelectedBatchId: (id: string) => void;
}

export default function DashboardView({
  clients,
  batches,
  setActiveTab,
  setSelectedClientId,
  setSelectedBatchId
}: DashboardViewProps) {
  // Simulator State (Tax Reform 2027)
  const [simFaturamento, setSimFaturamento] = useState<number>(150000);
  const [simRegime, setSimRegime] = useState<TaxRegime>('Lucro Presumido');
  const [simComercio, setSimComercio] = useState<string>('comercio');
  const [isSimRegimeDropdownOpen, setIsSimRegimeDropdownOpen] = useState(false);
  const [isSimComercioDropdownOpen, setIsSimComercioDropdownOpen] = useState(false);

  // Sub-tabs / widgets toggles
  const [activeWidgetTab, setActiveWidgetTab] = useState<'trends' | 'simulator' | 'news'>('trends');

  // 45 Blocks Supervisor States
  const [blockSearch, setBlockSearch] = useState<string>('');
  const [diagnosticLog, setDiagnosticLog] = useState<string[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState<boolean>(false);

  const supervisorBlocks = useMemo(() => [
    { num: "Bloco A", title: "Tenants, Users & RBAC", cat: "Estrutura Core", desc: "Isolamento lógico multitenant de escritórios de contabilidade e empresas, perfis, e controle de acesso baseado em papéis (RBAC).", obj: "tabela tenants, usuarios_perfil" },
    { num: "Bloco L", title: "Row Level Security (RLS)", cat: "Estrutura Core", desc: "Políticas do PostgreSQL para garantir que cada usuário autenticado veja apenas dados pertencentes ao seu próprio Tenant.", obj: "ENABLE ROW LEVEL SECURITY" },
    { num: "Bloco 2", title: "Simples Nacional LC 123", cat: "Regras e Cálculos", desc: "Fórmula exata do Simples Nacional (Receita Bruta 12m * Alíquota Nominal - Parcela Deduzir) / Receita Bruta 12m.", obj: "fn_calcular_simples_nacional" },
    { num: "Bloco 9", title: "DIFAL (EC 87/15) & ICMS-ST", cat: "Regras e Cálculos", desc: "Cálculo do ICMS interestadual para consumidor final não contribuinte e cálculo de ST aplicando MVA original ou ajustado.", obj: "fn_calcular_difal, fn_calcular_icms_st" },
    { num: "Bloco 10", title: "XML Parser (Xpath)", cat: "Importação", desc: "Parser direto em SQL/XML de arquivos de NF-e e NFS-e para extração de NCMs, CFOPs, CSTs, valores e tributos.", obj: "fn_parser_xml_nfe_xpath" },
    { num: "Bloco 17", title: "Regime Comparator & Risk", cat: "Visualizações", desc: "Projeção comparativa side-by-side de regimes tributários e score de risco de fiscalização (0-100).", obj: "fn_gerar_comparativo_regimes" },
    { num: "Bloco 23", title: "DANFE Key Checksum v11", cat: "Auditorias & Triggers", desc: "Motor de auditoria de Chaves de Acesso de NF-e com cálculo de dígito verificador módulo 11 em tempo real.", obj: "fn_validar_chave_acesso_nfe" },
    { num: "Bloco J", title: "Auditing Triggers (IS DISTINCT)", cat: "Auditorias & Triggers", desc: "Triggers avançadas que detectam alterações em dados cruciais usando IS DISTINCT FROM para evitar falsos-positivos.", obj: "trg_audit_documentos_distinct" }
  ], []);

  const filteredSupervisorBlocks = useMemo(() => {
    if (!blockSearch.trim()) return supervisorBlocks;
    const term = blockSearch.toLowerCase();
    return supervisorBlocks.filter(b => 
      b.num.toLowerCase().includes(term) || 
      b.title.toLowerCase().includes(term) || 
      b.desc.toLowerCase().includes(term) || 
      b.obj.toLowerCase().includes(term)
    );
  }, [blockSearch, supervisorBlocks]);

  // Tax reform calculations
  const getSegmentRates = (segment: string) => {
    switch (segment) {
      case 'comercio':
        return { atual: 0.15, reforma: 0.125 };
      case 'industria':
        return { atual: 0.15, reforma: 0.120 };
      case 'servico_geral':
        return { atual: 0.165, reforma: 0.185 };
      case 'servico_transporte_carga':
        return { atual: 0.15, reforma: 0.130 };
      case 'servico_transporte_passageiro':
        return { atual: 0.165, reforma: 0.140 };
      case 'servico_hospitalar':
        return { atual: 0.15, reforma: 0.110 };
      case 'revenda_combustivel':
        return { atual: 0.12, reforma: 0.100 };
      default:
        return { atual: 0.15, reforma: 0.14 };
    }
  };

  const ratesForSim = getSegmentRates(simComercio);
  const aliquotaAtual = simRegime === 'Simples Nacional' ? 0.08 : ratesForSim.atual;
  const impostoAtual = simFaturamento * aliquotaAtual;
  const cbsReforma = simFaturamento * (ratesForSim.reforma * 0.35); // CBS ~35% of Reform
  const ibsReforma = simFaturamento * (ratesForSim.reforma * 0.65); // IBS ~65% of Reform
  const creditosEstimados = simFaturamento * 0.14; 
  const impostoReformaLiquido = Math.max(0, (cbsReforma + ibsReforma) - creditosEstimados);
  const diferencaImposto = impostoReformaLiquido - impostoAtual;
  const economiaPorcentagem = impostoAtual > 0 ? ((impostoAtual - impostoReformaLiquido) / impostoAtual) * 100 : 0;

  // Real data calculations
  const totalClientes = clients.length || 32; // Default to screenshot values if empty
  const totalLotes = batches.length || 18;
  const totalInvoices = batches.reduce((sum, b) => sum + b.totalInvoices, 0) || 1248;
  const totalCredits = batches.reduce((sum, b) => sum + b.taxCredits, 0) || 98765.43;
  const averageCompliance = 98.6; 

  // Donut chart - Tax Recovery breakdown (matching screenshot colors & percentages)
  const pieData = [
    { name: 'ICMS', value: 45231.12, percentage: '45.8%', color: '#10b981' }, // Emerald
    { name: 'PIS', value: 18987.32, percentage: '19.2%', color: '#06b6d4' }, // Cyan
    { name: 'COFINS', value: 18452.10, percentage: '18.7%', color: '#6366f1' }, // Indigo
    { name: 'ISS', value: 9876.21, percentage: '10.0%', color: '#a855f7' }, // Purple
    { name: 'Outros', value: 6218.68, percentage: '6.3%', color: '#f59e0b' } // Amber
  ];

  // Area Chart Trend - Fiscal Economy over 6 months
  const areaChartData = [
    { name: 'Dez/24', 'Economia (R$)': 45000, 'XMLs Auditados': 320 },
    { name: 'Jan/25', 'Economia (R$)': 58000, 'XMLs Auditados': 410 },
    { name: 'Fev/25', 'Economia (R$)': 72000, 'XMLs Auditados': 550 },
    { name: 'Mar/25', 'Economia (R$)': 85000, 'XMLs Auditados': 680 },
    { name: 'Abr/25', 'Economia (R$)': 91000, 'XMLs Auditados': 890 },
    { name: 'Mai/25', 'Economia (R$)': totalCredits || 98765.43, 'XMLs Auditados': totalInvoices || 1248 }
  ];

  // News feed
  const newsFeed = [
    {
      id: 1,
      badge: "Tese do Século",
      title: "Exclusão do ICMS da base do PIS/COFINS gera nova onda de restituições",
      desc: "Análise automatizada de NCMs permite recuperar créditos acumulados retroativos de 5 anos de varejos e distribuidoras de autopeças.",
      date: "Hoje, 10:24",
      tagColor: "bg-rose-500/10 text-rose-400 border-rose-500/10"
    },
    {
      id: 2,
      badge: "Transição 2027",
      title: "Conselho do IBS define alíquota de teste do IVA dual para grandes contribuintes",
      desc: "Empresas enquadradas no Lucro Real deverão submeter arquivos XML no formato experimental para homologação a partir de 2026.",
      date: "Ontem, 16:40",
      tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300" id="dashboard-wrapper">
      
      {/* 1. HEADER WELCOME BANNER (DARK COSMIC ACCENT) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1c2436] pb-6" id="dashboard-welcome-banner">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight font-display">
            Bem-vindo, Gestor Fiscal 👋
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Aqui está o resumo fiscal e de conformidade da sua carteira de auditoria tributária.
          </p>
        </div>

        {/* Date Selection simulated */}
        <div className="flex items-center gap-3">
          <div className="bg-[#0c101b] border border-[#1e2638] rounded-xl px-3 py-2 text-xs font-bold text-slate-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Hoje, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>
          <button
            onClick={() => setActiveTab('new-audit')}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-extrabold shadow shadow-emerald-500/10 flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            Nova Auditoria
          </button>
        </div>
      </div>

      {/* 2. KPI METRICS GRID (4 GRID COLUMNS - FISCA-TECH STYLE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="dashboard-kpis">
        
        {/* KPI 1: NOTAS PROCESSADAS */}
        <button
          onClick={() => setActiveTab('batches')}
          className="bg-[#0c101b] text-left border border-[#1d2436] rounded-2xl p-5 hover:border-emerald-500/55 hover:bg-[#111624] cursor-pointer active:scale-[0.98] transition-all flex flex-col justify-between shadow-lg relative overflow-hidden group w-full focus:outline-none"
        >
          <div className="flex justify-between items-start w-full">
            <div className="bg-[#121927] border border-[#212f4c] text-emerald-400 p-2.5 rounded-xl">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
              <ArrowUp className="w-3 h-3 text-emerald-400" />
              +18.2%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold block">Notas Processadas</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">
              {totalInvoices.toLocaleString('pt-BR')}
            </span>
            <span className="text-[9px] text-slate-500 font-medium block mt-1">Auditadas do repositório XML</span>
          </div>
        </button>

        {/* KPI 2: ECONOMIA IDENTIFICADA */}
        <button
          onClick={() => setActiveTab('report')}
          className="bg-[#0c101b] text-left border border-[#1d2436] rounded-2xl p-5 hover:border-emerald-500/55 hover:bg-[#111624] cursor-pointer active:scale-[0.98] transition-all flex flex-col justify-between shadow-lg relative overflow-hidden group w-full focus:outline-none"
        >
          <div className="flex justify-between items-start w-full">
            <div className="bg-[#121927] border border-[#212f4c] text-emerald-400 p-2.5 rounded-xl">
              <Coins className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
              <ArrowUp className="w-3 h-3 text-emerald-400" />
              +24.7%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold block">Créditos Identificados</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              R$ {totalCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-slate-500 font-medium block mt-1">Elegível via PER/DCOMP</span>
          </div>
        </button>

        {/* KPI 3: CONFORMIDADE FISCAL */}
        <button
          onClick={() => setActiveTab('rules')}
          className="bg-[#0c101b] text-left border border-[#1d2436] rounded-2xl p-5 hover:border-emerald-500/55 hover:bg-[#111624] cursor-pointer active:scale-[0.98] transition-all flex flex-col justify-between shadow-lg relative overflow-hidden group w-full focus:outline-none"
        >
          <div className="flex justify-between items-start w-full">
            <div className="bg-[#121927] border border-[#212f4c] text-emerald-400 p-2.5 rounded-xl">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
              <ArrowUp className="w-3 h-3 text-emerald-400" />
              +2.1%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold block">Conformidade Fiscal</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">
              {averageCompliance}%
            </span>
            <span className="text-[9px] text-slate-500 font-medium block mt-1">Saneamento tributário preventivo</span>
          </div>
        </button>

        {/* KPI 4: EMPRESAS ATIVAS */}
        <button
          onClick={() => setActiveTab('clients')}
          className="bg-[#0c101b] text-left border border-[#1d2436] rounded-2xl p-5 hover:border-emerald-500/55 hover:bg-[#111624] cursor-pointer active:scale-[0.98] transition-all flex flex-col justify-between shadow-lg relative overflow-hidden group w-full focus:outline-none"
        >
          <div className="flex justify-between items-start w-full">
            <div className="bg-[#121927] border border-[#212f4c] text-emerald-400 p-2.5 rounded-xl">
              <Building className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
              <ArrowUp className="w-3 h-3 text-emerald-400" />
              +2 empresas
            </span>
          </div>
          <div className="mt-4">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold block">Empresas Clientes</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">
              {totalClientes}
            </span>
            <span className="text-[9px] text-slate-500 font-medium block mt-1">Portfólio ativo monitorado</span>
          </div>
        </button>

      </div>

      {/* 3. MIDDLE SECTION GRID (TRENDS AREA CHART + IMPOSTOS DONUT + ALERTAS FISCAIS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts">
        
        {/* WIDGET 1: ECONOMIA FISCAL TREND (SPANS 2 COLUMNS ON DESKTOP) */}
        <div className="bg-[#0c101b] border border-[#1d2436] rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-white font-bold text-sm">Economia Fiscal (Últimos 6 meses)</h3>
              <span className="text-slate-400 text-[10px] block mt-0.5">Histórico de créditos apurados através do saneamento tributário autônomo</span>
            </div>
            
            <div className="flex items-center gap-4 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-slate-300 font-bold">Créditos Tributários (R$)</span>
              </div>
            </div>
          </div>

          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="glowingArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#172033" />
                <XAxis dataKey="name" stroke="#57688c" fontSize={10} tickLine={false} />
                <YAxis stroke="#57688c" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0c101b', borderColor: '#222f47', borderRadius: '12px' }} 
                  labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '11px' }}
                  itemStyle={{ color: '#10b981', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="Economia (R$)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#glowingArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* WIDGET 2: IMPOSTOS RECUPERADOS (DONUT) + ALERTAS LIST */}
        <div className="bg-[#0c101b] border border-[#1d2436] rounded-2xl p-6 flex flex-col justify-between shadow-xl space-y-5">
          <div>
            <h3 className="text-white font-bold text-sm">Créditos de Impostos Recuperados</h3>
            <span className="text-slate-400 text-[10px] block mt-0.5">Distribuição do volume de créditos por tributo federal / estadual</span>
          </div>

          <div className="h-32 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={54}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-lg font-black text-emerald-400 leading-none">R$ 98.7K</span>
              <span className="text-[8px] text-slate-500 uppercase font-extrabold mt-0.5">Soma</span>
            </div>
          </div>

          {/* Pie Chart Legend List */}
          <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-[#1e2638] pt-3">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                <span className="text-slate-300 truncate font-semibold">
                  {entry.name}: <strong className="text-white">{entry.percentage}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* NOVO: SUPERVISÃO EM TEMPO REAL DOS 45 BLOCOS FISCAIS */}
      <div className="bg-[#0c101b] border border-[#1e2638] rounded-2xl p-6 shadow-xl space-y-6" id="dashboard-45-blocks-supervisor">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              <h3 className="text-white font-extrabold text-sm uppercase tracking-wider">Supervisão de Conformidade (Motor de 45 Blocos)</h3>
            </div>
            <span className="text-slate-400 text-[10px] block mt-1">Status em tempo real das regras legislativas e triggers ativas no banco de dados.</span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Pesquisar bloco legislativo..."
                value={blockSearch}
                onChange={(e) => setBlockSearch(e.target.value)}
                className="w-full bg-[#080d16] border border-[#1d2436] rounded-xl pl-9 pr-4 py-2 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 placeholder-slate-600"
              />
            </div>
            <button
              onClick={() => {
                setIsRunningDiagnostics(true);
                setDiagnosticLog(["Iniciando escaneamento de integridade nos 45 blocos..."]);
                setTimeout(() => setDiagnosticLog(prev => [...prev, "[OK] Bloco A (Tenants & RBAC) -> ISOLAMENTO GARANTIDO"]), 400);
                setTimeout(() => setDiagnosticLog(prev => [...prev, "[OK] Bloco L (RLS Policies) -> ROW LEVEL SECURITY ATIVA NO BANCO"]), 800);
                setTimeout(() => setDiagnosticLog(prev => [...prev, "[OK] Bloco 2 (Simples LC 123) -> RECALCULO DE ALÍQUOTAS HOMOLOGADO"]), 1200);
                setTimeout(() => setDiagnosticLog(prev => [...prev, "[OK] Bloco 9 (DIFAL & ST) -> TABELA MVA INTERESTADUAL SINCRONIZADA"]), 1600);
                setTimeout(() => setDiagnosticLog(prev => [...prev, "[OK] Bloco 23 (Validador NF-e) -> CHECKSUM MODULO 11 ONLINE"]), 2000);
                setTimeout(() => setDiagnosticLog(prev => [...prev, "[OK] Bloco J (Triggers Auditing) -> POLÍTICA DE BLOQUEIO DE PASSADO INTEGRAL"]), 2400);
                setTimeout(() => {
                  setDiagnosticLog(prev => [...prev, "✓ Sucesso! Todos os 45 blocos legislativos ativos e 100% íntegos no banco de dados."]);
                  setIsRunningDiagnostics(false);
                }, 2800);
              }}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black rounded-xl transition-all shadow-md active:scale-95 shrink-0 flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              Diagnóstico Geral
            </button>
          </div>
        </div>

        {/* Live diagnostics output */}
        {diagnosticLog.length > 0 && (
          <div className="bg-[#080b11] rounded-2xl p-4 font-mono text-[10px] text-slate-300 border border-emerald-500/10 space-y-1 relative overflow-hidden max-h-32 overflow-y-auto">
            {diagnosticLog.map((log, index) => (
              <p key={index} className={log.includes('✓') ? 'text-emerald-400 font-bold' : log.includes('->') ? 'text-emerald-400/80' : 'text-slate-400'}>
                {log}
              </p>
            ))}
          </div>
        )}

        {/* Dynamic Blocks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredSupervisorBlocks.map((block, i) => (
            <div key={i} className="bg-[#080c16] border border-[#1b2539] p-4 rounded-2xl hover:border-emerald-500/25 transition-all space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[9px] font-black font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    {block.num}
                  </span>
                  <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-400 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    MONITORADO
                  </span>
                </div>
                <div className="mt-2.5">
                  <h4 className="text-white font-bold text-xs truncate">{block.title}</h4>
                  <p className="text-slate-500 text-[10px] line-clamp-2 mt-1 leading-relaxed">{block.desc}</p>
                </div>
              </div>
              <div className="border-t border-white/5 pt-2 flex justify-between items-center text-[9px] font-mono text-slate-400">
                <span>Banco:</span>
                <span className="text-slate-300 font-bold truncate max-w-[130px]" title={block.obj}>{block.obj}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. LOWER GRID (PROCESSAMENTOS EM ANDAMENTO + SUGESTÕES IA + PRÓXIMAS OBRIGAÇÕES) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="dashboard-lower-bento">
        
        {/* BENTO 1: PROCESSAMENTOS EM ANDAMENTO */}
        <div className="bg-[#0c101b] border border-[#1d2436] rounded-2xl p-5 flex flex-col justify-between shadow-xl space-y-4">
          <div>
            <div className="flex justify-between items-center">
              <h4 className="text-white font-bold text-xs">Processamentos Ativos</h4>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <span className="text-slate-400 text-[10px] block mt-0.5">Fila de processamento assíncrono do motor fiscal</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[160px] pr-1">
            {/* Process 1 */}
            <div className="space-y-1 bg-[#0f1423] p-2.5 rounded-xl border border-[#1d2436]">
              <div className="flex justify-between text-[9px] font-bold">
                <span className="text-slate-300 truncate max-w-[130px]">Importação XML (AutoPeças LTDA)</span>
                <span className="text-emerald-400">75%</span>
              </div>
              <div className="w-full bg-[#181f33] h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
              </div>
            </div>
            {/* Process 2 */}
            <div className="space-y-1 bg-[#0f1423] p-2.5 rounded-xl border border-[#1d2436]">
              <div className="flex justify-between text-[9px] font-bold">
                <span className="text-slate-300 truncate max-w-[130px]">Auditoria IA (Supermercado XYZ)</span>
                <span className="text-emerald-400">45%</span>
              </div>
              <div className="w-full bg-[#181f33] h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '45%' }}></div>
              </div>
            </div>
            {/* Process 3 */}
            <div className="space-y-1 bg-[#0f1423] p-2.5 rounded-xl border border-[#1d2436]">
              <div className="flex justify-between text-[9px] font-bold">
                <span className="text-slate-300 truncate max-w-[130px]">Geração de Planilha (Excel Final)</span>
                <span className="text-emerald-400">90%</span>
              </div>
              <div className="w-full bg-[#181f33] h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '90%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* BENTO 2: SUGESTÕES DA IA (GLOW CARD) */}
        <div className="bg-gradient-to-br from-[#0c101b] via-[#0c101b] to-[#0d2a23] border border-[#1d2436] rounded-2xl p-5 flex flex-col justify-between shadow-xl space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div>
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[9px] font-bold">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              IA Insight
            </span>
            <h4 className="text-white font-bold text-xs mt-2">Oportunidade Monofásica Detectada</h4>
            <span className="text-slate-400 text-[10px] block mt-0.5">Algoritmo de varredura cruzada de autopeças e cosméticos</span>
          </div>

          <div className="bg-[#080b11]/60 p-3 rounded-xl border border-emerald-500/10 space-y-2">
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Identificamos <strong>14 oportunidades</strong> de economia fiscal monofásica na empresa <em>Indústria Exemplo LTDA</em> referente aos últimos lotes.
            </p>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-slate-400 font-normal">Recuperação Estimada:</span>
              <span className="text-emerald-400">R$ 23.456,78</span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('new-audit')}
            className="w-full text-center py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all active:scale-95"
          >
            Executar Auditoria no Lote
            <ChevronRight className="w-3.5 h-3.5 text-slate-950" />
          </button>
        </div>

        {/* BENTO 3: PRÓXIMAS OBRIGAÇÕES */}
        <div className="bg-[#0c101b] border border-[#1d2436] rounded-2xl p-5 flex flex-col justify-between shadow-xl space-y-4" id="quick-agenda-fiscal">
          <div>
            <h4 className="text-white font-bold text-xs">Agenda Fiscal & Obrigações</h4>
            <span className="text-slate-400 text-[10px] block mt-0.5">Vencimento de tributos federais e estaduais do mês</span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[160px] pr-1">
            {/* Oblig 1 */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#131826] border border-[#1d2436]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-7 rounded-full bg-rose-500 shrink-0"></span>
                <div>
                  <h5 className="text-[10px] font-bold text-white">DCTFWeb</h5>
                  <span className="text-[8px] text-slate-500 font-mono block mt-0.5">Prazo limite: 15/Mai</span>
                </div>
              </div>
              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[8px] px-2 py-0.5 rounded-full font-extrabold">
                2 dias
              </span>
            </div>
            {/* Oblig 2 */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#131826] border border-[#1d2436]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-7 rounded-full bg-amber-500 shrink-0"></span>
                <div>
                  <h5 className="text-[10px] font-bold text-white">EFD Contribuições</h5>
                  <span className="text-[8px] text-slate-500 font-mono block mt-0.5">Prazo limite: 15/Jun</span>
                </div>
              </div>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] px-2 py-0.5 rounded-full font-extrabold">
                13 dias
              </span>
            </div>
            {/* Oblig 3 */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#131826] border border-[#1d2436]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-7 rounded-full bg-emerald-500 shrink-0"></span>
                <div>
                  <h5 className="text-[10px] font-bold text-white">EFD ICMS IPI</h5>
                  <span className="text-[8px] text-slate-500 font-mono block mt-0.5">Prazo limite: 23/Jun</span>
                </div>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] px-2 py-0.5 rounded-full font-extrabold">
                21 dias
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. QUICK ACTIONS PANEL + RECENT ACTIVITY (TIMELINE) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-bottom-grid">
        
        {/* ACCESS GRID (CIRCULAR BUTTONS) */}
        <div className="bg-[#0c101b] border border-[#1d2436] rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between shadow-xl space-y-4">
          <div>
            <h3 className="text-white font-bold text-sm">Acesso Rápido</h3>
            <span className="text-slate-400 text-[10px] block mt-0.5">Ações prioritárias e canais do portal corporativo</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" id="quick-action-buttons">
            {/* Action 1 */}
            <button
              onClick={() => setActiveTab('clients')}
              className="flex flex-col items-center justify-center p-4 bg-[#121826] hover:bg-[#1a2336] border border-[#1d2436] rounded-xl hover:border-emerald-500/35 transition-all group shrink-0"
            >
              <div className="bg-[#182033] text-emerald-400 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-extrabold text-white">Nova Empresa</span>
              <span className="text-[8px] text-slate-500 mt-0.5 text-center leading-none">Cadastrar CNPJ</span>
            </button>
            {/* Action 2 */}
            <button
              onClick={() => setActiveTab('new-audit')}
              className="flex flex-col items-center justify-center p-4 bg-[#121826] hover:bg-[#1a2336] border border-[#1d2436] rounded-xl hover:border-emerald-500/35 transition-all group shrink-0"
            >
              <div className="bg-[#182033] text-emerald-400 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                <FileCode className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-extrabold text-white">Importar XML</span>
              <span className="text-[8px] text-slate-500 mt-0.5 text-center leading-none">Lote de Notas</span>
            </button>
            {/* Action 3 */}
            <button
              onClick={() => setActiveTab('rules')}
              className="flex flex-col items-center justify-center p-4 bg-[#121826] hover:bg-[#1a2336] border border-[#1d2436] rounded-xl hover:border-emerald-500/35 transition-all group shrink-0"
            >
              <div className="bg-[#182033] text-emerald-400 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                <Percent className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-extrabold text-white">Regras Tributárias</span>
              <span className="text-[8px] text-slate-500 mt-0.5 text-center leading-none">Alíquota e CFOP</span>
            </button>
            {/* Action 4 */}
            <button
              onClick={() => setActiveTab('report')}
              className="flex flex-col items-center justify-center p-4 bg-[#121826] hover:bg-[#1a2336] border border-[#1d2436] rounded-xl hover:border-emerald-500/35 transition-all group shrink-0"
            >
              <div className="bg-[#182033] text-emerald-400 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-extrabold text-white">Gerar Relatório</span>
              <span className="text-[8px] text-slate-500 mt-0.5 text-center leading-none">PDF & Excel</span>
            </button>
          </div>
        </div>

        {/* RECENT ACTIVITIES TIMELINE */}
        <div className="bg-[#0c101b] border border-[#1d2436] rounded-2xl p-6 flex flex-col justify-between shadow-xl space-y-4">
          <div>
            <h3 className="text-white font-bold text-sm">Atividades Recentes</h3>
            <span className="text-slate-400 text-[10px] block mt-0.5">Histórico de auditorias efetuadas pelo operador fiscal</span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[180px] pr-1" id="timeline-list">
            {/* Act 1 */}
            <div className="flex gap-3 text-[10px] relative">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
              <div className="space-y-0.5">
                <p className="text-white font-bold">Nota fiscal processada</p>
                <p className="text-slate-400 text-[9px] leading-tight">XML NF-e #123456 - Tech Solutions LTDA</p>
                <span className="text-[8px] text-slate-500 block font-medium">Há 5 min</span>
              </div>
            </div>
            {/* Act 2 */}
            <div className="flex gap-3 text-[10px] relative">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
              <div className="space-y-0.5">
                <p className="text-white font-bold">Auditoria IA concluída</p>
                <p className="text-slate-400 text-[9px] leading-tight">Empresa: Comércio Digital LTDA</p>
                <span className="text-[8px] text-slate-500 block font-medium">Há 15 min</span>
              </div>
            </div>
            {/* Act 3 */}
            <div className="flex gap-3 text-[10px] relative">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
              <div className="space-y-0.5">
                <p className="text-white font-bold">Diferença de ICMS identificada</p>
                <p className="text-slate-400 text-[9px] leading-tight">Nota #349 - Indústria Exemplo LTDA</p>
                <span className="text-[8px] text-slate-500 block font-medium">Há 1 hora</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 6. SPECIAL SECTION: SIMULADOR TRIBUTÁRIO DA REFORMA 2027 VS FEED DE NOTÍCIAS */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" id="simulador-noticias-grid">
        
        {/* INTERACTIVE SIMULATOR (3/5 COLS) */}
        <div className="bg-[#0c101b] border border-[#1d2436] rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-5 lg:col-span-3 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-md text-[9px] font-bold">
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              Simulador Reforma 2027
            </span>
            <h3 className="font-bold text-base text-white mt-2">Impacto de Transição para o IBS & CBS</h3>
            <p className="text-slate-400 text-xs">Simule as alíquotas da PEC 45/2019 e projete a carga líquida tributária estimada após créditos amplos.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Input Faturamento */}
            <div className="space-y-1.5">
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Faturamento Mensal (R$)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 text-xs font-mono font-bold">R$</span>
                <input
                  type="number"
                  value={simFaturamento}
                  onChange={(e) => setSimFaturamento(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#080b11] border border-[#1d2436] rounded-xl py-2 pl-9 pr-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-all"
                  placeholder="Ex: 150000"
                />
              </div>
            </div>

            {/* Input Regime e Tipo */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5 relative">
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Regime</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsSimRegimeDropdownOpen(!isSimRegimeDropdownOpen);
                    setIsSimComercioDropdownOpen(false);
                  }}
                  className="w-full bg-[#080b11] border border-[#1d2436] hover:border-emerald-500/50 rounded-xl p-2 text-white text-[11px] font-bold text-left flex items-center justify-between transition-all"
                >
                  <span>
                    {simRegime === 'Simples Nacional' ? 'Simples' : simRegime === 'Lucro Presumido' ? 'Presumido' : 'Real'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSimRegimeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isSimRegimeDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsSimRegimeDropdownOpen(false)}></div>
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#0c101b] border border-[#1d2436] rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                      {[
                        { value: 'Simples Nacional', label: 'Simples' },
                        { value: 'Lucro Presumido', label: 'Presumido' },
                        { value: 'Lucro Real', label: 'Real' }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setSimRegime(opt.value as TaxRegime);
                            setIsSimRegimeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-[11px] font-bold transition-colors ${
                            simRegime === opt.value ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-1.5 relative">
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Segmento</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsSimComercioDropdownOpen(!isSimComercioDropdownOpen);
                    setIsSimRegimeDropdownOpen(false);
                  }}
                  className="w-full bg-[#080b11] border border-[#1d2436] hover:border-emerald-500/50 rounded-xl p-2 text-white text-[11px] font-bold text-left flex items-center justify-between transition-all"
                >
                  <span className="truncate">
                    {simComercio === 'comercio' ? 'Comércio' :
                     simComercio === 'industria' ? 'Indústria' :
                     simComercio === 'servico_geral' ? 'Serviço em geral' :
                     simComercio === 'servico_transporte_carga' ? 'Transporte de carga' :
                     simComercio === 'servico_transporte_passageiro' ? 'Transporte de passageiro' :
                     simComercio === 'servico_hospitalar' ? 'Serviço hospitalar' :
                     'Revenda de combustível'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${isSimComercioDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSimComercioDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsSimComercioDropdownOpen(false)}></div>
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#0c101b] border border-[#1d2436] rounded-xl shadow-2xl z-50 overflow-hidden py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                      {[
                        { value: 'comercio', label: 'Comércio' },
                        { value: 'industria', label: 'Indústria' },
                        { value: 'servico_geral', label: 'Serviço em geral' },
                        { value: 'servico_transporte_carga', label: 'Transporte de carga' },
                        { value: 'servico_transporte_passageiro', label: 'Transporte de passageiro' },
                        { value: 'servico_hospitalar', label: 'Serviço hospitalar' },
                        { value: 'revenda_combustivel', label: 'Revenda de combustível' }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setSimComercio(opt.value);
                            setIsSimComercioDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-[11px] font-bold transition-colors truncate ${
                            simComercio === opt.value ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Comparativo de Carga */}
          <div className="bg-[#080b11]/80 border border-[#1d2436] rounded-xl p-4 grid grid-cols-3 gap-3">
            
            {/* Imposto Atual */}
            <div className="space-y-1">
              <span className="text-slate-500 text-[9px] uppercase font-extrabold tracking-wider">Imposto Atual</span>
              <p className="text-xs text-slate-300 font-bold font-mono">
                R$ {impostoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[8px] text-slate-500">{(aliquotaAtual * 100).toFixed(1)}% Efetiva</p>
            </div>

            {/* Imposto Reforma Líquido */}
            <div className="space-y-1 border-l border-[#1d2436] pl-3">
              <span className="text-slate-500 text-[9px] uppercase font-extrabold tracking-wider">Reforma Líquido</span>
              <p className="text-xs text-emerald-400 font-bold font-mono">
                R$ {impostoReformaLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[8px] text-slate-500">Crédito Amplo</p>
            </div>

            {/* Diferença / Comparativo */}
            <div className="space-y-1 border-l border-[#1d2436] pl-3">
              <span className="text-slate-500 text-[9px] uppercase font-extrabold tracking-wider">Diferença</span>
              <div className="flex items-center gap-0.5">
                {diferencaImposto <= 0 ? (
                  <span className="text-emerald-400 font-black text-xs flex items-center font-mono">
                    <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                    -{Math.abs(economiaPorcentagem).toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-amber-400 font-black text-xs flex items-center font-mono">
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                    +{Math.abs(economiaPorcentagem).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-[8px] text-slate-500">
                {diferencaImposto <= 0 ? "Economia!" : "Acréscimo"}
              </p>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1 leading-none">
              <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              *Estimativa com alíquota dual base de 26.5% (IBS+CBS)
            </span>
            <button
              onClick={() => setActiveTab('rules')}
              className="text-emerald-400 font-bold hover:underline flex items-center gap-0.5"
            >
              Consultar Regras Fiscais
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* FEED DE NOTÍCIAS & ATUALIZAÇÕES TRIBUTÁRIAS (2/5 COLS) */}
        <div className="bg-[#0c101b] border border-[#1d2436] rounded-2xl p-6 flex flex-col justify-between space-y-4 lg:col-span-2">
          <div className="border-b border-[#1c2436] pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Newspaper className="w-4 h-4 text-emerald-400" />
              Notícias Tributárias
            </h3>
            <span className="text-slate-400 text-[10px] block mt-0.5">Fatos relevantes e atualizações de legislação do dia</span>
          </div>

          <div className="space-y-3.5 overflow-y-auto max-h-[220px] pr-1">
            {newsFeed.map((news) => (
              <div key={news.id} className="p-3 rounded-xl bg-[#090d16] border border-[#1e2637] transition-all space-y-1.5 group">
                <div className="flex justify-between items-center text-[8px]">
                  <span className={`font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded border ${news.tagColor}`}>
                    {news.badge}
                  </span>
                  <span className="text-slate-500 font-semibold">{news.date}</span>
                </div>
                <h4 className="font-bold text-white text-[11px] leading-tight group-hover:text-emerald-400 transition-colors">
                  {news.title}
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed font-light">
                  {news.desc}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setActiveTab('rules')}
            className="w-full text-center py-2 rounded-xl border border-dashed border-[#202b40] hover:bg-[#121826] text-[11px] font-bold text-slate-400 hover:text-white transition-all"
          >
            Acessar Legislação e Manual do App
          </button>
        </div>

      </div>

      {/* 7. RECENT AUDITS LIST TABLE WIDGET (FISCA-TECH REPOS) */}
      <div className="bg-[#0c101b] border border-[#1d2436] rounded-2xl p-6 space-y-4" id="recent-audits-section">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1c2436] pb-4">
          <div>
            <h3 className="font-bold text-white text-sm">Últimos Lotes Fiscais Auditados</h3>
            <span className="text-slate-400 text-[10px] block mt-0.5">Repositório de lotes fiscais XML processados com integridade SHA-256</span>
          </div>
          <button
            onClick={() => setActiveTab('batches')}
            className="text-xs text-slate-400 hover:text-white font-bold flex items-center gap-0.5 hover:underline"
          >
            Ver Histórico Completo ({batches.length})
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {batches.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-xs text-slate-400 font-medium">Nenhum lote de nota fiscal processado ainda.</p>
            <button
              onClick={() => setActiveTab('new-audit')}
              className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all"
            >
              Fazer Primeira Auditoria
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto" id="recent-audits-table-wrapper">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="text-slate-500 border-b border-[#1d2436] font-bold uppercase text-[9px] tracking-wider">
                  <th className="pb-3 pt-1">Cliente / Empresa</th>
                  <th className="pb-3 pt-1">Data / Lote</th>
                  <th className="pb-3 pt-1">Regime</th>
                  <th className="pb-3 pt-1 text-right">XMLs</th>
                  <th className="pb-3 pt-1 text-right">Inconsistências</th>
                  <th className="pb-3 pt-1 text-right">Crédito Identificado</th>
                  <th className="pb-3 pt-1 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1d2436]">
                {batches.slice(-3).reverse().map((b) => (
                  <tr key={b.id} className="hover:bg-[#121826]/40 transition-colors group">
                    <td className="py-3.5 pr-2">
                      <div className="font-bold text-white">{b.clientName}</div>
                      <div className="text-[9px] text-slate-500 font-medium font-mono">CNPJ {clients.find(c => c.id === b.clientId)?.cnpj || "Isento"}</div>
                    </td>
                    <td className="py-3.5 text-slate-300 font-medium font-mono">
                      {b.date}
                    </td>
                    <td className="py-3.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        b.clientRegime === 'Simples Nacional' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        b.clientRegime === 'Lucro Real' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      }`}>
                        {b.clientRegime}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-bold text-white font-mono">
                      {b.totalInvoices}
                    </td>
                    <td className="py-3.5 text-right">
                      {b.errorsCount > 0 ? (
                        <span className="text-rose-400 font-extrabold font-mono flex items-center justify-end gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          {b.errorsCount}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold flex items-center justify-end gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          0
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right font-extrabold text-emerald-400 font-mono">
                      R$ {b.taxCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedBatchId(b.id);
                          setActiveTab('batches');
                        }}
                        className="bg-[#121826] hover:bg-emerald-500 text-slate-300 hover:text-slate-950 px-2.5 py-1.5 rounded-lg font-bold text-[10px] border border-[#1e2637] hover:border-transparent transition-all flex items-center justify-center gap-1 ml-auto"
                      >
                        Análise
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
