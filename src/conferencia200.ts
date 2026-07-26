import { FiscalBatch, TaxInvoice } from './types';

export interface DivergenciaItem {
  notaNumero: string;
  campo: string;
  esperado: string | number;
  encontrado: string | number;
  gravidade: "alta" | "media" | "baixa";
}

export interface ResultadoConferencia {
  aprovado: boolean;
  selo: string;
  totalNotas: number;
  notasConferidas: number;
  divergencias: DivergenciaItem[];
  resumo: string;
}

const TOLERANCIA_CENTAVOS = 0.02;

export function conferir200(batch: FiscalBatch): ResultadoConferencia {
  const divergencias: DivergenciaItem[] = [];
  let notasConferidas = 0;
  try {
    const invoices = (batch.invoices || []) as TaxInvoice[];
    let somaValores = 0;
    for (const inv of invoices) somaValores += Number(inv.value) || 0;
    const totalBatch = Number(batch.totalValue) || 0;
    if (Math.abs(somaValores - totalBatch) > TOLERANCIA_CENTAVOS) {
      divergencias.push({ notaNumero: "LOTE", campo: "total_do_lote", esperado: somaValores.toFixed(2), encontrado: totalBatch.toFixed(2), gravidade: "alta" });
    }
    for (const inv of invoices) {
      notasConferidas++;
      const ncm = String(inv.ncm || "").replace(/\D/g, "");
      if (ncm.length !== 8) {
        divergencias.push({ notaNumero: inv.number || "?", campo: "NCM", esperado: "8 digitos", encontrado: ncm.length + " digitos", gravidade: "alta" });
      }
      const cfop = String(inv.cfop || "");
      const ufEmit = (inv.issuerState || "").toUpperCase();
      const ufDest = (inv.recipientState || "").toUpperCase();
      if (cfop.startsWith("6") && ufEmit && ufDest && ufEmit === ufDest) {
        divergencias.push({ notaNumero: inv.number || "?", campo: "CFOP", esperado: "interno (5xxx) mesma UF", encontrado: cfop + " interestadual com UF " + ufEmit + "=" + ufDest, gravidade: "alta" });
      }
      if (cfop.startsWith("5") && ufEmit && ufDest && ufEmit !== ufDest) {
        divergencias.push({ notaNumero: inv.number || "?", campo: "CFOP", esperado: "interestadual (6xxx) UFs diferentes", encontrado: cfop + " interno com UF " + ufEmit + "!=" + ufDest, gravidade: "alta" });
      }
      const v = Number(inv.value) || 0;
      if (v <= 0) {
        divergencias.push({ notaNumero: inv.number || "?", campo: "valor", esperado: "> 0", encontrado: v, gravidade: "media" });
      }
      const imp = Number(inv.calculatedTax) || 0;
      if (imp > v && v > 0) {
        divergencias.push({ notaNumero: inv.number || "?", campo: "imposto", esperado: "<= " + v.toFixed(2), encontrado: imp.toFixed(2), gravidade: "alta" });
      }
      // checagem cruzada: se o motor marcou erro e a 2a via nao confirmou, sinaliza
      const errosMotor = (inv.errors || []).length;
      const jaAchou = divergencias.some(d => d.notaNumero === (inv.number || "?"));
      if (errosMotor > 0 && !jaAchou) {
        divergencias.push({ notaNumero: inv.number || "?", campo: "motor", esperado: "sem erro ou 2a via confirma", encontrado: errosMotor + " erro(s) do motor a revisar", gravidade: "alta" });
      }
    }
    const aprovado = divergencias.filter((d) => d.gravidade === "alta").length === 0;
    return {
      aprovado,
      selo: aprovado
        ? "Calculo validado por dupla conferencia independente (matematica, regras fiscais e consistencia). Nenhuma divergencia critica."
        : "ATENCAO: a dupla conferencia encontrou divergencias criticas. Parecer retido para revisao humana antes da emissao.",
      totalNotas: invoices.length,
      notasConferidas,
      divergencias,
      resumo: aprovado
        ? notasConferidas + " notas reconferidas, todas consistentes."
        : divergencias.filter((d) => d.gravidade === "alta").length + " divergencia(s) critica(s) em " + notasConferidas + " notas. Revisar antes de emitir.",
    };
  } catch (e: any) {
    return {
      aprovado: false,
      selo: "Dupla conferencia nao pode ser concluida. Parecer retido por seguranca.",
      totalNotas: (batch.invoices || []).length,
      notasConferidas,
      divergencias,
      resumo: "Erro interno na conferencia: " + (e?.message || "desconhecido") + ". Por seguranca, nao aprovado.",
    };
  }
}
