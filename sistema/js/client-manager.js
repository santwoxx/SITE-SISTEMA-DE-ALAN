// MONTAXX ERP - Gestão de Clientes (CRM)
(function() {
  function renderClients(searchQuery = "") {
    const clients = window.MONTAXX_STORE.getClients();
    const orders = window.MONTAXX_STORE.getOrders();
    const container = document.getElementById("clients-table-body");
    if (!container) return;

    let filtered = clients;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = clients.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.phone.includes(q) || 
        (c.neighborhood && c.neighborhood.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Nenhum cliente encontrado.</td></tr>`;
      return;
    }

    container.innerHTML = filtered.map(c => {
      // Calcula histórico do cliente
      const clientOrders = orders.filter(o => o.clientId === c.id || o.clientName === c.name);
      const totalSpent = clientOrders.reduce((sum, o) => sum + Number(o.price || 0), 0);
      const waUrl = `https://api.whatsapp.com/send?phone=${c.phone}&text=Olá ${c.name}! Aqui é da MONTAXX.`;

      return `
        <tr>
          <td><strong style="color: var(--primary);">${c.id}</strong></td>
          <td>
            <strong>${c.name}</strong><br>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${c.type || "Residencial"}</span>
          </td>
          <td>
            <a href="${waUrl}" target="_blank" style="color: #25D366; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
              💬 ${c.phone}
            </a>
          </td>
          <td>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">${c.address || "-"}</div>
            <small style="color: var(--text-muted);">${c.neighborhood || ""}, ${c.city || ""}</small>
          </td>
          <td>
            <span style="color: var(--text-primary); font-weight: 700;">${clientOrders.length} serviço(s)</span><br>
            <small style="color: var(--success); font-weight: 700;">R$ ${totalSpent.toFixed(2)} total</small>
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <a href="https://waze.com/ul?q=${encodeURIComponent(c.address)}" target="_blank" class="btn-icon-action" title="Abrir Waze">🚗</a>
              <button class="btn-erp btn-erp-outline btn-sm" onclick="window.editClient('${c.id}')">Editar</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // Modal Novo Cliente
  window.openNewClientModal = function() {
    const modal = document.getElementById("modal-new-client");
    if (modal) modal.classList.add("open");
  };

  window.saveNewClient = function() {
    const name = document.getElementById("new-client-name")?.value.trim();
    const phone = document.getElementById("new-client-phone")?.value.trim();
    const address = document.getElementById("new-client-address")?.value.trim();
    const neighborhood = document.getElementById("new-client-neighborhood")?.value.trim();
    const type = document.getElementById("new-client-type")?.value || "Apartamento (com elevador)";
    const notes = document.getElementById("new-client-notes")?.value.trim();

    if (!name || !phone) {
      alert("Por favor, informe ao menos o Nome e o WhatsApp do cliente.");
      return;
    }

    const newClient = {
      id: window.MONTAXX_STORE.nextId("clients", "CLI-"),
      name: name,
      phone: phone.replace(/\D/g, ""),
      address: address,
      neighborhood: neighborhood,
      city: "São Paulo",
      type: type,
      notes: notes,
      createdAt: new Date().toISOString().split('T')[0]
    };

    window.MONTAXX_STORE.addClient(newClient);
    document.getElementById("modal-new-client")?.classList.remove("open");
    if (window.showToast) window.showToast(`Cliente "${name}" cadastrado com sucesso!`);
    renderClients();
  };

  window.editClient = function(clientId) {
    const client = window.MONTAXX_STORE.getClients().find(c => c.id === clientId);
    if (!client) return;

    const newPhone = prompt(`Atualizar telefone WhatsApp de ${client.name}:`, client.phone);
    if (newPhone !== null) {
      client.phone = newPhone.replace(/\D/g, "");
      const newAddress = prompt(`Atualizar endereço:`, client.address);
      if (newAddress !== null) client.address = newAddress;
      window.MONTAXX_STORE.updateClient(client);
      if (window.showToast) window.showToast("Dados do cliente atualizados!");
      renderClients();
    }
  };

  function setupClientSearch() {
    const searchInput = document.getElementById("clients-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        renderClients(e.target.value);
      });
    }
  }

  window.initClientManager = function() {
    renderClients();
    setupClientSearch();
  };
})();
