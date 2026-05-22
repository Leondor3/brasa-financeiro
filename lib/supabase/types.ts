export type Database = {
  public: {
    Tables: {
      produtos: {
        Row: { id: string; user_id: string; nome: string; emoji: string; preco_venda: number; preco_custo: number; ativo: boolean; created_at: string }
        Insert: Omit<Database['public']['Tables']['produtos']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['produtos']['Insert']>
      }
      vendas: {
        Row: { id: string; user_id: string; total: number; lucro: number; forma_pagamento: string; cliente_id: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['vendas']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['vendas']['Insert']>
      }
      item_vendas: {
        Row: { id: string; venda_id: string; produto_id: string; quantidade: number; preco_unitario: number; custo_unitario: number; subtotal: number }
        Insert: Omit<Database['public']['Tables']['item_vendas']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['item_vendas']['Insert']>
      }
      compras: {
        Row: { id: string; user_id: string; fornecedor: string | null; total: number; created_at: string }
        Insert: Omit<Database['public']['Tables']['compras']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['compras']['Insert']>
      }
      compra_itens: {
        Row: { id: string; compra_id: string; produto_id: string; quantidade: number; preco_unitario: number; subtotal: number }
        Insert: Omit<Database['public']['Tables']['compra_itens']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['compra_itens']['Insert']>
      }
      estoque_movimentos: {
        Row: { id: string; user_id: string; produto_id: string; quantidade_delta: number; tipo: string; referencia_id: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['estoque_movimentos']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['estoque_movimentos']['Insert']>
      }
      clientes: {
        Row: { id: string; user_id: string; nome: string; telefone: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['clientes']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['clientes']['Insert']>
      }
      fidelidade_config: {
        Row: { id: string; user_id: string; selos_para_recompensa: number; descricao_recompensa: string; ativo: boolean; created_at: string }
        Insert: Omit<Database['public']['Tables']['fidelidade_config']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['fidelidade_config']['Insert']>
      }
      recompensas: {
        Row: { id: string; user_id: string; cliente_id: string; selos_utilizados: number; observacao: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['recompensas']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['recompensas']['Insert']>
      }
      fiados: {
        Row: { id: string; user_id: string; cliente_id: string; venda_id: string | null; valor_original: number; valor_pago: number; status: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['fiados']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['fiados']['Insert']>
      }
    }
  }
}

export type Produto = Database['public']['Tables']['produtos']['Row']
export type Venda   = Database['public']['Tables']['vendas']['Row']
export type Compra  = Database['public']['Tables']['compras']['Row']
export type Cliente = Database['public']['Tables']['clientes']['Row']
export type Fiado   = Database['public']['Tables']['fiados']['Row']
export type EstoqueMovimento = Database['public']['Tables']['estoque_movimentos']['Row']
export type FidelidadeConfig = Database['public']['Tables']['fidelidade_config']['Row']
export type Recompensa = Database['public']['Tables']['recompensas']['Row']
