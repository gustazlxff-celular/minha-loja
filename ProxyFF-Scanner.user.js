// ==UserScript==
// @name         ProxyFF - Deep Server & Network Scan
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  Intercepta dados da rede e vasculha o código fonte do servidor
// @author       Gemini
// @match        *://authproxyff.up.railway.app/*
// @grant        none
// @downloadURL https://update.greasyfork.org/scripts/575532/ProxyFF%20-%20Deep%20Server%20%20Network%20Scan.user.js
// @updateURL https://update.greasyfork.org/scripts/575532/ProxyFF%20-%20Deep%20Server%20%20Network%20Scan.meta.js
// ==/UserScript==

(function() {
    'use strict';

    const SENHA = "RUAN";
    const keysEncontradas = new Set();
    const regexKey = /proxyff-[\w-]+/gi;

    // --- INTERCEPTOR DE REDE (Pega chaves que o site recebe do servidor) ---
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        const clone = response.clone();
        clone.text().then(text => {
            const matches = text.match(regexKey);
            if (matches) matches.forEach(k => keysEncontradas.add(k));
        });
        return response;
    };

    const originalXHR = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function() {
        this.addEventListener('load', function() {
            const matches = this.responseText.match(regexKey);
            if (matches) matches.forEach(k => keysEncontradas.add(k));
        });
        originalXHR.apply(this, arguments);
    };

    // --- INTERFACE ---
    const panel = document.createElement('div');
    panel.style = "position: fixed; bottom: 10px; left: 10px; z-index: 99999; background: #111; color: #00ff00; padding: 12px; border: 1px solid #333; font-family: monospace; width: 240px; border-radius: 8px; box-shadow: 0 0 20px #000;";
    panel.innerHTML = `
        <div style="color:yellow; font-weight:bold; margin-bottom:10px; text-align:center;">SERVER SCANNER v6</div>
        <button id="deepScan" style="width:100%; background:#222; color:cyan; border:1px solid cyan; padding:8px; cursor:pointer; margin-bottom:5px;">VARREDURA DE SISTEMA</button>
        <div id="results" style="max-height:200px; overflow-y:auto; font-size:11px;"></div>
    `;
    document.body.appendChild(panel);

    // --- FUNÇÃO DE SENHA (RUAN) ---
    function injetarSenha() {
        document.querySelectorAll('input').forEach(i => {
            if (i.type === 'password' || i.name.includes('key') || i.id.includes('auth')) {
                i.value = SENHA;
            }
        });
    }

    // --- VARREDURA PROFUNDA (Arquivos e Código-Fonte) ---
    async function varrerServidor() {
        const resDiv = document.getElementById('results');
        resDiv.innerHTML = "Varrendo arquivos do site...";

        // 1. Procurar no HTML Bruto
        const html = document.documentElement.innerHTML;
        (html.match(regexKey) || []).forEach(k => keysEncontradas.add(k));

        // 2. Procurar em arquivos de Script (.js) que rodam no site
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        for (const s of scripts) {
            try {
                const r = await fetch(s.src);
                const t = await r.text();
                (t.match(regexKey) || []).forEach(k => keysEncontradas.add(k));
            } catch(e) {}
        }

        // 3. Renderizar resultados
        resDiv.innerHTML = "";
        if (keysEncontradas.size > 0) {
            keysEncontradas.forEach(k => {
                const item = document.createElement('div');
                item.style = "background:#222; padding:5px; margin-top:5px; border-left:2px solid #00ff00;";
                item.innerHTML = `${k} <br><button onclick="navigator.clipboard.writeText('${k}')" style="background:green; color:white; border:none; width:100%; margin-top:3px;">COPIAR</button>`;
                resDiv.appendChild(item);
            });
        } else {
            resDiv.innerHTML = "Nenhuma key encontrada nos arquivos.";
        }
    }

    document.getElementById('deepScan').onclick = varrerServidor;
    setInterval(injetarSenha, 1500); // Tenta colocar a senha a cada 1.5s

})();