(function () {
  // 1. Theme Toggle
  const root = document.documentElement;
  const themeBtn = document.getElementById("theme-toggle");

  function setTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
      if (themeBtn) themeBtn.textContent = "Light Mode";
    } else {
      root.setAttribute("data-theme", "light");
      if (themeBtn) themeBtn.textContent = "Dark Mode";
    }
    try {
      localStorage.setItem("sv_theme", theme);
    } catch (e) {}
    renderScatter(currentFiltered);
  }

  const savedTheme = (() => {
    try {
      return localStorage.getItem("sv_theme");
    } catch (e) {
      return null;
    }
  })();

  if (savedTheme) {
    setTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    setTheme("dark");
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const cur = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(cur);
    });
  }

  // 2. TariffDesk Interactive 3-Tier Confidence Demo
  const tariffSamples = {
    auto: {
      sku: "SKU-1042: 100% Cotton Men's Knitted Crewneck T-Shirt (Origin: CN -> US)",
      tier: "AUTO-APPLY (Confidence: 0.96)",
      tierClass: "pill-win",
      hts: "6109.10.00.12",
      basis: "GRI 1 & Chapter 61 Note 4: T-shirts, singlets, and other vests, knitted or crocheted, of cotton.",
      duty: "Base MFN: 16.5% + Section 301 List 4A: 7.5% = Total Duty 24.0%",
      landed: "FOB $12.00 + Freight/Ins $1.40 + Duty $2.88 + MPF = $16.32 Landed/Unit"
    },
    review: {
      sku: "SKU-2089: Smart Insulated Stainless Steel Bottle with OLED Temp Lid (Origin: CN -> US)",
      tier: "FLAG FOR HUMAN REVIEW (Confidence: 0.64)",
      tierClass: "pill-info",
      hts: "Candidate A: 7323.93.00.80 (Vacuum vessels of stainless steel) vs. Candidate B: 8543.70.98.60 (Electrical machines)",
      basis: "GRI 3(b) Essential Character Ambiguity: Merchant must confirm whether thermal insulation (Ch. 73) or electronic display module (Ch. 85) dominates value/function.",
      duty: "Rate Spread: 9.5% (Ch. 73 + Sec 301) vs. 27.6% (Ch. 85 + Sec 301 List 3)",
      landed: "Action: Halted auto-write to Shopify; surfaced $2.71/unit duty delta for merchant confirmation."
    },
    refuse: {
      sku: "SKU-3190: 'Assorted Mystery Gift Box - Holiday Edition' (Origin: CN -> US)",
      tier: "REFUSE TO GUESS (Insufficient Evidence)",
      tierClass: "pill-lose",
      hts: "BLOCKED — No HTS Assigned",
      basis: "GRI 1 & CBP Reasonable Care Standard (19 U.S.C. § 1484): Catalogue entry lacks material composition, item breakdown, and component values.",
      duty: "N/A — Refuses to hallucinate a customs code when product attributes are missing.",
      landed: "Action: Flagged missing fields [material_composition, item_breakdown] required before customs filing."
    }
  };

  const tariffBtns = document.querySelectorAll("[data-tariff-sample]");
  const tariffBox = document.getElementById("tariff-demo-output");

  function renderTariffSample(key) {
    const item = tariffSamples[key];
    if (!item || !tariffBox) return;
    tariffBox.innerHTML =
      "<div><strong>Product:</strong> " + item.sku + "</div>" +
      "<div style='margin:4px 0'><strong>Decision:</strong> <span class='pill " + item.tierClass + "'>" + item.tier + "</span></div>" +
      "<div><strong>HTS Code:</strong> " + item.hts + "</div>" +
      "<div><strong>Legal Basis:</strong> " + item.basis + "</div>" +
      "<div><strong>Tariff Calculation:</strong> " + item.duty + "</div>" +
      "<div><strong>Landed Cost Result:</strong> " + item.landed + "</div>";
  }

  tariffBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tariffBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderTariffSample(btn.getAttribute("data-tariff-sample"));
    });
  });
  renderTariffSample("auto");

  // 3. Under the Hood Tabs
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const panel = document.getElementById(target);
      if (panel) panel.classList.add("active");
    });
  });

  // 4. Interactive Trial Ledger & Scatter Plot
  const trials = window.TRIALS_DATA || [];
  const famSelect = document.getElementById("filter-fam");
  const stgSelect = document.getElementById("filter-stg");
  const verSelect = document.getElementById("filter-ver");
  const searchInput = document.getElementById("filter-q");
  const countEl = document.getElementById("ledger-count");
  const tbody = document.getElementById("ledger-tbody");
  const svg = document.getElementById("scatter-svg");

  if (famSelect) {
    const families = Array.from(new Set(trials.map((d) => d.family))).sort();
    famSelect.innerHTML = '<option value="">All Families (' + families.length + ')</option>' +
      families.map((f) => '<option value="' + f + '">' + f + '</option>').join("");
  }

  let sortKey = "date";
  let sortAsc = false;
  let currentFiltered = trials.slice();

  function pillClassFor(type) {
    if (type === "win") return "pill-win";
    if (type === "lose") return "pill-lose";
    if (type === "info") return "pill-info";
    return "pill-flat";
  }

  function renderScatter(rows) {
    if (!svg) return;
    const W = 560, H = 260;
    const pad = { l: 46, r: 18, t: 16, b: 34 };
    const pw = W - pad.l - pad.r;
    const ph = H - pad.t - pad.b;

    const minX = -70, maxX = 0;
    const minY = 0, maxY = 28;

    const xOf = (dd) => pad.l + ((Math.max(minX, Math.min(maxX, dd)) - minX) / (maxX - minX)) * pw;
    const yOf = (cagr) => pad.t + (1 - (Math.max(minY, Math.min(maxY, cagr)) - minY) / (maxY - minY)) * ph;

    const isDark = root.getAttribute("data-theme") === "dark";
    const gridColor = isDark ? "#29332f" : "#d6ddd9";
    const textColor = isDark ? "#8d9b95" : "#5d6964";
    const gateColor = isDark ? "#f4897f" : "#b42d22";

    let out = "";

    // Grid lines
    [-60, -50, -40, -30, -20, -10, 0].forEach((xv) => {
      const x = xOf(xv);
      out += '<line x1="' + x + '" y1="' + pad.t + '" x2="' + x + '" y2="' + (H - pad.b) + '" stroke="' + gridColor + '" stroke-dasharray="2,2" />';
      out += '<text x="' + x + '" y="' + (H - 12) + '" text-anchor="middle" fill="' + textColor + '" font-size="10" font-family="IBM Plex Mono, monospace">' + xv + '%</text>';
    });

    [0, 7, 14, 21, 28].forEach((yv) => {
      const y = yOf(yv);
      out += '<line x1="' + pad.l + '" y1="' + y + '" x2="' + (W - pad.r) + '" y2="' + y + '" stroke="' + gridColor + '" stroke-dasharray="2,2" />';
      out += '<text x="' + (pad.l - 6) + '" y="' + (y + 3) + '" text-anchor="end" fill="' + textColor + '" font-size="10" font-family="IBM Plex Mono, monospace">' + yv + '%</text>';
    });

    // -50% Hard Drawdown Gate Line
    const xGate50 = xOf(-50);
    out += '<line x1="' + xGate50 + '" y1="' + pad.t + '" x2="' + xGate50 + '" y2="' + (H - pad.b) + '" stroke="' + gateColor + '" stroke-width="1.5" stroke-dasharray="4,3" />';
    out += '<text x="' + (xGate50 + 5) + '" y="' + (pad.t + 11) + '" fill="' + gateColor + '" font-size="9.5" font-family="IBM Plex Mono, monospace">-50% DD Gate</text>';

    // Points
    rows.forEach((r) => {
      const cx = xOf(r.maxdd);
      const cy = yOf(r.cagr);
      let fill = isDark ? "#8d9b95" : "#6a736f";
      if (r.verdictType === "win") fill = isDark ? "#68d69c" : "#196f43";
      else if (r.verdictType === "lose") fill = isDark ? "#f4897f" : "#b42d22";
      else if (r.verdictType === "info") fill = isDark ? "#85b2ef" : "#285185";

      const radius = r.stage.indexOf("Formal") === 0 ? 5.5 : 4.2;
      const stroke = r.stage.indexOf("Formal") === 0 ? (isDark ? "#ffffff" : "#141917") : "none";
      out += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + radius + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.2" opacity="0.9">' +
        '<title>' + r.study + ' (' + r.variant + ')\nWindow: ' + r.window + '\nCAGR: ' + r.cagr.toFixed(2) + '% | MaxDD: ' + r.maxdd.toFixed(2) + '% | Calmar: ' + r.calmar.toFixed(3) + '\nVerdict: ' + r.verdict + '</title></circle>';
    });

    svg.innerHTML = out;
  }

  function updateLedger() {
    if (!tbody) return;
    const fam = famSelect ? famSelect.value : "";
    const stg = stgSelect ? stgSelect.value : "";
    const ver = verSelect ? verSelect.value : "";
    const q = searchInput ? searchInput.value.trim().toLowerCase() : "";

    currentFiltered = trials.filter((d) => {
      if (fam && d.family !== fam) return false;
      if (stg && d.stage.indexOf(stg) === -1) return false;
      if (ver && d.verdictType !== ver) return false;
      if (q) {
        const hay = (d.study + " " + d.variant + " " + d.window + " " + d.verdict + " " + d.note + " " + d.family).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    currentFiltered.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === "number" && typeof vb === "number") {
        return sortAsc ? va - vb : vb - va;
      }
      return sortAsc
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });

    if (countEl) {
      countEl.textContent = "Showing " + currentFiltered.length + " of " + trials.length + " logged runs";
    }

    tbody.innerHTML = currentFiltered
      .map((r) => {
        const ddClass = r.maxdd < -50 ? "num dd-breach" : "num";
        return (
          "<tr>" +
          "<td style='font-family:var(--f-mono);font-size:12px;white-space:nowrap'>" + r.date + "</td>" +
          "<td><div style='font-family:var(--f-mono);font-size:12px;font-weight:600'>" + r.study + "</div><div style='font-size:11.5px;color:var(--muted)'>" + r.family + "</div></td>" +
          "<td><div style='font-weight:500'>" + r.variant + "</div><div style='font-size:11.5px;color:var(--muted)'>" + r.note + "</div></td>" +
          "<td style='font-size:12px;white-space:nowrap'>" + r.stage + "</td>" +
          "<td style='font-size:12px;color:var(--fg-secondary)'>" + r.window + "</td>" +
          "<td class='num'>" + r.cagr.toFixed(2) + "%</td>" +
          "<td class='" + ddClass + "'>" + r.maxdd.toFixed(2) + "%</td>" +
          "<td class='num'>" + r.calmar.toFixed(3) + "</td>" +
          "<td><span class='pill " + pillClassFor(r.verdictType) + "'>" + r.verdict + "</span></td>" +
          "</tr>"
        );
      })
      .join("");

    renderScatter(currentFiltered);
  }

  [famSelect, stgSelect, verSelect].forEach((el) => {
    if (el) el.addEventListener("change", updateLedger);
  });
  if (searchInput) searchInput.addEventListener("input", updateLedger);

  document.querySelectorAll(".ledger-table th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const k = th.getAttribute("data-sort");
      if (sortKey === k) {
        sortAsc = !sortAsc;
      } else {
        sortKey = k;
        sortAsc = k === "study" || k === "stage";
      }
      updateLedger();
    });
  });

  updateLedger();
})();
