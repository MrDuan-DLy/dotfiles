// ==UserScript==
// @name         Claude Chat Exporter
// @namespace    https://shalud.me/
// @version      2.0
// @description  一键导出 Claude.ai 对话内容，正确还原 LaTeX 公式
// @author       Sean
// @match        https://claude.ai/*
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  'use strict';

  // ════════════════════════════════════════
  //  核心：将 DOM 节点递归转为纯文本/Markdown
  //  遇到 KaTeX 节点时从 annotation 还原 LaTeX
  // ════════════════════════════════════════

  function nodeToText(node) {
    // ── 文本节点 ──
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node;
    const tag = el.tagName.toLowerCase();
    const cls = el.classList;

    // ── 块级 LaTeX（katex-display） ──
    if (cls.contains('katex-display')) {
      const tex = getTexFromKatex(el);
      return tex ? `\n\n$$${tex}$$\n\n` : '';
    }

    // ── 内联 LaTeX（katex，但不在 katex-display 内） ──
    if (cls.contains('katex') && !el.closest('.katex-display')) {
      const tex = getTexFromKatex(el);
      return tex ? `$${tex}$` : '';
    }

    // ── 跳过 KaTeX 内部渲染节点（已由上层处理） ──
    if (cls.contains('katex-mathml') || cls.contains('katex-html')) {
      return '';
    }

    // ── 代码块 ──
    if (tag === 'pre') {
      const codeEl = el.querySelector('code');
      const langCls = codeEl
        ? Array.from(codeEl.classList).find(c => c.startsWith('language-'))
        : null;
      const lang = langCls ? langCls.replace('language-', '') : '';
      const code = el.innerText.trim();
      return `\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
    }

    // ── 行内代码 ──
    if (tag === 'code' && el.closest('pre') === null) {
      return '`' + el.textContent + '`';
    }

    // ── 标题 ──
    if (/^h[1-6]$/.test(tag)) {
      const level = parseInt(tag[1]);
      const inner = childrenToText(el);
      return `\n\n${'#'.repeat(level)} ${inner.trim()}\n\n`;
    }

    // ── 段落 ──
    if (tag === 'p') {
      const inner = childrenToText(el);
      return `\n\n${inner.trim()}\n\n`;
    }

    // ── 无序列表 ──
    if (tag === 'ul') {
      const items = el.querySelectorAll(':scope > li');
      const lines = Array.from(items).map(li => `- ${childrenToText(li).trim()}`);
      return '\n\n' + lines.join('\n') + '\n\n';
    }

    // ── 有序列表 ──
    if (tag === 'ol') {
      const items = el.querySelectorAll(':scope > li');
      const lines = Array.from(items).map((li, i) => `${i + 1}. ${childrenToText(li).trim()}`);
      return '\n\n' + lines.join('\n') + '\n\n';
    }

    // ── 粗体 ──
    if (tag === 'strong' || tag === 'b') {
      const inner = childrenToText(el);
      return `**${inner.trim()}**`;
    }

    // ── 斜体 ──
    if (tag === 'em' || tag === 'i') {
      const inner = childrenToText(el);
      return `*${inner.trim()}*`;
    }

    // ── 链接 ──
    if (tag === 'a') {
      const inner = childrenToText(el);
      const href = el.getAttribute('href') || '';
      return `[${inner.trim()}](${href})`;
    }

    // ── 换行 ──
    if (tag === 'br') return '\n';

    // ── 表格 ──
    if (tag === 'table') {
      return '\n\n' + extractTable(el) + '\n\n';
    }

    // ── 包含表格的 div ──
    if (tag === 'div' && el.querySelector(':scope > table')) {
      const table = el.querySelector(':scope > table');
      return '\n\n' + extractTable(table) + '\n\n';
    }

    // ── 引用 ──
    if (tag === 'blockquote') {
      const inner = childrenToText(el).trim();
      return '\n\n' + inner.split('\n').map(l => `> ${l}`).join('\n') + '\n\n';
    }

    // ── 默认：递归子节点 ──
    return childrenToText(el);
  }

  function childrenToText(el) {
    let result = '';
    for (const child of el.childNodes) {
      result += nodeToText(child);
    }
    return result;
  }

  // ── 从 KaTeX 节点提取原始 TeX 源码 ──
  function getTexFromKatex(el) {
    const annotation = el.querySelector('annotation[encoding="application/x-tex"]');
    if (annotation) {
      return annotation.textContent.trim();
    }
    return el.getAttribute('aria-label') || '';
  }

  // ── 表格提取（支持 Markdown 格式） ──
  function extractTable(table) {
    const rows = table.querySelectorAll('tr');
    if (!rows.length) return '';

    const result = [];
    let isFirst = true;

    for (const row of rows) {
      const cells = row.querySelectorAll('th, td');
      const cellTexts = Array.from(cells).map(c => childrenToText(c).trim());
      result.push('| ' + cellTexts.join(' | ') + ' |');

      if (isFirst && row.querySelector('th')) {
        result.push('| ' + cellTexts.map(() => '---').join(' | ') + ' |');
        isFirst = false;
      }
    }

    return result.join('\n');
  }

  // ════════════════════════════════════════
  //  提取整个对话
  // ════════════════════════════════════════

  function extractConversation() {
    const lines = [];
    const messageBlocks = document.querySelectorAll('[data-test-render-count]');

    for (const block of messageBlocks) {
      // ── 用户消息 ──
      const userMsg = block.querySelector('[data-testid="user-message"]');
      if (userMsg) {
        const text = childrenToText(userMsg).trim();
        if (!text) continue;

        const images = block.querySelectorAll('img[alt]');
        const imgNotes = [];
        for (const img of images) {
          const alt = img.getAttribute('alt');
          if (alt && alt.includes('image')) {
            imgNotes.push(`[图片: ${alt}]`);
          }
        }
        const prefix = imgNotes.length ? imgNotes.join(' ') + '\n' : '';
        lines.push(`user: ${prefix}${text}`);
        continue;
      }

      // ── Claude 回复 ──
      const claudeResponse = block.querySelector('.standard-markdown, .progressive-markdown');
      if (claudeResponse) {
        const text = nodeToText(claudeResponse);
        const cleaned = cleanOutput(text);
        if (cleaned) {
          lines.push(`claude: ${cleaned}`);
        }
        continue;
      }
    }

    return lines.join('\n\n---\n\n');
  }

  // ── 清理多余空行 ──
  function cleanOutput(text) {
    return text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .replace(/[ \t]+$/gm, '');
  }

  // ════════════════════════════════════════
  //  导出功能
  // ════════════════════════════════════════

  function exportAsFile() {
    const content = extractConversation();
    if (!content) return alert('未找到对话内容！');

    const titleEl = document.querySelector('title');
    const title = titleEl?.textContent?.replace(' - Claude', '').trim() || 'claude-chat';
    const safeName = title.replace(/[/\\?%*:|"<>]/g, '_').substring(0, 80);
    const timestamp = new Date().toISOString().slice(0, 10);

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}_${timestamp}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyToClipboard() {
    const content = extractConversation();
    if (!content) return alert('未找到对话内容！');

    if (typeof GM_setClipboard === 'function') {
      GM_setClipboard(content, 'text');
    } else {
      navigator.clipboard.writeText(content).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = content;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      });
    }
    showToast('对话已复制到剪贴板！');
  }

  // ════════════════════════════════════════
  //  UI
  // ════════════════════════════════════════

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: '#1a1a2e',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      zIndex: '99999',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      transition: 'opacity 0.3s',
    });
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('📋 复制对话', copyToClipboard);
    GM_registerMenuCommand('💾 导出对话为 TXT', exportAsFile);
  }

  function addFloatingButton() {
    const btn = document.createElement('div');
    btn.innerHTML = '📋';
    btn.title = '左键 = 复制对话 | 右键 = 下载 TXT';
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '80px',
      right: '20px',
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      background: '#1a1a2e',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      cursor: 'pointer',
      zIndex: '99999',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      transition: 'transform 0.2s, opacity 0.2s',
      opacity: '0.7',
      userSelect: 'none',
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.opacity = '1';
      btn.style.transform = 'scale(1.1)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.opacity = '0.7';
      btn.style.transform = 'scale(1)';
    });

    btn.addEventListener('click', (e) => { e.preventDefault(); copyToClipboard(); });
    btn.addEventListener('contextmenu', (e) => { e.preventDefault(); exportAsFile(); });

    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addFloatingButton);
  } else {
    setTimeout(addFloatingButton, 1500);
  }
})();
