#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Normalize URL the same way osmosfeed does:
 * if already encoded (decodeURI changes it), leave it; otherwise encodeURI it.
 * @param {string} url
 * @returns {string}
 */
function normalizeUrl(url) {
  try {
    return decodeURI(url) !== url ? url : encodeURI(url);
  } catch {
    return url;
  }
}

/**
 * Parse active (non-commented) href entries from osmosfeed.yaml content.
 * Returns an array of { href, comment } objects.
 * @param {string} content
 * @returns {{ href: string, comment: string }[]}
 */
function parseHrefs(content) {
  const results = [];
  for (const line of content.split("\n")) {
    // Match lines like:  - href: https://... # optional comment
    // Must start with spaces/dash/href and NOT be commented out with a leading #
    const match = line.match(/^\s+-\s+href:\s+(\S+)(?:\s+#\s*(.*))?$/);
    if (match) {
      results.push({
        href: match[1].trim(),
        comment: match[2] ? match[2].trim() : "",
      });
    }
  }
  return results;
}

// ── Read osmosfeed.yaml ───────────────────────────────────────────────────────
const yamlContent = fs.readFileSync("osmosfeed.yaml", "utf-8");
const sources = parseHrefs(yamlContent);

if (sources.length === 0) {
  console.error("[update-feed-status] No sources found in osmosfeed.yaml");
  process.exit(1);
}

// ── Read public/cache.json ────────────────────────────────────────────────────
const cachePath = path.join("public", "cache.json");
const successfulUrls = new Set();

if (fs.existsSync(cachePath)) {
  try {
    const cache = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    for (const source of cache.sources || []) {
      if (source.feedUrl) {
        successfulUrls.add(source.feedUrl);
      }
    }
  } catch (e) {
    console.error("[update-feed-status] Failed to parse cache.json:", e.message);
  }
} else {
  console.warn("[update-feed-status] public/cache.json not found – all feeds will be marked ❌");
}

// ── Build status table ────────────────────────────────────────────────────────
const rows = sources.map(({ href }) => {
  const normalizedHref = normalizeUrl(href);
  const status = successfulUrls.has(normalizedHref) ? "✅" : "❌";
  return `| ${status} | ${href} |`;
});

const successCount = rows.filter((r) => r.includes("✅")).length;
const failCount = rows.filter((r) => r.includes("❌")).length;

// Format date in Shanghai timezone
const dateStr = new Date().toLocaleString("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const table = `| 状态 | 订阅源链接 |\n| :---: | --- |\n${rows.join("\n")}`;

const MARKER_START = "<!-- FEED_STATUS_START -->";
const MARKER_END = "<!-- FEED_STATUS_END -->";

const newSection =
  `${MARKER_START}\n` +
  `## 订阅源抓取状态\n\n` +
  `> ✅ ${successCount} 个成功，❌ ${failCount} 个失败，最后更新：${dateStr}\n\n` +
  `${table}\n` +
  `${MARKER_END}`;

// ── Update README.md ──────────────────────────────────────────────────────────
let content = fs.readFileSync("README.md", "utf-8");

if (content.includes(MARKER_START) && content.includes(MARKER_END)) {
  const startIdx = content.indexOf(MARKER_START);
  const endIdx = content.indexOf(MARKER_END) + MARKER_END.length;
  content = content.slice(0, startIdx) + newSection + content.slice(endIdx);
} else {
  content = content.trimEnd() + "\n\n" + newSection + "\n";
}

fs.writeFileSync("README.md", content);
console.log(
  `[update-feed-status] README updated: ${successCount} succeeded, ${failCount} failed`
);
