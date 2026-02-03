let exchangeRates = {};
let currencyList = [];
let fromCurrency = 'IDR';
let toCurrency = 'USD';
let currentPickerTarget = null;

const currencyNames = {
    IDR: 'Indonesian Rupiah', USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound',
    JPY: 'Japanese Yen', AUD: 'Australian Dollar', CAD: 'Canadian Dollar',
    CHF: 'Swiss Franc', CNY: 'Chinese Yuan', HKD: 'Hong Kong Dollar',
    SGD: 'Singapore Dollar', MYR: 'Malaysian Ringgit', THB: 'Thai Baht',
    KRW: 'South Korean Won', INR: 'Indian Rupee', PHP: 'Philippine Peso',
    VND: 'Vietnamese Dong', TWD: 'Taiwan Dollar', NZD: 'New Zealand Dollar',
    SAR: 'Saudi Riyal', AED: 'UAE Dirham', BRL: 'Brazilian Real',
    MXN: 'Mexican Peso', ZAR: 'South African Rand', RUB: 'Russian Ruble',
    TRY: 'Turkish Lira', SEK: 'Swedish Krona', NOK: 'Norwegian Krone',
    DKK: 'Danish Krone', PLN: 'Polish Zloty', CZK: 'Czech Koruna',
    HUF: 'Hungarian Forint', ILS: 'Israeli Shekel', CLP: 'Chilean Peso',
    ARS: 'Argentine Peso', COP: 'Colombian Peso', PEN: 'Peruvian Sol',
    EGP: 'Egyptian Pound', PKR: 'Pakistani Rupee', BDT: 'Bangladeshi Taka',
    NGN: 'Nigerian Naira', KES: 'Kenyan Shilling', GHS: 'Ghanaian Cedi',
    MAD: 'Moroccan Dirham', QAR: 'Qatari Riyal', KWD: 'Kuwaiti Dinar',
    BHD: 'Bahraini Dinar', OMR: 'Omani Rial', JOD: 'Jordanian Dinar',
    LKR: 'Sri Lankan Rupee', MMK: 'Myanmar Kyat', NPR: 'Nepalese Rupee'
};

const $ = id => document.getElementById(id);

const fromAmountInput = $('fromAmount');
const toAmountInput = $('toAmount');
const fromCurrencyBtn = $('fromCurrencyBtn');
const toCurrencyBtn = $('toCurrencyBtn');
const fromCurrencyCode = $('fromCurrencyCode');
const fromCurrencyName = $('fromCurrencyName');
const toCurrencyCode = $('toCurrencyCode');
const toCurrencyName = $('toCurrencyName');
const swapBtn = $('swapBtn');
const rateText = $('rateText');
const status = $('status');
const currencyModal = $('currencyModal');
const currencySearch = $('currencySearch');
const currencyListEl = $('currencyList');
const modalClose = $('modalClose');
const modalTitle = $('modalTitle');

async function fetchExchangeRates() {
    if (!CONFIG || !CONFIG.API_KEY) {
        showStatus('API key belum dikonfigurasi', 'warning');
        return false;
    }

    try {
        showStatus('Memuat kurs...', 'warning');
        const response = await fetch(`${CONFIG.API_BASE_URL}/${CONFIG.API_KEY}/latest/${CONFIG.BASE_CURRENCY}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (data.result === 'success') {
            exchangeRates = data.conversion_rates;
            currencyList = Object.keys(exchangeRates).sort();
            showStatus('Kurs berhasil dimuat', 'success');
            setTimeout(hideStatus, 3000);
            return true;
        }
        throw new Error(data['error-type']);
    } catch (error) {
        console.error('API Error:', error);
        showStatus('Gagal memuat kurs dari API', 'error');
        return false;
    }
}

function convert() {
    const amount = parseFloat(fromAmountInput.value.replace(/[^0-9.,-]/g, '').replace(/,/g, '')) || 0;
    
    if (amount <= 0 || !exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
        toAmountInput.value = '-';
        return;
    }
    
    const result = (amount / exchangeRates[fromCurrency]) * exchangeRates[toCurrency];
    toAmountInput.value = formatNumber(result);
    updateRateDisplay();
}

function formatNumber(num) {
    const opts = num >= 1000 ? { maximumFractionDigits: 2 } 
               : num >= 1 ? { minimumFractionDigits: 2, maximumFractionDigits: 4 }
               : { minimumFractionDigits: 2, maximumFractionDigits: 6 };
    return num.toLocaleString('en-US', opts);
}

function updateRateDisplay() {
    if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
        rateText.textContent = 'Memuat...';
        return;
    }
    const rate = exchangeRates[toCurrency] / exchangeRates[fromCurrency];
    rateText.textContent = `1 ${fromCurrency} = ${formatNumber(rate)} ${toCurrency}`;
}

function swapCurrencies() {
    [fromCurrency, toCurrency] = [toCurrency, fromCurrency];
    updateCurrencyDisplay();
    convert();
}

function updateCurrencyDisplay() {
    fromCurrencyCode.textContent = fromCurrency;
    fromCurrencyName.textContent = currencyNames[fromCurrency] || fromCurrency;
    toCurrencyCode.textContent = toCurrency;
    toCurrencyName.textContent = currencyNames[toCurrency] || toCurrency;
}

function openCurrencyPicker(target) {
    currentPickerTarget = target;
    modalTitle.textContent = target === 'from' ? 'Pilih Mata Uang Asal' : 'Pilih Mata Uang Tujuan';
    currencySearch.value = '';
    renderCurrencyList('');
    currencyModal.classList.add('active');
    currencySearch.focus();
}

function closeCurrencyPicker() {
    currencyModal.classList.remove('active');
    currentPickerTarget = null;
}

function renderCurrencyList(filter) {
    const filterLower = filter.toLowerCase();
    const selected = currentPickerTarget === 'from' ? fromCurrency : toCurrency;
    
    const filtered = currencyList.filter(code => {
        const name = currencyNames[code] || code;
        return code.toLowerCase().includes(filterLower) || name.toLowerCase().includes(filterLower);
    });
    
    currencyListEl.innerHTML = filtered.map(code => `
        <div class="currency-item ${code === selected ? 'selected' : ''}" data-code="${code}">
            <span class="currency-item-code">${code}</span>
            <span class="currency-item-name">${currencyNames[code] || code}</span>
        </div>
    `).join('');
}

function selectCurrency(code) {
    if (currentPickerTarget === 'from') fromCurrency = code;
    else toCurrency = code;
    updateCurrencyDisplay();
    closeCurrencyPicker();
    convert();
}

function showStatus(message, type) {
    status.textContent = message;
    status.className = `status show ${type}`;
}

function hideStatus() {
    status.classList.remove('show');
}

function formatInputValue(input) {
    let value = input.value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
    if (parts[0]) parts[0] = parseInt(parts[0], 10).toLocaleString('en-US');
    input.value = parts.join('.');
}

fromAmountInput.addEventListener('input', () => { formatInputValue(fromAmountInput); convert(); });
fromCurrencyBtn.addEventListener('click', () => openCurrencyPicker('from'));
toCurrencyBtn.addEventListener('click', () => openCurrencyPicker('to'));
swapBtn.addEventListener('click', swapCurrencies);
modalClose.addEventListener('click', closeCurrencyPicker);
currencyModal.addEventListener('click', e => { if (e.target === currencyModal) closeCurrencyPicker(); });
currencySearch.addEventListener('input', e => renderCurrencyList(e.target.value));
currencyListEl.addEventListener('click', e => {
    const item = e.target.closest('.currency-item');
    if (item) selectCurrency(item.dataset.code);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCurrencyPicker(); });

document.addEventListener('DOMContentLoaded', async () => {
    updateCurrencyDisplay();
    if (await fetchExchangeRates()) {
        fromAmountInput.value = '1,000,000';
        convert();
    }
});
