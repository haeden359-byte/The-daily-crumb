let currentCart = null;
const maxCapacityPerDay = 10; 

window.onload = function() {
if(!localStorage.getItem('storeName')) localStorage.setItem('storeName', 'BREAD STORE');
if(!localStorage.getItem('cashTag')) localStorage.setItem('cashTag', 'YourCashTag');
if(!localStorage.getItem('skipDays')) localStorage.setItem('skipDays', JSON.stringify([]));
if(!localStorage.getItem('orders')) localStorage.setItem('orders', JSON.stringify([])); 

if(!localStorage.getItem('price_banana')) localStorage.setItem('price_banana', '8.00');
if(!localStorage.getItem('price_bagel')) localStorage.setItem('price_bagel', '9.50');
if(!localStorage.getItem('price_plain')) localStorage.setItem('price_plain', '6.00');
if(!localStorage.getItem('price_bbq')) localStorage.setItem('price_bbq', '10.00');

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
if(!selectEl || !manifestSelect) return; 

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
document.getElementById('tray-summary').innerText = ${itemName} — $${dynamicPrice.toFixed(2)};

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
statusNotice.innerHTML = `<span style="color:red;">SOLD OUT — Day limit reached (10/10). Choose another day.
