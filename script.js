(function(){
  let currentMode = 'investment'; // 'investment' or 'shares'
  let roiChart = null;
  
  const view = document.getElementById("view");
  const darkModeToggle = document.getElementById("darkModeToggle");
  
  // Initialize with proper event listeners
  document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners using addEventListener
    document.getElementById("btnSingle").addEventListener('click', loadSingleView);
    document.getElementById("btnMultiple").addEventListener('click', loadMultipleView);
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Ensure commissionRate and profitTarget inputs also save data
    document.getElementById("commissionRate").addEventListener('input', saveSingleStockData);
    document.getElementById("profitTarget").addEventListener('input', saveSingleStockData);
    
    // Load dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
      document.body.setAttribute('data-theme', 'dark');
      darkModeToggle.textContent = '☀️ Light Mode';
    }

    // Load single view by default
    loadSingleView();
  });

  // Welcome banner functionality
  window.addEventListener("load", () => {
    const banner = document.getElementById("welcomeBanner");
    if (banner) {
      // Hide after 3.5 seconds
      setTimeout(() => {
        banner.style.transition = "opacity 0.8s ease";
        banner.style.opacity = "0";
        setTimeout(() => banner.remove(), 1000);
      }, 3500);
    }
  });

  function toggleDarkMode() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.body.removeAttribute('data-theme');
      darkModeToggle.textContent = '🌙 Dark Mode';
      localStorage.setItem('darkMode', 'false');
    } else {
      document.body.setAttribute('data-theme', 'dark');
      darkModeToggle.textContent = '☀️ Light Mode';
      localStorage.setItem('darkMode', 'true');
    }
  }

  function getCommissionRate() {
    const rate = parseFloat(document.getElementById("commissionRate").value);
    return isNaN(rate) ? 3.0 : rate;
  }

  function getProfitTarget() {
    const target = parseFloat(document.getElementById("profitTarget").value);
    return isNaN(target) ? 10.0 : target;
  }

  function formatCurrency(amount) {
    if (isNaN(amount)) return '0';
       return `₦${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;  }

  function formatNumber(number) {
    if (isNaN(number)) return '0';
    return number.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  function validateInput(value, fieldName, min = 0) {
    const num = parseFloat(value);
    if (isNaN(num) || num <= min) {
      alert(`Please enter a valid ${fieldName} (must be greater than ${min})`);
      return false;
    }
    return true;
  }

  function activateTab(id) {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  function loadSingleView() {
    activateTab("btnSingle");
    view.innerHTML = `
      <section class="section">
        <h2>Single Stock Calculator</h2>
        
        <div class="calculation-mode">
          <button class="mode-btn ${currentMode === 'investment' ? 'active' : ''}" id="investmentModeBtn">
            💰 By Investment Amount
          </button>
          <button class="mode-btn ${currentMode === 'shares' ? 'active' : ''}" id="sharesModeBtn">
            📊 By Number of Shares
          </button>
        </div>
        
        <div id="singleInputs"></div>
        <button class="calc" id="calculateSingleBtn">Calculate</button>
        <div id="singleResult"></div>
      </section>`;
    
    // Add event listeners for mode buttons
    document.getElementById('investmentModeBtn').addEventListener('click', () => switchMode('investment'));
    document.getElementById('sharesModeBtn').addEventListener('click', () => switchMode('shares'));
    document.getElementById('calculateSingleBtn').addEventListener('click', singleCalc);
    
    renderSingleInputs();
    restoreSingleStockData();
  }

  function loadMultipleView() {
    activateTab("btnMultiple");
    view.innerHTML = `
      <section class="section">
        <h2>Multiple Stock Calculator</h2>
        <label>Total Investment (₦):</label>
        <input id="totalInv" type="number" placeholder="e.g. ₦100,000.00" min="1">
        <div id="multiInputs"></div>
        <button class="calc" id="calculateMultiBtn">Calculate</button>
        <div id="multiResults"></div>
      </section>`;
    
    // Add event listener for calculate button
    document.getElementById('calculateMultiBtn').addEventListener('click', multiCalc);
    
    renderMultiInputs();
    restoreMultipleStockData();
  }

  function renderSingleInputs() {
    const container = document.getElementById("singleInputs");
    if (currentMode === 'investment') {
      container.innerHTML = `
        <label>Investment Amount (₦):</label>
        <input id="invAmt" type="number" placeholder="e.g. ₦500,000.00" min="1">
        <label>Price per Share (₦):</label>
        <input id="buyPrice" type="number" placeholder="e.g. ₦3.00" min="0.01" step="0.01">
      `;
    } else {
      container.innerHTML = `
        <label>Number of Shares:</label>
        <input id="numShares" type="number" placeholder="e.g. 1,000" min="1">
        <label>Price per Share (₦):</label>
        <input id="buyPrice" type="number" placeholder="e.g. ₦3.00" min="0.01" step="0.01">
      `;
    }
    
    // Add event listeners to save data on input
    setTimeout(() => {
      const inputs = container.querySelectorAll('input');
      inputs.forEach(input => {
        input.addEventListener('input', saveSingleStockData);
      });
      restoreSingleStockData();
    }, 100);
  }

  function switchMode(mode) {
    currentMode = mode;
    renderSingleInputs();
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    if (mode === 'investment') {
      document.getElementById('investmentModeBtn').classList.add('active');
    } else {
      document.getElementById('sharesModeBtn').classList.add('active');
    }
    saveSingleStockData();
  }

  function singleCalc() {
    const buyPriceInput = document.getElementById("buyPrice");
    const buyPrice = parseFloat(buyPriceInput.value);
    
    if (!validateInput(buyPrice, "price per share", 0)) return;
    
    const commissionRate = getCommissionRate() / 100;
    const profitTargetRate = getProfitTarget() / 100;
    
    let investment, shares;
    
    if (currentMode === 'investment') {
      const invAmtInput = document.getElementById("invAmt");
      investment = parseFloat(invAmtInput.value);
      if (!validateInput(investment, "investment amount", 0)) return;
      shares = investment / buyPrice;
    } else {
      const numSharesInput = document.getElementById("numShares");
      shares = parseFloat(numSharesInput.value);
      if (!validateInput(shares, "number of shares", 0)) return;
      investment = shares * buyPrice;
    }
    
    const targetPrice = buyPrice * (1 + profitTargetRate);
    const totalSaleAmount = shares * targetPrice;
    const grossProfit = shares * (targetPrice - buyPrice);
    
    // Fixed commission calculation: commission on total sale amount
    const commissionFee = totalSaleAmount * commissionRate;
    const netProfit = grossProfit - commissionFee;
    const roi = (netProfit / investment) * 100;
    
    const performanceIndicator = roi > 15 ? '🚀' : roi > 5 ? '📈' : roi > 0 ? '📊' : '📉';
    const performanceText = roi > 15 ? 'High Performer' : roi > 5 ? 'Good Performer' : roi > 0 ? 'Moderate Performer' : 'Low Performer';
    
    const resultHTML = `
      <h3>Stock Results</h3>
      <div class="card ${roi > 10 ? 'best' : ''}">
        <div class="performance-indicator">${performanceIndicator}</div>
        <strong>Investment Analysis - ${performanceText}</strong><br><br>
        <strong>Investment Details:</strong><br>
        Total Investment: ${formatCurrency(investment)}<br>
        Number of Shares: ${formatNumber(shares)}<br>
        Buy Price per Share: ${formatCurrency(buyPrice)}<br>
        Target Price (${getProfitTarget()}% profit): ${formatCurrency(targetPrice)}<br>
        Total Sale Amount: ${formatCurrency(totalSaleAmount)}<br><br>
        
        <strong>Profit Analysis:</strong><br>
        Gross Profit: ${formatCurrency(grossProfit)}<br>
        Commission Fee (${getCommissionRate()}%): <span class="commission-fee">${formatCurrency(commissionFee)}</span><br>
        <strong>Net Profit: <span class="net-profit">${formatCurrency(netProfit)}</span></strong><br>
        <strong>ROI: <span class="roi-value-color">${formatNumber(roi)}%</span></strong>
      </div>`;
    
    document.getElementById("singleResult").innerHTML = resultHTML;
    
    // Save results to localStorage
    const singleStockResults = {
      investment,
      shares,
      buyPrice,
      targetPrice,
      totalSaleAmount,
      grossProfit,
      commissionFee,
      netProfit,
      roi,
      performanceText,
      resultHTML
    };
    localStorage.setItem('singleStockResults', JSON.stringify(singleStockResults));
    
    // Also save input data
    saveSingleStockData();
  }

  function renderMultiInputs() {
    const container = document.getElementById("multiInputs");
    container.innerHTML = "";
    for (let i = 0; i < 4; i++) {
      container.innerHTML += `
        <div class="stockRow">
          <input id="name${i}" type="text" placeholder="Stock ${i + 1} Name">
          <input id="buy${i}" type="number" placeholder="Buying Price (₦) e.g. ₦3.00" min="0.01" step="0.01">
          <input id="sell${i}" type="number" placeholder="Selling Price (₦) e.g. ₦3.50" min="0.01" step="0.01">
        </div>`;
    }
    
    // Add event listeners to save data on input
    setTimeout(() => {
      const totalInvInput = document.getElementById("totalInv");
      if (totalInvInput) {
        totalInvInput.addEventListener('input', saveMultipleStockData);
      }
      
      for (let i = 0; i < 4; i++) {
        const nameInput = document.getElementById(`name${i}`);
        const buyInput = document.getElementById(`buy${i}`);
        const sellInput = document.getElementById(`sell${i}`);
        
        if (nameInput) nameInput.addEventListener('input', saveMultipleStockData);
        if (buyInput) buyInput.addEventListener('input', saveMultipleStockData);
        if (sellInput) sellInput.addEventListener('input', saveMultipleStockData);
      }
    }, 100);
  }

  function multiCalc() {
    const totalInvestmentInput = document.getElementById("totalInv");
    const totalInvestment = parseFloat(totalInvestmentInput.value);
    
    if (!validateInput(totalInvestment, "total investment amount", 0)) return;
    
    const commissionRate = getCommissionRate() / 100;
    const results = [];
    const resDiv = document.getElementById("multiResults");
    resDiv.innerHTML = "";
    
    let bestROI = -Infinity;
    let worstROI = Infinity;
    let bestIdx = -1;
    let worstIdx = -1;
    
    // Calculate for each stock using the FULL investment amount for each
    for (let i = 0; i < 4; i++) {
      const name = document.getElementById(`name${i}`).value || `Stock ${i + 1}`;
      const buyPrice = parseFloat(document.getElementById(`buy${i}`).value);
      const sellPrice = parseFloat(document.getElementById(`sell${i}`).value);
      
      if (isNaN(buyPrice) || isNaN(sellPrice) || buyPrice <= 0 || sellPrice <= 0) continue;
      
      // Use full investment amount for each stock separately
      const shares = totalInvestment / buyPrice;
      const totalSaleAmount = shares * sellPrice;
      const grossProfit = shares * (sellPrice - buyPrice);
      
      // Fixed commission calculation: commission on total sale amount
      const commissionFee = totalSaleAmount * commissionRate;
      const netProfit = grossProfit - commissionFee;
      const roi = (netProfit / totalInvestment) * 100;
      
      if (roi > bestROI) {
        bestROI = roi;
        bestIdx = results.length;
      }
      if (roi < worstROI) {
        worstROI = roi;
        worstIdx = results.length;
      }
      
      results.push({
        name,
        shares,
        buyPrice,
        sellPrice,
        investment: totalInvestment,
        totalSaleAmount,
        grossProfit,
        commissionFee,
        netProfit,
        roi
      });
    }
    
    if (results.length === 0) {
      return alert("Please enter at least one stock with valid buy and sell prices");
    }
    
    // Display results
    results.forEach((r, idx) => {
      const isBest = idx === bestIdx;
      const isWorst = idx === worstIdx && results.length > 1;
      
      let performanceIndicator = '📊';
      let performanceClass = '';
      let performanceText = '';
      
      if (isBest) {
        performanceIndicator = '✅🚀';
        performanceClass = 'best';
        performanceText = ' - Best Performer';
      } else if (isWorst) {
        performanceIndicator = '⚠️📉';
        performanceText = ' - Needs Attention';
      } else if (r.roi > 10) {
        performanceIndicator = '📈';
        performanceText = ' - Good Performer';
      }
      
      const div = document.createElement("div");
      div.className = `card resultCard ${performanceClass}`;
      div.innerHTML = `
        <h3>Stock Results</h3>
        <div class="performance-indicator">${performanceIndicator}</div>
        <strong>${r.name}${performanceText}</strong><br><br>
        <strong>Total Investment:</strong> ${formatCurrency(r.investment)}<br>
        <strong>Number of Shares:</strong> ${formatNumber(r.shares)}<br>
        <strong>Buying Price:</strong> ${formatCurrency(r.buyPrice)}<br>
        <strong>Selling Price:</strong> ${formatCurrency(r.sellPrice)}<br>
        <strong>Total Sale Amount:</strong> ${formatCurrency(r.totalSaleAmount)}<br>
        <strong>Gross Profit:</strong> ${formatCurrency(r.grossProfit)}<br>
        <strong>Commission (${getCommissionRate()}%):</strong> <span class="commission-fee">${formatCurrency(r.commissionFee)}</span><br>
        <strong>Net Profit:</strong> <span class="net-profit">${formatCurrency(r.netProfit)}</span><br>
        <strong>ROI:</strong> <span class="roi-value-color">${formatNumber(r.roi)}%</span>
      `;
      resDiv.appendChild(div);
    });
    
    // Save results to localStorage
    localStorage.setItem('multipleStockResults', JSON.stringify(results));
    saveMultipleStockData();
  }



  function saveSingleStockData() {
    const data = {
      commissionRate: document.getElementById("commissionRate").value,
      profitTarget: document.getElementById("profitTarget").value,
      currentMode: currentMode
    };
    
    if (currentMode === 'investment') {
      const invAmtInput = document.getElementById("invAmt");
      if (invAmtInput) data.invAmt = invAmtInput.value;
    } else {
      const numSharesInput = document.getElementById("numShares");
      if (numSharesInput) data.numShares = numSharesInput.value;
    }
    
    const buyPriceInput = document.getElementById("buyPrice");
    if (buyPriceInput) data.buyPrice = buyPriceInput.value;
    
    localStorage.setItem('singleStockData', JSON.stringify(data));
  }

  function restoreSingleStockData() {
    const saved = localStorage.getItem('singleStockData');
    if (!saved) return;
    
    try {
      const data = JSON.parse(saved);
      
      if (data.commissionRate !== undefined) {
        document.getElementById("commissionRate").value = data.commissionRate;
      }
      if (data.profitTarget !== undefined) {
        document.getElementById("profitTarget").value = data.profitTarget;
      }
      
      if (currentMode === 'investment' && data.invAmt !== undefined) {
        const invAmtInput = document.getElementById("invAmt");
        if (invAmtInput) invAmtInput.value = data.invAmt;
      } else if (currentMode === 'shares' && data.numShares !== undefined) {
        const numSharesInput = document.getElementById("numShares");
        if (numSharesInput) numSharesInput.value = data.numShares;
      }
      
      if (data.buyPrice !== undefined) {
        const buyPriceInput = document.getElementById("buyPrice");
        if (buyPriceInput) buyPriceInput.value = data.buyPrice;
      }
    } catch (e) {
      console.error('Error restoring single stock data:', e);
    }
  }

  function saveMultipleStockData() {
    const data = {
      commissionRate: document.getElementById("commissionRate").value,
      profitTarget: document.getElementById("profitTarget").value
    };
    
    const totalInvInput = document.getElementById("totalInv");
    if (totalInvInput) data.totalInv = totalInvInput.value;
    
    for (let i = 0; i < 4; i++) {
      const nameInput = document.getElementById(`name${i}`);
      const buyInput = document.getElementById(`buy${i}`);
      const sellInput = document.getElementById(`sell${i}`);
      
      if (nameInput) data[`name${i}`] = nameInput.value;
      if (buyInput) data[`buy${i}`] = buyInput.value;
      if (sellInput) data[`sell${i}`] = sellInput.value;
    }
    
    localStorage.setItem('multipleStockData', JSON.stringify(data));
  }

  function restoreMultipleStockData() {
    const saved = localStorage.getItem('multipleStockData');
    if (!saved) return;
    
    try {
      const data = JSON.parse(saved);
      
      if (data.commissionRate !== undefined) {
        document.getElementById("commissionRate").value = data.commissionRate;
      }
      if (data.profitTarget !== undefined) {
        document.getElementById("profitTarget").value = data.profitTarget;
      }
      
      const totalInvInput = document.getElementById("totalInv");
      if (totalInvInput && data.totalInv !== undefined) {
        totalInvInput.value = data.totalInv;
      }
      
      for (let i = 0; i < 4; i++) {
        const nameInput = document.getElementById(`name${i}`);
        const buyInput = document.getElementById(`buy${i}`);
        const sellInput = document.getElementById(`sell${i}`);
        
        if (nameInput && data[`name${i}`] !== undefined) {
          nameInput.value = data[`name${i}`];
        }
        if (buyInput && data[`buy${i}`] !== undefined) {
          buyInput.value = data[`buy${i}`];
        }
        if (sellInput && data[`sell${i}`] !== undefined) {
          sellInput.value = data[`sell${i}`];
        }
      }
    } catch (e) {
      console.error('Error restoring multiple stock data:', e);
      localStorage.removeItem('multipleStockData');
    }
  }
  
})();
