// MONTAXX ERP - Módulo de Dashboard
(function() {
  function renderDashboard() {
    const orders = window.MONTAXX_STORE.getOrders();
    const inventory = window.MONTAXX_STORE.getInventory();
    const transactions = window.MONTAXX_STORE.getTransactions();

    // 1. Cálculos de KPIs
    let totalRevenue = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
      if (t.type === "income") totalRevenue += Number(t.amount);
      if (t.type === "expense") totalExpenses += Number(t.amount);
    });

    const netProfit = totalRevenue - totalExpenses;
    const completedOrders = orders.filter(o => o.status === "concluido").length;
    const pendingOrders = orders.filter(o => o.status === "agendado" || o.status === "andamento").length;
    
    // Total de móveis em estoque
    const totalStock = inventory.reduce((acc, curr) => acc + Number(curr.stock), 0);

    // Atualiza KPIs no DOM
    const kpiRevenue = document.getElementById("kpi-revenue");
    const kpiProfit = document.getElementById("kpi-profit");
    const kpiCompleted = document.getElementById("kpi-completed");
    const kpiPending = document.getElementById("kpi-pending");

    if (kpiRevenue) kpiRevenue.textContent = totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (kpiProfit) kpiProfit.textContent = netProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (kpiCompleted) kpiCompleted.textContent = `${completedOrders} concluídas`;
    if (kpiPending) kpiPending.textContent = `${pendingOrders} em aberto`;

    // 2. Montagens de Hoje e Próximas
    renderTodaySchedule(orders);

    // 3. Gráfico Visual de Faturamento
    renderRevenueChart(transactions);

    // 4. Móveis com Estoque Baixo
    renderLowStockAlert(inventory);
  }

  function renderTodaySchedule(orders) {
    const container = document.getElementById("dashboard-today-list");
    if (!container) return;

    // Pega as ordens agendadas ou em andamento
    const activeOrders = orders.filter(o => o.status === "agendado" || o.status === "andamento");

    if (activeOrders.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.9rem;">
          🎉 Nenhuma montagem pendente na fila! Aproveite para organizar o estoque ou agendar novos clientes.
        </div>
      `;
      return;
    }

    container.innerHTML = activeOrders.map(order => {
      const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(order.address)}`;
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`;
      const waMsg = encodeURIComponent(`Olá ${order.clientName}! Aqui é o montador da MONTAXX. Estou a caminho do seu endereço para realizar o serviço agendado.`);
      const waUrl = `https://api.whatsapp.com/send?phone=${order.clientPhone}&text=${waMsg}`;

      return `
        <div class="schedule-item">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div class="schedule-time-box">
              ${order.time || "09:00"}
              <div style="font-size: 0.65rem; color: var(--text-muted);">${order.date.split('-').reverse().slice(0,2).join('/')}</div>
            </div>
            <div class="schedule-info">
              <strong>${order.clientName} - ${order.serviceType}</strong>
              <span>📍 ${order.address}</span>
            </div>
          </div>
          
          <div class="schedule-actions">
            <a href="${wazeUrl}" target="_blank" class="btn-icon-action" title="Abrir no Waze">
              🚗
            </a>
            <a href="${mapsUrl}" target="_blank" class="btn-icon-action" title="Abrir no Google Maps">
              🗺️
            </a>
            <a href="${waUrl}" target="_blank" class="btn-icon-action" title="Avisar no WhatsApp">
              💬
            </a>
            <button class="btn-erp btn-erp-primary btn-sm" onclick="window.quickCompleteOrder('${order.id}')" title="Marcar como Concluído">
              ✓ Finalizar
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderRevenueChart(transactions) {
    const container = document.getElementById("revenue-chart-container");
    if (!container) return;

    // Agrupa receitas por categoria
    const categories = {};
    transactions.filter(t => t.type === "income").forEach(t => {
      const cat = t.category || "Outros";
      categories[cat] = (categories[cat] || 0) + Number(t.amount);
    });

    const total = Object.values(categories).reduce((a, b) => a + b, 0) || 1;

    let barsHtml = Object.entries(categories).map(([cat, val]) => {
      const pct = Math.round((val / total) * 100);
      return `
        <div style="margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
            <span><strong>${cat}</strong></span>
            <span style="color: var(--primary); font-weight: 700;">R$ ${val.toFixed(2)} (${pct}%)</span>
          </div>
          <div style="height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${pct}%; background: linear-gradient(90deg, #FFB800, #FFA200); border-radius: 4px;"></div>
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = barsHtml || `<p style="color: var(--text-muted); font-size: 0.85rem;">Nenhuma receita registrada ainda.</p>`;
  }

  function renderLowStockAlert(inventory) {
    const container = document.getElementById("low-stock-container");
    if (!container) return;

    if (inventory.length === 0) {
      container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;">Nenhum móvel cadastrado ainda. Use "+ Novo Móvel" para montar o seu catálogo.</div>`;
      return;
    }

    const lowItems = inventory.filter(item => item.stock <= item.minStock);

    if (lowItems.length === 0) {
      container.innerHTML = `<div style="color: var(--success); font-size: 0.85rem;">✓ Estoque regularizado. Todos os produtos possuem estoque suficiente.</div>`;
      return;
    }

    container.innerHTML = lowItems.map(item => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-subtle);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.2rem;">⚠️</span>
          <div>
            <strong style="font-size: 0.88rem; color: var(--text-primary);">${item.name}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Mínimo: ${item.minStock} unid.</div>
          </div>
        </div>
        <div style="background: var(--danger-subtle); color: var(--danger); font-weight: 800; font-size: 0.8rem; padding: 3px 10px; border-radius: var(--radius-full);">
          Restam ${item.stock}
        </div>
      </div>
    `).join("");
  }

  window.quickCompleteOrder = function(orderId) {
    const orders = window.MONTAXX_STORE.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = "concluido";
      order.paymentStatus = "Pago";
      window.MONTAXX_STORE.updateOrder(order);

      // Registra transação se não registrada
      window.MONTAXX_STORE.addTransaction({
        id: window.MONTAXX_STORE.nextId("transactions", "TR-"),
        type: "income",
        category: order.serviceType,
        desc: `${order.id} - ${order.clientName}`,
        amount: order.price,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: order.paymentMethod
      });

      if (window.showToast) window.showToast(`Ordem ${order.id} marcada como CONCLUÍDA! Pagamento registrado.`);
    }
  };

  // Inscreve no store para atualizar quando houver mudanças
  window.MONTAXX_STORE.subscribe(renderDashboard);

  window.renderDashboard = renderDashboard;
})();
