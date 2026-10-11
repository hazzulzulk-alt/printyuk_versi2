// Variable State Utama
var orders = [];
var expenses = [];

try {
  orders = JSON.parse(localStorage.getItem('py_orders') || '[]');
  expenses = JSON.parse(localStorage.getItem('py_expenses') || '[]');
} catch (e) {
  orders = [];
  expenses = [];
}

var adminUserStored = localStorage.getItem('py_admin_user') || 'admin';
var adminPassStored = localStorage.getItem('py_admin_pass') || 'admin123';
var currentAttachedFile = null;
var myChart = null;

// Helper Format Rupiah
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);
}

// Fitur Perpindahan Tab Navigation
function switchTab(type) {
  var clientView = document.getElementById('client-view');
  var adminView = document.getElementById('admin-view');
  var clientBtn = document.getElementById('tab-client-btn');
  var adminBtn = document.getElementById('tab-admin-btn');

  if (type === 'client') {
    if (clientView) clientView.classList.remove('hidden');
    if (adminView) adminView.classList.add('hidden');
    if (clientBtn && adminBtn) {
      clientBtn.className = "px-4 py-2 rounded-lg font-bold text-xs md:text-sm bg-white text-brand-600 shadow-sm transition-all flex items-center gap-1.5";
      adminBtn.className = "px-4 py-2 rounded-lg font-bold text-xs md:text-sm text-slate-600 hover:text-slate-900 transition-all flex items-center gap-1.5";
    }
  } else {
    if (clientView) clientView.classList.add('hidden');
    if (adminView) adminView.classList.remove('hidden');
    if (clientBtn && adminBtn) {
      adminBtn.className = "px-4 py-2 rounded-lg font-bold text-xs md:text-sm bg-white text-brand-600 shadow-sm transition-all flex items-center gap-1.5";
      clientBtn.className = "px-4 py-2 rounded-lg font-bold text-xs md:text-sm text-slate-600 hover:text-slate-900 transition-all flex items-center gap-1.5";
    }
    renderAdminDashboard();
  }
}

// Kalkulasi Total Harga Cetak
function calculateTotal() {
  var paperTypeEl = document.getElementById('paper-type');
  var printColorEl = document.getElementById('print-color');
  var printSidesEl = document.getElementById('print-sides');
  var bindingTypeEl = document.getElementById('binding-type');
  var pageCountEl = document.getElementById('page-count');
  var copyCountEl = document.getElementById('copy-count');
  var deliveryOptionEl = document.getElementById('delivery-option');

  if (!paperTypeEl) return { grandTotal: 0, totalSheets: 0 };

  var basePaperPrice = parseInt(paperTypeEl.value) || 0;
  var colorExtra = parseInt(printColorEl ? printColorEl.value : 0) || 0;
  var sides = parseInt(printSidesEl ? printSidesEl.value : 1) || 1;
  var bindingCost = parseInt(bindingTypeEl ? bindingTypeEl.value : 0) || 0;
  var deliveryCost = parseInt(deliveryOptionEl ? deliveryOptionEl.value : 0) || 0;
  var pageCount = Math.max(1, parseInt(pageCountEl ? pageCountEl.value : 1) || 1);
  var copyCount = Math.max(1, parseInt(copyCountEl ? copyCountEl.value : 1) || 1);

  var sheetsPerPage = (sides === 2) ? Math.ceil(pageCount / 2) : pageCount;
  var totalSheets = sheetsPerPage * copyCount;
  var pricePerSheet = basePaperPrice + colorExtra;

  var subtotalPrint = pricePerSheet * totalSheets;
  var totalBinding = bindingCost * copyCount;
  var grandTotal = subtotalPrint + totalBinding + deliveryCost;

  var pricePerSheetEl = document.getElementById('price-per-sheet');
  var totalSheetsEl = document.getElementById('total-sheets');
  var subtotalPrintEl = document.getElementById('subtotal-print');
  var bindingCostEl = document.getElementById('binding-cost');
  var deliveryCostEl = document.getElementById('delivery-cost');
  var grandTotalEl = document.getElementById('grand-total');

  if (pricePerSheetEl) pricePerSheetEl.textContent = formatRupiah(pricePerSheet);
  if (totalSheetsEl) totalSheetsEl.textContent = totalSheets + " Lembar";
  if (subtotalPrintEl) subtotalPrintEl.textContent = formatRupiah(subtotalPrint);
  if (bindingCostEl) bindingCostEl.textContent = formatRupiah(totalBinding);
  if (deliveryCostEl) deliveryCostEl.textContent = formatRupiah(deliveryCost);
  if (grandTotalEl) grandTotalEl.textContent = formatRupiah(grandTotal);

  return { 
    pricePerSheet: pricePerSheet, 
    totalSheets: totalSheets, 
    subtotalPrint: subtotalPrint, 
    totalBinding: totalBinding, 
    deliveryCost: deliveryCost, 
    grandTotal: grandTotal 
  };
}

// SIMPAN SEJARAH PESANAN KE PERANGKAT PELANGGAN
function saveOrderToClientHistory(orderData) {
  try {
    var clientHistory = JSON.parse(localStorage.getItem('py_client_history') || '[]');
    clientHistory.unshift({
      id: orderData.id,
      date: orderData.date,
      totalPrice: orderData.totalPrice,
      processStatus: orderData.processStatus
    });
    localStorage.setItem('py_client_history', JSON.stringify(clientHistory));
  } catch (e) {
    console.warn("Storage penuh untuk riwayat pelanggan", e);
  }
  renderClientHistory();
}

// TAMPILKAN DAFTAR RIWAYAT DI PORTAL PELANGGAN
function renderClientHistory() {
  var historyContainer = document.getElementById('client-history-list');
  if (!historyContainer) return;

  var clientHistory = [];
  try {
    clientHistory = JSON.parse(localStorage.getItem('py_client_history') || '[]');
  } catch (e) {
    clientHistory = [];
  }

  if (clientHistory.length === 0) {
    historyContainer.innerHTML = '<p class="text-slate-400 italic text-center py-2">Belum ada riwayat pesanan di perangkat ini.</p>';
    return;
  }

  historyContainer.innerHTML = '';
  for (var i = 0; i < Math.min(clientHistory.length, 5); i++) {
    var item = clientHistory[i];

    var div = document.createElement('div');
    div.className = 'p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2';
    div.innerHTML = 
      '<div>' +
        '<span class="font-bold text-brand-700 block">' + item.id + '</span>' +
        '<span class="text-[10px] text-slate-400">' + new Date(item.date).toLocaleDateString('id-ID') + ' • ' + formatRupiah(item.totalPrice) + '</span>' +
      '</div>' +
      '<button type="button" onclick="autoFillTrack(\'' + item.id + '\')" class="bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold px-2.5 py-1 rounded-lg text-[11px] border border-brand-200">' +
        'Cek Status' +
      '</button>';
    historyContainer.appendChild(div);
  }

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function autoFillTrack(orderId) {
  var trackInput = document.getElementById('track-input');
  if (trackInput) {
    trackInput.value = orderId;
    trackOrderStatus();
  }
}

// PROSES PEMESANAN BARU
function processOrder() {
  try {
    var custNameEl = document.getElementById('cust-name');
    var custPhoneEl = document.getElementById('cust-phone');
    var paperTypeEl = document.getElementById('paper-type');
    var printColorEl = document.getElementById('print-color');
    var printSidesEl = document.getElementById('print-sides');
    var bindingTypeEl = document.getElementById('binding-type');
    var deliveryOptionEl = document.getElementById('delivery-option');
    var paymentMethodEl = document.getElementById('payment-method');
    var pageCountEl = document.getElementById('page-count');
    var copyCountEl = document.getElementById('copy-count');
    var notesEl = document.getElementById('notes');

    var nameVal = custNameEl ? custNameEl.value.trim() : '';
    var phoneVal = custPhoneEl ? custPhoneEl.value.trim() : '';

    if (!nameVal || !phoneVal) {
      alert("Mohon isi Nama Pemesan dan Nomor WhatsApp terlebih dahulu!");
      return;
    }

    var calc = calculateTotal();
    var chosenPayment = (paymentMethodEl && paymentMethodEl.value) ? paymentMethodEl.value : 'Bayar di Toko';

    var orderData = {
      id: 'PY-' + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toISOString(),
      custName: nameVal,
      custPhone: phoneVal,
      paperName: (paperTypeEl && paperTypeEl.selectedIndex >= 0) ? paperTypeEl.options[paperTypeEl.selectedIndex].text : '-',
      colorName: (printColorEl && printColorEl.selectedIndex >= 0) ? printColorEl.options[printColorEl.selectedIndex].text : '-',
      sidesName: (printSidesEl && printSidesEl.selectedIndex >= 0) ? printSidesEl.options[printSidesEl.selectedIndex].text : '-',
      bindingName: (bindingTypeEl && bindingTypeEl.selectedIndex >= 0) ? bindingTypeEl.options[bindingTypeEl.selectedIndex].text : '-',
      deliveryName: (deliveryOptionEl && deliveryOptionEl.selectedIndex >= 0) ? deliveryOptionEl.options[deliveryOptionEl.selectedIndex].text : '-',
      pageCount: pageCountEl ? pageCountEl.value : 1,
      copyCount: copyCountEl ? copyCountEl.value : 1,
      totalSheets: calc.totalSheets,
      notes: notesEl ? notesEl.value.trim() || '-' : '-',
      paymentMethod: chosenPayment,
      totalPrice: calc.grandTotal,
      paymentStatus: (chosenPayment.indexOf('Direct') !== -1 ? 'Proses Konfirmasi' : 'Belum Lunas'),
      processStatus: 'Menunggu Pembayaran',
      file: currentAttachedFile || { name: 'File disusulkan via WA', size: '0 MB', dataUri: '' }
    };

    try {
      orders = JSON.parse(localStorage.getItem('py_orders') || '[]');
    } catch (e) { orders = []; }

    orders.unshift(orderData);

    try {
      localStorage.setItem('py_orders', JSON.stringify(orders));
    } catch (e) {
      if (orders.length > 1) {
        orders.pop();
        try { localStorage.setItem('py_orders', JSON.stringify(orders)); } catch (err2) {}
      }
    }

    saveOrderToClientHistory(orderData);

    var textWA = 'Halo Admin PrintYuk! Saya buat pesanan baru:%0A' +
                 '*ID Pesanan:* ' + orderData.id + '%0A' +
                 '*Nama:* ' + encodeURIComponent(orderData.custName) + '%0A' +
                 '*Total:* ' + encodeURIComponent(formatRupiah(orderData.totalPrice)) + '%0A' +
                 '*Metode Pembayaran:* ' + encodeURIComponent(orderData.paymentMethod);

    window.open('https://wa.me/6281234567890?text=' + textWA, '_blank');

    alert('BERHASIL! Pesanan Anda telah dibuat.\nID Pesanan: ' + orderData.id);
    
    resetOrderForm();

  } catch (err) {
    alert("Terjadi kesalahan sistem!");
    console.error(err);
  }
}

// FITUR LACAK PESANAN UNTUK KOSTUMER
function trackOrderStatus() {
  var trackInput = document.getElementById('track-input');
  var q = trackInput ? trackInput.value.trim().toUpperCase() : '';
  if (!q) { alert("Masukkan ID Pesanan atau Nomor HP Anda!"); return; }

  var found = null;
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].id.toUpperCase() === q || orders[i].custPhone.indexOf(q) !== -1) {
      found = orders[i];
      break;
    }
  }

  var modal = document.getElementById('track-modal');
  var content = document.getElementById('track-modal-content');

  if (content) {
    if (!found) {
      content.innerHTML = '<p class="text-red-500 font-bold text-center">Data pesanan tidak ditemukan!</p>';
    } else {
      content.innerHTML = 
        '<div class="space-y-2">' +
        '<div class="flex justify-between"><span>ID Pesanan:</span><strong class="text-brand-600">' + found.id + '</strong></div>' +
        '<div class="flex justify-between"><span>Pemesan:</span><strong>' + found.custName + '</strong></div>' +
        '<div class="flex justify-between"><span>Total Lembar:</span><span>' + (found.totalSheets || 1) + ' lembar</span></div>' +
        '<div class="flex justify-between items-center pt-2 border-t">' +
        '<span>Status Pengerjaan:</span>' +
        '<span class="px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-800">' + (found.processStatus || 'Diproses') + '</span>' +
        '</div>' +
        '<div class="flex justify-between items-center">' +
        '<span>Status Pembayaran:</span>' +
        '<span class="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">' + found.paymentStatus + '</span>' +
        '</div>' +
        '</div>';
    }
  }
  if (modal) modal.classList.remove('hidden');
}

function resetOrderForm() {
  var custNameEl = document.getElementById('cust-name');
  var custPhoneEl = document.getElementById('cust-phone');
  var notesEl = document.getElementById('notes');
  var fileInput = document.getElementById('file-input');
  var pageCountEl = document.getElementById('page-count');
  var uploadPlaceholder = document.getElementById('upload-placeholder');
  var fileInfo = document.getElementById('file-info');

  if (custNameEl) custNameEl.value = '';
  if (custPhoneEl) custPhoneEl.value = '';
  if (notesEl) notesEl.value = '';
  if (fileInput) fileInput.value = '';
  currentAttachedFile = null;
  
  if (uploadPlaceholder) uploadPlaceholder.classList.remove('hidden');
  if (fileInfo) fileInfo.classList.add('hidden');
  if (pageCountEl) pageCountEl.value = 1;
  
  calculateTotal();
}

function unlockAdmin() {
  var inputUser = document.getElementById('admin-username').value.trim();
  var inputPass = document.getElementById('admin-password').value.trim();

  if (inputUser === adminUserStored && inputPass === adminPassStored) {
    document.getElementById('admin-pin-gate').classList.add('hidden');
    document.getElementById('admin-content').classList.remove('hidden');
    renderAdminDashboard();
  } else {
    alert("Username atau Password Admin Salah!");
  }
}

function markAsPaid(orderId) {
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].id === orderId) {
      orders[i].paymentStatus = 'LUNAS';
      break;
    }
  }
  try { localStorage.setItem('py_orders', JSON.stringify(orders)); } catch (e) {}
  renderAdminDashboard();
  alert('Pesanan ' + orderId + ' berhasil ditandai LUNAS!');
}

// FITUR ADMIN UNTUK MENGATUR STATUS PENGERJAAN/PENGIRIMAN
function updateProcessStatus(orderId, newStatus) {
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].id === orderId) {
      orders[i].processStatus = newStatus;
      if (newStatus === 'Selesai') orders[i].paymentStatus = 'LUNAS';
      break;
    }
  }
  try { localStorage.setItem('py_orders', JSON.stringify(orders)); } catch (e) {}
  renderAdminDashboard();
}

function printReceipt(orderId) {
  var order = null;
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].id === orderId) {
      order = orders[i];
      break;
    }
  }
  if (!order) return;

  var printWindow = window.open('', '_blank', 'width=400,height=600');
  printWindow.document.write(
    '<html><head><title>Struk - ' + order.id + '</title>' +
    '<style>body{font-family:monospace;padding:15px;font-size:12px;}.text-center{text-align:center;}.border-b{border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:8px;}.flex{display:flex;justify-content:space-between;margin:4px 0;}</style>' +
    '</head><body>' +
    '<div class="text-center border-b"><h3>PRINTYUK! TANJUNGPINANG</h3><p>ID: ' + order.id + '</p></div>' +
    '<div class="flex"><span>Pelanggan:</span><span>' + order.custName + '</span></div>' +
    '<div class="flex"><span>Layanan:</span><span>' + (order.paperName || '-') + '</span></div>' +
    '<div class="flex"><span>Status:</span><span>' + (order.processStatus || 'Diproses') + '</span></div>' +
    '<div class="flex" style="font-weight:bold;border-top:1px dashed #000;padding-top:6px;">' +
    '<span>TOTAL BIAYA:</span><span>' + formatRupiah(order.totalPrice) + '</span></div>' +
    '<script>window.onload = function() { window.print(); window.close(); }<\/script>' +
    '</body></html>'
  );
  printWindow.document.close();
}

function isDateInFilter(dateString, filterType) {
  var itemDate = new Date(dateString);
  var now = new Date();

  if (filterType === 'today') {
    return itemDate.toDateString() === now.toDateString();
  } else if (filterType === 'week') {
    var sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    return itemDate >= sevenDaysAgo;
  } else if (filterType === 'month') {
    return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
  } else if (filterType === 'year') {
    return itemDate.getFullYear() === now.getFullYear();
  }
  return true;
}

function renderAdminDashboard() {
  try {
    orders = JSON.parse(localStorage.getItem('py_orders') || '[]');
    expenses = JSON.parse(localStorage.getItem('py_expenses') || '[]');
  } catch (e) {}

  var timeFilterEl = document.getElementById('time-filter');
  var filterType = timeFilterEl ? timeFilterEl.value : 'month';

  var filteredOrders = [];
  for (var i = 0; i < orders.length; i++) {
    if (isDateInFilter(orders[i].date, filterType)) filteredOrders.push(orders[i]);
  }

  var filteredExpenses = [];
  for (var j = 0; j < expenses.length; j++) {
    if (isDateInFilter(expenses[j].date, filterType)) filteredExpenses.push(expenses[j]);
  }

  var totalIncome = 0;
  for (var k = 0; k < filteredOrders.length; k++) {
    if (filteredOrders[k].paymentStatus === 'LUNAS') totalIncome += filteredOrders[k].totalPrice;
  }

  var totalExpense = 0;
  for (var l = 0; l < filteredExpenses.length; l++) {
    totalExpense += filteredExpenses[l].amount;
  }

  var profit = totalIncome - totalExpense;

  var statIncome = document.getElementById('stat-income');
  var statExpense = document.getElementById('stat-expense');
  var statProfit = document.getElementById('stat-profit');

  if (statIncome) statIncome.textContent = formatRupiah(totalIncome);
  if (statExpense) statExpense.textContent = formatRupiah(totalExpense);
  if (statProfit) statProfit.textContent = formatRupiah(profit);

  var orderTbody = document.getElementById('order-table-body');
  if (orderTbody) {
    orderTbody.innerHTML = '';

    if (orders.length === 0) {
      orderTbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-slate-400">Belum ada pesanan masuk</td></tr>';
    } else {
      for (var m = 0; m < orders.length; m++) {
        var o = orders[m];
        var downloadBtn = '<span class="text-slate-400">Tanpa File</span>';
        if (o.file && o.file.dataUri) {
          downloadBtn = '<a href="' + o.file.dataUri + '" download="' + o.file.name + '" class="bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-300 px-2.5 py-1.5 rounded-lg font-bold inline-flex items-center gap-1 text-xs">Unduh File</a>';
        } else if (o.file && o.file.name) {
          downloadBtn = '<span class="text-slate-500 font-medium text-[11px]">' + o.file.name + '</span>';
        }

        var isPaid = o.paymentStatus === 'LUNAS';
        var textWA = 'Halo ' + o.custName + ', pesanan cetak Anda (' + (o.paperName || 'Kertas') + ') di PrintYuk Tanjungpinang sedang diproses!';
        var urlWA = 'https://wa.me/' + (o.custPhone || '').replace(/^0/, '62') + '?text=' + encodeURIComponent(textWA);

        var actionBtn = '<div class="flex items-center gap-1.5">' +
          '<button type="button" onclick="printReceipt(\'' + o.id + '\')" class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg font-bold text-xs inline-flex items-center gap-1 shadow-sm">Struk</button>' +
          (!isPaid ? '<button type="button" onclick="markAsPaid(\'' + o.id + '\')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg font-bold text-xs">Lunas</button>' : '') +
          '<a href="' + urlWA + '" target="_blank" class="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded-lg font-bold text-xs">WA</a>' +
          '</div>';

        var paperDetails = o.paperName ? 
          '<div class="space-y-0.5 text-[11px] text-slate-700">' +
          '<p><strong class="text-slate-900">' + o.paperName + '</strong> (' + (o.colorName || 'B/W') + ')</p>' +
          '<p>Sisi: ' + (o.sidesName || '1 Sisi') + ' | Jilid: <span class="font-semibold text-brand-700">' + (o.bindingName || 'Tanpa Jilid') + '</span></p>' +
          '<p>Jumlah: <strong>' + (o.pageCount || 1) + ' hlm</strong> x <strong>' + (o.copyCount || 1) + ' copy</strong> = <strong class="text-emerald-700">' + (o.totalSheets || 1) + ' lembar</strong></p>' +
          '</div>' : '<span class="text-slate-400 italic">Transaksi Manual/Walk-in</span>';

        var tr = document.createElement('tr');
        tr.innerHTML = 
          '<td class="p-3 font-bold text-slate-800">' + o.id + '<br><span class="text-[10px] text-slate-400 font-normal">' + new Date(o.date).toLocaleDateString('id-ID') + '</span></td>' +
          '<td class="p-3"><strong>' + o.custName + '</strong><br><span class="text-brand-600 font-mono">' + o.custPhone + '</span></td>' +
          '<td class="p-3 min-w-[220px]">' + paperDetails + '</td>' +
          '<td class="p-3">' + downloadBtn + '</td>' +
          '<td class="p-3"><strong>' + formatRupiah(o.totalPrice) + '</strong><br><span class="text-slate-400">' + o.paymentMethod + '</span></td>' +
          '<td class="p-3">' +
            '<select onchange="updateProcessStatus(\'' + o.id + '\', this.value)" class="bg-slate-50 border border-slate-300 rounded p-1 text-xs font-semibold">' +
              '<option value="Menunggu Pembayaran"' + (o.processStatus === 'Menunggu Pembayaran' ? ' selected' : '') + '>Menunggu Pembayaran</option>' +
              '<option value="Sedang Dicetak"' + (o.processStatus === 'Sedang Dicetak' ? ' selected' : '') + '>Sedang Dicetak</option>' +
              '<option value="Siap Diantar / Diambil"' + (o.processStatus === 'Siap Diantar / Diambil' ? ' selected' : '') + '>Siap Diantar / Diambil</option>' +
              '<option value="Selesai"' + (o.processStatus === 'Selesai' ? ' selected' : '') + '>Selesai (Lunas)</option>' +
            '</select>' +
          '</td>' +
          '<td class="p-3">' + actionBtn + '</td>';
        orderTbody.appendChild(tr);
      }
    }
  }

  var expTbody = document.getElementById('expense-table-body');
  if (expTbody) {
    expTbody.innerHTML = '';
    for (var n = 0; n < expenses.length; n++) {
      var e = expenses[n];
      var trExp = document.createElement('tr');
      trExp.innerHTML = 
        '<td class="p-3">' + new Date(e.date).toLocaleDateString('id-ID') + '</td>' +
        '<td class="p-3"><span class="bg-slate-100 px-2 py-0.5 rounded">' + e.category + '</span></td>' +
        '<td class="p-3">' + e.desc + '</td>' +
        '<td class="p-3 font-bold text-red-600">' + formatRupiah(e.amount) + '</td>';
      expTbody.appendChild(trExp);
    }
  }

  renderRealChart(filterType);
}

function downloadFinancialReport() {
  var filterType = document.getElementById('time-filter').value;
  var filteredOrders = [];
  for (var i = 0; i < orders.length; i++) {
    if (isDateInFilter(orders[i].date, filterType)) filteredOrders.push(orders[i]);
  }

  if (filteredOrders.length === 0) {
    alert("Belum ada data transaksi!");
    return;
  }

  var csvContent = "data:text/csv;charset=utf-8,ID,Tanggal,Nama,No WA,Spesifikasi,Total,Status\n";
  for (var j = 0; j < filteredOrders.length; j++) {
    var o = filteredOrders[j];
    csvContent += '"' + o.id + '","' + new Date(o.date).toLocaleString('id-ID') + '","' + o.custName + '","' + o.custPhone + '","' + (o.paperName || '-') + '","' + o.totalPrice + '","' + (o.processStatus || 'Diproses') + '"\n';
  }

  var encodedUri = encodeURI(csvContent);
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "Laporan_PrintYuk_" + filterType + "_" + Date.now() + ".csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function renderRealChart(filterType) {
  var chartCanvas = document.getElementById('financialChart');
  if (!chartCanvas || typeof Chart === 'undefined') return;

  var ctx = chartCanvas.getContext('2d');
  if (myChart) myChart.destroy();

  var labels = [];
  var incomeData = [];
  var expenseData = [];

  var daysCount = 7;
  if (filterType === 'today') daysCount = 1;
  else if (filterType === 'month') daysCount = 30;

  for (var i = daysCount - 1; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var dateStr = d.toLocaleDateString('id-ID');
    labels.push(dateStr);

    var dayIncome = 0;
    for (var j = 0; j < orders.length; j++) {
      if (orders[j].paymentStatus === 'LUNAS' && new Date(orders[j].date).toLocaleDateString('id-ID') === dateStr) {
        dayIncome += orders[j].totalPrice;
      }
    }

    var dayExpense = 0;
    for (var k = 0; k < expenses.length; k++) {
      if (new Date(expenses[k].date).toLocaleDateString('id-ID') === dateStr) {
        dayExpense += expenses[k].amount;
      }
    }

    incomeData.push(dayIncome);
    expenseData.push(dayExpense);
  }

  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Pemasukan Lunas', data: incomeData, backgroundColor: '#0284c7' },
        { label: 'Pengeluaran', data: expenseData, backgroundColor: '#dc2626' }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function openManualOrderModal() { document.getElementById('manual-order-modal').classList.remove('hidden'); }
function closeManualOrderModal() { document.getElementById('manual-order-modal').classList.add('hidden'); }

function saveManualOrder() {
  var custName = document.getElementById('manual-cust-name').value.trim() || 'Pelanggan Toko';
  var desc = document.getElementById('manual-desc').value.trim() || 'Transaksi Cetak Toko';
  var amount = parseFloat(document.getElementById('manual-amount').value) || 0;
  var paymentMethod = document.getElementById('manual-payment-method') ? document.getElementById('manual-payment-method').value : 'Cash';

  if (amount <= 0) {
    alert("Masukkan nominal pemasukan yang valid!");
    return;
  }

  var manualOrder = {
    id: 'OFF-' + Math.floor(1000 + Math.random() * 9000),
    date: new Date().toISOString(),
    custName: custName,
    custPhone: 'Walk-in Toko',
    paperName: desc,
    colorName: 'Manual',
    bindingName: '-',
    deliveryName: 'Di Toko',
    paymentMethod: paymentMethod,
    pageCount: 1,
    copyCount: 1,
    totalSheets: 1,
    totalPrice: amount,
    paymentStatus: 'LUNAS',
    processStatus: 'Selesai',
    file: null
  };

  orders.unshift(manualOrder);
  try { localStorage.setItem('py_orders', JSON.stringify(orders)); } catch (e) {}
  closeManualOrderModal();
  renderAdminDashboard();
  alert("Pemasukan manual berhasil ditambahkan!");
}

function openSettingsModal() { 
  document.getElementById('new-username').value = adminUserStored;
  document.getElementById('new-password').value = adminPassStored;
  document.getElementById('settings-modal').classList.remove('hidden'); 
}
function closeSettingsModal() { document.getElementById('settings-modal').classList.add('hidden'); }

function changeAdminCredentials() {
  var newU = document.getElementById('new-username').value.trim();
  var newP = document.getElementById('new-password').value.trim();

  if (!newU || !newP) {
    alert("Username dan Password tidak boleh kosong!");
    return;
  }

  adminUserStored = newU;
  adminPassStored = newP;
  localStorage.setItem('py_admin_user', newU);
  localStorage.setItem('py_admin_pass', newP);
  alert("Username & Password Admin berhasil diperbarui!");
  closeSettingsModal();
}

function openExpenseModal() { document.getElementById('expense-modal').classList.remove('hidden'); }
function closeExpenseModal() { document.getElementById('expense-modal').classList.add('hidden'); }

function saveExpense() {
  var category = document.getElementById('exp-category').value;
  var desc = document.getElementById('exp-desc').value.trim();
  var amount = parseFloat(document.getElementById('exp-amount').value) || 0;

  if (!desc || amount <= 0) {
    alert("Mohon isi deskripsi dan nominal pengeluaran!");
    return;
  }

  expenses.unshift({ date: new Date().toISOString(), category: category, desc: desc, amount: amount });
  try { localStorage.setItem('py_expenses', JSON.stringify(expenses)); } catch (e) {}
  closeExpenseModal();
  renderAdminDashboard();
}

// INISIALISASI HALAMAN UTAMA (DETEKSI HALAMAN PDF & WORD)
document.addEventListener('DOMContentLoaded', function() {
  var paperTypeEl = document.getElementById('paper-type');
  var printColorEl = document.getElementById('print-color');
  var printSidesEl = document.getElementById('print-sides');
  var bindingTypeEl = document.getElementById('binding-type');
  var pageCountEl = document.getElementById('page-count');
  var copyCountEl = document.getElementById('copy-count');
  var deliveryOptionEl = document.getElementById('delivery-option');
  var fileInput = document.getElementById('file-input');
  var removeFileBtn = document.getElementById('remove-file');

  var elementsToWatch = [paperTypeEl, printColorEl, printSidesEl, bindingTypeEl, pageCountEl, copyCountEl, deliveryOptionEl];
  for (var i = 0; i < elementsToWatch.length; i++) {
    if (elementsToWatch[i]) {
      elementsToWatch[i].addEventListener('change', calculateTotal);
      elementsToWatch[i].addEventListener('input', calculateTotal);
    }
  }

  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;

      if (file.size > 3.5 * 1024 * 1024) {
        alert("Ukuran file terlalu besar (Maksimal 3.5 MB)!");
        fileInput.value = '';
        return;
      }

      var fileNameEl = document.getElementById('file-name');
      var fileSizeEl = document.getElementById('file-size');
      var uploadPlaceholder = document.getElementById('upload-placeholder');
      var fileInfo = document.getElementById('file-info');

      if (fileNameEl) fileNameEl.textContent = file.name;
      if (fileSizeEl) fileSizeEl.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      if (uploadPlaceholder) uploadPlaceholder.classList.add('hidden');
      if (fileInfo) fileInfo.classList.remove('hidden');

      var reader = new FileReader();
      reader.onload = function(evt) {
        currentAttachedFile = {
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          dataUri: evt.target.result
        };
      };
      reader.readAsDataURL(file);

      var fileNameLower = file.name.toLowerCase();

      // DETEKSI OTOMATIS JUMLAH HALAMAN PDF
      if (file.type === 'application/pdf' || fileNameLower.endsWith('.pdf')) {
        var pdfReader = new FileReader();
        pdfReader.onload = function() {
          var typedarray = new Uint8Array(this.result);
          if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
              if (pageCountEl) pageCountEl.value = pdf.numPages;
              calculateTotal();
            }).catch(function() {
              if (pageCountEl) pageCountEl.value = 1;
              calculateTotal();
            });
          }
        };
        pdfReader.readAsArrayBuffer(file);

      // DETEKSI OTOMATIS JUMLAH HALAMAN WORD (.DOCX)
      } else if (fileNameLower.endsWith('.docx')) {
        if (typeof JSZip !== 'undefined') {
          var zip = new JSZip();
          zip.loadAsync(file).then(function(zipContent) {
            if (zipContent.file("docProps/app.xml")) {
              return zipContent.file("docProps/app.xml").async("text");
            }
            return null;
          }).then(function(xmlText) {
            if (xmlText) {
              var match = xmlText.match(/<Pages>(\d+)<\/Pages>/);
              if (match && match[1] && parseInt(match[1], 10) > 0) {
                if (pageCountEl) pageCountEl.value = parseInt(match[1], 10);
              }
            }
            calculateTotal();
          }).catch(function() {
            if (pageCountEl) pageCountEl.value = 1;
            calculateTotal();
          });
        }
      } else {
        if (pageCountEl) pageCountEl.value = 1;
        calculateTotal();
      }
    });
  }

  if (removeFileBtn) {
    removeFileBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (fileInput) fileInput.value = '';
      currentAttachedFile = null;
      var uploadPlaceholder = document.getElementById('upload-placeholder');
      var fileInfo = document.getElementById('file-info');
      if (uploadPlaceholder) uploadPlaceholder.classList.remove('hidden');
      if (fileInfo) fileInfo.classList.add('hidden');
      if (pageCountEl) pageCountEl.value = 1;
      calculateTotal();
    });
  }

  calculateTotal();
  renderClientHistory();

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});