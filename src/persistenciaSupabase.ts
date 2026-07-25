import { supabase } from './supabaseClient';
import { FiscalBatch, TaxInvoice } from './types';

/**
 * Persiste um lote auditado no Supabase (documentos_fiscais + itens_nota_auditados).
 * Isolada e segura: se o supabase nao estiver configurado, nao faz nada.
 * Nunca lanca excecao para nao travar o app — retorna {ok, erro?}.
 */
export async function salvarLoteNoSupabase(
  batch: FiscalBatch
): Promise<{ ok: boolean; erro?: string; gravados?: number }> {
  if (!supabase) {
    return { ok: false, erro: 'Supabase nao configurado (variaveis de ambiente ausentes).' };
  }

  try {
    let gravados = 0;

    for (const inv of batch.invoices as TaxInvoice[]) {
      // 1. Grava o documento fiscal e recupera o id gerado
      const { data: doc, error: errDoc } = await supabase
        .from('documentos_fiscais')
        .insert({
          tipo_documento: 'NF-e',
          cnpj_emitente: inv.issuerCnpj || null,
          cnpj_destinatario: inv.recipientCnpj || null,
          origem_captura: 'auditoria_app',
          status_sefaz: 'auditado',
          is_deleted: false,
        })
        .select('id')
        .single();

      if (errDoc || !doc) {
        return { ok: false, erro: 'Falha ao gravar documento: ' + (errDoc?.message || 'sem id'), gravados };
      }

      // 2. Grava o item auditado vinculado ao documento

      const { error: errItem } = await supabase
        .from('itens_nota_auditados')
        .insert({
          lote_id: batch.id,
          documento_id: doc.id,
          nome_produto: inv.recipientName || inv.number || null,
          valor_item: inv.value ?? null,
          ncm_original: inv.ncm || null,
          cfop_original: inv.cfop || null,
          cst_original: inv.icmsCst || null,
          alerta_divergencia: (inv.errors || []).length > 0,
          justificativa_ia: (inv.errors || []).join('; ') || null,
        });

      if (errItem) {
        return { ok: false, erro: 'Falha ao gravar item: ' + errItem.message, gravados };
      }

      gravados++;
    }

    return { ok: true, gravados };
  } catch (e: any) {
    return { ok: false, erro: e?.message || 'Erro inesperado ao gravar no Supabase.' };
  }
}
