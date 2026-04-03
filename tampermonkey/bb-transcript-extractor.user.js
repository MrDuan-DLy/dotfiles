// ==UserScript==
// @name         自动提取字幕工具
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  点击按钮提取 .event-text 内容
// @author       You
// @match        *://*/*
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // 等待 body 加载完成
  function init() {
    if (!document.body) {
      setTimeout(init, 100);
      return;
    }

    // 防止重复创建
    if (document.getElementById('subtitle-extract-btn')) return;

    let btn = document.createElement("button");
    btn.id = 'subtitle-extract-btn';
    btn.innerHTML = "📋 提取字幕";

    // 使用 cssText 一次性设置，避免被覆盖
    btn.style.cssText = `
            position: fixed !important;
            bottom: 20px !important;
            left: 20px !important;
            z-index: 2147483647 !important;
            padding: 12px 16px !important;
            background: #28a745 !important;
            color: white !important;
            border: 2px solid #1e7e34 !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            font-weight: bold !important;
            font-size: 14px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            font-family: system-ui, sans-serif !important;
            opacity: 1 !important;
            visibility: visible !important;
            display: block !important;
        `;

    document.body.appendChild(btn);

    btn.onclick = function () {
      let texts = [];
      document.querySelectorAll('.event-text').forEach(element => {
        const text = element.textContent.trim();
        if (text) {
          texts.push(text);
        }
      });

      if (texts.length === 0) {
        btn.innerHTML = "⚠️ 未找到字幕";
        btn.style.background = "#dc3545";
      } else {
        const finalStr = texts.join('\n\n');
        console.log(finalStr);
        GM_setClipboard(finalStr);
        btn.innerHTML = `✅ 已复制 ${texts.length} 条`;
        btn.style.background = "#17a2b8";
      }

      setTimeout(() => {
        btn.innerHTML = "📋 提取字幕";
        btn.style.background = "#28a745";
      }, 2000);
    };

    console.log('[字幕提取] 按钮已创建');
  }

  init();
})();
