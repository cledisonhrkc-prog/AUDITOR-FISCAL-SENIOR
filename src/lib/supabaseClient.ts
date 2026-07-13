import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TaxClient, FiscalBatch } from '../types';

let supabaseInstance: SupabaseClient | null = null;
let isConfigLoaded = false;
let hasValidConfig = false;

interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export async function getSupabaseConfig(): Promise<SupabaseConfig | null> {
  try {
    const res = await fetch('/api/supabase-config');
    if (!res.ok) throw new Error("Endpoint returned non-OK status");
    const data = await res.json();
    if (data.supabaseUrl && data.supabaseAnonKey) {
      return data;
    }
    return null;
  } catch (err) {
    console.warn("Could not retrieve Supabase credentials:", err);
    return null;
  }
}

export async function initSupabase(): Promise<SupabaseClient | null> {
  if (isConfigLoaded) return supabaseInstance;

  try {
    const config = await getSupabaseConfig();
    if (config && config.supabaseUrl && config.supabaseAnonKey) {
      supabaseInstance = createClient(config.supabaseUrl, config.supabaseAnonKey);
      hasValidConfig = true;
    }
  } catch (err) {
    console.error("Error during Supabase initialization:", err);
  }
  isConfigLoaded = true;
  return supabaseInstance;
}

export function isSupabaseActive(): boolean {
  return hasValidConfig && supabaseInstance !== null;
}

// Helpers to map camelCase <-> snake_case for clients
export function mapClientToSupabase(client: TaxClient) {
  return {
    id: client.id,
    name: client.name,
    cnpj: client.cnpj,
    regime: client.regime,
    state: client.state,
    city: client.city,
    activity: client.activity,
    created_at: client.createdAt
  };
}

export function mapClientFromSupabase(row: any): TaxClient {
  return {
    id: row.id,
    name: row.name,
    cnpj: row.cnpj,
    regime: row.regime,
    state: row.state,
    city: row.city,
    activity: row.activity,
    createdAt: row.created_at || row.createdAt || new Date().toISOString()
  };
}

// Helpers to map camelCase <-> snake_case for batches
export function mapBatchToSupabase(batch: FiscalBatch) {
  return {
    id: batch.id,
    client_id: batch.clientId,
    client_name: batch.clientName,
    client_regime: batch.clientRegime,
    date: batch.date,
    total_invoices: batch.totalInvoices,
    total_value: batch.totalValue,
    estimated_tax: batch.estimatedTax,
    errors_count: batch.errorsCount,
    tax_credits: batch.taxCredits,
    status: batch.status,
    ai_analysis: batch.aiAnalysis,
    invoices: batch.invoices,
    reform_2027_summary: batch.reform2027Summary
  };
}

export function mapBatchFromSupabase(row: any): FiscalBatch {
  return {
    id: row.id,
    clientId: row.client_id || row.clientId,
    clientName: row.client_name || row.clientName,
    clientRegime: row.client_regime || row.clientRegime,
    date: row.date,
    totalInvoices: row.total_invoices || row.totalInvoices || 0,
    totalValue: row.total_value || row.totalValue || 0,
    estimatedTax: row.estimated_tax || row.estimatedTax || 0,
    errorsCount: row.errors_count || row.errorsCount || 0,
    taxCredits: row.tax_credits || row.taxCredits || 0,
    status: row.status || 'Pendente',
    aiAnalysis: row.ai_analysis || row.aiAnalysis,
    invoices: row.invoices || [],
    reform2027Summary: row.reform_2027_summary || row.reform2027Summary
  };
}

// Database API operations
export async function dbFetchClients(): Promise<TaxClient[] | null> {
  const client = await initSupabase();
  if (!client) return null;

  const { data, error } = await client.from('clients').select('*');
  if (error) {
    console.error("Error fetching clients from Supabase:", error);
    throw error;
  }
  return (data || []).map(mapClientFromSupabase);
}

export async function dbSaveClient(clientData: TaxClient): Promise<void> {
  const client = await initSupabase();
  if (!client) return;

  const { error } = await client.from('clients').upsert(mapClientToSupabase(clientData));
  if (error) {
    console.error("Error upserting client to Supabase:", error);
    throw error;
  }
}

export async function dbDeleteClient(id: string): Promise<void> {
  const client = await initSupabase();
  if (!client) return;

  const { error } = await client.from('clients').delete().eq('id', id);
  if (error) {
    console.error("Error deleting client from Supabase:", error);
    throw error;
  }
}

export async function dbFetchBatches(): Promise<FiscalBatch[] | null> {
  const client = await initSupabase();
  if (!client) return null;

  const { data, error } = await client.from('batches').select('*');
  if (error) {
    console.error("Error fetching batches from Supabase:", error);
    throw error;
  }
  return (data || []).map(mapBatchFromSupabase);
}

export async function dbSaveBatch(batchData: FiscalBatch): Promise<void> {
  const client = await initSupabase();
  if (!client) return;

  const { error } = await client.from('batches').upsert(mapBatchToSupabase(batchData));
  if (error) {
    console.error("Error upserting batch to Supabase:", error);
    throw error;
  }
}

export async function dbDeleteBatch(id: string): Promise<void> {
  const client = await initSupabase();
  if (!client) return;

  const { error } = await client.from('batches').delete().eq('id', id);
  if (error) {
    console.error("Error deleting batch from Supabase:", error);
    throw error;
  }
}
