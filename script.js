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
var MASTER_KEY = "PRINTYUK2026"; // Kunci Darurat Khusus Pemilik Toko

var currentAttachedFile = null;
var currentProofFile = null;
var tempPendingOrder = null;
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

// FITUR PEMULIHAN PASSWORD AMAN
function openForgotPasswordModal() {
  document.getElementById('forgot-password-modal').classList.remove('hidden');
}

function resetViaWA() {
  var textWA = 'Halo Owner PrintYuk! Saya lupa kredensial login Admin Website. Mohon bantuan reset akun Admin saya.';
  window.open('https://wa.me/6285658323189?text=' + encodeURIComponent(textWA), '_blank');
}

function resetViaMasterKey() {
  var inputKey = document.getElementById('master-key-input').value.trim();
  if (inputKey === MASTER_KEY) {
    adminUserStored = 'admin';
    adminPassStored = 'admin123';
    localStorage.setItem('py_admin_user', adminUserStored);
    localStorage.setItem('py_admin_pass', adminPassStored);
    alert("Berhasil! Akun Admin telah di-reset ke Default.\nUsername: admin\nPassword: admin123");
    document.getElementById('forgot-password-modal').classList.add('hidden');
    document.getElementById('master-key-input').value = '';
  } else {
    alert("Master Key Pemulihan Salah!");
  }
}

// GANTI ACCOUNT ADMIN DENGAN VERIFIKASI PASSWORD LAMA
function changeAdminCredentials() {
  var oldP = document.getElementById('old-password') ? document.getElementById('old-password').value.trim() : '';
  var newU = document.getElementById('new-username').value.trim();
  var newP = document.getElementById('new-password').value.trim();

  if (oldP !== adminPassStored) {
    alert("Gagal! Password saat ini (Password Lama) salah.");
    return;
  }

  if (!newU || !newP) {
    alert("Username dan Password baru tidak boleh kosong!");
    return;
  }

  adminUserStored = newU;
  adminPassStored = newP;
  localStorage.setItem('py_admin_user', newU);
  localStorage.setItem('py_admin_pass', newP);
  alert("Akun Admin berhasil diperbarui dengan aman!");
  closeSettingsModal();
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
      paymentStatus: (chosenPayment.indexOf('Direct') !== -1 || chosenPayment.indexOf('QRIS') !== -1 ? 'Menunggu Verifikasi' : 'Belum Lunas (COD/Toko)'),
      processStatus: 'Menunggu Pembayaran',
      file: currentAttachedFile || { name: 'File disusulkan via WA', size: '0 MB', dataUri: '' },
      proofFile: null
    };

    if (chosenPayment.indexOf('Direct') !== -1 || chosenPayment.indexOf('QRIS') !== -1) {
      tempPendingOrder = orderData;
      
      var modalAmount = document.getElementById('pay-modal-amount');
      var modalDetails = document.getElementById('pay-modal-details');
      var modal = document.getElementById('payment-modal');

      if (modalAmount) modalAmount.textContent = formatRupiah(calc.grandTotal);
      
      if (modalDetails) {
        if (chosenPayment.indexOf('BCA') !== -1) {
          modalDetails.innerHTML = 
            '<p class="text-slate-500">Bank Tujuan:</p><p class="font-bold text-slate-900">Bank BCA</p>' +
            '<p class="text-slate-500 mt-2">Nomor Rekening:</p><p class="font-extrabold text-brand-600 text-sm">1234 5678 90</p>' +
            '<p class="text-slate-500">Atas Nama: <strong>PrintYuk Tanjungpinang</strong></p>';
        } else if (chosenPayment.indexOf('Mandiri') !== -1) {
          modalDetails.innerHTML = 
            '<p class="text-slate-500">Bank Tujuan:</p><p class="font-bold text-slate-900">Bank Mandiri</p>' +
            '<p class="text-slate-500 mt-2">Nomor Rekening:</p><p class="font-extrabold text-brand-600 text-sm">0987 6543 21</p>' +
            '<p class="text-slate-500">Atas Nama: <strong>PrintYuk Tanjungpinang</strong></p>';
        } else {
          modalDetails.innerHTML = 
            '<div class="text-center py-2 space-y-2">' +
            '<div class="bg-white p-3 inline-block rounded-xl border border-slate-300 shadow-inner">' +
            '<i data-lucide="qr-code" class="w-28 h-28 mx-auto text-slate-800"></i>' +
            '</div>' +
            '<p class="font-bold text-slate-900">QRIS PrintYuk Tanjungpinang</p>' +
            '<p class="text-[10px] text-slate-500">Scan via GoPay, ShopeePay, OVO, Dana, atau m-Banking</p>' +
            '</div>';
        }
      }

      if (typeof lucide !== 'undefined') lucide.createIcons();
      if (modal) modal.classList.remove('hidden');

    } else {
      saveFinalOrder(orderData, false);
    }

  } catch (err) {
    alert("Terjadi kesalahan sistem!");
    console.error(err);
  }
}

function closePaymentModal() {
  var modal = document.getElementById('payment-modal');
  if (modal) modal.classList.add('hidden');
  var proofInput = document.getElementById('proof-input');
  if (proofInput) proofInput.value = '';
  currentProofFile = null;
  tempPendingOrder = null;
}

// KONFIRMASI PEMBAYARAN & BACA FOTO BUKTI UNTUK DISIMPAN
function confirmPaymentWithProof() {
  var proofInput = document.getElementById('proof-input');
  if (!proofInput || !proofInput.files || proofInput.files.length === 0) {
    alert("Mohon upload foto bukti transfer terlebih dahulu!");
    return;
  }

  var file = proofInput.files[0];

  if (file.size > 2 * 1024 * 1024) {
    alert("Ukuran foto bukti terlalu besar! Maksimal 2 MB.");
    return;
  }

  var reader = new FileReader();
  reader.onload = function(evt) {
    if (tempPendingOrder) {
      tempPendingOrder.proofFile = {
        name: file.name,
        dataUri: evt.target.result
      };

      saveFinalOrder(tempPendingOrder, true);
      closePaymentModal();
    }
  };

  reader.readAsDataURL(file);
}

// SIMPAN PESANAN KE LOCALSTORAGE ADMIN & BUKA WA
function saveFinalOrder(orderData, isDigitalWithProof) {
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

  var textWA = '';

  if (isDigitalWithProof) {
    textWA = 'Halo Admin PrintYuk! Saya sudah transfer dan melampirkan bukti pembayaran di website.%0A%0A' +
             '📌 *ID Pesanan:* ' + orderData.id + '%0A' +
             '👤 *Nama:* ' + encodeURIComponent(orderData.custName) + '%0A' +
             '💰 *Total Dibayar:* ' + encodeURIComponent(formatRupiah(orderData.totalPrice)) + '%0A' +
             '💳 *Metode:* ' + encodeURIComponent(orderData.paymentMethod) + '%0A' +
             '🔍 *Status:* Menunggu Verifikasi Admin%0A%0A' +
             'Mohon verifikasi mutasi dan segera diproses ya Kak! Terima kasih.';
  } else {
    textWA = 'Halo Admin PrintYuk! Saya buat pesanan baru (Bayar di Tempat/COD).%0A%0A' +
             '📌 *ID Pesanan:* ' + orderData.id + '%0A' +
             '👤 *Nama:* ' + encodeURIComponent(orderData.custName) + '%0A' +
             '💵 *Total Biaya:* ' + encodeURIComponent(formatRupiah(orderData.totalPrice)) + '%0A' +
             '📌 *Metode Pembayaran:* ' + encodeURIComponent(orderData.paymentMethod) + '%0A' +
             '🛵 *Opsi Pengiriman:* ' + encodeURIComponent(orderData.deliveryName) + '%0A%0A' +
             'Sistem pembayaran lewat COD / Bayar di Tempat langsung saat berkas diambil/diantar. Mohon diproses Kak, Terima kasih!';
  }

  window.open('https://wa.me/6285658323189?text=' + textWA, '_blank');

  alert('BERHASIL! Pesanan ' + orderData.id + ' telah dibuat dan masuk ke sistem Admin.');
  resetOrderForm();
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

// 1. VERIFIKASI LUNAS DARI ADMIN (MENGUPDATE PEMASUKAN & GRAFIK + NOTIF WA)
function markAsPaid(orderId) {
  var targetOrder = null;
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].id === orderId) {
      orders[i].paymentStatus = 'LUNAS';
      targetOrder = orders[i];
      break;
    }
  }

  // Simpan data terbaru ke localStorage
  try { localStorage.setItem('py_orders', JSON.stringify(orders)); } catch (e) {}

  // Render ulang dashboard untuk update tabel, statistik, dan grafik
  renderAdminDashboard();

  if (targetOrder) {
    var phone = (targetOrder.custPhone || '').replace(/^0/, '62').replace(/[^0-9]/g, '');
    var textWA = 'Halo Kak ' + targetOrder.custName + ',\n\n' +
                 'Pembayaran Anda sebesar *' + formatRupiah(targetOrder.totalPrice) + '* untuk pesanan *ID: ' + targetOrder.id + '* telah *DIVERIFIKASI LUNAS* oleh Admin! 🎉\n\n' +
                 'Pesanan cetak Anda langsung kami masukkan ke antrean pengerjaan. Terima kasih! 🙏';
    
    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(textWA), '_blank');
  }

  alert('Pesanan ' + orderId + ' berhasil ditandai LUNAS!');
}

// 2. VERIFIKASI BELUM LUNAS / SALDO BELUM MASUK (KIRIM WA NOTIFIKASI)
function sendPaymentUnverifiedWA(orderId) {
  var targetOrder = null;
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].id === orderId) {
      orders[i].paymentStatus = 'Belum Lunas (Saldo Belum Masuk)';
      targetOrder = orders[i];
      break;
    }
  }

  // Simpan data terbaru ke localStorage
  try { localStorage.setItem('py_orders', JSON.stringify(orders)); } catch (e) {}

  // Render ulang dashboard
  renderAdminDashboard();

  if (targetOrder) {
    var phone = (targetOrder.custPhone || '').replace(/^0/, '62').replace(/[^0-9]/g, '');
    var textWA = 'Halo Kak ' + targetOrder.custName + ',\n\n' +
                 'Terima kasih sudah memesan di PrintYuk Tanjungpinang.\n\n' +
                 'Kami telah mengecek bukti transfer & mutasi rekening/QRIS kami untuk pesanan *ID: ' + targetOrder.id + '*, namun *PEMBAYARAN BELUM LUNAS / SALDO BELUM MASUK* sebesar *' + formatRupiah(targetOrder.totalPrice) + '*.\n\n' +
                 'Mohon bantuannya untuk mengecek kembali transaksi di aplikasi bank/e-wallet Kakak ya. Pesanan akan segera kami cetak setelah saldo terverifikasi masuk. Terima kasih! 🙏';

    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(textWA), '_blank');
  }

  alert('Status pesanan ' + orderId + ' diubah menjadi Belum Lunas dan pesan peringatan WA telah dibuat.');
}

function generateWATemplate(order, customStatus) {
  var status = customStatus || order.processStatus;
  var phone = (order.custPhone || '').replace(/^0/, '62').replace(/[^0-9]/g, '');
  var textWA = '';

  if (status === 'Menunggu Pembayaran' || order.paymentStatus !== 'LUNAS') {
    textWA = 'Halo Kak ' + order.custName + ',\n\n' +
             'Pesanan Anda di *PrintYuk Tanjungpinang* dengan *ID: ' + order.id + '* telah kami terima.\n\n' +
             '📌 *Status Pembayaran:* ' + order.paymentStatus + '\n' +
             '💰 *Total Pembayaran:* ' + formatRupiah(order.totalPrice) + '\n\n' +
             'Silakan konfirmasi jika sudah melakukan transaksi. Terima kasih! 🙏';
  } else if (status === 'Sedang Dicetak') {
    textWA = 'Halo Kak ' + order.custName + ',\n\n' +
             'Kabar baik! Pesanan cetak Anda di *PrintYuk Tanjungpinang* (*ID: ' + order.id + '*) *SEDANG DICETAK* 🖨️✨\n\n' +
             'Mohon tunggu sebentar ya, kami sedang memproses dokumen Anda dengan kualitas terbaik.';
  } else if (status === 'Siap Diantar / Diambil') {
    textWA = 'Halo Kak ' + order.custName + ',\n\n' +
             'Pesanan Anda di *PrintYuk Tanjungpinang* (*ID: ' + order.id + '*) *SUDAH SELESAI* dan siap diantar/diambil! 🎉📦\n\n' +
             'Opsi Pengiriman: *' + order.deliveryName + '*\n' +
             'Silakan konfirmasi jika ingin diambil atau diantar sekarang. Terima kasih!';
  } else if (status === 'Selesai') {
    textWA = 'Halo Kak ' + order.custName + ',\n\n' +
             'Pesanan *' + order.id + '* telah *SELESAI*. Terima kasih telah mencetak dokumen di *PrintYuk Tanjungpinang*! 🙏😊\n\n' +
             'Jangan ragu untuk cetak berkas/tugas kamu lagi di sini ya!';
  } else {
    textWA = 'Halo Kak ' + order.custName + ', mengenai pesanan Anda (*ID: ' + order.id + '*) di PrintYuk Tanjungpinang.';
  }

  return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(textWA);
}

function updateProcessStatus(orderId, newStatus) {
  var targetOrder = null;
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].id === orderId) {
      orders[i].processStatus = newStatus;
      if (newStatus === 'Selesai') orders[i].paymentStatus = 'LUNAS';
      targetOrder = orders[i];
      break;
    }
  }
  try { localStorage.setItem('py_orders', JSON.stringify(orders)); } catch (e) {}
  renderAdminDashboard();

  if (targetOrder) {
    var waUrl = generateWATemplate(targetOrder, newStatus);
    window.open(waUrl, '_blank');
  }
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

  // TOTAL PEMASUKAN HANYA MENGHITUNG TRANSAKSI DENGAN STATUS "LUNAS"
  var totalIncome = 0;
  for (var k = 0; k < filteredOrders.length; k++) {
    if (filteredOrders[k].paymentStatus === 'LUNAS') {
      totalIncome += filteredOrders[k].totalPrice;
    }
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
      orderTbody.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-slate-400">Belum ada pesanan masuk</td></tr>';
    } else {
      for (var m = 0; m < orders.length; m++) {
        var o = orders[m];
        
        // DOKUMEN CETAK
        var downloadBtn = '<span class="text-slate-400">Tanpa File</span>';
        if (o.file && o.file.dataUri) {
          downloadBtn = '<a href="' + o.file.dataUri + '" download="' + o.file.name + '" class="bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-300 px-2 py-1 rounded-lg font-bold inline-flex items-center gap-1 text-[11px]">Unduh File</a>';
        }

        // BUKTI BAYAR
        var proofBtn = '<span class="text-slate-400">COD / Cash</span>';
        if (o.proofFile && o.proofFile.dataUri) {
          proofBtn = '<a href="' + o.proofFile.dataUri + '" target="_blank" download="' + o.proofFile.name + '" class="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 px-2 py-1 rounded-lg font-bold inline-flex items-center gap-1 text-[11px]">Lihat Bukti</a>';
        }

        var isPaid = o.paymentStatus === 'LUNAS';
        var urlWA = generateWATemplate(o);

        // TOMBOL AKSI TERMASUK VERIFIKASI LUNAS DAN BELUM MASUK
        var actionBtn = '<div class="flex flex-col gap-1">' +
          '<div class="flex items-center gap-1">' +
            '<button type="button" onclick="printReceipt(\'' + o.id + '\')" class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg font-bold text-xs shadow-sm">Struk</button>' +
            '<a href="' + urlWA + '" target="_blank" class="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded-lg font-bold text-xs">WA</a>' +
          '</div>' +
          (!isPaid ? '<button type="button" onclick="markAsPaid(\'' + o.id + '\')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg font-bold text-xs w-full text-center">✓ Verifikasi Lunas</button>' : '') +
          (!isPaid ? '<button type="button" onclick="sendPaymentUnverifiedWA(\'' + o.id + '\')" class="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded-lg font-bold text-xs w-full text-center" title="Saldo belum masuk / SS palsu">✕ Belum Lunas</button>' : '') +
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
          '<td class="p-3 min-w-[200px]">' + paperDetails + '</td>' +
          '<td class="p-3">' + downloadBtn + '</td>' +
          '<td class="p-3">' + proofBtn + '</td>' +
          '<td class="p-3"><strong>' + formatRupiah(o.totalPrice) + '</strong><br><span class="px-1.5 py-0.5 rounded text-[10px] font-bold ' + (isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800') + '">' + o.paymentStatus + '</span></td>' +
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

// FUNGSI GRAFIK HANYA MENGHITUNG PENJUALAN YANG STATUSNYA "LUNAS"
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
      // HANYA TAMBAHKAN KE GRAFIK JIKA STATUSNYA SUDAH "LUNAS"
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
    file: null,
    proofFile: null
  };

  orders.unshift(manualOrder);
  try { localStorage.setItem('py_orders', JSON.stringify(orders)); } catch (e) {}
  closeManualOrderModal();
  renderAdminDashboard();
  alert("Pemasukan manual berhasil ditambahkan!");
}

function openSettingsModal() { 
  document.getElementById('new-username').value = adminUserStored;
  if (document.getElementById('old-password')) document.getElementById('old-password').value = '';
  if (document.getElementById('new-password')) document.getElementById('new-password').value = '';
  document.getElementById('settings-modal').classList.remove('hidden'); 
}
function closeSettingsModal() { document.getElementById('settings-modal').classList.add('hidden'); }

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
