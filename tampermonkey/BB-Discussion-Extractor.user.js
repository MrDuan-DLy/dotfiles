// ==UserScript==
// @name         BB Discussion Extractor
// @namespace    https://shalud.me/
// @version      1.0
// @description  Extract Blackboard Ultra discussion threads to Markdown
// @author       Sean
// @match        https://*.blackboard.com/*
// @match        https://*.blackboardcdn.com/*
// @match        https://learn.content.blackboardcdn.com/*
// @match        https://*.ole.bris.ac.uk/*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  // ── Styles ──────────────────────────────────────────────────────────────
  GM_addStyle(`
    #bb-extract-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      background: #2d2d2d;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px 18px;
      font-size: 14px;
      font-family: system-ui, -apple-system, sans-serif;
      cursor: pointer;
      box-shadow: 0 2px 12px rgba(0,0,0,.3);
      transition: all .2s;
    }
    #bb-extract-btn:hover { background: #444; transform: translateY(-1px); }
    #bb-extract-btn.success { background: #2e7d32; }
    #bb-extract-btn.success:hover { background: #388e3c; }

    #bb-extract-panel {
      position: fixed;
      bottom: 72px;
      right: 24px;
      z-index: 99999;
      background: #1e1e1e;
      color: #e0e0e0;
      border: 1px solid #444;
      border-radius: 12px;
      padding: 16px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      box-shadow: 0 4px 24px rgba(0,0,0,.4);
      display: none;
      width: 320px;
    }
    #bb-extract-panel.show { display: block; }
    #bb-extract-panel h3 { margin: 0 0 12px; font-size: 15px; color: #fff; }
    #bb-extract-panel .stats { margin-bottom: 12px; line-height: 1.6; }
    #bb-extract-panel .actions { display: flex; gap: 8px; }
    #bb-extract-panel button {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #555;
      border-radius: 6px;
      background: #333;
      color: #fff;
      cursor: pointer;
      font-size: 13px;
      transition: background .15s;
    }
    #bb-extract-panel button:hover { background: #4a4a4a; }
    #bb-extract-panel button.primary { background: #1976d2; border-color: #1976d2; }
    #bb-extract-panel button.primary:hover { background: #1565c0; }
  `);

  // ── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Extract text from a ql-editor element, preserving basic structure.
   */
  function extractEditorContent(editorEl) {
    if (!editorEl) return "";
    const lines = [];
    for (const child of editorEl.children) {
      const tag = child.tagName.toLowerCase();
      let text = child.textContent.trim();
      if (!text || text === "\n") {
        lines.push("");
        continue;
      }
      if (tag === "ol") {
        const items = child.querySelectorAll("li");
        items.forEach((li, i) => lines.push(`${i + 1}. ${li.textContent.trim()}`));
      } else if (tag === "ul") {
        const items = child.querySelectorAll("li");
        items.forEach((li) => lines.push(`- ${li.textContent.trim()}`));
      } else if (tag === "pre") {
        lines.push("```");
        lines.push(text);
        lines.push("```");
      } else {
        // Check for bold / strong
        if (child.querySelector("strong, b")) {
          text = `**${text}**`;
        }
        lines.push(text);
      }
    }
    // Trim trailing empty lines
    while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
    return lines.join("\n");
  }

  /**
   * Extract a single message block (comment or reply).
   */
  function extractMessage(messageEl) {
    // Username
    const usernameEl = messageEl.querySelector("bdi.username, .username bdi");
    const username = usernameEl ? usernameEl.textContent.trim() : "Unknown";

    // Timestamp
    const dateEl = messageEl.querySelector(".timestamp .date");
    const timeEl = messageEl.querySelector(".timestamp .time");
    const timestamp = [dateEl?.textContent?.trim(), timeEl?.textContent?.trim()]
      .filter(Boolean)
      .join(" ");

    // Instructor badge
    const chipEl = messageEl.querySelector('[class*="MuiChiplabel"]');
    const isInstructor = chipEl && chipEl.textContent.trim() === "INSTRUCTOR";

    // Content
    const editorEl = messageEl.querySelector(".ql-editor.bb-editor");
    const content = extractEditorContent(editorEl);

    return { username, timestamp, isInstructor, content };
  }

  /**
   * Recursively expand all collapsed replies until none remain.
   * After expanding one level, new "Show Replies" buttons may appear
   * for deeper nesting — keep going until stable.
   */
  async function expandAllReplies() {
    const MAX_ROUNDS = 10;
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const toggleBtns = document.querySelectorAll(
        'discussion-toggle-replies-button button[aria-pressed="false"]'
      );
      if (toggleBtns.length === 0) break;

      for (const btn of toggleBtns) {
        btn.click();
        await new Promise((r) => setTimeout(r, 400));
      }
      // Wait for DOM to update after this round
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  /**
   * Main extraction logic.
   */
  async function extractDiscussion() {
    await expandAllReplies();
    // Give DOM time to settle
    await new Promise((r) => setTimeout(r, 500));

    const result = {
      title: "",
      topicBody: "",
      topicAuthor: "",
      topicTimestamp: "",
      comments: [],
    };

    // ── Topic ───────────────────────────────────────────────────────────
    const titleEl = document.querySelector(".discussion-full-panel-detail-header");
    result.title = titleEl ? titleEl.textContent.trim() : "Discussion";

    const topicEntry = document.querySelector(".entry.original");
    if (topicEntry) {
      const msg = extractMessage(topicEntry);
      result.topicAuthor = msg.username;
      result.topicTimestamp = msg.timestamp;
      result.topicBody = msg.content;
    }

    // ── Comments ────────────────────────────────────────────────────────
    const commentWrappers = document.querySelectorAll(".comment-wrapper");
    for (const wrapper of commentWrappers) {
      // The top-level comment message
      const topCommentEl = wrapper.querySelector(".comment-level-0");
      if (!topCommentEl) continue;

      const topMsgEl = topCommentEl.querySelector(
        ":scope > .entry-wrapper .comment-entry > bb-message"
      );
      if (!topMsgEl) continue;

      const comment = extractMessage(topMsgEl);
      comment.replies = [];

      // Recursively gather all nested replies at any depth
      function collectReplies(parentEl) {
        // Look for reply containers: .replies > div > .content.reply > .entry
        const nestedComments = parentEl.querySelectorAll(
          ":scope > .replies .comment-and-reply, :scope > div.replies .comment-and-reply"
        );
        // Also try direct children comment-and-reply at any level
        const allNested = parentEl.querySelectorAll(
          ".comment-and-reply"
        );

        // Deduplicate: only pick those whose closest .comment-wrapper ancestor is `wrapper`
        const seen = new Set();
        for (const nested of allNested) {
          // Skip the top-level one itself
          if (nested === topCommentEl) continue;
          // Skip if already processed
          const id = nested.querySelector(".comment-entry-container")?.className || "";
          if (seen.has(id)) continue;
          seen.add(id);

          const msgEl = nested.querySelector(
            ":scope > .entry-wrapper .comment-entry > bb-message"
          );
          if (!msgEl) continue;

          const depth = nested.classList.contains("comment-level-1")
            ? 1
            : nested.classList.contains("comment-level-2")
              ? 2
              : 1;

          const reply = extractMessage(msgEl);
          reply.depth = depth;
          comment.replies.push(reply);
        }
      }

      collectReplies(wrapper);
      result.comments.push(comment);
    }

    return result;
  }

  // ── Formatters ──────────────────────────────────────────────────────────

  function roleTag(msg) {
    return msg.isInstructor ? " `INSTRUCTOR`" : "";
  }

  function toMarkdown(data) {
    const lines = [];
    lines.push(`# ${data.title}`);
    lines.push("");

    if (data.topicBody) {
      lines.push(`**${data.topicAuthor}**${data.topicAuthor ? "" : ""}  `);
      if (data.topicTimestamp) lines.push(`_${data.topicTimestamp}_`);
      lines.push("");
      lines.push(data.topicBody);
      lines.push("");
      lines.push("---");
      lines.push("");
    }

    for (const c of data.comments) {
      lines.push(`## ${c.username}${roleTag(c)}`);
      if (c.timestamp) lines.push(`_${c.timestamp}_`);
      lines.push("");
      lines.push(c.content);
      lines.push("");

      for (const r of c.replies) {
        const depth = r.depth || 1;
        const prefix = "> ".repeat(depth);
        lines.push(`${prefix}**${r.username}**${roleTag(r)}  `);
        if (r.timestamp) lines.push(`${prefix}_${r.timestamp}_`);
        lines.push(prefix.trimEnd());
        // Indent reply content
        for (const line of r.content.split("\n")) {
          lines.push(`${prefix}${line}`);
        }
        lines.push("");
      }

      lines.push("---");
      lines.push("");
    }

    return lines.join("\n");
  }

  function toJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  // ── UI ──────────────────────────────────────────────────────────────────

  function createUI() {
    // Main button
    const btn = document.createElement("button");
    btn.id = "bb-extract-btn";
    btn.textContent = "📋 Extract Discussion";
    document.body.appendChild(btn);

    // Panel
    const panel = document.createElement("div");
    panel.id = "bb-extract-panel";
    panel.innerHTML = `
      <h3>📋 Discussion Extracted</h3>
      <div class="stats"></div>
      <div class="actions">
        <button id="bb-copy-md" class="primary">Copy Markdown</button>
        <button id="bb-copy-json">Copy JSON</button>
        <button id="bb-download-md">Download .md</button>
      </div>
    `;
    document.body.appendChild(panel);

    let extractedData = null;

    btn.addEventListener("click", async () => {
      btn.textContent = "⏳ Extracting...";
      btn.disabled = true;

      try {
        extractedData = await extractDiscussion();
        const totalReplies = extractedData.comments.reduce(
          (sum, c) => sum + c.replies.length,
          0
        );

        panel.querySelector(".stats").innerHTML = `
          <div><strong>Title:</strong> ${extractedData.title}</div>
          <div><strong>Comments:</strong> ${extractedData.comments.length}</div>
          <div><strong>Replies:</strong> ${totalReplies}</div>
          <div><strong>Total messages:</strong> ${extractedData.comments.length + totalReplies}</div>
        `;

        panel.classList.add("show");
        btn.textContent = "✅ Extracted!";
        btn.classList.add("success");
      } catch (err) {
        console.error("BB Extract error:", err);
        btn.textContent = "❌ Error - check console";
      } finally {
        btn.disabled = false;
        setTimeout(() => {
          btn.textContent = "📋 Extract Discussion";
          btn.classList.remove("success");
        }, 3000);
      }
    });

    // Close panel on outside click
    document.addEventListener("click", (e) => {
      if (
        !panel.contains(e.target) &&
        e.target !== btn &&
        panel.classList.contains("show")
      ) {
        panel.classList.remove("show");
      }
    });

    // Copy Markdown
    panel.querySelector("#bb-copy-md").addEventListener("click", () => {
      if (!extractedData) return;
      GM_setClipboard(toMarkdown(extractedData), "text");
      showToast("Markdown copied!");
    });

    // Copy JSON
    panel.querySelector("#bb-copy-json").addEventListener("click", () => {
      if (!extractedData) return;
      GM_setClipboard(toJSON(extractedData), "text");
      showToast("JSON copied!");
    });

    // Download .md
    panel.querySelector("#bb-download-md").addEventListener("click", () => {
      if (!extractedData) return;
      const md = toMarkdown(extractedData);
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${extractedData.title.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_")}.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Downloaded!");
    });
  }

  function showToast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    Object.assign(t.style, {
      position: "fixed",
      bottom: "130px",
      right: "24px",
      zIndex: "100000",
      background: "#2e7d32",
      color: "#fff",
      padding: "8px 16px",
      borderRadius: "6px",
      fontSize: "13px",
      fontFamily: "system-ui",
      boxShadow: "0 2px 8px rgba(0,0,0,.3)",
      transition: "opacity .3s",
    });
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = "0";
      setTimeout(() => t.remove(), 300);
    }, 1800);
  }

  // ── Init ────────────────────────────────────────────────────────────────

  // Wait for discussion content to load
  function waitForDiscussion() {
    const observer = new MutationObserver(() => {
      if (document.querySelector(".discussion-comments")) {
        observer.disconnect();
        createUI();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Also check immediately
    if (document.querySelector(".discussion-comments")) {
      createUI();
    }

    // Fallback timeout
    setTimeout(() => {
      observer.disconnect();
      if (!document.getElementById("bb-extract-btn")) {
        createUI();
      }
    }, 10000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForDiscussion);
  } else {
    waitForDiscussion();
  }
})();
