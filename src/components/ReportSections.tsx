import React from 'react';
import { FiscalBatch } from '../types';
import {
  analisarLote,
  montarSumarioExecutivo,
  formatarMoeda,
  rotuloSeveridade,
  VIGENCIA_BASE_LEGAL,
  Severidade,
} from '../reportEngine';

/* =====================================================================
   SEÇÕES ANALÍTICAS DO RELATÓRIO DE CONFORMIDADE
   ---------------------------------------------------------------------
   Renderiza sumário executivo, diagnóstico agrupado por tipo de erro
   (com causa raiz e base legal), detalhamento nota a nota e plano de
   ação priorizado.

   Roda sem IA: todos os dados vêm da análise determinística do lote.
   ===================================================================== */

const CORES: Record<Severidade, { bg: string; text: string; border: string; dot: string }> = {
  critico: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  alto: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  medio: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  baixo: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
};

interface Props {
  batch: FiscalBatch;
  clienteCnpj?: string;
  clienteLocalidade?: string;
  limiteDetalhamento?: number;
}

export default function ReportSections({
  batch,
  clienteCnpj,
  clienteLocalidade,
  limiteDetalhamento = 50,
}: Props) {
  const a = analisarLote(batch);
  const sumario = montarSumarioExecutivo(a, batch.clientName, batch.clientRegime);

  const achadosVisiveis = a.achados.slice(0, limiteDetalhamento);
  const ocultos = a.achados.length - achadosVisiveis.length;

  return (
    <div className="space-y-8 text-slate-800">
      {/* ================= 1. SUMÁRIO EXECUTIVO ================= */}
      <section className="space-y-3">
        <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight border-b-2 border-slate-900 pb-1">
          1. Sumário Executivo
        </h4>

        <p className="text-xs text-slate-700 leading-relaxed text-justify">{sumario}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-[9px] uppercase font-bold text-slate-400">Documentos</p>
            <p className="text-lg font-extrabold text-slate-900">{a.totalNotas}</p>
            <p className="text-[9px] text-slate-500">{a.notasConformes} conformes</p>
          </div>
          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-[9px] uppercase font-bold text-slate-400">Conformidade</p>
            <p className="text-lg font-extrabold text-slate-900">{a.percentualConformidade}%</p>
            <p className="text-[9px] text-slate-500">{a.notasComErro} com divergência</p>
          </div>
          <div className="border border-red-200 bg-red-50/40 rounded-lg p-3">
            <p className="text-[9px] uppercase font-bold text-red-600">Ocorrências</p>
            <p className="text-lg font-extrabold text-red-700">{a.totalOcorrencias}</p>
            <p className="text-[9px] text-red-600/80">
              {a.contagemPorSeveridade.critico} crítica(s)
            </p>
          </div>
          <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-3">
            <p className="text-[9px] uppercase font-bold text-emerald-700">Recuperável</p>
            <p className="text-lg font-extrabold text-emerald-700">
              R$ {formatarMoeda(a.creditoRecuperavel)}
            </p>
            <p className="text-[9px] text-emerald-700/80">Prazo: 5 anos</p>
          </div>
        </div>

        {(clienteCnpj || clienteLocalidade) && (
          <p className="text-[10px] text-slate-400 pt-1">
            {clienteCnpj && <>CNPJ {clienteCnpj}</>}
            {clienteCnpj && clienteLocalidade && ' · '}
            {clienteLocalidade}
          </p>
        )}
      </section>

      {/* ================= 2. DIAGNÓSTICO POR TIPO ================= */}
      <section className="space-y-3">
        <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight border-b-2 border-slate-900 pb-1">
          2. Diagnóstico por Tipo de Ocorrência
        </h4>

        {a.grupos.length === 0 ? (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            Nenhuma divergência identificada nos documentos analisados.
          </p>
        ) : (
          <div className="space-y-4">
            {a.grupos.map((g) => {
              const c = CORES[g.regra.severidade];
              return (
                <div
                  key={g.regra.codigo}
                  className={`border ${c.border} ${c.bg} rounded-xl p-4 space-y-3`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-2">
                      <span className={`w-2 h-2 rounded-full ${c.dot} mt-1.5 shrink-0`} />
                      <div>
                        <p className={`font-extrabold text-xs ${c.text}`}>{g.regra.titulo}</p>
                        <p className="text-[10px] text-slate-500">
                          Severidade {rotuloSeveridade(g.regra.severidade)} · {g.ocorrencias}{' '}
                          ocorrência(s) em {g.notasAfetadas.length} documento(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase text-slate-400 font-bold">Valor envolvido</p>
                      <p className="text-xs font-extrabold text-slate-800">
                        R$ {formatarMoeda(g.valorEnvolvido)}
                      </p>
                      {g.creditoEstimado > 0 && (
                        <p className="text-[10px] text-emerald-700 font-bold">
                          Crédito: R$ {formatarMoeda(g.creditoEstimado)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <p className="font-bold text-slate-700 uppercase text-[9px] mb-0.5">
                        Causa raiz
                      </p>
                      <p className="text-slate-600 leading-snug text-justify">{g.regra.causaRaiz}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 uppercase text-[9px] mb-0.5">
                        Risco associado
                      </p>
                      <p className="text-slate-600 leading-snug text-justify">{g.regra.risco}</p>
                    </div>
                  </div>

                  <div className="text-[11px] pt-1 border-t border-slate-200/70">
                    <p className="font-bold text-slate-700 uppercase text-[9px] mb-0.5">
                      Fundamentação legal
                    </p>
                    <p className="text-slate-600 leading-snug text-justify italic">
                      {g.regra.baseLegal}
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-500">
                    <span className="font-bold">Documentos afetados: </span>
                    {g.notasAfetadas.slice(0, 12).join(', ')}
                    {g.notasAfetadas.length > 12 && ` e mais ${g.notasAfetadas.length - 12}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= 3. PLANO DE AÇÃO ================= */}
      {a.planoAcao.length > 0 && (
        <section className="space-y-3">
          <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight border-b-2 border-slate-900 pb-1">
            3. Plano de Ação Priorizado
          </h4>
          <p className="text-[10px] text-slate-500">
            Ordenado por severidade e volume de ocorrências. A execução na sequência indicada
            concentra o esforço nos pontos de maior exposição.
          </p>

          <div className="space-y-3">
            {a.planoAcao.map((p) => {
              const c = CORES[p.severidade];
              return (
                <div key={p.ordem} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className={`${c.bg} px-4 py-2 flex items-center justify-between gap-2`}>
                    <div className="flex items-center gap-2">
                      <span
                        className={`${c.dot} text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0`}
                      >
                        {p.ordem}
                      </span>
                      <p className={`font-extrabold text-xs ${c.text}`}>{p.titulo}</p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase ${c.text}`}>
                      {rotuloSeveridade(p.severidade)}
                    </span>
                  </div>

                  <div className="p-4 space-y-2 text-[11px] bg-white">
                    <div>
                      <p className="font-bold text-slate-700 uppercase text-[9px] mb-0.5">
                        Providência
                      </p>
                      <p className="text-slate-600 leading-snug text-justify">{p.acao}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <p className="font-bold text-slate-700 uppercase text-[9px]">Prazo</p>
                        <p className="text-slate-600 leading-snug">{p.prazo}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 uppercase text-[9px]">Responsável</p>
                        <p className="text-slate-600">{p.responsavel}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 uppercase text-[9px]">Incidências</p>
                        <p className="text-slate-600">
                          {p.ocorrencias}
                          {p.impacto > 0 && (
                            <span className="text-emerald-700 font-bold">
                              {' '}
                              · R$ {formatarMoeda(p.impacto)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= 4. DETALHAMENTO NOTA A NOTA ================= */}
      {a.achados.length > 0 && (
        <section className="space-y-3">
          <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight border-b-2 border-slate-900 pb-1">
            4. Detalhamento por Documento
          </h4>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-[10px]">
              <thead className="bg-slate-100">
                <tr className="text-left text-slate-600 uppercase text-[9px]">
                  <th className="px-2 py-2 font-bold">NF</th>
                  <th className="px-2 py-2 font-bold">Data</th>
                  <th className="px-2 py-2 font-bold">Destinatário</th>
                  <th className="px-2 py-2 font-bold">NCM</th>
                  <th className="px-2 py-2 font-bold">CFOP</th>
                  <th className="px-2 py-2 font-bold">CST</th>
                  <th className="px-2 py-2 font-bold text-right">Valor</th>
                  <th className="px-2 py-2 font-bold">Divergência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {achadosVisiveis.map((d, i) => (
                  <tr key={`${d.numeroNota}-${i}`} className="hover:bg-slate-50/60 align-top">
                    <td className="px-2 py-2 font-bold text-slate-900 whitespace-nowrap">
                      {d.numeroNota}
                    </td>
                    <td className="px-2 py-2 text-slate-500 whitespace-nowrap">{d.dataNota}</td>
                    <td className="px-2 py-2 text-slate-600 max-w-[120px] truncate">
                      {d.destinatario}
                    </td>
                    <td className="px-2 py-2 font-mono text-slate-700">{d.ncm}</td>
                    <td className="px-2 py-2 font-mono text-slate-700">{d.cfop}</td>
                    <td className="px-2 py-2 font-mono text-slate-700">{d.cstIcms}</td>
                    <td className="px-2 py-2 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatarMoeda(d.valorNota)}
                    </td>
                    <td className="px-2 py-2 text-slate-600 leading-snug">{d.mensagem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {ocultos > 0 && (
            <p className="text-[10px] text-slate-500 italic">
              Exibindo os primeiros {limiteDetalhamento} apontamentos. Há mais {ocultos} ocorrência(s)
              no lote — consulte a planilha completa exportada em Excel.
            </p>
          )}
        </section>
      )}

      {/* ================= 5. NOTA METODOLÓGICA ================= */}
      <section className="space-y-2 pt-2 border-t border-slate-200">
        <h4 className="font-extrabold text-[10px] text-slate-500 uppercase tracking-tight">
          Nota metodológica e fundamentação
        </h4>
        <p className="text-[9px] text-slate-500 leading-snug text-justify">
          Análise executada por motor de auditoria automatizado sobre {a.totalNotas} documento(s)
          fiscal(is) eletrônico(s), com verificação de NCM, CFOP, CST/CSOSN, enquadramento monofásico
          de PIS/COFINS, substituição tributária e limites do regime de apuração. Referências legais
          verificadas em {VIGENCIA_BASE_LEGAL.verificadoEm}.
        </p>
        <div className="text-[9px] text-slate-400 leading-snug">
          <span className="font-bold">Fontes: </span>
          {VIGENCIA_BASE_LEGAL.fontes.join(' · ')}
        </div>
        <p className="text-[9px] text-slate-400 italic">{VIGENCIA_BASE_LEGAL.observacao}</p>
      </section>
    </div>
  );
}