# Arquitetura Técnica — Sistema de Gestão para Espetinho

> Versão 1.0 — Mobile-first SaaS para negócios locais

---

## 1. Visão Geral

Sistema web mobile-first para gestão financeira e operacional de pequenos negócios de alimentação. O MVP resolve o fluxo central:

```
COMPRA DE INSUMO → PRODUÇÃO → VENDA → LUCRO REAL
```

**Princípios que guiam cada decisão arquitetural:**
- Um clique a menos é uma feature
- Dados nunca são perdidos (offline-first)
- Sem matemática manual para o dono
- Deploy em menos de 5 minutos
- Custo operacional próximo de zero no MVP

---

## 2. Stack Completa e Decisões Justificadas

### 2.1 Frontend

| Tecnologia | Decisão | Justificativa |
|---|---|---|
| **Next.js 14+ (App Router)** | Core framework | Server Components reduzem JS no cliente → performance mobile |
| **TailwindCSS** | Estilo | Zero CSS customizado, classes utilitárias = velocidade de dev |
| **shadcn/ui** | Componentes | Acessível, personalizável, sem peso de biblioteca externa |
| **TanStack Query v5** | Server state | Cache, refetch, mutations com rollback otimista |
| **Zustand** | Client state | 1KB, sem boilerplate, ideal para estado de sessão/UI |
| **React Hook Form + Zod** | Formulários | Validação runtime + tipo TypeScript de graça |
| **Recharts** | Gráficos | Leve, responsivo, mobile-friendly, API declarativa |
| **Dexie.js** | IndexedDB wrapper | Offline storage com API Promise limpa |
| **next-pwa** | PWA | Service Worker sem config manual |

### 2.2 Backend / Infraestrutura

| Tecnologia | Decisão | Justificativa |
|---|---|---|
| **Supabase** | BaaS | PostgreSQL gerenciado + Auth + Realtime + Storage em um lugar |
| **Prisma** | ORM | Type-safety, migrations versionadas, queries legíveis |
| **Vercel** | Deploy | Zero config, preview por branch, edge network global |

### 2.3 Por que Supabase + Prisma juntos?

Supabase expõe o PostgreSQL diretamente. Prisma se conecta via `DATABASE_URL` normal.
O Supabase cuida de Auth, Realtime e Row-Level Security. O Prisma cuida de migrations e queries type-safe.
Você nunca fica preso: se o Supabase crescer de custo, migra para RDS e só muda a string de conexão.

---

## 3. Estrutura de Pastas

```
cocada/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (app)/                    # Rotas autenticadas
│   │   ├── layout.tsx            # Shell com nav mobile
│   │   ├── dashboard/page.tsx
│   │   ├── vendas/
│   │   │   ├── page.tsx          # Lista de vendas
│   │   │   └── nova/page.tsx     # Registrar venda (tela principal)
│   │   ├── compras/
│   │   │   ├── page.tsx
│   │   │   └── nova/page.tsx
│   │   ├── estoque/page.tsx
│   │   ├── fiado/
│   │   │   ├── page.tsx
│   │   │   └── [clienteId]/page.tsx
│   │   ├── produtos/page.tsx
│   │   └── relatorios/page.tsx
│   └── api/
│       ├── vendas/route.ts
│       ├── compras/route.ts
│       ├── estoque/route.ts
│       ├── fiado/route.ts
│       └── dashboard/route.ts
│
├── components/
│   ├── ui/                       # shadcn/ui (gerados)
│   ├── layout/
│   │   ├── mobile-nav.tsx        # Bottom navigation bar
│   │   ├── page-header.tsx
│   │   └── pull-to-refresh.tsx
│   ├── dashboard/
│   │   ├── metric-card.tsx
│   │   ├── lucro-chart.tsx
│   │   └── top-produtos.tsx
│   ├── vendas/
│   │   ├── venda-form.tsx
│   │   └── item-venda-row.tsx
│   ├── fiado/
│   │   └── fiado-card.tsx
│   └── shared/
│       ├── currency-input.tsx
│       ├── offline-banner.tsx
│       └── sync-indicator.tsx
│
├── lib/
│   ├── db/
│   │   ├── client.ts             # Prisma client singleton
│   │   └── queries/              # Queries complexas isoladas
│   │       ├── dashboard.ts
│   │       ├── estoque.ts
│   │       └── relatorios.ts
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client (cookies)
│   ├── offline/
│   │   ├── db.ts                 # Dexie schema
│   │   ├── sync.ts               # Sync engine
│   │   └── queue.ts              # Mutation queue
│   ├── hooks/
│   │   ├── use-dashboard.ts
│   │   ├── use-estoque.ts
│   │   ├── use-offline.ts
│   │   └── use-realtime.ts
│   └── utils/
│       ├── currency.ts           # Formatação BRL
│       ├── lucro.ts              # Cálculos financeiros
│       └── estoque.ts            # Projeções de estoque
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│   ├── manifest.json             # PWA manifest
│   └── icons/
│
└── middleware.ts                 # Proteção de rotas
```

---

## 4. Banco de Dados — Modelagem Completa

### 4.1 Princípio Central: Ledgers, não campos mutáveis

> Nunca atualizar estoque ou saldo diretamente. Sempre inserir movimentos. O estado atual é sempre a soma dos movimentos.

Isso elimina inconsistências, permite auditoria completa e facilita recálculos.

### 4.2 Schema Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── MULTI-TENANT ────────────────────────────────────────────

model Tenant {
  id         String   @id @default(cuid())
  nome       String
  slug       String   @unique
  createdAt  DateTime @default(now())

  users      User[]
  produtos   Produto[]
  compras    Compra[]
  vendas     Venda[]
  clientes   Cliente[]
  estoqueMovimentos EstoqueMovimento[]
  ledger     LedgerEntry[]

  @@map("tenants")
}

model User {
  id        String   @id @default(uuid()) // Supabase Auth UUID
  tenantId  String
  nome      String
  email     String   @unique
  role      UserRole @default(OPERADOR)
  createdAt DateTime @default(now())

  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  vendas    Venda[]

  @@index([tenantId])
  @@map("users")
}

enum UserRole {
  DONO
  OPERADOR
}

// ─── PRODUTOS ────────────────────────────────────────────────

model Produto {
  id               String       @id @default(cuid())
  tenantId         String
  nome             String
  unidade          UnidadeMedida
  precoCusto       Decimal      @db.Decimal(10, 2)
  precoVenda       Decimal      @db.Decimal(10, 2)
  // Quantos produtos finais 1 unidade de insumo gera
  // Ex: 1kg de carne gera 10 espetos → rendimento = 10
  rendimento       Decimal      @db.Decimal(10, 4) @default(1)
  tipo             ProdutoTipo
  ativo            Boolean      @default(true)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  tenant           Tenant       @relation(fields: [tenantId], references: [id])
  itensVenda       ItemVenda[]
  compraItens      CompraItem[]
  estoqueMovimentos EstoqueMovimento[]

  @@index([tenantId])
  @@index([tenantId, ativo])
  @@map("produtos")
}

enum UnidadeMedida {
  KG
  UNIDADE
  LITRO
  PACOTE
}

enum ProdutoTipo {
  INSUMO       // matéria-prima (carne, carvão, sal...)
  PRODUTO_FINAL // o que é vendido (espeto, bebida...)
}

// ─── COMPRAS DE INSUMO ────────────────────────────────────────

model Compra {
  id          String      @id @default(cuid())
  tenantId    String
  fornecedor  String?
  total       Decimal     @db.Decimal(10, 2)
  notas       String?
  dataCompra  DateTime    @default(now())
  createdAt   DateTime    @default(now())

  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  itens       CompraItem[]

  @@index([tenantId])
  @@index([tenantId, dataCompra])
  @@map("compras")
}

model CompraItem {
  id           String   @id @default(cuid())
  compraId     String
  produtoId    String
  quantidade   Decimal  @db.Decimal(10, 4)
  precoUnitario Decimal @db.Decimal(10, 2)
  subtotal     Decimal  @db.Decimal(10, 2)

  compra       Compra   @relation(fields: [compraId], references: [id], onDelete: Cascade)
  produto      Produto  @relation(fields: [produtoId], references: [id])

  @@map("compra_itens")
}

// ─── ESTOQUE LEDGER ────────────────────────────────────────────
// NUNCA atualizar quantidade diretamente.
// Cada linha é um evento. O estoque atual = SUM(quantidade_delta).

model EstoqueMovimento {
  id               String              @id @default(cuid())
  tenantId         String
  produtoId        String
  quantidadeDelta  Decimal             @db.Decimal(10, 4) // positivo = entrada, negativo = saída
  tipo             EstoqueMovimentoTipo
  referenciaId     String?             // ID da compra, venda ou produção que gerou o movimento
  referenciaTipo   String?             // "compra" | "venda" | "producao" | "ajuste"
  custo            Decimal?            @db.Decimal(10, 2) // custo unitário no momento do movimento
  notas            String?
  criadoEm        DateTime            @default(now())

  tenant           Tenant              @relation(fields: [tenantId], references: [id])
  produto          Produto             @relation(fields: [produtoId], references: [id])

  @@index([tenantId, produtoId])
  @@index([tenantId, criadoEm])
  @@index([referenciaId])
  @@map("estoque_movimentos")
}

enum EstoqueMovimentoTipo {
  COMPRA         // entrada de insumo
  PRODUCAO       // insumo → produto final (saída de insumo + entrada de produto final)
  VENDA          // saída de produto final
  AJUSTE_MANUAL  // correção de inventário
  PERDA          // perda/vencimento
}

// ─── VENDAS ────────────────────────────────────────────────────

model Venda {
  id          String        @id @default(cuid())
  tenantId    String
  userId      String
  clienteId   String?       // null = venda avulsa
  total       Decimal       @db.Decimal(10, 2)
  formaPagamento FormaPagamento
  status      VendaStatus   @default(PAGA)
  notas       String?
  vendidoEm   DateTime      @default(now())
  createdAt   DateTime      @default(now())

  tenant      Tenant        @relation(fields: [tenantId], references: [id])
  user        User          @relation(fields: [userId], references: [id])
  cliente     Cliente?      @relation(fields: [clienteId], references: [id])
  itens       ItemVenda[]
  fiado       Fiado?

  @@index([tenantId])
  @@index([tenantId, vendidoEm])
  @@index([tenantId, status])
  @@index([tenantId, clienteId])
  @@map("vendas")
}

model ItemVenda {
  id            String   @id @default(cuid())
  vendaId       String
  produtoId     String
  quantidade    Decimal  @db.Decimal(10, 4)
  precoUnitario Decimal  @db.Decimal(10, 2)
  custoUnitario Decimal  @db.Decimal(10, 2) // custo snapshot no momento da venda
  subtotal      Decimal  @db.Decimal(10, 2)

  venda         Venda    @relation(fields: [vendaId], references: [id], onDelete: Cascade)
  produto       Produto  @relation(fields: [produtoId], references: [id])

  @@map("item_vendas")
}

enum FormaPagamento {
  DINHEIRO
  PIX
  CARTAO_CREDITO
  CARTAO_DEBITO
  FIADO
}

enum VendaStatus {
  PAGA
  FIADO
  CANCELADA
}

// ─── CLIENTES E FIADO ─────────────────────────────────────────

model Cliente {
  id         String   @id @default(cuid())
  tenantId   String
  nome       String
  telefone   String?
  ativo      Boolean  @default(true)
  createdAt  DateTime @default(now())

  tenant     Tenant   @relation(fields: [tenantId], references: [id])
  vendas     Venda[]
  fiado      Fiado[]

  @@index([tenantId])
  @@map("clientes")
}

model Fiado {
  id              String         @id @default(cuid())
  tenantId        String         // desnormalizado para facilitar queries
  clienteId       String
  vendaId         String         @unique
  valorOriginal   Decimal        @db.Decimal(10, 2)
  valorPago       Decimal        @db.Decimal(10, 2) @default(0)
  status          FiadoStatus    @default(ABERTO)
  vencimento      DateTime?
  criadoEm       DateTime       @default(now())
  quitadoEm      DateTime?

  cliente         Cliente        @relation(fields: [clienteId], references: [id])
  venda           Venda          @relation(fields: [vendaId], references: [id])
  pagamentos      FiadoPagamento[]

  @@index([tenantId, status])
  @@index([clienteId])
  @@map("fiados")
}

model FiadoPagamento {
  id        String   @id @default(cuid())
  fiadoId   String
  valor     Decimal  @db.Decimal(10, 2)
  pagoEm   DateTime @default(now())
  notas     String?

  fiado     Fiado    @relation(fields: [fiadoId], references: [id])

  @@map("fiado_pagamentos")
}

enum FiadoStatus {
  ABERTO
  PARCIAL
  QUITADO
}

// ─── LEDGER FINANCEIRO ────────────────────────────────────────
// Registro imutável de toda movimentação financeira.
// Inspirado em double-entry bookkeeping, simplificado.

model LedgerEntry {
  id           String          @id @default(cuid())
  tenantId     String
  tipo         LedgerTipo
  direcao      LedgerDirecao
  valor        Decimal         @db.Decimal(10, 2)
  descricao    String
  referenciaId String?
  referenciaTipo String?
  categoria    String?         // "carne", "carvão", "bebida"...
  ocorridoEm  DateTime        @default(now())
  createdAt    DateTime        @default(now())

  tenant       Tenant          @relation(fields: [tenantId], references: [id])

  @@index([tenantId, ocorridoEm])
  @@index([tenantId, tipo])
  @@index([tenantId, direcao])
  @@map("ledger_entries")
}

enum LedgerTipo {
  VENDA            // receita de venda
  RECEBIMENTO_FIADO // recebimento de fiado
  COMPRA_INSUMO    // saída para compra
  DESPESA_OPERACIONAL
  AJUSTE
}

enum LedgerDirecao {
  CREDITO  // dinheiro entrando
  DEBITO   // dinheiro saindo
}

// ─── METAS ────────────────────────────────────────────────────

model Meta {
  id          String     @id @default(cuid())
  tenantId    String
  tipo        MetaTipo
  valorAlvo   Decimal    @db.Decimal(10, 2)
  periodo     MetaPeriodo
  referenciaData DateTime
  atingida    Boolean    @default(false)

  @@index([tenantId, referenciaData])
  @@map("metas")
}

enum MetaTipo {
  FATURAMENTO
  LUCRO
  VENDAS_QUANTIDADE
}

enum MetaPeriodo {
  DIARIO
  SEMANAL
  MENSAL
}
```

---

## 5. O Ledger Financeiro — Como Usar Corretamente

O `LedgerEntry` é o coração da saúde financeira. Toda operação que envolve dinheiro cria uma entrada.

### Fluxo de uma venda à vista

```typescript
// lib/utils/lucro.ts
async function registrarVenda(vendaId: string, itens: ItemVenda[]) {
  return prisma.$transaction(async (tx) => {
    // 1. Criar a venda
    const venda = await tx.venda.create({ ... })

    // 2. Baixar estoque (ledger de estoque)
    for (const item of itens) {
      await tx.estoqueMovimento.create({
        data: {
          produtoId: item.produtoId,
          quantidadeDelta: -item.quantidade,  // saída
          tipo: 'VENDA',
          referenciaId: venda.id,
          custo: item.custoUnitario,
        }
      })
    }

    // 3. Registrar no ledger financeiro
    await tx.ledgerEntry.create({
      data: {
        tipo: 'VENDA',
        direcao: 'CREDITO',
        valor: venda.total,
        descricao: `Venda #${venda.id}`,
        referenciaId: venda.id,
        referenciaTipo: 'venda',
      }
    })

    return venda
  })
}
```

### Fluxo de uma compra de insumo

```typescript
async function registrarCompra(compra: Compra, itens: CompraItem[]) {
  return prisma.$transaction(async (tx) => {
    const compraCreated = await tx.compra.create({ ... })

    for (const item of itens) {
      // Entrada no estoque
      await tx.estoqueMovimento.create({
        data: {
          produtoId: item.produtoId,
          quantidadeDelta: +item.quantidade,  // entrada
          tipo: 'COMPRA',
          referenciaId: compraCreated.id,
          custo: item.precoUnitario,
        }
      })
    }

    // Saída no ledger financeiro
    await tx.ledgerEntry.create({
      data: {
        tipo: 'COMPRA_INSUMO',
        direcao: 'DEBITO',
        valor: compra.total,
        descricao: `Compra de insumos`,
        referenciaId: compraCreated.id,
      }
    })

    return compraCreated
  })
}
```

---

## 6. Cálculos de Lucro — Estratégia Correta

```typescript
// lib/utils/lucro.ts

// LUCRO ESTIMADO = faturamento potencial do estoque atual
// "Quanto eu posso faturar com o que tenho em estoque"
export async function calcularLucroEstimado(tenantId: string) {
  const estoque = await getEstoqueAtual(tenantId)

  return estoque.reduce((total, item) => {
    const faturamentoPotencial = item.quantidade * item.produto.rendimento * item.produto.precoVenda
    const custoPotencial = item.quantidade * item.produto.precoCusto
    return total + (faturamentoPotencial - custoPotencial)
  }, 0)
}

// LUCRO REAL = receitas - custos reais (baseado no ledger)
export async function calcularLucroReal(tenantId: string, de: Date, ate: Date) {
  const [creditos, debitos] = await Promise.all([
    prisma.ledgerEntry.aggregate({
      where: { tenantId, direcao: 'CREDITO', ocorridoEm: { gte: de, lte: ate } },
      _sum: { valor: true }
    }),
    prisma.ledgerEntry.aggregate({
      where: { tenantId, direcao: 'DEBITO', ocorridoEm: { gte: de, lte: ate } },
      _sum: { valor: true }
    })
  ])

  return (creditos._sum.valor ?? 0) - (debitos._sum.valor ?? 0)
}

// MARGEM POR PRODUTO
export function calcularMargem(precoVenda: number, precoCusto: number): number {
  return ((precoVenda - precoCusto) / precoVenda) * 100
}

// ESTOQUE ATUAL (ledger)
export async function getEstoqueAtual(tenantId: string) {
  return prisma.$queryRaw`
    SELECT
      p.id,
      p.nome,
      p.preco_venda,
      p.preco_custo,
      p.rendimento,
      COALESCE(SUM(em.quantidade_delta), 0) as quantidade
    FROM produtos p
    LEFT JOIN estoque_movimentos em ON em.produto_id = p.id
    WHERE p.tenant_id = ${tenantId} AND p.ativo = true
    GROUP BY p.id, p.nome, p.preco_venda, p.preco_custo, p.rendimento
    HAVING COALESCE(SUM(em.quantidade_delta), 0) > 0
  `
}
```

---

## 7. Queries do Dashboard

```typescript
// lib/db/queries/dashboard.ts

export async function getDashboardData(tenantId: string) {
  const hoje = startOfDay(new Date())
  const fimDoDia = endOfDay(new Date())
  const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 1 })
  const inicioMes = startOfMonth(new Date())

  const [
    vendasHoje,
    gastosHoje,
    fiadoAberto,
    topProdutos,
    estoqueAtual,
    faturamentoSemanal,
    faturamentoMensal,
  ] = await Promise.all([
    // Receita do dia
    prisma.ledgerEntry.aggregate({
      where: { tenantId, direcao: 'CREDITO', tipo: 'VENDA',
               ocorridoEm: { gte: hoje, lte: fimDoDia } },
      _sum: { valor: true }
    }),

    // Gastos do dia
    prisma.ledgerEntry.aggregate({
      where: { tenantId, direcao: 'DEBITO',
               ocorridoEm: { gte: hoje, lte: fimDoDia } },
      _sum: { valor: true }
    }),

    // Total de fiado em aberto
    prisma.fiado.aggregate({
      where: { tenantId, status: { in: ['ABERTO', 'PARCIAL'] } },
      _sum: { valorOriginal: true, valorPago: true }
    }),

    // Top 5 produtos mais vendidos (semana)
    prisma.$queryRaw`
      SELECT p.nome, SUM(iv.quantidade) as qtd, SUM(iv.subtotal) as receita
      FROM item_vendas iv
      JOIN produtos p ON iv.produto_id = p.id
      JOIN vendas v ON iv.venda_id = v.id
      WHERE v.tenant_id = ${tenantId}
        AND v.vendido_em >= ${inicioSemana}
        AND v.status = 'PAGA'
      GROUP BY p.id, p.nome
      ORDER BY receita DESC
      LIMIT 5
    `,

    getEstoqueAtual(tenantId),

    // Faturamento por dia na semana
    prisma.$queryRaw`
      SELECT DATE(vendido_em) as dia, SUM(total) as valor
      FROM vendas
      WHERE tenant_id = ${tenantId}
        AND vendido_em >= ${inicioSemana}
        AND status = 'PAGA'
      GROUP BY DATE(vendido_em)
      ORDER BY dia
    `,

    // Faturamento por semana no mês
    prisma.$queryRaw`
      SELECT DATE_TRUNC('week', vendido_em) as semana, SUM(total) as valor
      FROM vendas
      WHERE tenant_id = ${tenantId}
        AND vendido_em >= ${inicioMes}
        AND status = 'PAGA'
      GROUP BY DATE_TRUNC('week', vendido_em)
      ORDER BY semana
    `,
  ])

  const receitaHoje = Number(vendasHoje._sum.valor ?? 0)
  const gastosHojeVal = Number(gastosHoje._sum.valor ?? 0)
  const fiadoPendente = Number(fiadoAberto._sum.valorOriginal ?? 0)
                      - Number(fiadoAberto._sum.valorPago ?? 0)

  return {
    hoje: {
      receita: receitaHoje,
      gastos: gastosHojeVal,
      lucro: receitaHoje - gastosHojeVal,
    },
    fiado: { pendente: fiadoPendente },
    topProdutos,
    estoque: estoqueAtual,
    graficos: { semanal: faturamentoSemanal, mensal: faturamentoMensal },
  }
}
```

### Materialized View para relatórios pesados (opcional no MVP)

```sql
-- Executar apenas quando relatórios demorarem > 500ms
CREATE MATERIALIZED VIEW mv_resumo_diario AS
SELECT
  tenant_id,
  DATE(vendido_em) as dia,
  SUM(total) as faturamento,
  COUNT(*) as num_vendas,
  SUM(total) FILTER (WHERE forma_pagamento = 'FIADO') as vendas_fiado
FROM vendas
WHERE status = 'PAGA'
GROUP BY tenant_id, DATE(vendido_em);

CREATE UNIQUE INDEX ON mv_resumo_diario (tenant_id, dia);

-- Atualizar com CONCURRENTLY para não bloquear leitura
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_resumo_diario;
```

---

## 8. Estratégia de Autenticação

Supabase Auth com **magic link por email** (ou telefone via OTP).

**Por quê não senha tradicional?**
O dono do espetinho não quer lembrar senha. Magic link é um clique no email.

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// middleware.ts — protege todas as rotas (app)
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && request.nextUrl.pathname.startsWith('/(app)')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

**Row Level Security no Supabase:**
```sql
-- Usuário só vê dados do seu tenant
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON vendas
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
```

---

## 9. Estratégia Mobile-First

### Bottom Navigation (padrão mobile)

```
┌─────────────────────────────┐
│  Header: "Hoje: R$ 450"     │
├─────────────────────────────┤
│                             │
│    Conteúdo principal       │
│                             │
│                             │
├─────────────────────────────┤
│  🏠    💰    📦    👥    📊  │
│ Home  Venda Estoque Fiado  Mais│
└─────────────────────────────┘
```

### Tela de Nova Venda (fluxo principal — máximo 3 toques)

```
Toque 1: Selecionar produto (lista com foto e preço)
Toque 2: Informar quantidade (teclado numérico grande)
Toque 3: Confirmar pagamento (PIX / Dinheiro / Fiado)
```

### Touch targets mínimos: 48px × 48px (guideline Google Material)

### Gestos: pull-to-refresh em todas as listas

---

## 10. Estratégia Offline-First

### Problema real
Internet ruim no ponto de venda. Venda não pode travar.

### Solução: Queue + Sync

```typescript
// lib/offline/db.ts — Dexie schema
import Dexie from 'dexie'

export const offlineDb = new Dexie('cocada_offline')
offlineDb.version(1).stores({
  pendingMutations: '++id, tipo, createdAt, synced',
  cachedVendas: 'id, tenantId, vendidoEm',
  cachedEstoque: 'produtoId',
})

// lib/offline/queue.ts
export async function enqueueVenda(venda: VendaPayload) {
  // Salva localmente com ID temporário
  const tempId = `temp_${Date.now()}`
  await offlineDb.pendingMutations.add({
    tipo: 'CRIAR_VENDA',
    payload: { ...venda, id: tempId },
    createdAt: new Date(),
    synced: false,
  })

  // Atualiza UI otimisticamente
  return tempId
}

// lib/offline/sync.ts
export async function syncPendingMutations() {
  const pending = await offlineDb.pendingMutations
    .where('synced').equals(false)
    .toArray()

  for (const mutation of pending) {
    try {
      await fetch(`/api/${mutation.tipo.toLowerCase()}`, {
        method: 'POST',
        body: JSON.stringify(mutation.payload),
      })
      await offlineDb.pendingMutations.update(mutation.id!, { synced: true })
    } catch {
      // Mantém na fila, tenta na próxima conexão
    }
  }
}

// Disparar sync quando voltar online
window.addEventListener('online', syncPendingMutations)
```

### Service Worker (next-pwa)

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co/,
      handler: 'NetworkFirst',
      options: { cacheName: 'supabase-cache', expiration: { maxAgeSeconds: 300 } }
    }
  ]
})
```

---

## 11. Estratégia de Realtime

Supabase Realtime para atualização automática do dashboard quando uma venda é registrada em outro dispositivo.

```typescript
// lib/hooks/use-realtime.ts
export function useRealtimeDashboard(tenantId: string) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`tenant:${tenantId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'vendas',
        filter: `tenant_id=eq.${tenantId}`,
      }, () => {
        // Invalida cache do dashboard automaticamente
        queryClient.invalidateQueries({ queryKey: ['dashboard', tenantId] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tenantId])
}
```

---

## 12. Estratégia de Cache

```
Browser (TanStack Query)
  staleTime: 30s para dashboard
  staleTime: 5min para relatórios
  staleTime: ∞ para dados de configuração (produtos, clientes)

CDN (Vercel Edge)
  /api/dashboard → no-cache (dados ao vivo)
  /api/relatorios → cache: 60s, stale-while-revalidate

Service Worker
  Assets estáticos → Cache First
  API calls → Network First (fallback para cache)
```

---

## 13. Gerenciamento de Estado

```typescript
// Zustand — apenas estado de UI e sessão
const useAppStore = create<AppStore>((set) => ({
  tenantId: null,
  userId: null,
  isOnline: true,
  pendingSyncCount: 0,

  setTenant: (tenantId) => set({ tenantId }),
  setOnline: (isOnline) => set({ isOnline }),
}))

// TanStack Query — estado de servidor
// Caching automático, background refetch, optimistic updates
const { data: dashboard } = useQuery({
  queryKey: ['dashboard', tenantId],
  queryFn: () => fetch('/api/dashboard').then(r => r.json()),
  staleTime: 30_000,
  refetchInterval: 60_000, // atualiza a cada 1 minuto
})

// Mutation com rollback otimista
const mutation = useMutation({
  mutationFn: criarVenda,
  onMutate: async (novaVenda) => {
    await queryClient.cancelQueries({ queryKey: ['dashboard'] })
    const anterior = queryClient.getQueryData(['dashboard'])
    queryClient.setQueryData(['dashboard'], old => ({
      ...old,
      hoje: { ...old.hoje, receita: old.hoje.receita + novaVenda.total }
    }))
    return { anterior }
  },
  onError: (_, __, context) => {
    queryClient.setQueryData(['dashboard'], context?.anterior)
  },
})
```

---

## 14. Estratégia de Deploy

```
Git push → Vercel build → Deploy automático
              │
              ├── Branch feature → Preview URL automática
              ├── Branch main → Produção
              └── Variáveis de ambiente por ambiente no Vercel
```

**Variáveis de ambiente necessárias:**
```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # nunca expor no cliente
```

**Migrations em produção:**
```bash
# package.json
"scripts": {
  "db:migrate": "prisma migrate deploy",
  "vercel-build": "prisma generate && prisma migrate deploy && next build"
}
```

---

## 15. Escalabilidade Simples

O sistema nasce com multi-tenancy pelo `tenant_id` em todas as tabelas. Para virar SaaS:

1. Adicionar planos na tabela `tenants` (free / pro)
2. Rate limiting por tenant no middleware
3. Stripe para cobrança (uma semana de trabalho)

**Quando escalar:**
- Até 100 tenants → Supabase Free / Pro (sem mudança de código)
- Até 10.000 tenants → Supabase + read replicas
- Acima disso → migrar para RDS + separar o compute (ainda sem reescrever)

---

## 16. Observabilidade e Logs

```typescript
// Sentry para erros (gratuito até 5k erros/mês)
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs'

export function logError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, { extra: context })
  console.error('[ERROR]', error.message, context)
}

// Logs de auditoria no banco (não no Sentry)
// Toda ação importante (venda, compra, ajuste) já está no LedgerEntry
// Isso é o log de auditoria natural
```

**Vercel Analytics** para métricas de uso → zero config, zero custo no plano hobby.

---

## 17. Segurança Básica

| Camada | Medida |
|---|---|
| Autenticação | Supabase Auth (JWT gerenciado) |
| Autorização | Row Level Security no PostgreSQL |
| Tenant isolation | `tenant_id` em todas as queries + RLS |
| API Routes | Verificar session server-side em toda route |
| Dados sensíveis | Service role key nunca no frontend |
| Input | Zod validation em toda entrada de dados |
| HTTPS | Automático no Vercel + Supabase |

---

## 18. PWA — Manifest

```json
// public/manifest.json
{
  "name": "Cocada — Gestão",
  "short_name": "Cocada",
  "description": "Gestão financeira do seu negócio",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

O usuário adiciona à tela inicial. Abre como app nativo. Zero custo de App Store.

---

## 19. Bibliotecas Recomendadas (lista final)

| Categoria | Biblioteca | Por quê |
|---|---|---|
| Framework | `next` 14+ | App Router + Server Components |
| Estilo | `tailwindcss` + `shadcn/ui` | Velocidade de desenvolvimento |
| ORM | `prisma` | Type-safety + migrations |
| Auth | `@supabase/ssr` | Integrado com Supabase |
| Server state | `@tanstack/react-query` v5 | Cache + optimistic updates |
| Client state | `zustand` | Leve e simples |
| Formulários | `react-hook-form` + `zod` | Performance + validação |
| Gráficos | `recharts` | Leve, mobile-friendly |
| Datas | `date-fns` | Tree-shakeable, sem moment |
| Offline DB | `dexie` | IndexedDB com API limpa |
| PWA | `next-pwa` | Service Worker zero config |
| Realtime | `@supabase/realtime-js` | Já incluso no Supabase |
| Moeda BR | `intl` nativo | Nativo do browser, sem lib |
| Erros | `@sentry/nextjs` | Monitoramento gratuito |
| Ícones | `lucide-react` | Já vem com shadcn/ui |

---

## 20. Ordem de Implementação (MVP)

```
Semana 1: Setup + Auth + Produtos
  - Projeto Next.js + Supabase + Prisma
  - Login com magic link
  - CRUD de produtos com preço e rendimento

Semana 2: Vendas (o core)
  - Tela de nova venda (3 toques)
  - Baixa automática de estoque
  - Ledger financeiro

Semana 3: Dashboard
  - Métricas do dia
  - Gráfico semanal
  - Estoque atual

Semana 4: Fiado + Compras
  - Registrar compra de insumo
  - Controle de fiado com histórico

Semana 5: Offline + PWA
  - Service Worker
  - Queue de vendas offline
  - Instalável no celular

Semana 6: Polimento
  - Relatórios mensais
  - Metas
  - Export PDF/CSV
```

---

## Custo Operacional Estimado

| Serviço | Custo/mês |
|---|---|
| Vercel Hobby | R$ 0 |
| Supabase Free (até 500MB + 50.000 MAU) | R$ 0 |
| Sentry Free (5k erros) | R$ 0 |
| **Total MVP** | **R$ 0** |
| Supabase Pro (quando crescer) | ~R$ 130/mês |

---

*Arquitetura desenhada para ir de zero a produção em 6 semanas, com potencial de escalar para SaaS sem reescrita.*
