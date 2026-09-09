// MONTAXX ERP - Controle Financeiro & Fluxo de Caixa
(function() {
  let activeFilter = "all";

  function renderFinancial() {
    const transactions = window.MONTAXX_STORE.getTransactions();
    const container = document.getElementById("financial-table-body");
    if (!container) return;

    let totalIncomes = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
      if (t.type === "income") totalIncomes += Number(t.amount);
      if (t.type === "expense") totalExpenses += Number(t.amount);
    });

    const netBalance = totalIncomes - totalExpenses;

    const inEl = document.getElementById("fin-total-income");
    const outEl = document.getElementById("fin-total-expense");
    const netEl = document.getElementById("fin-net-balance");

    if (inEl) inEl.textContent = `+ R$ ${totalIncomes.toFixed(2)}`;
    if (outEl) outEl.textContent = `- R$ ${totalExpenses.toFixed(2)}`;
    if (netEl) {
      netEl.textContent = `R$ ${netBalance.toFixed(2)}`;
      netEl.style.color = netBalance >= 0 ? "var(--success)" : "var(--danger)";
    }

    let filtered = transactions;
    if (activeFilter === "income") filtered = transactions.filter(t => t.type === "income");
    if (activeFilter === "expense") filtered = transactions.filter(t => t.type === "expense");

    if (filtered.length === 0) {
      container.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Nenhum lançamento no período selecionado.</td></tr>`;
      return;
    }

    container.innerHTML = filtered.map(t => {
      const isIncome = t.type === "income";
      const amountFormatted = Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      return `
        <tr>
          <td><strong style="color: var(--primary);">${t.id}</strong></td>
          <td>${t.date.split('-').reverse().join('/')}</td>
          <td>
            <span class="badge-status ${isIncome ? 'status-concluido' : 'status-cancelado'}">
              ${isIncome ? 'Receita (+)' : 'Despesa (-)'}
            </span>
          </td>
          <td><strong>${t.category}</strong></td>
          <td>${t.desc || "-"}</td>
          <td><span style="font-size: 0.8rem; background: var(--bg-elevated); padding: 2px 8px; border-radius: 4px;">${t.paymentMethod || "Pix"}</span></td>
          <td style="text-align: right; font-weight: 800; color: ${isIncome ? 'var(--success)' : 'var(--danger)'};">
            ${isIncome ? '+' : '-'} ${amountFormatted}
          </td>
          <td>
            <button class="btn-erp btn-erp-danger btn-sm" onclick="window.deleteTransaction('${t.id}')" title="Excluir Lançamento">✕</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  window.openNewTransactionModal = function(type = "income") {
    const modal = document.getElementById("modal-new-transaction");
    if (!modal) return;

    const typeSelect = document.getElementById("new-tx-type");
    if (typeSelect) typeSelect.value = type;

    const dateInput = document.getElementById("new-tx-date");
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    modal.classList.add("open");
  };

  window.saveNewTransaction = function() {
    const type = document.getElementById("new-tx-type")?.value || "income";
    const category = document.getElementById("new-tx-category")?.value || "Serviço";
    const desc = document.getElementById("new-tx-desc")?.value.trim() || "";
    const amount = parseFloat(document.getElementById("new-tx-amount")?.value) || 0;
    const method = document.getElementById("new-tx-method")?.value || "Pix";
    const date = document.getElementById("new-tx-date")?.value || new Date().toISOString().split('T')[0];

    if (amount <= 0) {
      alert("Por favor, informe um valor válido maior que zero.");
      return;
    }

    const newTx = {
      id: window.MONTAXX_STORE.nextId("transactions", "TR-"),
      type: type,
      category: category,
      desc: desc,
      amount: amount,
      date: date,
      paymentMethod: method
    };

    window.MONTAXX_STORE.addTransaction(newTx);
    document.getElementById("modal-new-transaction")?.classList.remove("open");
    if (window.showToast) window.showToast(`Lançamento de ${type === 'income' ? 'receita' : 'despesa'} cadastrado!`);
  };

  window.deleteTransaction = function(id) {
    if (confirm("Deseja realmente excluir este lançamento financeiro?")) {
      window.MONTAXX_STORE.deleteTransaction(id);
      if (window.showToast) window.showToast("Lançamento removido.");
    }
  };

  function setupFinancialFilters() {
    const filterBtns = document.querySelectorAll(".fin-filter-btn");
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("btn-erp-primary"));
        filterBtns.forEach(b => b.classList.add("btn-erp-outline"));
        btn.classList.add("btn-erp-primary");
        btn.classList.remove("btn-erp-outline");
        activeFilter = btn.getAttribute("data-filter");
        renderFinancial();
      });
    });
  }

  window.MONTAXX_STORE.subscribe(renderFinancial);

  window.initFinancial = function() {
    renderFinancial();
    setupFinancialFilters();
  };
})();
