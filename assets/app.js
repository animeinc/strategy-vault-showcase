(function () {
  // Declare all state and DOM references at top to prevent any TDZ issues
  var root = document.documentElement;
  var themeBtn = document.getElementById("theme-toggle");
  var langBtn = document.getElementById("lang-toggle");
  var trials = window.TRIALS_DATA || [];
  var famSelect = document.getElementById("filter-fam");
  var stgSelect = document.getElementById("filter-stg");
  var verSelect = document.getElementById("filter-ver");
  var searchInput = document.getElementById("filter-q");
  var countEl = document.getElementById("ledger-count");
  var tbody = document.getElementById("ledger-tbody");
  var svg = document.getElementById("scatter-svg");
  var tariffBtns = document.querySelectorAll("[data-tariff-sample]");
  var tariffBox = document.getElementById("tariff-demo-output");

  var sortKey = "date";
  var sortAsc = false;
  var currentFiltered = trials.slice();
  var currentLang = "en";
  var currentTariffKey = "auto";

  // Chinese translations for trial ledger fields
  var familyZhMap = {
    "Sleeve Allocation": "仓间比例配置",
    "Core & Sleeve": "核心与仓间",
    "Risk Sleeve Selection": "风险仓选股与过滤",
    "Regime & Exposure Gate": "体制与敞口闸门",
    "QLD Timing": "QLD 择时与对冲",
    "Fundamental & Event": "基本面与公司事件",
    "Core & Macro Hedge": "核心与宏观对冲",
    "Long-History Multi-Rule": "长历史多规则对照"
  };

  var stageZhMap = {
    "Formal (Holdout)": "正式检验（留出段）",
    "Formal (Pre-Sample M1)": "正式检验（M1 1934–85）",
    "Screening (Dev)": "开发段筛查（1997–2011）",
    "Screening (Dev, fit=0)": "开发段零拟合筛查（fit=0）",
    "Diagnostic (Common Window)": "公共窗口诊断对照",
    "Baseline Control": "现行基线对照"
  };

  var verdictZhMap = {
    "Pass Path A (Window Only)": "单窗达路径 A（总门未过）",
    "Eliminated (MaxDD > 55%)": "淘汰（日回撤 > 55%）",
    "No Edge": "不胜出",
    "Baseline Control": "基线对照",
    "Pass Path B (Dev Only)": "开发段过路径 B",
    "No Edge (Holdout Reversal)": "不胜出（留出段反转）",
    "No Edge (Split Halves Failed)": "不胜出（留出前后半段不过）",
    "Eliminated (Dev DD Gate)": "淘汰（越开发段回撤门）",
    "Eliminated (MaxDD > 50%)": "淘汰（日回撤 > 50%）",
    "No Edge (Crash-Year Gate)": "不胜出（剔除股灾年落后）",
    "Diagnostic Trade-off": "诊断对照（降回撤但牺牲年化）",
    "No Edge (Trailed Cash 2.84%)": "不胜出（低于无风险现金 2.84%）"
  };

  var noteZhByStudyVariant = {
    "formal-qld-from-core|30/40/20/10 Allocation|Formal (Holdout)": "2012–2026 牛市跑赢基线，但分块自助法 p=0.428 < 0.70 且 M1 回撤破门，不可采纳。",
    "formal-qld-from-core|30/40/20/10 Allocation|Formal (Pre-Sample M1)": "1937–1942 宏观收缩期日最大回撤达 -56.10%，越过 -55% 硬淘汰线。",
    "formal-ratio-v2|V2 40/40/10/10 (6-Tranche)|Formal (Holdout)": "留出段年化较基线高 +3.66pp，但分块自助法 p=0.620 未达 0.70 门槛。",
    "formal-ratio-v2|V2 40/40/10/10 (6-Tranche)|Formal (Pre-Sample M1)": "整体驳回：提高 2 倍杠杆仓位使 1930 年代回撤放大至 -57.04%。",
    "formal-spy2x-x1|30/20/20(2x)/10/20 + Long Bond|Formal (Holdout)": "1997–2011 靠降息周期过筛，但在 2012–2026（尤其 2022 加息年）跑输基线。",
    "formal-spy2x-x1|30/20/20(2x)/10/20 + Long Bond|Formal (Pre-Sample M1)": "长久期国债仓在跨世纪通胀周期中未能对冲股票回撤。",
    "formal-core-equal-weight|V1 S&P 500 Equal-Weight Core|Formal (Holdout)": "开发段（10.45%）跑赢市值加权，但在 2012–2025 留出段跑输 SPY 基线（18.59%）。",
    "formal-core-equal-weight|Baseline SPY Core Control|Formal (Holdout)": "同一六分仓引擎、15 bps 成本下的现行 SPY 核心仓对照基线。",
    "formal-downside-beta|V1 Downside-Beta Penalized 126d Mom|Screening (Dev)": "开发段回撤收窄 2.99pp、卡玛提升 +18.2%（基线 8.89% / -47.33%），通过步骤 0。",
    "formal-downside-beta|V1 Downside-Beta Penalized 126d Mom|Formal (Holdout)": "留出段相对基线（17.74% 年化、0.629 卡玛）发生反转；自助法胜出概率 p=0.0000。",
    "formal-downside-beta|V1 Downside-Beta Penalized 126d Mom|Formal (Pre-Sample M1)": "M1 跑赢基线（15.07%），但留出前半（2012–18）与后半（2019–25）方向均未通过。",
    "formal-hard-ma10-overlay|HARD Monthly Close < 10M SMA Exit|Formal (Holdout)": "因震荡期反复进出磨损落后于基线（21.30% 年化、0.914 卡玛）；boot_p=0.0005。",
    "screen-qld-streak-exit|V1 Consecutive Down-Streak Exit|Screening (Dev)": "连跌提前止损错失熊市急跌后的反弹日，年化损失超 2 个百分点。",
    "screen-qld-streak-exit|V3 3-Streak Exit + Vol Filter|Screening (Dev)": "轻微的回撤改善不足以弥补年化收益拖累。",
    "screen-erc-crsp-dev|V1 Equal-Risk-Contribution 60d (Cap 35%)|Screening (Dev)": "逆波动率加权稀释了危机后复苏阶段高弹性动量领涨股的权重。",
    "screen-no-sector-cap|V1 Unconstrained Sector Concentration|Screening (Dev)": "取消单行业 ≤2 只限制后，2000 年科网泡沫集中度崩盘导致回撤达 -50.29%。",
    "screen-quality-momentum|V1 Gross Profitability (GPA) Filter|Screening (Dev)": "财报数据的时点滞后稀释了纯 126 日价格动量信号。",
    "screen-risk-adjusted-mom|V1 Sharpe-Ranked 126d Momentum|Screening (Dev)": "较 CRSP 基线（8.98%）仅微增 +0.09pp，未达路径 A（+1.0pp）门槛。",
    "screen-acceleration|V1 Momentum Acceleration (63d vs 126d)|Screening (Dev)": "更高的换手率与均值回归惩罚在扣除 15 bps 成本后拉低净收益。",
    "screen-intraday-momentum|V1 Open-to-Close Component 126d|Screening (Dev)": "只取日内开盘到收盘收益丢掉了隔夜跳空漂移，导致动量收益大幅流失。",
    "screen-overnight-momentum|V1 Close-to-Open Overnight 126d|Screening (Dev)": "纯隔夜分量在 2001 与 2008 年遭遇严重的向下跳空回撤（-51.70%）。",
    "screen-signed-path-efficiency|V1 Signed Path Efficiency (Kaufman ER)|Screening (Dev)": "全窗卡玛虽有改善，但剔除 2000–02 与 2008 股灾年后跑输基线。",
    "screen-earnings-drift|V1 3-Day Earnings Announcement Return (EAR)|Screening (Dev)": "财报公告漂移（PEAD）信号在六分仓半年持有周期内衰减过快。",
    "screen-asset-growth|V1 Low Asset-Growth × Momentum|Screening (Dev)": "卡玛较基线提升 +8.0%，未达路径 B（+15%）门槛，家族结案。",
    "screen-gold-lbma-dev|V1 20% Gold + 10M SMA Gate|Screening (Dev)": "表面通过路径 A，但剔除 2000–02/2008 后年化（20.61%）低于基线（21.42%），依赖降息期。",
    "screen-corp-event-drift|V1 Stock Split / Dividend Hike Drift|Screening (Dev)": "高年化来自 1998–99 拆股狂热，随后在 2000–2002 暴跌 -57.38% 破门淘汰。",
    "five-longest-G870 (MV)|MV Volatility-Managed QLD|Diagnostic (Common Window)": "将回撤从规则 B 的 -47.37% 压至 -20.97%，但在长牛中每年牺牲 6.75pp 收益。",
    "five-longest-G870 (RULE_B)|Current Baseline Rule B (100% Sleeve)|Baseline Control": "2012–2025 公共重启窗口下未修改的现行规则 B 基准。",
    "qld-ndx-vardrain-arb-dev|S1 Rule B + 2:1 Variance-Drain Overlay (15bp)|Screening (Dev, fit=0)": "Avellaneda-Zhang 2:1 做空 QLD / 做多 2xNDX 零拟合检验；日回撤 -58.08% 超 -55% 淘汰。",
    "qld-ndx-vardrain-arb-dev|S2 Standalone 2:1 Variance-Drain Band08 (15bp)|Screening (Dev, fit=0)": "扣除 100bp/年借券费、rf 融资费及 15bp 双腿换手费后，净年化 2.52% 低于现金（2.84%）。"
  };

  function pillClassFor(type) {
    if (type === "win") return "pill-win";
    if (type === "lose") return "pill-lose";
    if (type === "info") return "pill-info";
    return "pill-flat";
  }

  function updateThemeButtonLabel() {
    if (!themeBtn) return;
    var isDark = root.getAttribute("data-theme") === "dark";
    if (currentLang === "zh") {
      themeBtn.textContent = isDark ? "浅色模式" : "深色模式";
    } else {
      themeBtn.textContent = isDark ? "Light Mode" : "Dark Mode";
    }
  }

  function renderScatter(rows) {
    if (!svg || !rows) return;
    var W = 560, H = 260;
    var pad = { l: 46, r: 18, t: 16, b: 34 };
    var pw = W - pad.l - pad.r;
    var ph = H - pad.t - pad.b;

    var minX = -70, maxX = 0;
    var minY = 0, maxY = 28;

    function xOf(dd) {
      return pad.l + ((Math.max(minX, Math.min(maxX, dd)) - minX) / (maxX - minX)) * pw;
    }
    function yOf(cagr) {
      return pad.t + (1 - (Math.max(minY, Math.min(maxY, cagr)) - minY) / (maxY - minY)) * ph;
    }

    var isDark = root.getAttribute("data-theme") === "dark";
    var gridColor = isDark ? "#29332f" : "#d6ddd9";
    var textColor = isDark ? "#8d9b95" : "#5d6964";
    var gateColor = isDark ? "#f4897f" : "#b42d22";

    var out = "";

    [-60, -50, -40, -30, -20, -10, 0].forEach(function (xv) {
      var x = xOf(xv);
      out += '<line x1="' + x + '" y1="' + pad.t + '" x2="' + x + '" y2="' + (H - pad.b) + '" stroke="' + gridColor + '" stroke-dasharray="2,2" />';
      out += '<text x="' + x + '" y="' + (H - 12) + '" text-anchor="middle" fill="' + textColor + '" font-size="10" font-family="IBM Plex Mono, monospace">' + xv + '%</text>';
    });

    [0, 7, 14, 21, 28].forEach(function (yv) {
      var y = yOf(yv);
      out += '<line x1="' + pad.l + '" y1="' + y + '" x2="' + (W - pad.r) + '" y2="' + y + '" stroke="' + gridColor + '" stroke-dasharray="2,2" />';
      out += '<text x="' + (pad.l - 6) + '" y="' + (y + 3) + '" text-anchor="end" fill="' + textColor + '" font-size="10" font-family="IBM Plex Mono, monospace">' + yv + '%</text>';
    });

    var xGate50 = xOf(-50);
    var gateLabel = currentLang === "zh" ? "-50% 合格线" : "-50% DD Gate";
    out += '<line x1="' + xGate50 + '" y1="' + pad.t + '" x2="' + xGate50 + '" y2="' + (H - pad.b) + '" stroke="' + gateColor + '" stroke-width="1.5" stroke-dasharray="4,3" />';
    out += '<text x="' + (xGate50 + 5) + '" y="' + (pad.t + 11) + '" fill="' + gateColor + '" font-size="9.5" font-family="IBM Plex Mono, monospace">' + gateLabel + '</text>';

    rows.forEach(function (r) {
      var cx = xOf(r.maxdd);
      var cy = yOf(r.cagr);
      var fill = isDark ? "#8d9b95" : "#6a736f";
      if (r.verdictType === "win") fill = isDark ? "#68d69c" : "#196f43";
      else if (r.verdictType === "lose") fill = isDark ? "#f4897f" : "#b42d22";
      else if (r.verdictType === "info") fill = isDark ? "#85b2ef" : "#285185";

      var radius = r.stage.indexOf("Formal") === 0 ? 5.5 : 4.2;
      var stroke = r.stage.indexOf("Formal") === 0 ? (isDark ? "#ffffff" : "#141917") : "none";
      var vText = currentLang === "zh" ? (verdictZhMap[r.verdict] || r.verdict) : r.verdict;
      out += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + radius + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.2" opacity="0.9">' +
        '<title>' + r.study + ' (' + r.variant + ')\nWindow: ' + r.window + '\nCAGR: ' + r.cagr.toFixed(2) + '% | MaxDD: ' + r.maxdd.toFixed(2) + '% | Calmar: ' + r.calmar.toFixed(3) + '\nVerdict: ' + vText + '</title></circle>';
    });

    svg.innerHTML = out;
  }

  // 2. TariffDesk Interactive 3-Tier Confidence Demo (Bilingual)
  var tariffSamples = {
    en: {
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
        hts: "Candidate A: 7323.93.00.80 (Stainless steel vacuum vessels) vs. Candidate B: 8543.70.98.60 (Electrical machines)",
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
    },
    zh: {
      auto: {
        sku: "SKU-1042: 100% 纯棉男士针织圆领 T 恤（原产国：中国 -> 美国）",
        tier: "自动应用 AUTO-APPLY（置信度：0.96）",
        tierClass: "pill-win",
        hts: "6109.10.00.12",
        basis: "归类总规则一（GRI 1）及第 61 章章注 4：棉制针织或钩编 T 恤衫、汗衫及其他背心。",
        duty: "基础最惠国税率 MFN：16.5% + 301 关税清单 4A：7.5% = 综合关税率 24.0%",
        landed: "FOB $12.00 + 运费保险 $1.40 + 关税 $2.88 + MPF = 到岸总成本 $16.32 / 件"
      },
      review: {
        sku: "SKU-2089: 带 OLED 测温屏顶盖的智能不锈钢保温杯（原产国：中国 -> 美国）",
        tier: "人工复核 FLAG FOR REVIEW（置信度：0.64）",
        tierClass: "pill-info",
        hts: "候选 A：7323.93.00.80（不锈钢餐桌/厨房器具） vs. 候选 B：8543.70.98.60（未列名电气设备）",
        basis: "GRI 3(b) 基本特征判定分歧：需卖家确认不锈钢保温杯体（第 73 章）与电子显温模块（第 85 章）何者构成商品主要价值与功能。",
        duty: "税率分歧区间：9.5%（第 73 章 + 301） vs. 27.6%（第 85 章 + 301 清单 3）",
        landed: "系统动作：暂停自动写入 Shopify，向卖家展示每件 $2.71 的关税差额并等待人工确认。"
      },
      refuse: {
        sku: "SKU-3190: '节日限定惊喜盲盒礼盒'（原产国：中国 -> 美国）",
        tier: "证据不足拒绝盲猜 REFUSE TO GUESS",
        tierClass: "pill-lose",
        hts: "已拦截 BLOCKED — 不分配任何税号",
        basis: "GRI 1 及美国海关合理审慎义务（19 U.S.C. § 1484）：商品详情缺失材质成分、内含物明细与分项价值。",
        duty: "不适用 — 当商品核心属性缺失时，严禁大模型幻觉编造海关编码。",
        landed: "系统动作：标记必填缺失字段 [材质成分, 礼盒分项明细]，补齐证据前禁止生成报关单。"
      }
    }
  };

  function renderTariffSample(key) {
    currentTariffKey = key || currentTariffKey || "auto";
    var langPack = tariffSamples[currentLang] || tariffSamples.en;
    var item = langPack[currentTariffKey];
    if (!item || !tariffBox) return;
    if (currentLang === "zh") {
      tariffBox.innerHTML =
        "<div><strong>商品条目：</strong> " + item.sku + "</div>" +
        "<div style='margin:4px 0'><strong>判定档位：</strong> <span class='pill " + item.tierClass + "'>" + item.tier + "</span></div>" +
        "<div><strong>HTS 编码：</strong> " + item.hts + "</div>" +
        "<div><strong>法律依据：</strong> " + item.basis + "</div>" +
        "<div><strong>关税测算：</strong> " + item.duty + "</div>" +
        "<div><strong>到岸成本结论：</strong> " + item.landed + "</div>";
    } else {
      tariffBox.innerHTML =
        "<div><strong>Product:</strong> " + item.sku + "</div>" +
        "<div style='margin:4px 0'><strong>Decision:</strong> <span class='pill " + item.tierClass + "'>" + item.tier + "</span></div>" +
        "<div><strong>HTS Code:</strong> " + item.hts + "</div>" +
        "<div><strong>Legal Basis:</strong> " + item.basis + "</div>" +
        "<div><strong>Tariff Calculation:</strong> " + item.duty + "</div>" +
        "<div><strong>Landed Cost Result:</strong> " + item.landed + "</div>";
    }
  }

  function populateFilterControls() {
    var curFam = famSelect ? famSelect.value : "";
    var curStg = stgSelect ? stgSelect.value : "";
    var curVer = verSelect ? verSelect.value : "";

    var families = Array.from(new Set(trials.map(function (d) { return d.family; }))).sort();

    if (famSelect) {
      var allFamLabel = currentLang === "zh" ? "全部策略家族 (" + families.length + ")" : "All Families (" + families.length + ")";
      famSelect.innerHTML = '<option value="">' + allFamLabel + '</option>' +
        families.map(function (f) {
          var label = currentLang === "zh" ? (familyZhMap[f] || f) : f;
          return '<option value="' + f + '">' + label + '</option>';
        }).join("");
      famSelect.value = curFam;
    }

    if (stgSelect) {
      if (currentLang === "zh") {
        stgSelect.innerHTML =
          '<option value="">全部检验阶段</option>' +
          '<option value="Formal (Holdout)">正式检验（留出段 2012+）</option>' +
          '<option value="Formal (Pre-Sample M1)">正式检验（M1 1934–85）</option>' +
          '<option value="Screening">开发段筛查（1997–2011）</option>' +
          '<option value="Baseline">现行基线对照</option>';
      } else {
        stgSelect.innerHTML =
          '<option value="">All Stages</option>' +
          '<option value="Formal (Holdout)">Formal (Holdout 2012+)</option>' +
          '<option value="Formal (Pre-Sample M1)">Formal (Pre-Sample M1 1934–85)</option>' +
          '<option value="Screening">Screening (Dev 1997–2011)</option>' +
          '<option value="Baseline">Baseline Control</option>';
      }
      stgSelect.value = curStg;
    }

    if (verSelect) {
      if (currentLang === "zh") {
        verSelect.innerHTML =
          '<option value="">全部判定结果</option>' +
          '<option value="win">单窗达标（路径 A / B）</option>' +
          '<option value="flat">驳回：不胜出 / 留出反转</option>' +
          '<option value="lose">淘汰（越最大回撤红线）</option>' +
          '<option value="info">基线对照 / 诊断</option>';
      } else {
        verSelect.innerHTML =
          '<option value="">All Verdicts</option>' +
          '<option value="win">Window Pass (Path A / B)</option>' +
          '<option value="flat">Rejected: No Edge / Reversal</option>' +
          '<option value="lose">Eliminated (MaxDD Gate Breach)</option>' +
          '<option value="info">Baseline / Diagnostic</option>';
      }
      verSelect.value = curVer;
    }

    if (searchInput) {
      searchInput.placeholder = currentLang === "zh"
        ? "搜索研究名、规则变体、时间段或驳回原因…"
        : "Search study name, rule variant, or failure reason...";
    }
  }

  function updateLedger() {
    if (!tbody) return;
    var fam = famSelect ? famSelect.value : "";
    var stg = stgSelect ? stgSelect.value : "";
    var ver = verSelect ? verSelect.value : "";
    var q = searchInput ? searchInput.value.trim().toLowerCase() : "";

    currentFiltered = trials.filter(function (d) {
      if (fam && d.family !== fam) return false;
      if (stg && d.stage.indexOf(stg) === -1) return false;
      if (ver && d.verdictType !== ver) return false;
      if (q) {
        var key = d.study + "|" + d.variant + "|" + d.stage;
        var zhNote = noteZhByStudyVariant[key] || "";
        var zhFam = familyZhMap[d.family] || "";
        var zhVer = verdictZhMap[d.verdict] || "";
        var hay = (d.study + " " + d.variant + " " + d.window + " " + d.verdict + " " + d.note + " " + d.family + " " + zhNote + " " + zhFam + " " + zhVer).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    currentFiltered.sort(function (a, b) {
      var va = a[sortKey];
      var vb = b[sortKey];
      if (typeof va === "number" && typeof vb === "number") {
        return sortAsc ? va - vb : vb - va;
      }
      return sortAsc
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });

    if (countEl) {
      countEl.textContent = currentLang === "zh"
        ? "当前显示 " + currentFiltered.length + " / 共 " + trials.length + " 条试验记录"
        : "Showing " + currentFiltered.length + " of " + trials.length + " logged runs";
    }

    tbody.innerHTML = currentFiltered
      .map(function (r) {
        var ddClass = r.maxdd < -50 ? "num dd-breach" : "num";
        var key = r.study + "|" + r.variant + "|" + r.stage;
        var famText = currentLang === "zh" ? (familyZhMap[r.family] || r.family) : r.family;
        var stgText = currentLang === "zh" ? (stageZhMap[r.stage] || r.stage) : r.stage;
        var verText = currentLang === "zh" ? (verdictZhMap[r.verdict] || r.verdict) : r.verdict;
        var noteText = currentLang === "zh" ? (noteZhByStudyVariant[key] || r.note) : r.note;

        return (
          "<tr>" +
          "<td style='font-family:var(--f-mono);font-size:12px;white-space:nowrap'>" + r.date + "</td>" +
          "<td><div style='font-family:var(--f-mono);font-size:12px;font-weight:600'>" + r.study + "</div><div style='font-size:11.5px;color:var(--muted)'>" + famText + "</div></td>" +
          "<td><div style='font-weight:500'>" + r.variant + "</div><div style='font-size:11.5px;color:var(--muted)'>" + noteText + "</div></td>" +
          "<td style='font-size:12px;white-space:nowrap'>" + stgText + "</td>" +
          "<td style='font-size:12px;color:var(--fg-secondary)'>" + r.window + "</td>" +
          "<td class='num'>" + r.cagr.toFixed(2) + "%</td>" +
          "<td class='" + ddClass + "'>" + r.maxdd.toFixed(2) + "%</td>" +
          "<td class='num'>" + r.calmar.toFixed(3) + "</td>" +
          "<td><span class='pill " + pillClassFor(r.verdictType) + "'>" + verText + "</span></td>" +
          "</tr>"
        );
      })
      .join("");

    renderScatter(currentFiltered);
  }

  // 1. Theme & Language Setters
  function setTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
    }
    updateThemeButtonLabel();
    try {
      localStorage.setItem("sv_theme", theme);
    } catch (e) {}
    renderScatter(currentFiltered);
  }

  function setLang(lang) {
    currentLang = lang === "zh" ? "zh" : "en";
    root.setAttribute("lang", currentLang);
    if (langBtn) {
      langBtn.textContent = currentLang === "zh" ? "EN / 英文" : "中文 / ZH";
    }
    updateThemeButtonLabel();
    populateFilterControls();
    renderTariffSample(currentTariffKey);
    updateLedger();
    try {
      localStorage.setItem("sv_lang", currentLang);
    } catch (e) {}
  }

  // Initialize Theme
  var savedTheme = null;
  try {
    savedTheme = localStorage.getItem("sv_theme");
  } catch (e) {}

  if (savedTheme) {
    setTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    setTheme("dark");
  } else {
    setTheme("light");
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var cur = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(cur);
    });
  }

  // Initialize Language (Default English for admissions reviewers; supports toggle or ?lang=zh)
  var savedLang = "en";
  try {
    if (window.location && window.location.search && window.location.search.indexOf("lang=zh") !== -1) {
      savedLang = "zh";
    } else {
      savedLang = localStorage.getItem("sv_lang") || "en";
    }
  } catch (e) {}
  setLang(savedLang);

  if (langBtn) {
    langBtn.addEventListener("click", function () {
      setLang(currentLang === "en" ? "zh" : "en");
    });
  }

  // Bind TariffDesk buttons
  Array.prototype.forEach.call(tariffBtns, function (btn) {
    btn.addEventListener("click", function () {
      Array.prototype.forEach.call(tariffBtns, function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      renderTariffSample(btn.getAttribute("data-tariff-sample"));
    });
  });

  // 3. Under the Hood Tabs
  var tabBtns = document.querySelectorAll(".tab-btn");
  var tabPanels = document.querySelectorAll(".tab-panel");

  Array.prototype.forEach.call(tabBtns, function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-tab");
      Array.prototype.forEach.call(tabBtns, function (b) {
        b.classList.remove("active");
      });
      Array.prototype.forEach.call(tabPanels, function (p) {
        p.classList.remove("active");
      });
      btn.classList.add("active");
      var panel = document.getElementById(target);
      if (panel) panel.classList.add("active");
    });
  });

  // Bind Ledger Filters & Sort
  [famSelect, stgSelect, verSelect].forEach(function (el) {
    if (el) el.addEventListener("change", updateLedger);
  });
  if (searchInput) searchInput.addEventListener("input", updateLedger);

  Array.prototype.forEach.call(document.querySelectorAll(".ledger-table th[data-sort]"), function (th) {
    th.addEventListener("click", function () {
      var k = th.getAttribute("data-sort");
      if (sortKey === k) {
        sortAsc = !sortAsc;
      } else {
        sortKey = k;
        sortAsc = k === "study" || k === "stage";
      }
      updateLedger();
    });
  });
})();
