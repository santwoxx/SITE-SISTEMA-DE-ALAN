// MONTAXX ERP - Armazenamento Central de Dados (LocalStorage + Reatividade)
(function() {
  const STORAGE_KEY = "MONTAXX_ERP_DATA_V1";

  // Dados iniciais realistas para o montador e vendedor de móveis
  const DEFAULT_DATA = {
    settings: {
      companyName: "MONTAXX Montagens e Venda de Móveis",
      ownerName: "Carlos Montaxx",
      phone: "5511999999999",
      email: "contato@montaxx.com.br",
      pixKey: "11999999999 (Celular)",
      pixName: "Carlos Montaxx Serviços",
      city: "São Paulo - SP",
      warrantyDays: 90
    },
    clients: [
      {
        id: "CLI-101",
        name: "Mariana Castro",
        phone: "5511987654321",
        address: "Rua Augusta, 1420, Apto 82",
        neighborhood: "Consolação",
        city: "São Paulo",
        type: "Apartamento (com elevador)",
        notes: "Cliente muito cuidadosa. Pediu para tirar sapatos ao entrar.",
        createdAt: "2026-08-15"
      },
      {
        id: "CLI-102",
        name: "Rodrigo Ferreira",
        phone: "5511976543210",
        address: "Av. Paulista, 900, Conj 45",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        type: "Comercial",
        notes: "Montagem de escritório e suporte de TV 75 polegadas.",
        createdAt: "2026-08-20"
      },
      {
        id: "CLI-103",
        name: "Camila Silveira",
        phone: "5511965432109",
        address: "Rua Domingos de Morais, 540",
        neighborhood: "Vila Mariana",
        city: "São Paulo",
        type: "Apartamento (sem elevador, 2º andar)",
        notes: "Instalação de piso laminado no quarto e sala.",
        createdAt: "2026-09-01"
      },
      {
        id: "CLI-104",
        name: "Lucas Mendes",
        phone: "5511954321098",
        address: "Rua Teodoro Sampaio, 2100",
        neighborhood: "Pinheiros",
        city: "São Paulo",
        type: "Casa térrea",
        notes: "Comprador do Painel Home Theater com LED.",
        createdAt: "2026-09-05"
      }
    ],
    inventory: [
      {
        id: "MTX-01",
        name: "Guarda-Roupa Casal Imperial 6 Portas com Espelho",
        category: "Quarto",
        costPrice: 1150.00,
        salePrice: 1899.00,
        stock: 4,
        minStock: 2,
        image: "assets/images/wardrobe.jpg",
        description: "100% MDF, corrediças telescópicas, portas espelhadas"
      },
      {
        id: "MTX-02",
        name: "Painel Home Theater Ripado Sublime com LED TV 75\"",
        category: "Sala de Estar",
        costPrice: 720.00,
        salePrice: 1290.00,
        stock: 6,
        minStock: 3,
        image: "assets/images/tv-panel.jpg",
        description: "Ripado autêntico com fita de LED quente embutida"
      },
      {
        id: "MTX-03",
        name: "Mesa de Jantar Áustria 6 Lugares com Cadeiras Velvet",
        category: "Cozinha & Jantar",
        costPrice: 1350.00,
        salePrice: 2190.00,
        stock: 3,
        minStock: 1,
        image: "assets/images/dining-table.jpg",
        description: "Tampo madeira maciça, base aço preto, cadeiras estofadas"
      },
      {
        id: "MTX-04",
        name: "Suporte Articulado para TV 32\" a 85\" Ultra-Slim",
        category: "Acessórios",
        costPrice: 65.00,
        salePrice: 150.00,
        stock: 12,
        minStock: 5,
        image: "assets/images/servico-acessorios.jpeg",
        description: "Aço reforçado com nível bolha e parafusos extras inclusos"
      }
    ],
    orders: [
      {
        id: "OS-2026-001",
        clientId: "CLI-101",
        clientName: "Mariana Castro",
        clientPhone: "5511987654321",
        address: "Rua Augusta, 1420, Apto 82 - Consolação",
        serviceType: "Montagem de Guarda-Roupa",
        description: "Montagem de Guarda-Roupa Casal 6 portas com gavetas e alinhamento de espelho.",
        date: "2026-09-09",
        time: "10:00",
        price: 220.00,
        paymentMethod: "Pix",
        paymentStatus: "Pago",
        status: "concluido", // agendado, andamento, concluido, cancelado
        checklist: [
          { item: "Conferência de caixas e peças na entrega", done: true },
          { item: "Proteção do piso com papelão/lona", done: true },
          { item: "Montagem da estrutura e prateleiras", done: true },
          { item: "Alinhamento fino de portas e corrediças", done: true },
          { item: "Limpeza da serragem e recolhimento de lixo", done: true }
        ],
        notes: "Cliente elogiou a pontualidade e cuidado."
      },
      {
        id: "OS-2026-002",
        clientId: "CLI-102",
        clientName: "Rodrigo Ferreira",
        clientPhone: "5511976543210",
        address: "Av. Paulista, 900, Conj 45 - Bela Vista",
        serviceType: "Instalação de TV & Suporte",
        description: "Fixação de TV 75 polegadas em parede de drywall com buchas metálicas basculantes.",
        date: "2026-09-09",
        time: "15:00",
        price: 180.00,
        paymentMethod: "Cartão de Crédito",
        paymentStatus: "Pendente",
        status: "andamento",
        checklist: [
          { item: "Localização de tubulação com detector de metais", done: true },
          { item: "Marcação com nível a laser milimétrico", done: true },
          { item: "Furação e fixação do suporte com buchas especiais", done: false },
          { item: "Passagem e organização de cabos HDMI", done: false },
          { item: "Teste de fixação e peso", done: false }
        ],
        notes: "Levar broca vídea 10mm e buchas Toggle."
      },
      {
        id: "OS-2026-003",
        clientId: "CLI-103",
        clientName: "Camila Silveira",
        clientPhone: "5511965432109",
        address: "Rua Domingos de Morais, 540 - Vila Mariana",
        serviceType: "Instalação de Piso Laminado",
        description: "Instalação de 42m² de piso laminado click + rodapés de 8cm em todos os cômodos.",
        date: "2026-09-10",
        time: "08:30",
        price: 1050.00,
        paymentMethod: "Pix (50% entrada + 50% término)",
        paymentStatus: "Entrada Paga",
        status: "agendado",
        checklist: [
          { item: "Verificação de nivelamento e umidade do contrapiso", done: false },
          { item: "Instalação de manta acústica", done: false },
          { item: "Encaixe dos pisos com junta de dilatação", done: false },
          { item: "Instalação dos rodapés com corte de canto 45°", done: false },
          { item: "Aspiração e acabamento com silicone acrílico", done: false }
        ],
        notes: "Agendado para 2 dias de execução."
      },
      {
        id: "OS-2026-004",
        clientId: "CLI-104",
        clientName: "Lucas Mendes",
        clientPhone: "5511954321098",
        address: "Rua Teodoro Sampaio, 2100 - Pinheiros",
        serviceType: "Venda de Móvel + Montagem",
        description: "Entrega e montagem do Painel Home Theater Ripado com fiação embutida.",
        date: "2026-09-11",
        time: "13:30",
        price: 1290.00,
        paymentMethod: "Cartão Parcelado 10x",
        paymentStatus: "Pago",
        status: "agendado",
        checklist: [
          { item: "Carregar móvel lacrado na van", done: false },
          { item: "Instalar suporte de sustentação com laser", done: false },
          { item: "Montagem dos painéis ripados e fita LED", done: false },
          { item: "Teste do nicho flutuante e gavetas", done: false }
        ],
        notes: "Móvel separado no estoque do galpão."
      }
    ],
    transactions: [
      { id: "TR-01", type: "income", category: "Montagem de Móveis", desc: "OS-2026-001 - Mariana Castro", amount: 220.00, date: "2026-09-09", paymentMethod: "Pix" },
      { id: "TR-02", type: "income", category: "Venda de Móveis", desc: "Venda Painel Ripado - Lucas Mendes", amount: 1290.00, date: "2026-09-08", paymentMethod: "Cartão" },
      { id: "TR-03", type: "expense", category: "Combustível", desc: "Abastecimento van de trabalho", amount: 150.00, date: "2026-09-08", paymentMethod: "Pix" },
      { id: "TR-04", type: "expense", category: "Ferramentas & Insumos", desc: "Caixa de parafusos Philips e buchas 8mm Fischer", amount: 85.00, date: "2026-09-07", paymentMethod: "Dinheiro" },
      { id: "TR-05", type: "income", category: "Sinal de Instalação", desc: "Entrada 50% Pisos - Camila Silveira", amount: 525.00, date: "2026-09-07", paymentMethod: "Pix" },
      { id: "TR-06", type: "income", category: "Instalação de Acessórios", desc: "Instalação de 2 ventiladores e chuveiro", amount: 280.00, date: "2026-09-06", paymentMethod: "Pix" }
    ],
    proposals: [
      {
        id: "PROP-101",
        clientName: "Mariana Castro",
        clientPhone: "5511987654321",
        date: "2026-09-08",
        validUntil: "2026-09-15",
        items: [
          { desc: "Montagem de Guarda-Roupa Casal 6 Portas", qty: 1, unitPrice: 220.00, subtotal: 220.00 },
          { desc: "Instalação de Espelho de Corpo Inteiro em Alvenaria", qty: 1, unitPrice: 50.00, subtotal: 50.00 }
        ],
        subtotal: 270.00,
        discount: 20.00,
        total: 250.00,
        paymentTerms: "À vista no Pix com desconto ou em 3x no cartão.",
        notes: "Garantia de 90 dias com revisão gratuita se necessário."
      }
    ]
  };

  class Store {
    constructor() {
      this.data = this.load();
      this.listeners = [];
    }

    load() {
      try {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          return JSON.parse(local);
        }
      } catch (e) {
        console.error("Erro ao carregar dados do LocalStorage, usando dados padrão:", e);
      }
      this.save(DEFAULT_DATA);
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }

    save(dataToSave = this.data) {
      this.data = dataToSave;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        console.error("Erro ao salvar no LocalStorage:", e);
      }
      this.notify();
    }

    subscribe(fn) {
      this.listeners.push(fn);
    }

    notify() {
      this.listeners.forEach(fn => fn(this.data));
    }

    resetToDefault() {
      this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      this.save();
    }

    exportJSON() {
      const jsonStr = JSON.stringify(this.data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_montaxx_erp_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    importJSON(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.orders && parsed.clients && parsed.inventory) {
          this.data = parsed;
          this.save();
          return { success: true };
        } else {
          return { success: false, error: "Estrutura do arquivo de backup incompatível." };
        }
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // Métodos utilitários
    getOrders() { return this.data.orders || []; }
    getClients() { return this.data.clients || []; }
    getInventory() { return this.data.inventory || []; }
    getTransactions() { return this.data.transactions || []; }
    getProposals() { return this.data.proposals || []; }
    getSettings() { return this.data.settings || {}; }

    addOrder(order) {
      this.data.orders.unshift(order);
      this.save();
    }

    updateOrder(updatedOrder) {
      const idx = this.data.orders.findIndex(o => o.id === updatedOrder.id);
      if (idx !== -1) {
        this.data.orders[idx] = updatedOrder;
        this.save();
      }
    }

    deleteOrder(id) {
      this.data.orders = this.data.orders.filter(o => o.id !== id);
      this.save();
    }

    addClient(client) {
      this.data.clients.unshift(client);
      this.save();
    }

    updateClient(updatedClient) {
      const idx = this.data.clients.findIndex(c => c.id === updatedClient.id);
      if (idx !== -1) {
        this.data.clients[idx] = updatedClient;
        this.save();
      }
    }

    addInventoryItem(item) {
      this.data.inventory.unshift(item);
      this.save();
    }

    updateInventoryItem(item) {
      const idx = this.data.inventory.findIndex(i => i.id === item.id);
      if (idx !== -1) {
        this.data.inventory[idx] = item;
        this.save();
      }
    }

    decreaseStock(itemId, qty = 1) {
      const item = this.data.inventory.find(i => i.id === itemId);
      if (item) {
        item.stock = Math.max(0, item.stock - qty);
        this.save();
      }
    }

    addTransaction(tx) {
      this.data.transactions.unshift(tx);
      this.save();
    }

    deleteTransaction(id) {
      this.data.transactions = this.data.transactions.filter(t => t.id !== id);
      this.save();
    }

    addProposal(prop) {
      this.data.proposals.unshift(prop);
      this.save();
    }

    updateSettings(newSettings) {
      this.data.settings = { ...this.data.settings, ...newSettings };
      this.save();
    }
  }

  window.MONTAXX_STORE = new Store();
})();
