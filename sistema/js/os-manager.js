// MONTAXX ERP - Módulo de Ordens de Serviço & Agendamentos
(function() {
  let currentViewMode = "kanban"; // kanban ou table

  function initOSManager() {
    renderOSView();
    setupOSListeners();
  }

  function renderOSView() {
    const orders = window.MONTAXX_STORE.getOrders();
    const kanbanContainer = document.getElementById("os-kanban-board");
    const tableContainer = document.getElementById("os-table-view");

    if (currentViewMode === "kanban") {
      if (kanbanContainer) kanbanContainer.style.display = "grid";
      if (tableContainer) tableContainer.style.display = "none";
      renderKanban(orders);
    } else {
      if (kanbanContainer) kanbanContainer.style.display = "none";
      if (tableContainer) tableContainer.style.display = "block";
      renderTable(orders);
    }
  }

  function renderKanban(orders) {
    const cols = {
      agendado: document.getElementById("col-agendado-cards"),
      andamento: document.getElementById("col-andamento-cards"),
      concluido: document.getElementById("col-concluido-cards"),
      cancelado: document.getElementById("col-cancelado-cards")
    };

    const counts = {
      agendado: document.getElementById("badge-count-agendado"),
      andamento: document.getElementById("badge-count-andamento"),
      concluido: document.getElementById("badge-count-concluido"),
      cancelado: document.getElementById("badge-count-cancelado")
    };

    // Limpa colunas
    Object.values(cols).forEach(col => { if (col) col.innerHTML = ""; });

    const grouped = { agendado: [], andamento: [], concluido: [], cancelado: [] };

    orders.forEach(order => {
      const st = order.status || "agendado";
      if (grouped[st]) grouped[st].push(order);
    });

    // Atualiza contadores
    Object.keys(grouped).forEach(st => {
      if (counts[st]) counts[st].textContent = grouped[st].length;
      if (cols[st]) {
        if (grouped[st].length === 0) {
          cols[st].innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 30px 0;">Sem ordens nesta coluna</div>`;
        } else {
          cols[st].innerHTML = grouped[st].map(order => createKanbanCard(order)).join("");
        }
      }
    });
  }

  function createKanbanCard(order) {
    const formattedPrice = Number(order.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(order.address)}`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`;
    const waUrl = `https://api.whatsapp.com/send?phone=${order.clientPhone}&text=${encodeURIComponent('Olá ' + order.clientName + ', estou acompanhando o agendamento da MONTAXX.')}`;

    // Progresso do checklist
    const totalChecks = order.checklist ? order.checklist.length : 0;
    const doneChecks = order.checklist ? order.checklist.filter(c => c.done).length : 0;
    const checklistProgress = totalChecks > 0 ? `✓ Checklist: ${doneChecks}/${totalChecks}` : "";

    return `
      <div class="kanban-card" onclick="window.openOrderDetailModal('${order.id}')">
        <div class="kanban-card-top">
          <span class="kanban-card-id">${order.id}</span>
          <span class="badge-status status-${order.status}">${order.status}</span>
        </div>

        <h4 class="kanban-card-title">${order.serviceType}</h4>
        
        <div class="kanban-card-client">
          <span>👤 ${order.clientName}</span>
          <span style="color: var(--primary); font-size: 0.75rem;">(${order.time || "09:00"})</span>
        </div>

        <div class="kanban-card-address">
          📍 ${order.address}
        </div>

        ${checklistProgress ? `<div style="font-size: 0.72rem; color: var(--primary); margin-bottom: 8px;">${checklistProgress}</div>` : ""}

        <div class="kanban-card-footer" onclick="event.stopPropagation()">
          <div class="kanban-card-price">${formattedPrice}</div>
          <div class="kanban-card-actions">
            <a href="${wazeUrl}" target="_blank" class="btn-icon-action" title="Waze">🚗</a>
            <a href="${mapsUrl}" target="_blank" class="btn-icon-action" title="Google Maps">🗺️</a>
            <a href="${waUrl}" target="_blank" class="btn-icon-action" title="WhatsApp">💬</a>
            <button class="btn-icon-action" onclick="window.cycleOrderStatus('${order.id}')" title="Avançar Status">➡️</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderTable(orders) {
    const tbody = document.getElementById("os-table-body");
    if (!tbody) return;

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Nenhuma OS cadastrada</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(order => {
      const formattedPrice = Number(order.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      return `
        <tr>
          <td><strong style="color: var(--primary);">${order.id}</strong></td>
          <td>
            <strong>${order.clientName}</strong><br>
            <small style="color: var(--text-muted);">${order.clientPhone}</small>
          </td>
          <td>${order.serviceType}</td>
          <td>${order.date.split('-').reverse().join('/')} às ${order.time || "--:--"}</td>
          <td><strong>${formattedPrice}</strong> (${order.paymentStatus || "Pendente"})</td>
          <td><span class="badge-status status-${order.status}">${order.status}</span></td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn-erp btn-erp-outline btn-sm" onclick="window.openOrderDetailModal('${order.id}')">Ver Detalhes</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function setupOSListeners() {
    const btnKanban = document.getElementById("btn-view-kanban");
    const btnTable = document.getElementById("btn-view-table");

    if (btnKanban && btnTable) {
      btnKanban.addEventListener("click", () => {
        currentViewMode = "kanban";
        btnKanban.classList.add("btn-erp-primary");
        btnKanban.classList.remove("btn-erp-outline");
        btnTable.classList.remove("btn-erp-primary");
        btnTable.classList.add("btn-erp-outline");
        renderOSView();
      });

      btnTable.addEventListener("click", () => {
        currentViewMode = "table";
        btnTable.classList.add("btn-erp-primary");
        btnTable.classList.remove("btn-erp-outline");
        btnKanban.classList.remove("btn-erp-primary");
        btnKanban.classList.add("btn-erp-outline");
        renderOSView();
      });
    }
  }

  // Avança o status em 1 clique
  window.cycleOrderStatus = function(orderId) {
    const orders = window.MONTAXX_STORE.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const sequence = ["agendado", "andamento", "concluido"];
    const currentIdx = sequence.indexOf(order.status);
    if (currentIdx !== -1 && currentIdx < sequence.length - 1) {
      order.status = sequence[currentIdx + 1];
      if (order.status === "concluido") {
        order.paymentStatus = "Pago";
      }
      window.MONTAXX_STORE.updateOrder(order);
      if (window.showToast) window.showToast(`Status da ${order.id} alterado para: ${order.status.toUpperCase()}`);
    }
  };

  // Abre Modal de Detalhes da OS
  window.openOrderDetailModal = function(orderId) {
    const order = window.MONTAXX_STORE.getOrders().find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById("modal-os-detail");
    const container = document.getElementById("modal-os-detail-body");
    if (!modal || !container) return;

    const checklistHtml = (order.checklist || []).map((item, idx) => `
      <label style="display: flex; align-items: center; gap: 10px; padding: 6px 0; cursor: pointer; font-size: 0.88rem;">
        <input type="checkbox" ${item.done ? "checked" : ""} onchange="window.toggleChecklistItem('${order.id}', ${idx})">
        <span style="${item.done ? 'text-decoration: line-through; color: var(--text-muted);' : 'color: var(--text-secondary);'}">${item.item}</span>
      </label>
    `).join("");

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <span style="color: var(--primary); font-weight: 800; font-size: 1.1rem;">${order.id}</span>
          <h3 style="color: var(--text-primary); margin-top: 4px;">${order.serviceType}</h3>
        </div>
        <div>
          <select id="modal-os-status-select" class="form-control" onchange="window.updateOrderStatusFromModal('${order.id}', this.value)">
            <option value="agendado" ${order.status === 'agendado' ? 'selected' : ''}>Agendado</option>
            <option value="andamento" ${order.status === 'andamento' ? 'selected' : ''}>Em Andamento</option>
            <option value="concluido" ${order.status === 'concluido' ? 'selected' : ''}>Concluído</option>
            <option value="cancelado" ${order.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
          </select>
        </div>
      </div>

      <div class="form-grid-2" style="background: var(--bg-elevated); padding: 16px; border-radius: var(--radius-sm); margin-bottom: 20px;">
        <div>
          <div class="form-label">Cliente:</div>
          <strong style="color: var(--text-primary); font-size: 0.95rem;">${order.clientName}</strong><br>
          <span style="color: var(--text-muted); font-size: 0.85rem;">📞 ${order.clientPhone}</span>
        </div>
        <div>
          <div class="form-label">Data e Horário:</div>
          <strong style="color: var(--text-primary); font-size: 0.95rem;">📅 ${order.date} às ${order.time}</strong>
        </div>
        <div style="grid-column: span 2; margin-top: 8px;">
          <div class="form-label">Endereço de Atendimento:</div>
          <span style="color: var(--text-secondary); font-size: 0.9rem;">📍 ${order.address}</span>
          <div style="display: flex; gap: 10px; margin-top: 8px;">
            <a href="https://waze.com/ul?q=${encodeURIComponent(order.address)}" target="_blank" class="btn-erp btn-erp-outline btn-sm">Abrir Waze</a>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}" target="_blank" class="btn-erp btn-erp-outline btn-sm">Google Maps</a>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 8px;">Descrição do Trabalho:</h4>
        <p style="background: var(--bg-app); padding: 12px; border-radius: var(--radius-sm); font-size: 0.88rem; color: var(--text-muted); border: 1px solid var(--border-subtle);">
          ${order.description || "Nenhuma descrição informada."}
        </p>
      </div>

      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="font-size: 0.95rem; color: var(--primary);">Checklist de Qualidade MONTAXX:</h4>
        </div>
        <div style="background: var(--bg-app); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          ${checklistHtml || "<p style='color: var(--text-muted); font-size: 0.85rem;'>Nenhum item no checklist.</p>"}
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 16px;">
        <div>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Valor Acordado:</span>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--primary);">
            ${Number(order.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <small style="color: var(--text-muted);">Forma: ${order.paymentMethod} (${order.paymentStatus})</small>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-erp btn-erp-danger btn-sm" onclick="window.deleteOrder('${order.id}')">Excluir OS</button>
          <button class="btn-erp btn-erp-outline btn-sm" onclick="window.printWorkOrder('${order.id}')">🖨️ Imprimir Ordem</button>
        </div>
      </div>
    `;

    modal.classList.add("open");
  };

  window.toggleChecklistItem = function(orderId, index) {
    const order = window.MONTAXX_STORE.getOrders().find(o => o.id === orderId);
    if (order && order.checklist && order.checklist[index]) {
      order.checklist[index].done = !order.checklist[index].done;
      window.MONTAXX_STORE.updateOrder(order);
      renderOSView();
    }
  };

  window.updateOrderStatusFromModal = function(orderId, newStatus) {
    const order = window.MONTAXX_STORE.getOrders().find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      if (newStatus === "concluido") order.paymentStatus = "Pago";
      window.MONTAXX_STORE.updateOrder(order);
      if (window.showToast) window.showToast(`Ordem atualizada para: ${newStatus.toUpperCase()}`);
    }
  };

  window.deleteOrder = function(orderId) {
    if (confirm(`Tem certeza que deseja excluir a ordem ${orderId}?`)) {
      window.MONTAXX_STORE.deleteOrder(orderId);
      document.getElementById("modal-os-detail")?.classList.remove("open");
      if (window.showToast) window.showToast(`Ordem ${orderId} removida.`);
    }
  };

  // Abre Modal de Nova OS
  window.openNewOSModal = function() {
    const modal = document.getElementById("modal-new-os");
    if (!modal) return;

    // Popula select de clientes
    const clientSelect = document.getElementById("new-os-client");
    if (clientSelect) {
      const clients = window.MONTAXX_STORE.getClients();
      clientSelect.innerHTML = clients.map(c => `
        <option value="${c.id}">${c.name} - ${c.neighborhood || c.city}</option>
      `).join("");
    }

    // Preenche data padrão (hoje)
    const dateInput = document.getElementById("new-os-date");
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    modal.classList.add("open");
  };

  // Salvar Nova OS
  window.saveNewOS = function() {
    const clientId = document.getElementById("new-os-client")?.value;
    const serviceType = document.getElementById("new-os-service")?.value || "Montagem de Móveis";
    const date = document.getElementById("new-os-date")?.value || new Date().toISOString().split('T')[0];
    const time = document.getElementById("new-os-time")?.value || "09:00";
    const price = parseFloat(document.getElementById("new-os-price")?.value) || 0;
    const paymentMethod = document.getElementById("new-os-payment")?.value || "Pix";
    const desc = document.getElementById("new-os-desc")?.value || "";

    const client = window.MONTAXX_STORE.getClients().find(c => c.id === clientId) || {
      name: "Cliente Avulso",
      phone: "5511999999999",
      address: "Endereço a confirmar"
    };

    const newId = "OS-" + new Date().getFullYear() + "-" + Math.floor(100 + Math.random() * 900);

    const newOrder = {
      id: newId,
      clientId: clientId,
      clientName: client.name,
      clientPhone: client.phone,
      address: client.address || "Endereço do cliente",
      serviceType: serviceType,
      description: desc,
      date: date,
      time: time,
      price: price,
      paymentMethod: paymentMethod,
      paymentStatus: "Pendente",
      status: "agendado",
      checklist: [
        { item: "Conferir integridade das embalagens e ferragens", done: false },
        { item: "Proteger o chão com lona ou papelão", done: false },
        { item: "Fixar e regular módulos no prumo/nível laser", done: false },
        { item: "Limpeza da serragem com aspirador", done: false },
        { item: "Apresentar para aprovação e assinatura do cliente", done: false }
      ],
      notes: ""
    };

    window.MONTAXX_STORE.addOrder(newOrder);
    document.getElementById("modal-new-os")?.classList.remove("open");
    if (window.showToast) window.showToast(`Ordem ${newId} agendada com sucesso!`);
  };

  window.MONTAXX_STORE.subscribe(renderOSView);
  window.initOSManager = initOSManager;
})();
