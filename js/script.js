"use strict";

const $ = (id) => document.getElementById(id);
let items = [];

const defaultItems = [
    { name: "ドリンク", price: 1200, count: 0 },
    { name: "チェキ", price: 1500, count: 0 },
    { name: "宿チェキ", price: 2000, count: 0 },
    { name: "フード", price: 2200, count: 0 },
];

function renderItems() {
    const tbody = $("itemsTable").querySelector("tbody");
    tbody.innerHTML = "";

    items.forEach((item, idx) => {
        const tr = document.createElement("tr");

        // 名前
        const tdName = document.createElement("td");
        const inputName = document.createElement("input");
        inputName.type = "text";
        inputName.placeholder = "項目名";
        inputName.value = item.name;
        inputName.addEventListener("input", (e) => {
            items[idx].name = e.target.value;
        });
        tdName.appendChild(inputName);

        // 単価
        const tdPrice = document.createElement("td");
        const inputPrice = document.createElement("input");
        inputPrice.type = "number";
        inputPrice.min = 0;
        inputPrice.value = item.price;
        inputPrice.addEventListener("input", (e) => {
            items[idx].price = +e.target.value;
            updateRowTotal(idx);
        });
        tdPrice.appendChild(inputPrice);

        // 個数
        const tdCount = document.createElement("td");
        const inputCount = document.createElement("input");
        inputCount.type = "number";
        inputCount.min = 0;
        inputCount.value = item.count;
        inputCount.addEventListener("input", (e) => {
            items[idx].count = +e.target.value;
            updateRowTotal(idx);
        });
        tdCount.appendChild(inputCount);

        // 売上
        const tdTotal = document.createElement("td");
        tdTotal.textContent = item.price * item.count;

        // 削除
        const tdDel = document.createElement("td");
        const btnDel = document.createElement("button");
        btnDel.className = "ghost";
        btnDel.textContent = "削除";
        btnDel.addEventListener("click", () => {
            items.splice(idx, 1);
            tbody.removeChild(tr);
            calculate();
        });
        tdDel.appendChild(btnDel);

        tr.append(tdName, tdPrice, tdCount, tdTotal, tdDel);
        tbody.appendChild(tr);
    });

    calculate();
}

function updateRowTotal(idx) {
    const tbody = $("itemsTable").querySelector("tbody");
    if (tbody.rows[idx]) {
        tbody.rows[idx].cells[3].textContent = items[idx].price * items[idx].count;
        calculate();
    }
}

function getBackRate(recoveryPercent) {
    if (recoveryPercent <= 100) return 0.1;
    if (recoveryPercent <= 150) return 0.15;
    if (recoveryPercent <= 250) return 0.2;
    if (recoveryPercent <= 400) return 0.3;
    if (recoveryPercent <= 1000) return 0.35;
    if (recoveryPercent <= 2000) return 0.5;
    return 0.6;
}

function calculate() {
    const wage = +$("wage").value;
    const hours = +$("hours").value;
    const base = wage * hours;
    const totalSales = items.reduce((sum, i) => sum + i.price * i.count, 0);
    const recoveryPercent = (totalSales / base) * 100;
    const backRate = getBackRate(recoveryPercent);
    const backAmount = Math.floor(totalSales * backRate);
    const totalPayment = base + backAmount;

    const summaryWrap = $("summary");
    summaryWrap.innerHTML = "";
    const createPill = (label, big) => {
        const div = document.createElement("div");
        div.className = "pill";
        div.innerHTML = `<div class="big">${big}</div><div class="small">${label}</div>`;
        return div;
    };

    summaryWrap.appendChild(createPill("時給ベース", base.toLocaleString() + " 円"));
    summaryWrap.appendChild(createPill("売上合計", totalSales.toLocaleString() + " 円"));
    summaryWrap.appendChild(createPill("回収率", recoveryPercent.toFixed(1) + " %"));
    summaryWrap.appendChild(createPill("適用バック率", (backRate * 100).toFixed(1) + " %"));
    summaryWrap.appendChild(createPill("バック額", backAmount.toLocaleString() + " 円"));
    summaryWrap.appendChild(createPill("合計（概算）", totalPayment.toLocaleString() + " 円"));
}

// 行操作
function addItem() {
    items.push({ name: "", price: 0, count: 0 });
    renderItems();
}

function resetItems() {
    items = JSON.parse(JSON.stringify(defaultItems));
    renderItems();
}

// 初期化
window.addEventListener("load", () => {
    resetItems();
    $("calc").addEventListener("click", calculate);
    $("addItem").addEventListener("click", addItem);
    $("resetItems").addEventListener("click", resetItems);
    $("wage").addEventListener("input", calculate);
    $("hours").addEventListener("input", calculate);
});
