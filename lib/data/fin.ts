export const FIN = {
  business: {
    name: "Espetinho da Cocada",
    owner: "Seu Cocada",
    moeda: "BRL",
  },

  hoje: {
    data: "Qui, 21 mai 2026",
    vendido:     623.50,
    lucro:       278.00,
    pedidos:     31,
    ticketMedio: 20.11,
    fiadoNovo:    95.00,
    fiadoQuitado: 60.00,
    pagamentos: [
      { tipo: 'PIX',      valor: 312.00, pct: 50 },
      { tipo: 'Dinheiro', valor: 168.50, pct: 27 },
      { tipo: 'Cartão',   valor:  48.00, pct:  8 },
      { tipo: 'Fiado',    valor:  95.00, pct: 15 },
    ],
    estoqueRestante: { espetos: 53, valor: 795.00 },
    eventos: [
      { id: 'e1', tipo: 'pix',      label: '2× Picanha · 1× Coalho · PIX', valor: 33.00, time: '21:14' },
      { id: 'e2', tipo: 'dinheiro', label: '3× Frango · Refri',            valor: 30.00, time: '21:11' },
      { id: 'e3', tipo: 'fiado',    label: 'Fiado — Marcão da Kombi',      valor: 18.00, time: '21:07' },
      { id: 'e4', tipo: 'pix',      label: 'Combo família · PIX',          valor: 88.00, time: '21:02' },
      { id: 'e5', tipo: 'cartao',   label: '2× Picanha · Cerveja',         valor: 33.00, time: '20:54' },
      { id: 'e6', tipo: 'pix',      label: 'Kafta · Pão alho · PIX',       valor: 16.00, time: '20:49' },
    ],
  },

  semana: {
    label: "Esta semana · 19–25 mai",
    faturamento: 3120.00,
    lucro:       1390.00,
    metaSemanal: 4200.00,
    melhorDia:   { dia: 'Sáb', valor: 980.00 },
    piorDia:     { dia: 'Seg', valor: 210.00 },
    maisVendido: { nome: 'Espeto de Picanha', qty: 142 },
    dias: [
      { d: 'Seg', vendas: 210, lucro:  85, futuro: false },
      { d: 'Ter', vendas: 320, lucro: 142, futuro: false },
      { d: 'Qua', vendas: 410, lucro: 178, futuro: false },
      { d: 'Qui', vendas: 624, lucro: 278, futuro: false },
      { d: 'Sex', vendas: 576, lucro: 240, futuro: false },
      { d: 'Sáb', vendas: 980, lucro: 467, futuro: false },
      { d: 'Dom', vendas:   0, lucro:   0, futuro: true },
    ],
  },

  mes: {
    label: "Maio 2026",
    faturamento:  11840.00,
    lucro:         4790.00,
    gastos:        7050.00,
    aReceber:       420.00,
    margemMedia:   40.5,
    crescimento:   18.2,
    metaLucro:     6000.00,
    diasUteis:     31,
    diasPassados:  21,
  },

  meta: {
    titulo: "Meta de lucro · maio",
    alvo:          6000.00,
    atual:         4790.00,
    diasRestantes: 10,
    paraBater:     121.00,
  },

  compras: [
    { id: 'c1', emoji: '🥩', item: 'Picanha',      qty: '5kg',  valor: 320.00, fornecedor: 'Açougue do Tião',    dias: 0, tag: 'carne'  },
    { id: 'c2', emoji: '🔥', item: 'Carvão',        qty: '20kg', valor:  85.00, fornecedor: 'Carvoaria Boa Vista', dias: 0, tag: 'insumo' },
    { id: 'c3', emoji: '🍗', item: 'Frango',        qty: '8kg',  valor: 124.00, fornecedor: 'Frigorífico Sul',    dias: 1, tag: 'carne'  },
    { id: 'c4', emoji: '🥤', item: 'Refrigerante',  qty: '48un', valor: 192.00, fornecedor: 'Distribuidora Zé',   dias: 2, tag: 'bebida' },
    { id: 'c5', emoji: '🧀', item: 'Queijo coalho', qty: '60un', valor: 240.00, fornecedor: 'Laticínios Vale',    dias: 3, tag: 'insumo' },
    { id: 'c6', emoji: '🌶️', item: 'Kafta',         qty: '4kg',  valor: 168.00, fornecedor: 'Açougue do Tião',   dias: 4, tag: 'carne'  },
    { id: 'c7', emoji: '🍺', item: 'Cerveja LN',    qty: '96un', valor: 384.00, fornecedor: 'Distribuidora Zé',   dias: 6, tag: 'bebida' },
  ],

  producao: [
    {
      id: 'pr1', emoji: '🐂', nome: 'Espeto de Picanha',
      custoUn: 6.00, vendaUn: 12.00, lucroUn: 6.00,
      compradoKg: 5, espetosPorKg: 10,
      vendidosHoje: 26, restantes: 14,
    },
    {
      id: 'pr2', emoji: '🍗', nome: 'Espeto de Frango',
      custoUn: 3.20, vendaUn: 8.00, lucroUn: 4.80,
      compradoKg: 8, espetosPorKg: 10,
      vendidosHoje: 38, restantes: 22,
    },
    {
      id: 'pr3', emoji: '🌶️', nome: 'Espeto de Kafta',
      custoUn: 4.20, vendaUn: 10.00, lucroUn: 5.80,
      compradoKg: 4, espetosPorKg: 8,
      vendidosHoje: 14, restantes: 9,
    },
    {
      id: 'pr4', emoji: '🧀', nome: 'Queijo Coalho',
      custoUn: 4.00, vendaUn: 9.00, lucroUn: 5.00,
      compradoKg: null, espetosPorKg: null,
      vendidosHoje: 21, restantes: 8,
    },
  ],

  fiado: {
    totalAberto: 420.00,
    clientesAtivos: 7,
    clientes: [
      { id: 'f1', nome: 'Seu Joaquim',     iniciais: 'SJ', valor:  85.00, dias:  3, ult: '18 mai', tel: '(11) 9...', tag: 'verde'    },
      { id: 'f2', nome: 'Marcão da Kombi', iniciais: 'MK', valor: 124.00, dias:  7, ult: '14 mai', tel: '(11) 9...', tag: 'amarelo'  },
      { id: 'f3', nome: 'Tati & Bia',      iniciais: 'TB', valor:  42.00, dias:  2, ult: '19 mai', tel: '(11) 9...', tag: 'verde'    },
      { id: 'f4', nome: 'Renato Cabeção',  iniciais: 'RC', valor:  68.00, dias: 12, ult:  '9 mai', tel: '(11) 9...', tag: 'vermelho' },
      { id: 'f5', nome: 'Lú do Salão',     iniciais: 'LS', valor:  36.00, dias:  5, ult: '16 mai', tel: '(11) 9...', tag: 'amarelo'  },
      { id: 'f6', nome: 'Bruno Pedreiro',  iniciais: 'BP', valor:  29.00, dias:  1, ult: '20 mai', tel: '(11) 9...', tag: 'verde'    },
      { id: 'f7', nome: 'Pri & Família',   iniciais: 'PF', valor:  36.00, dias:  4, ult: '17 mai', tel: '(11) 9...', tag: 'verde'    },
    ],
  },

  produtos: [
    { id: 'p1', emoji: '🐂', nome: 'Picanha',    preco: 12.00, custo: 6.00  },
    { id: 'p2', emoji: '🍗', nome: 'Frango',     preco:  8.00, custo: 3.20  },
    { id: 'p3', emoji: '🌶️', nome: 'Kafta',      preco: 10.00, custo: 4.20  },
    { id: 'p4', emoji: '❤️', nome: 'Coração',    preco:  8.00, custo: 3.40  },
    { id: 'p5', emoji: '🧀', nome: 'Coalho',     preco:  9.00, custo: 4.00  },
    { id: 'p6', emoji: '🥖', nome: 'Pão alho',   preco:  6.00, custo: 2.20  },
    { id: 'p7', emoji: '🥤', nome: 'Refri lata', preco:  6.00, custo: 2.50  },
    { id: 'p8', emoji: '🍺', nome: 'Cerveja LN', preco:  9.00, custo: 4.00  },
  ],
} as const

export type Produto = typeof FIN.produtos[number]
export type Cliente = typeof FIN.fiado.clientes[number]
export type Compra  = typeof FIN.compras[number]
export type Producao = typeof FIN.producao[number]
