// MONTAXX ERP - Módulo de Móveis, Catálogo & Controle de Estoque
(function() {
  function renderFurniture() {
    const inventory = window.MONTAXX_STORE.getInventory();
    const container = document.getElementById("furniture-table-body");
    if (!container) return;

    if (inventory.length === 0) {
      container.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Nenhum móvel cadastrado no estoque.</td></tr>`;
      return;
    }

    container.innerHTML = inventory.map(item => {
      const cost = Number(item.costPrice);
      const sale = Number(item.salePrice);
      const margin = sale - cost;
      const marginPct = cost > 0 ? Math.round((margin / cost) * 100) : 0;

      let stockBadge = "";
      if (item.stock === 0) {
        stockBadge = `<span class="badge-status status-cancelado">Esgotado</span>`;
      } else if (item.stock <= item.minStock) {
        stockBadge = `<span class="badge-status status-andamento">Baixo: ${item.stock}</span>`;
      } else {
        stockBadge = `<span class="badge-status status-concluido">${item.stock} em estoque</span>`;
      }

      return `
        <tr>
          <td>
            <img src="${item.image || 'assets/images/wardrobe.jpg'}" alt="${item.name}" style="width: 50px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-subtle);">
          </td>
          <td><strong style="color: var(--primary);">${item.id}</strong></td>
          <td>
            <strong>${item.name}</strong><br>
            <small style="color: var(--text-muted);">${item.category}</small>
          </td>
          <td>R$ ${cost.toFixed(2)}</td>
          <td><strong style="color: var(--text-primary);">R$ ${sale.toFixed(2)}</strong></td>
          <td>
            <span style="color: var(--success); font-weight: 700;">+ R$ ${margin.toFixed(2)}</span>
            <small style="color: var(--text-muted);">(${marginPct}%)</small>
          </td>
          <td>${stockBadge}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn-erp btn-erp-primary btn-sm" onclick="window.openSaleModal('${item.id}')">
                Vender
              </button>
              <button class="btn-erp btn-erp-outline btn-sm" onclick="window.editFurniture('${item.id}')">
                Editar
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // Modal para Registrar Venda Direta de Móvel
  window.openSaleModal = function(itemId) {
    const item = window.MONTAXX_STORE.getInventory().find(i => i.id === itemId);
    if (!item) return;

    const modal = document.getElementById("modal-sell-furniture");
    if (!modal) return;

    // Popula clientes
    const clientSelect = document.getElementById("sale-client-select");
    if (clientSelect) {
      const clients = window.MONTAXX_STORE.getClients();
      clientSelect.innerHTML = clients.map(c => `
        <option value="${c.id}">${c.name} - ${c.neighborhood || c.city}</option>
      `).join("");
    }

    document.getElementById("sale-item-id").value = item.id;
    document.getElementById("sale-item-name").textContent = item.name;
    document.getElementById("sale-item-price").textContent = Number(item.salePrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById("sale-stock-left").textContent = `${item.stock} disponíveis`;

    modal.classList.add("open");
  };

  // Concluir Venda
  window.confirmFurnitureSale = function() {
    const itemId = document.getElementById("sale-item-id")?.value;
    const clientId = document.getElementById("sale-client-select")?.value;
    const includeAssembly = document.getElementById("sale-include-assembly")?.checked;
    const paymentMethod = document.getElementById("sale-payment-method")?.value || "Cartão";

    const item = window.MONTAXX_STORE.getInventory().find(i => i.id === itemId);
    const client = window.MONTAXX_STORE.getClients().find(c => c.id === clientId) || { name: "Cliente Balcão", phone: "", address: "Retirada em loja" };

    if (!item) return;
    if (item.stock <= 0) {
      alert("Atenção: Este produto está esgotado no estoque!");
      return;
    }

    // 1. Reduz estoque
    window.MONTAXX_STORE.decreaseStock(itemId, 1);

    // 2. Registra receita
    const totalAmount = Number(item.salePrice);
    window.MONTAXX_STORE.addTransaction({
      id: window.MONTAXX_STORE.nextId("transactions", "TR-"),
      type: "income",
      category: "Venda de Móveis",
      desc: `Venda: ${item.name} (${client.name})`,
      amount: totalAmount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod
    });

    // 3. Se inclui montagem, cria OS agendada automaticamente!
    if (includeAssembly) {
      const newOsId = window.MONTAXX_STORE.nextId("orders", "OS-" + new Date().getFullYear() + "-");
      window.MONTAXX_STORE.addOrder({
        id: newOsId,
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone,
        address: client.address,
        serviceType: `Montagem de ${item.name}`,
        description: `Montagem inclusa na compra do móvel ${item.name} (#${item.id}).`,
        date: new Date().toISOString().split('T')[0],
        time: "14:00",
        price: 0.00, // montagem inclusa
        paymentMethod: paymentMethod,
        paymentStatus: "Pago na Venda",
        status: "agendado",
        checklist: [
          { item: "Transportar móvel lacrado", done: false },
          { item: "Conferir todas as ferragens", done: false },
          { item: "Montar e alinhar portas", done: false },
          { item: "Limpar e colher assinatura", done: false }
        ]
      });
    }

    document.getElementById("modal-sell-furniture")?.classList.remove("open");
    if (window.showToast) window.showToast(`Venda do ${item.name} realizada com sucesso! Estoque atualizado.`);
  };

  // Modal para Novo Móvel
  window.openNewFurnitureModal = function() {
    const modal = document.getElementById("modal-new-furniture");
    if (modal) modal.classList.add("open");
  };

  window.saveNewFurniture = function() {
    const name = document.getElementById("new-furniture-name")?.value.trim();
    const category = document.getElementById("new-furniture-cat")?.value || "Quarto";
    const cost = parseFloat(document.getElementById("new-furniture-cost")?.value) || 0;
    const sale = parseFloat(document.getElementById("new-furniture-sale")?.value) || 0;
    const stock = parseInt(document.getElementById("new-furniture-stock")?.value) || 1;
    const minStock = parseInt(document.getElementById("new-furniture-min")?.value) || 1;

    if (!name) {
      alert("Por favor, preencha o nome do móvel.");
      return;
    }

    const newItem = {
      id: window.MONTAXX_STORE.nextId("inventory", "MTX-"),
      name: name,
      category: category,
      costPrice: cost,
      salePrice: sale,
      stock: stock,
      minStock: minStock,
      image: "assets/images/wardrobe.jpg",
      description: "Móvel novo com garantia de fábrica MONTAXX"
    };

    window.MONTAXX_STORE.addInventoryItem(newItem);
    document.getElementById("modal-new-furniture")?.classList.remove("open");
    if (window.showToast) window.showToast(`Produto "${name}" cadastrado no catálogo!`);
  };

  window.editFurniture = function(id) {
    const item = window.MONTAXX_STORE.getInventory().find(i => i.id === id);
    if (!item) return;
    const newStock = prompt(`Atualizar quantidade em estoque de "${item.name}":`, item.stock);
    if (newStock !== null) {
      item.stock = parseInt(newStock) || 0;
      window.MONTAXX_STORE.updateInventoryItem(item);
      if (window.showToast) window.showToast("Estoque atualizado!");
    }
  };

  window.MONTAXX_STORE.subscribe(renderFurniture);
  window.renderFurniture = renderFurniture;
})();
