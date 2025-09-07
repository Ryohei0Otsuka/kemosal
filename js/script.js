'use strict';

const defaultItems = [
    { name: 'ドリンク', price: 1200, count: 0 },
    { name: 'チェキ', price: 1500, count: 0 },
    { name: '宿チェキ', price: 2000, count: 0 },
    { name: 'フード', price: 2200, count: 0 }
];

const $ = id => document.getElementById(id);

let items = [], summaryWrap = $('summary');

function renderItems() {
    const tbody = $('itemsTable').querySelector('tbody');
    tbody.innerHTML = '';
    items.forEach((item, idx) => {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.textContent = item.name;
        tdName.setAttribute('data-label', '名前');

        const tdPrice = document.createElement('td');
        tdPrice.textContent = item.price;
        tdPrice.setAttribute('data-label', '単価');

        const tdCount = document.createElement('td');
        tdCount.innerHTML = `<input type="number" value="${item.count}" min="0" style="width:60px">`;
        tdCount.setAttribute('data-label', '個数');
        tdCount.querySelector('input').addEventListener('input', e => { items[idx].count = +e.target.value; });

        const tdBack = document.createElement('td');
        tdBack.textContent = item.price * item.count;
        tdBack.setAttribute('data-label', 'バック額');

        const tdDel = document.createElement('td');
        tdDel.innerHTML = '<button class="ghost">削除</button>';
        tdDel.setAttribute('data-label', '');
        tdDel.querySelector('button').addEventListener('click', () => { items.splice(idx, 1); renderItems(); });

        tr.append(tdName, tdPrice, tdCount, tdBack, tdDel);
        tbody.appendChild(tr);
    });
}

function calculate() {
    const wage = +$('wage').value, hours = +$('hours').value;
    const totalBase = wage * hours;
    let totalBack = items.reduce((a, i) => a + i.price * i.count, 0);
    let totalSales = totalBase + totalBack;

    let backRate = totalBack / totalSales;
    let recoveryRate = totalSales / totalBase;

    summaryWrap.innerHTML = '';
    const createPill = (label, big) => {
        const div = document.createElement('div');
        div.className = 'pill';
        div.innerHTML = `<div class="big">${big}</div><div class="small">${label}</div>`;
        return div;
    }

    summaryWrap.appendChild(createPill('時給ベース', totalBase.toLocaleString() + ' 円'));
    summaryWrap.appendChild(createPill('バック合計', totalBack.toLocaleString() + ' 円'));
    summaryWrap.appendChild(createPill('バック率', (backRate * 100).toFixed(1) + ' %'));
    summaryWrap.appendChild(createPill('回収率', recoveryRate.toFixed(2) + ' 倍'));
    summaryWrap.appendChild(createPill('合計（概算）', totalSales.toLocaleString() + ' 円'));
}

function addItem() {
    items.push({ name: '新規項目', price: 0, count: 0 });
    renderItems();
}

function resetItems() {
    items = [...defaultItems];
    renderItems();
}

function saveHistory() {
    const data = { wage: $('wage').value, hours: $('hours').value, items: JSON.parse(JSON.stringify(items)) };
    let history = JSON.parse(localStorage.getItem('kemosalHistory') || '[]');
    history.unshift(data); localStorage.setItem('kemosalHistory', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const list = $('historyList'); list.innerHTML = '';
    let history = JSON.parse(localStorage.getItem('kemosalHistory') || '[]');
    if (history.length === 0) { list.textContent = '保存された履歴はまだありません。'; return; }
    history.forEach((h, idx) => {
        const div = document.createElement('div');
        div.className = 'pill';
        div.textContent = `${idx + 1}. 時給:${h.wage}, 労働時間:${h.hours}, バック項目:${h.items.map(i => i.name + 'x' + i.count).join(',')}`;
        list.appendChild(div);
    });
}

function clearHistory() { localStorage.removeItem('kemosalHistory'); renderHistory(); }

window.addEventListener('load', () => {
    resetItems();
    $('calc').addEventListener('click', calculate);
    $('addItem').addEventListener('click', addItem);
    $('resetItems').addEventListener('click', resetItems);
    $('save').addEventListener('click', saveHistory);
    $('clearStore').addEventListener('click', clearHistory);
    renderHistory();
});
