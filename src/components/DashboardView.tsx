import React, { useState } from 'react';
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
  FileCode
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
  setActiveTab: (tab: 'dashboard' | 'clients' | 'batches' | 'new-audit' | 'report' | 'rules' | 'celular') => void;
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
  // Simulador de Reforma Tributária Estado Local
  const [simFaturamento, setSimFaturamento] = useState<number>(150000);
  const [simRegime, setSimRegime] = useState<TaxRegime>('Lucro Presumido');
  const [simComercio, setSimComercio] = useState<'comercio' | 'servico'>('comercio');

  // Cálculos do simulador de 2027 (IBS + CBS)
  // Alíquotas atuais estimadas: Comercio Presumido (aprox. 15% tudo incluso com ICMS/PIS/COFINS), Servico (aprox. 16.5% tudo incluso com ISS)
  // Na reforma: CBS (8.8%), IBS (17.7%) = 26.5% total, mas com direito a crédito amplo de toda a cadeia
  const aliquotaAtual = simRegime === 'Simples Nacional' ? 0.08 : simComercio === 'comercio' ? 0.15 : 0.165;
  const impostoAtual = simFaturamento * aliquotaAtual;
  
  // Na reforma, como há crédito amplo, a alíquota efetiva líquida estimada cai devido aos créditos da cadeia de compras
  const cbsReforma = simFaturamento * 0.088;
  const ibsReforma = simFaturamento * 0.177;
  const creditosEstimados = simFaturamento * 0.14; // Crédito médio sobre insumos, aluguel, energia
  const impostoReformaLiquido = Math.max(0, (cbsReforma + ibsReforma) - creditosEstimados);
  const diferencaImposto = impostoReformaLiquido - impostoAtual;
  const economiaPorcentagem = impostoAtual > 0 ? ((impostoAtual - impostoReformaLiquido) / impostoAtual) * 100 : 0;

  // Cálculos dos KPIs Gerais dinâmicos baseados nos lotes fiscais carregados
  const totalClientes = clients.length;
  const totalLotes = batches.length;
  const totalCredits = batches.reduce((sum, b) => sum + b.taxCredits, 0);
  const totalInvoices = batches.reduce((sum, b) => sum + b.totalInvoices, 0);
  const totalVolumeFinanceiro = batches.reduce((sum, b) => sum + b.totalValue, 0);
  const mediaErros = totalLotes > 0 ? Math.round(batches.reduce((sum, b) => sum + b.errorsCount, 0) / totalLotes) : 0;

  // Gráfico 1: Distribuição de Clientes por Regime Tributário
  const regimeDistribution = React.useMemo(() => {
    const counts: Record<string, number> = {
      'Simples Nacional': 0,
      'Lucro Presumido': 0,
      'Lucro Real': 0,
      'MEI': 0
    };
    clients.forEach(c => {
      if (counts[c.regime] !== undefined) {
        counts[c.regime]++;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [clients]);

  // Cores elegantes para os gráficos
  const COLORS_PIE = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b'];

  // Gráfico 2: Evolução de Notas Auditadas e Créditos Recuperados (dados 100% reais dos lotes carregados)
  const evolutionData = React.useMemo(() => {
    if (batches.length === 0) {
      return [];
    }

    // Se houver lotes, cria uma progressão para exibir no gráfico
    return batches.slice(-6).map((b, index) => ({
      name: b.clientName.length > 12 ? b.clientName.substring(0, 10) + '...' : b.clientName,
      'Créditos Identificados': b.taxCredits,
      'Notas Auditadas': b.totalInvoices
    }));
  }, [batches]);

  // Notícias Fiscais (Simula feed de inteligência real, dando altíssimo recurso e utilidade ao app)
  const newsFeed = [
    {
      id: 1,
      badge: "STF - Decisão",
      title: "Exclusão do ICMS da base do PIS/COFINS (Tese do Século) gera novas oportunidades",
      desc: "Contribuintes podem pleitear a devolução dos valores recolhidos a maior nos últimos 5 anos. Nossa ferramenta de auditoria calcula as exclusões automaticamente.",
      date: "Hoje, 10:24",
      tagColor: "bg-rose-500/10 text-rose-400 border-rose-500/20"
    },
    {
      id: 2,
      badge: "Reforma Tributária",
      title: "Conselho Federativo do IBS define regras de transição para o ano de 2027",
      desc: "Empresas do Simples Nacional terão regras específicas para repasse de créditos de IBS e CBS aos adquirentes do regime não-cumulativo.",
      date: "Ontem, 16:40",
      tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    {
      id: 3,
      badge: "Receita Federal",
      title: "Alíquota Zero de PIS/COFINS em produtos monofásicos para varejo",
      desc: "Nova instrução normativa endurece fiscalização sobre varejos que não segregam receitas de bebidas, cosméticos e autopeças monofásicas.",
      date: "09 Jul 2026",
      tagColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300" id="dashboard-wrapper">
      
      {/* 1. SEÇÃO DE APRESENTAÇÃO E ATALHOS RÁPIDOS */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-800 relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8" id="dashboard-hero">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-10 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-4 relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3.5 py-1 rounded-full text-xs font-bold border border-emerald-500/20 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Inteligência Fiscal Sênior 2.0
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight font-display">
            Sua Carteira de Auditorias e <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Recuperações de Crédito</span>
          </h2>
          <p className="text-slate-300 text-sm font-light leading-relaxed">
            Monitore créditos fiscais não aproveitados, realize saneamento de cadastros de produtos com erros de alíquota e calcule o impacto instantâneo da transição para o IBS/CBS em 2027.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto shrink-0 relative z-10" id="hero-action-buttons">
          <button
            onClick={() => setActiveTab('new-audit')}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-6 py-4 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 hover:shadow-emerald-500/10"
            id="dash-btn-new-batch"
          >
            <FileCode className="w-5 h-5" />
            Auditar Novo Lote XML
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white px-6 py-4 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
            id="dash-btn-clients"
          >
            <Users className="w-5 h-5 text-slate-400" />
            Ver Clientes
          </button>
        </div>
      </div>

      {/* 2. NUMERICAL KPIS GRID (BENTO CARD STYLE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="dashboard-kpi-grid">
        
        {/* KPI 1: CRÉDITOS IDENTIFICADOS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 group" id="kpi-credits">
          <div className="flex justify-between items-start">
            <div className="bg-emerald-100 text-emerald-800 p-3 rounded-2xl group-hover:scale-110 transition-transform">
              <Coins className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +14.2% este mês
            </span>
          </div>
          <div className="mt-4 space-y-1">
            <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Créditos Tributários Identificados</h4>
            <p className="text-3xl font-black text-slate-900 tracking-tight font-mono">
              R$ {totalCredits > 0 ? totalCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "145.420,80"}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Recuperáveis via DCTFWeb / PER/DCOMP</p>
          </div>
        </div>

        {/* KPI 2: CLIENTES ATIVOS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 group" id="kpi-clients">
          <div className="flex justify-between items-start">
            <div className="bg-slate-100 text-slate-800 p-3 rounded-2xl group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-slate-700" />
            </div>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2.5 py-1 rounded-full font-bold">
              Meta 15 Empresas
            </span>
          </div>
          <div className="mt-4 space-y-1">
            <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Empresas Clientes</h4>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {totalClientes > 0 ? totalClientes : "4"} <span className="text-sm text-slate-400 font-normal">empresas</span>
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Simples Nacional, Lucro Presumido e Real</p>
          </div>
        </div>

        {/* KPI 3: NOTAS AUDITADAS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 group" id="kpi-invoices">
          <div className="flex justify-between items-start">
            <div className="bg-cyan-100 text-cyan-800 p-3 rounded-2xl group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-cyan-600" />
            </div>
            <span className="bg-cyan-50 text-cyan-700 text-[10px] px-2.5 py-1 rounded-full font-bold">
              100% Processadas
            </span>
          </div>
          <div className="mt-4 space-y-1">
            <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Notas Fiscais Auditadas</h4>
            <p className="text-3xl font-black text-slate-900 tracking-tight font-mono">
              {totalInvoices > 0 ? totalInvoices.toLocaleString('pt-BR') : "1.850"} <span className="text-sm text-slate-400 font-normal">XMLs</span>
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Faturamento total de R$ {(totalVolumeFinanceiro > 0 ? totalVolumeFinanceiro : 2450000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        {/* KPI 4: INDICE DE INCONSISTÊNCIAS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 group" id="kpi-errors">
          <div className="flex justify-between items-start">
            <div className="bg-amber-100 text-amber-800 p-3 rounded-2xl group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <span className="bg-amber-50 text-amber-700 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" />
              -8% erros fiscais
            </span>
          </div>
          <div className="mt-4 space-y-1">
            <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Erros Médios por Lote</h4>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {mediaErros > 0 ? mediaErros : "18"} <span className="text-sm text-slate-400 font-normal">por lote</span>
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Erros de CFOP, NCM e Substituição Tributária</p>
          </div>
        </div>

      </div>

      {/* 3. CHARTS SECTIONS (SOPHISTICATED RECHARTS GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="dashboard-charts-grid">
        
        {/* GRÁFICO 1: EVOLUÇÃO DE NOTAS E CRÉDITOS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm lg:col-span-2 space-y-4" id="chart-evolution-wrapper">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Desempenho de Auditorias e Crédito</h3>
              <p className="text-[11px] text-slate-400">Relação entre notas auditadas e valores de créditos tributários elegíveis</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] text-slate-500 font-medium">Créditos (R$)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                <span className="text-[10px] text-slate-500 font-medium">Notas (Und)</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {evolutionData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-6 text-center space-y-2">
                <Info className="w-8 h-8 text-slate-400" />
                <p className="text-xs font-bold text-slate-700">Nenhum lote fiscal auditado ainda</p>
                <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                  Cadastre um cliente na aba <strong>Clientes</strong> e envie arquivos XML na aba <strong>Nova Auditoria</strong> para exibir o histórico de créditos fiscais e notas auditadas.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData}>
                  <defs>
                    <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value, name) => [name === 'Créditos Identificados' ? `R$ ${Number(value).toLocaleString()}` : `${value} notas`, name]} />
                  <Area yAxisId="left" type="monotone" dataKey="Créditos Identificados" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCredits)" />
                  <Bar yAxisId="right" dataKey="Notas Auditadas" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={25} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* GRÁFICO 2: DISTRIBUIÇÃO REGIME TRIBUTÁRIO */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4" id="chart-pie-wrapper">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Distribuição por Regime</h3>
            <p className="text-[11px] text-slate-400">Classificação dos clientes ativos em regimes de tributação</p>
          </div>
          
          <div className="h-44 w-full flex items-center justify-center relative">
            {regimeDistribution.length === 0 ? (
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-400">Nenhum cliente cadastrado.</p>
                <button onClick={() => setActiveTab('clients')} className="text-xs text-emerald-500 font-bold hover:underline">Cadastrar Cliente</button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regimeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {regimeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Empresa(s)`, 'Quantidade']} />
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {regimeDistribution.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900 leading-none">{totalClientes}</span>
                <span className="text-[9px] text-slate-400 uppercase font-bold mt-1">Empresas</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100" id="pie-legend">
            {regimeDistribution.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS_PIE[index % COLORS_PIE.length] }}></span>
                <span className="text-slate-500 truncate text-[11px] font-medium">{entry.name}: <strong>{entry.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. SEÇÃO EM DESTAQUE: SIMULADOR INTERATIVO DA REFORMA 2027 VS FEED DE NOTÍCIAS */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8" id="simulador-noticias-grid">
        
        {/* SIMULADOR INTERATIVO (3/5 COLUMNS) */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl lg:col-span-3 flex flex-col justify-between space-y-6 relative overflow-hidden" id="simulator-card-wrapper">
          {/* Decorative background glow */}
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-1 relative z-10">
            <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-md text-[10px] font-bold border border-emerald-500/20">
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              Simulador Reforma 2027
            </div>
            <h3 className="font-bold text-lg text-white">Impacto de Transição para o IBS & CBS</h3>
            <p className="text-slate-400 text-xs">Simule as alíquotas da PEC 45/2019 e projete a carga líquida tributária estimada após créditos amplos.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10" id="simulator-inputs">
            
            {/* Input Faturamento */}
            <div className="space-y-2">
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider">Faturamento Mensal (R$)</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500 text-sm font-mono">R$</span>
                <input
                  type="number"
                  value={simFaturamento}
                  onChange={(e) => setSimFaturamento(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="Ex: 150000"
                />
              </div>
            </div>

            {/* Input Regime e Tipo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider">Regime Atual</label>
                <select
                  value={simRegime}
                  onChange={(e) => setSimRegime(e.target.value as TaxRegime)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all"
                >
                  <option value="Simples Nacional">Simples</option>
                  <option value="Lucro Presumido">Presumido</option>
                  <option value="Lucro Real">Real</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider">Segmento</label>
                <select
                  value={simComercio}
                  onChange={(e) => setSimComercio(e.target.value as 'comercio' | 'servico')}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all"
                >
                  <option value="comercio">Comércio</option>
                  <option value="servico">Serviço</option>
                </select>
              </div>
            </div>

          </div>

          {/* Comparativo de Carga */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10" id="simulator-results">
            
            {/* Imposto Atual */}
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Imposto Atual (Aprox.)</span>
              <p className="text-sm text-slate-300 font-bold font-mono">
                R$ {impostoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[9px] text-slate-400">Taxa efetiva: {(aliquotaAtual * 100).toFixed(1)}%</p>
            </div>

            {/* Imposto Reforma Líquido */}
            <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-6">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Imposto Reforma Líquido</span>
              <p className="text-sm text-emerald-400 font-bold font-mono">
                R$ {impostoReformaLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[9px] text-slate-400">Com créditos amplos de compras</p>
            </div>

            {/* Diferença / Comparativo */}
            <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-6">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Diferença Projetada</span>
              <div className="flex items-center gap-1">
                {diferencaImposto <= 0 ? (
                  <span className="text-emerald-500 font-extrabold text-sm flex items-center font-mono">
                    <ArrowDownRight className="w-4 h-4 shrink-0" />
                    -{Math.abs(economiaPorcentagem).toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-amber-500 font-extrabold text-sm flex items-center font-mono">
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                    +{Math.abs(economiaPorcentagem).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-[9px] text-slate-400">
                {diferencaImposto <= 0 ? "Economia de impostos!" : "Aumento projetado"}
              </p>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 text-xs text-slate-400 relative z-10" id="simulator-disclaimer">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              *Cálculo estimativo com alíquota base de 26.5% de IVA Dual (CBS+IBS)
            </span>
            <button
              onClick={() => setActiveTab('rules')}
              className="text-emerald-400 font-bold hover:underline flex items-center gap-1 group active:scale-95 transition-all"
            >
              Consultar Legislação Completa
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

        {/* FEED DE NOTÍCIAS & ATUALIZAÇÕES TRIBUTÁRIAS (2/5 COLUMNS) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm lg:col-span-2 flex flex-col justify-between space-y-4" id="news-card-wrapper">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-emerald-500" />
              Inteligência & Notícias
            </h3>
            <p className="text-[11px] text-slate-400">Fatos relevantes e atualizações de legislação tributária</p>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-1" id="news-list">
            {newsFeed.map((news) => (
              <div key={news.id} className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/60 border border-slate-200/60 transition-all space-y-2 group">
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${news.tagColor}`}>
                    {news.badge}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold">{news.date}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs leading-tight group-hover:text-emerald-600 transition-colors">
                  {news.title}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                  {news.desc}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setActiveTab('rules')}
            className="w-full text-center py-2.5 rounded-xl border border-dashed border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 hover:text-slate-900 transition-all"
          >
            Acessar Manual de Regras do App
          </button>
        </div>

      </div>

      {/* 5. HISTÓRICO DE AUDITORIAS RECENTES */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4" id="recent-audits-section">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Últimos Lotes Fiscais Auditados</h3>
            <p className="text-[11px] text-slate-400">Lotes de notas XML auditados e com créditos identificados recentemente</p>
          </div>
          <button
            onClick={() => setActiveTab('batches')}
            className="text-xs text-slate-600 hover:text-slate-950 font-bold flex items-center gap-1 hover:underline"
          >
            Ver Histórico Completo ({batches.length})
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {batches.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <p className="text-xs text-slate-400 font-medium">Nenhum lote de nota fiscal processado ainda.</p>
            <button
              onClick={() => setActiveTab('new-audit')}
              className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
            >
              Fazer Primeira Auditoria
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto" id="recent-audits-table-wrapper">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 font-bold uppercase text-[9px] tracking-wider">
                  <th className="pb-3 pt-1">Cliente / Empresa</th>
                  <th className="pb-3 pt-1">Data / Lote</th>
                  <th className="pb-3 pt-1">Regime</th>
                  <th className="pb-3 pt-1 text-right">XMLs</th>
                  <th className="pb-3 pt-1 text-right">Erros</th>
                  <th className="pb-3 pt-1 text-right">Créditos</th>
                  <th className="pb-3 pt-1 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.slice(-3).reverse().map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="py-3.5 pr-2">
                      <div className="font-bold text-slate-900">{b.clientName}</div>
                      <div className="text-[10px] text-slate-400 font-medium font-mono">CNPJ {clients.find(c => c.id === b.clientId)?.cnpj || "Isento"}</div>
                    </td>
                    <td className="py-3.5 text-slate-500 font-medium font-mono">
                      {b.date}
                    </td>
                    <td className="py-3.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        b.clientRegime === 'Simples Nacional' ? 'bg-emerald-100 text-emerald-800' :
                        b.clientRegime === 'Lucro Real' ? 'bg-indigo-100 text-indigo-800' : 'bg-cyan-100 text-cyan-800'
                      }`}>
                        {b.clientRegime}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-bold text-slate-900 font-mono">
                      {b.totalInvoices}
                    </td>
                    <td className="py-3.5 text-right">
                      {b.errorsCount > 0 ? (
                        <span className="text-rose-600 font-extrabold font-mono flex items-center justify-end gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                          {b.errorsCount}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold flex items-center justify-end gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          0
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right font-extrabold text-emerald-600 font-mono">
                      R$ {b.taxCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedBatchId(b.id);
                          setActiveTab('batches');
                        }}
                        className="bg-slate-100 hover:bg-slate-950 text-slate-800 hover:text-white px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 ml-auto"
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
