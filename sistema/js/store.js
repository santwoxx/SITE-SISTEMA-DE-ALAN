// MONTAXX ERP - Armazenamento Central de Dados (LocalStorage + Reatividade)
(function() {
  const STORAGE_KEY = "MONTAXX_ERP_DATA_V2";
  const LEGACY_KEYS = ["MONTAXX_ERP_DATA_V1"]; // dados de demonstracao das versoes anteriores

  // Base inicial de PRODUCAO: sistema comeca vazio.
  // Os dados da empresa sao preenchidos pelo administrador em
  // "Configuracoes & Backup" e sobem automaticamente para a nuvem.
  const DEFAULT_DATA = {
    settings: {
      companyName: "MONTAXX Montagens e Venda de Móveis",
      ownerName: "",
      phone: "",
      email: "",
      pixKey: "",
      pixName: "",
      city: "",
      warrantyDays: 90
    },
    clients: [],
    inventory: [],
    orders: [],
    transactions: [],
    proposals: []
  };

  class Store {
    constructor() {
      // listeners precisa existir ANTES de load(): no primeiro acesso (sem dados
      // salvos) o load() chama save() -> notify(), que percorre esta lista.
      this.listeners = [];
      this.data = this.load();
    }

    load() {
      // Descarta resquícios de demonstração de versões anteriores
      try {
        LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
      } catch (e) { /* navegador sem localStorage: segue em memória */ }

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

    /**
     * Gera identificadores sequenciais e SEM COLISÃO (CLI-001, MTX-014, OS-2026-007).
     * Os códigos aleatórios anteriores tinham poucas combinações e passariam a
     * repetir com poucos cadastros reais, sobrescrevendo registros já existentes.
     */
    nextId(listName, prefix, digits = 3) {
      const list = this.data[listName] || [];
      let maior = 0;
      list.forEach(item => {
        const m = String(item && item.id || "").match(/(\d+)\s*$/);
        if (m) maior = Math.max(maior, parseInt(m[1], 10));
      });
      return prefix + String(maior + 1).padStart(digits, "0");
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

  // Exposto para o logout (auth.js) limpar o cache do aparelho compartilhado
  window.MONTAXX_STORAGE_KEYS = [STORAGE_KEY].concat(LEGACY_KEYS);

  window.MONTAXX_STORE = new Store();
})();
