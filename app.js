let currentCart = null;
const maxCapacityPerDay = 10;

window.onload = function() {
  if (!localStorage.getItem('storeName')) localStorage.setItem('storeName', 'BREAD STORE');
  if (!localStorage.getItem('cashTag')) localStorage.setItem('cashTag', 'YourCashTag');
  if (!localStorage.getItem('skipDays')) localStorage.setItem('skipDays', JSON.stringify([]));
  if (!localStorage.getItem('orders')) localStorage.setItem('orders', JSON.stringify([]));

  if (!localStorage.getItem('price_banana')) localStorage.setItem('price_banana', '8.00');
  if (!localStorage.getItem('price_bagel')) localStorage.setItem('price_bagel', '9.50');
  if (!localStorage.getItem('price_plain')) localStorage.setItem('price_plain', '6.00');
  if (!localStorage.getItem('price_bbq')) localStorage.setItem('price_bbq', '10.00');

  applyStoredConfigs();
  startLiveClock();
  recalculateRollingCalendar();
};

function applyStoredConfigs() {
  const name = localStorage.getItem('storeName');
  document.getElementById('store-title-display').innerText = name;
  document.getElementById('tab-title').innerText = name;
  document.getElementById('admin-store-name').value = name;
  document.getElementById('admin-cashtag').value = localStorage.getItem('cashTag');

  document.getElementById('price-banana-display').innerText = localStorage.getItem('price_banana');
  document.getElementById('price-bagel-display').innerText = localStorage.getItem('price_bagel');
  document.getElementById('price-plain-display').innerText = localStorage.getItem('price_plain');
  document.getElementById('price-bbq-display').innerText = localStorage.getItem('price_bbq');

  document.getElementById('p-banana-in').value = localStorage.getItem('price_banana');
  document.getElementById('p-bagel-in').value = localStorage.getItem('price_bagel');
  document.getElementById('p-plain-in').value = localStorage.getItem('price_plain');
  document.getElementById('p-bbq-in').value = localStorage.getItem('price_bbq');
}

function startLiveClock() {
  setInterval(() => {
    const now = new Date();
    document.getElementById('live-clock').innerText = now.toLocaleString();
  }, 1000);
}

function recalculateRollingCalendar() {
  const selectEl = document.getElementById('pickup-date');
  const manifestSelect = document.getElementById('manifest-date-select');
  if (!selectEl || !manifestSelect) return;

  selectEl.innerHTML = '';
  manifestSelect.innerHTML = '';

  const skipDays = JSON.parse(localStorage.getItem('skipDays'));
  let validDatesCount = 0;
  let daysOffset = 0;

  while (validDatesCount < 2 && daysOffset < 14) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysOffset);
    const dayOfWeek = targetDate.getDay();
    if (dayOfWeek === 6 || dayOfWeek === 0) {
      const dateString = targetDate.toISOString().split('T')[0];

      if (!skipDays.includes(dateString)) {
        const optionText = targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        selectEl.add(new Option(optionText, dateString));
        manifestSelect.add(new Option(optionText, dateString));
        validDatesCount++;
      }
    }
    daysOffset++;
  }
  checkCapacityAlert();
}

function addToCart(itemName, priceElementId) {
  const dynamicPrice = parseFloat(document.getElementById(priceElementId).innerText);
  currentCart = { name: itemName, price: dynamicPrice };

  document.getElementById('cart-empty-message').style.display = 'none';
  document.getElementById('cart-form-content').style.display = 'block';
  document.getElementById('tray-summary').innerText = `${itemName} — $${dynamicPrice.toFixed(2)}`;

  checkCapacityAlert();
  document.getElementById('cart-section').scrollIntoView({ behavior: 'smooth' });
}

function getOrderCountForDate(dateStr) {
  const orders = JSON.parse(localStorage.getItem('orders'));
  return orders.filter(o => o.date === dateStr).length;
}

function checkCapacityAlert() {
  const selectedDate = document.getElementById('pickup-date').value;
  if (!selectedDate) return;

  const totalBooked = getOrderCountForDate(selectedDate);
  const remaining = maxCapacityPerDay - totalBooked;
  const statusNotice = document.getElementById('capacity-notice');
  const submitBtn = document.getElementById('submit-order-btn');

  if (remaining <= 0) {
    statusNotice.innerHTML = `<span style="color:red;">SOLD OUT — Day limit reached (10/10). Choose another day.</span>`;
    submitBtn.disabled = true;
  } else {
    statusNotice.innerHTML = `<span style="color:green;">Slots Available: ${remaining} / ${maxCapacityPerDay} remaining for this date.</span>`;
    submitBtn.disabled = false;
  }
}

function processOrder(e) {
  e.preventDefault();
  if (!currentCart) return;

  const selectedDate = document.getElementById('pickup-date').value;
  if (getOrderCountForDate(selectedDate) >= maxCapacityPerDay) {
    alert("Sorry, this pickup slot filled up while you were ordering!");
    checkCapacityAlert();
    return;
  }

  const newOrder = {
    id: Date.now(),
    date: selectedDate,
    item: currentCart.name,
    price: currentCart.price,
    customerName: document.getElementById('cust-name').value,
    phone: document.getElementById('cust-phone').value,
    email: document.getElementById('cust-email').value
  };

  const allOrders = JSON.parse(localStorage.getItem('orders'));
  allOrders.push(newOrder);
  localStorage.setItem('orders', JSON.stringify(allOrders));

  const tag = localStorage.getItem('cashTag');
  document.getElementById('modal-total-display').innerText = `$${currentCart.price.toFixed(2)}`;
  document.getElementById('cashapp-link').href = `https://cash.app/$${tag}/${currentCart.price.toFixed(2)}`;
  document.getElementById('payment-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('payment-modal').style.display = 'none';
  document.getElementById('order-form').reset();
  document.getElementById('cart-form-content').style.display = 'none';
  document.getElementById('cart-empty-message').style.display = 'block';
  currentCart = null;
  recalculateRollingCalendar();
}

function verifyAdminLogin() {
  const input = document.getElementById('admin-pass-input').value;
  if (input === '123haeden123') {
    document.getElementById('admin-dashboard-content').style.display = 'block';
    document.getElementById('admin-login-box').style.display = 'none';
    renderSkipDaysLists();
  } else {
    alert("Incorrect Admin Password.");
  }
}

function saveStoreSettings() {
  localStorage.setItem('storeName', document.getElementById('admin-store-name').value);
  localStorage.setItem('cashTag', document.getElementById('admin-cashtag').value);
  applyStoredConfigs();
  alert("Identity and CashApp settings refreshed successfully!");
}

function saveAdminPrices() {
  localStorage.setItem('price_banana', parseFloat(document.getElementById('p-banana-in').value).toFixed(2));
  localStorage.setItem('price_bagel', parseFloat(document.getElementById('p-bagel-in').value).toFixed(2));
  localStorage.setItem('price_plain', parseFloat(document.getElementById('p-plain-in').value).toFixed(2));
  localStorage.setItem('price_bbq', parseFloat(document.getElementById('p-bbq-in').value).toFixed(2));
  applyStoredConfigs();
  alert("Menu matrix pricing synchronized!");
}

function addSkipDay() {
  const dateVal = document.getElementById('skip-date-input').value;
  if (!dateVal) return;

  let skipDays = JSON.parse(localStorage.getItem('skipDays'));
  if (!skipDays.includes(dateVal)) {
    skipDays.push(dateVal);
    localStorage.setItem('skipDays', JSON.stringify(skipDays));
    renderSkipDaysLists();
    recalculateRollingCalendar();
  }
}

function removeSkipDay(dateVal) {
  let skipDays = JSON.parse(localStorage.getItem('skipDays'));
  skipDays = skipDays.filter(d => d !== dateVal);
  localStorage.setItem('skipDays', JSON.stringify(skipDays));
  renderSkipDaysLists();
  recalculateRollingCalendar();
}

function renderSkipDaysLists() {
  const listEl = document.getElementById('skip-days-list');
  listEl.innerHTML = '';

  const skipDays = JSON.parse(localStorage.getItem('skipDays'));
  skipDays.forEach(d => {
    listEl.innerHTML += `<li>${d} <button style="color:red; background:none; border:none; cursor:pointer;" onclick="removeSkipDay('${d}')">[Remove]</button></li>`;
  });
}

function renderCustomerManifest() {
  const targetDate = document.getElementById('manifest-date-select').value;
  const orders = JSON.parse(localStorage.getItem('orders'));
  const matches = orders.filter(o => o.date === targetDate);
  const wrapper = document.getElementById('manifest-table-wrapper');

  if (matches.length === 0) {
    wrapper.innerHTML = `<p style="margin-top:15px; font-weight:bold;">No current orders logged for ${targetDate}.</p>`;
    return;
  }

  let html = `<table class="manifest-table"><thead><tr><th>Customer Name</th><th>Phone</th><th>Email</th><th>Item</th><th>Price</th></tr></thead><tbody>`;

  matches.forEach(m => {
    html += `<tr><td>${m.customerName}</td><td>${m.phone}</td><td>${m.email}</td><td>${m.item}</td><td>$${m.price.toFixed(2)}</td></tr>`;
  });

  html += `</tbody></table>`;
  wrapper.innerHTML = html;
}

function clearSystemOrders() {
  if (confirm("Are you absolutely sure you want to purge all customer orders permanently? This reset cannot be undone.")) {
    localStorage.setItem('orders', JSON.stringify([]));
    renderCustomerManifest();
    recalculateRollingCalendar();
    alert("Order logs have been cleared.");
  }
}
