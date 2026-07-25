import { FiscalBatch } from './types';

/**
 * Envia o lote ao servidor, que grava no Supabase com a service_role (seguro).
 * Nunca lanca excecao para nao travar o app.
 */
export async function salvarLoteNoSupabase(
  batch: FiscalBatch
): Promise<{ ok: boolean; erro?: string; gravados?: number }> {
  try {
    const resp = await fetch('/api/salvar-lote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch }),
    });
    const data = await resp.json();
    return data;
  } catch (e: any) {
    return { ok: false, erro: e?.message || 'Falha ao contatar o servidor.' };
  }
}
