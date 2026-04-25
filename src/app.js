const DEFAULT_CELL = { 
  text: "", 
  image: "", 
  bgColor: "#ffffff", 
  textColor: "#000000" 
};

let state = {
  title: "My Communication Board",
  rows: 4,
  cols: 4,
  mode: "edit", // 'edit' or 'use'
  activeCellId: null,
  cells: [] // Array of { id, text, image, bgColor, textColor }
};

// Initialize app DOM
function initApp() {
  const app = document.getElementById('app');
  app.className = "flex w-full h-full";
  app.innerHTML = `
    <!-- Sidebar -->
    <aside id="sidebar" class="w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex shrink-0 flex-col h-auto md:h-full shadow-sm print-hide p-6 overflow-y-auto print:hidden z-10 transition-all">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">🗣️ AAC Builder</h1>
        <p class="text-sm text-gray-500 mt-1">Design & Print Communication Boards</p>
      </div>

      <!-- Mode Toggle -->
      <div class="flex items-center gap-2 bg-gray-100 p-1 rounded-lg mb-6 shadow-inner">
        <button id="btn-mode-edit" class="flex-1 py-2 font-semibold text-sm rounded-md bg-white border shadow-sm transition-colors text-blue-600 border-blue-200">
          ✏️ Edit Mode
        </button>
        <button id="btn-mode-use" class="flex-1 py-2 font-semibold text-sm rounded-md transition-colors text-gray-600 hover:text-gray-900">
          🗣️ Use Mode
        </button>
      </div>

      <!-- Grid Settings -->
      <div class="space-y-4 mb-6 relative" id="panel-settings">
        <h2 class="font-bold text-gray-700 uppercase text-xs tracking-wider">Grid Settings</h2>
        
        <div>
          <label class="block text-sm font-medium mb-1">Board Title</label>
          <input type="text" id="input-title" value="${state.title}" class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Cols: <span id="val-cols">${state.cols}</span></label>
            <input type="range" id="slider-cols" min="2" max="10" value="${state.cols}" class="w-full accent-blue-600" />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Rows: <span id="val-rows">${state.rows}</span></label>
            <input type="range" id="slider-rows" min="2" max="10" value="${state.rows}" class="w-full accent-blue-600" />
          </div>
        </div>

        <div id="print-warning" class="hidden text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded relative">
          ⚠️ Warning: Grids larger than 6x6 or 8x4 may be difficult to read when printed to A4.
        </div>
      </div>

      <!-- Board Themes / Templates -->
      <div class="space-y-3 mb-6" id="panel-templates">
        <h2 class="font-bold text-gray-700 uppercase text-xs tracking-wider">Templates</h2>
        <div class="grid grid-cols-2 gap-2">
          <button id="btn-template-cafe" class="px-2 py-2 border border-blue-200 text-blue-700 bg-blue-50 rounded text-sm hover:bg-blue-100 flex items-center justify-center gap-2 transition">
            ☕ Cafe Board
          </button>
          <button id="btn-template-clear" class="px-2 py-2 border border-red-200 text-red-600 bg-red-50 rounded text-sm hover:bg-red-100 flex items-center justify-center gap-2 transition">
            🧹 Clear Grid
          </button>
        </div>
      </div>

      <!-- Global Actions -->
      <div class="mt-auto space-y-2 pt-4 border-t border-gray-100">
        <button id="btn-print" class="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition">
          🖨️ Print (A4)
        </button>
        <div class="grid grid-cols-2 gap-2">
          <button id="btn-export-json" class="flex items-center justify-center gap-2 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded transition text-sm">
            💾 Save JSON
          </button>
          <label class="flex items-center justify-center gap-2 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded cursor-pointer transition text-sm">
            📂 Load JSON
            <input type="file" id="input-import-json" accept=".json" class="hidden" />
          </label>
        </div>
      </div>
    </aside>

    <!-- Main Canvas Area -->
    <main class="flex-1 flex flex-col items-center p-4 md:p-8 overflow-y-auto bg-gray-50 print-expand print:bg-white relative z-0 w-full">
      <div id="board-container" class="w-full max-w-screen-xl flex flex-col h-full items-center justify-start print-expand">
        <h2 id="board-display-title" class="text-3xl font-bold mb-6 text-center print:text-black print:mb-4">${state.title}</h2>
        
        <div class="flex-1 w-full rounded-lg flex items-start justify-center print:items-start p-2 break-inside-avoid print:p-0">
           <!-- Grid container -->   
           <div id="grid" class="grid gap-2 w-full max-w-6xl aspect-[4/3] print:aspect-[1.414/1] print:border-none print:shadow-none print:gap-[2mm]"></div>
        </div>
      </div>
    </main>

    <!-- Generic Modal Overlay -->
    <dialog id="edit-modal" class="p-0 border-0 rounded-xl shadow-2xl backdrop:bg-gray-900/60 flex-col w-[95%] max-w-3xl bg-white m-auto hidden open:flex">
      <div class="flex justify-between items-center border-b p-4 bg-gray-50 rounded-t-xl">
        <h3 class="text-xl font-bold text-gray-800">✏️ Edit Cell</h3>
        <button id="btn-close-modal" class="text-gray-500 hover:bg-gray-200 p-2 rounded-full w-8 h-8 flex items-center justify-center font-bold transition">X</button>
      </div>

      <div class="p-6 flex flex-col md:flex-row gap-6">
        
        <!-- Tab 1: Basics -->
        <div class="flex-1 space-y-4">
          <div>
            <label class="block text-sm font-semibold mb-1">Text Label</label>
            <input type="text" id="cell-text" placeholder="e.g. Yes, Water, Stop" class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          
          <div>
            <label class="block text-sm font-semibold mb-1">Cell Color Background</label>
            <div class="flex items-center gap-2">
              <input type="color" id="cell-color" value="#ffffff" class="w-10 h-10 border rounded cursor-pointer p-0" />
              <button class="preset-color w-8 h-8 rounded border bg-blue-100 border-blue-300 hover:ring-2" data-color="#dbeafe"></button>
              <button class="preset-color w-8 h-8 rounded border bg-green-100 border-green-300 hover:ring-2" data-color="#dcfce3"></button>
              <button class="preset-color w-8 h-8 rounded border bg-yellow-100 border-yellow-300 hover:ring-2" data-color="#fef08a"></button>
              <button class="preset-color w-8 h-8 rounded border bg-red-100 border-red-300 hover:ring-2" data-color="#fee2e2"></button>
              <button class="preset-color w-8 h-8 rounded border bg-purple-100 border-purple-300 hover:ring-2" data-color="#f3e8ff"></button>
              <button class="preset-color w-8 h-8 rounded border bg-gray-100 border-gray-300 hover:ring-2" data-color="#f3f4f6"></button>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-semibold mb-1">Text Color</label>
            <input type="color" id="cell-text-color" value="#000000" class="w-10 h-10 border rounded cursor-pointer p-0" />
          </div>
        </div>

        <div class="border-l border-gray-200 hidden md:block"></div>

        <!-- Tab 2: Icon Search -->
        <div class="flex-[1.5] space-y-4 flex flex-col">
          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700 flex justify-between">
              <span>Icon / Image Search</span>
              <span class="text-xs text-blue-600 font-normal">Powered by OpenSymbols</span>
            </label>
            <div class="flex gap-2">
              <input type="text" id="icon-search-input" placeholder="Search a symbol..." class="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              <button id="btn-search-icon" class="px-4 bg-blue-100 text-blue-800 rounded font-semibold hover:bg-blue-200 border border-blue-200 transition">Search</button>
            </div>
          </div>

          <div id="icon-results" class="grid grid-cols-4 sm:grid-cols-5 gap-2 h-48 overflow-y-auto border border-gray-200 bg-gray-50 rounded p-2 content-start">
             <p class="col-span-full text-center text-sm text-gray-400 mt-16 italic">Search to find symbols...</p>
          </div>

          <div class="text-xs text-gray-500 flex justify-between items-center px-1 mt-auto pt-2 border-t">
             <span class="font-semibold">Or upload an image:</span>
             <input type="file" id="input-upload-image" accept="image/*" class="w-48 text-xs border rounded p-1 p-0.5 border-gray-300" />
          </div>
        </div>
      </div>
      
      <div class="border-t bg-gray-50 p-4 rounded-b-xl flex justify-end gap-3 items-center">
        <button id="btn-remove-icon" class="px-4 py-2 text-red-600 hover:bg-red-50 rounded font-semibold transition border border-transparent mr-auto text-sm">🗑️ Remove Specific Icon</button>
        <button id="btn-modal-cancel" class="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-100 rounded font-semibold transition">Cancel</button>
        <button id="btn-modal-save" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow font-bold transition">Apply Options</button>
      </div>
    </dialog>
  `;

  attachEventListeners();
  syncCells();
}

function attachEventListeners() {
  document.getElementById('slider-cols').addEventListener('input', e => {
    state.cols = parseInt(e.target.value);
    document.getElementById('val-cols').textContent = state.cols;
    checkPrintWarning();
    syncCells();
  });

  document.getElementById('slider-rows').addEventListener('input', e => {
    state.rows = parseInt(e.target.value);
    document.getElementById('val-rows').textContent = state.rows;
    checkPrintWarning();
    syncCells();
  });

  document.getElementById('input-title').addEventListener('input', e => {
    state.title = e.target.value;
    document.getElementById('board-display-title').textContent = state.title;
  });

  // Mode Buttons
  document.getElementById('btn-mode-edit').addEventListener('click', () => setMode('edit'));
  document.getElementById('btn-mode-use').addEventListener('click', () => setMode('use'));

  // Templates
  document.getElementById('btn-template-cafe').addEventListener('click', loadCafeTemplate);
  document.getElementById('btn-template-clear').addEventListener('click', () => { 
    if(confirm("Clear the entire board?")) clearBoard(); 
  });

  // Modal
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);
  document.getElementById('btn-modal-save').addEventListener('click', saveModalDetails);
  
  // Icon remove
  document.getElementById('btn-remove-icon').addEventListener('click', () => {
    const cell = state.cells.find(c => c.id === state.activeCellId);
    if(cell) {
      cell.image = '';
      saveModalDetails();
    }
  });

  // Presets
  document.querySelectorAll('.preset-color').forEach(btn => {
    btn.addEventListener('click', e => {
      document.getElementById('cell-color').value = e.target.dataset.color;
    });
  });

  // Icon Search
  document.getElementById('btn-search-icon').addEventListener('click', searchIcons);
  document.getElementById('icon-search-input').addEventListener('keydown', e => {
    if(e.key === 'Enter') searchIcons();
  });

  // Image Upload
  document.getElementById('input-upload-image').addEventListener('change', handleImageUpload);

  // Print & Save & Load
  document.getElementById('btn-print').addEventListener('click', () => window.print());
  document.getElementById('btn-export-json').addEventListener('click', exportJSON);
  document.getElementById('input-import-json').addEventListener('change', importJSON);
}

function checkPrintWarning() {
  const warning = document.getElementById('print-warning');
  if (state.cols > 6 || state.rows > 6 || (state.cols > 8 && state.rows > 4)) {
    warning.classList.remove('hidden');
  } else {
    warning.classList.add('hidden');
  }
}

function setMode(mode) {
  state.mode = mode;
  const btnEdit = document.getElementById('btn-mode-edit');
  const btnUse = document.getElementById('btn-mode-use');
  const settingsPanel = document.getElementById('panel-settings');
  const templatesPanel = document.getElementById('panel-templates');

  if (mode === 'edit') {
    btnEdit.className = "flex-1 py-2 font-semibold text-sm rounded-md bg-white border shadow-sm transition-colors text-blue-600 border-blue-200";
    btnUse.className = "flex-1 py-2 font-semibold text-sm rounded-md transition-colors text-gray-600 hover:text-gray-900";
    settingsPanel.classList.remove('opacity-50', 'pointer-events-none');
    templatesPanel.classList.remove('opacity-50', 'pointer-events-none');
  } else {
    btnUse.className = "flex-1 py-2 font-semibold text-sm rounded-md bg-white border shadow-sm transition-colors text-blue-600 border-blue-200";
    btnEdit.className = "flex-1 py-2 font-semibold text-sm rounded-md transition-colors text-gray-600 hover:text-gray-900";
    settingsPanel.classList.add('opacity-50', 'pointer-events-none');
    templatesPanel.classList.add('opacity-50', 'pointer-events-none');
  }
  renderGrid();
}

/** SYNCHRONIZE CELLS TO GRID SIZE */
function syncCells() {
  const totalSlots = state.rows * state.cols;
  // Prune excess cells
  if (state.cells.length > totalSlots) {
    state.cells = state.cells.slice(0, totalSlots);
  }
  // Add missing cells
  while (state.cells.length < totalSlots) {
    state.cells.push({ 
      id: "cell_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7), 
      ...DEFAULT_CELL 
    });
  }
  renderGrid();
}

/** RENDER MAIN GRID */
function renderGrid() {
  const gridEl = document.getElementById('grid');
  gridEl.style.gridTemplateColumns = `repeat(${state.cols}, minmax(0, 1fr))`;
  gridEl.style.gridTemplateRows = `repeat(${state.rows}, minmax(0, 1fr))`;
  gridEl.innerHTML = '';

  state.cells.forEach((cell, idx) => {
    const el = document.createElement('button');
    // Common cell styles
    el.className = `flex flex-col items-center justify-center p-2 border-2 transition-transform overflow-hidden relative break-inside-avoid print:p-1 w-full h-full`;
    el.style.backgroundColor = cell.bgColor;
    el.style.borderColor = `darken(${cell.bgColor}, 20%)`; // simple fallback
    
    // Slight shadow or hover effect depending on mode
    if (state.mode === 'edit') {
      el.classList.add('hover:ring-4', 'ring-blue-300', 'cursor-pointer', 'rounded-lg');
    } else {
      el.classList.add('hover:scale-[1.02]', 'cursor-pointer', 'rounded-xl', 'shadow-sm', 'print:shadow-none');
    }

    el.onclick = () => handleCellClick(cell);

    // Apply specific text color to the full button container
    el.style.color = cell.textColor || "#000000";

    // Image Element
    if (cell.image) {
      const img = document.createElement('img');
      img.src = cell.image;
      img.onerror = () => { img.style.display = 'none'; };
      img.className = "flex-1 w-full max-h-[70%] object-contain mb-1 pointer-events-none"; 
      el.appendChild(img);
    }

    // Text Element
    const textSpan = document.createElement('span');
    textSpan.textContent = cell.text || (state.mode === 'edit' ? "+" : "");
    if (!cell.image) textSpan.classList.add('my-auto'); // center text if no image
    
    // Scale text based on grid denseness
    const total = state.rows * state.cols;
    if (total <= 9) textSpan.className += " text-xl md:text-3xl print:text-2xl font-bold uppercase tracking-tight";
    else if (total <= 20) textSpan.className += " text-lg md:text-xl print:text-xl font-bold uppercase";
    else textSpan.className += " text-sm md:text-base print:text-sm font-semibold uppercase";

    el.appendChild(textSpan);
    gridEl.appendChild(el);
  });
}

/** HANDLING INTERACTIONS */
function handleCellClick(cell) {
  if (state.mode === 'edit') {
    openModal(cell);
  } else {
    // Web Speech API
    if (cell.text && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // clear queue
      const utterance = new SpeechSynthesisUtterance(cell.text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
    // Add visual flash
    const idx = state.cells.findIndex(c => c.id === cell.id);
    const node = document.getElementById('grid').childNodes[idx];
    if(node) {
      const oldBg = node.style.backgroundColor;
      node.style.backgroundColor = '#60a5fa'; // Flash blue
      setTimeout(() => { node.style.backgroundColor = oldBg; }, 300);
    }
  }
}

/** MODAL OPERATIONS */
function openModal(cell) {
  state.activeCellId = cell.id;
  const modal = document.getElementById('edit-modal');
  
  // Reset modal state
  document.getElementById('cell-text').value = cell.text || "";
  document.getElementById('cell-color').value = cell.bgColor || "#ffffff";
  document.getElementById('cell-text-color').value = cell.textColor || "#000000";
  document.getElementById('icon-results').innerHTML = '<p class="col-span-full text-center text-sm text-gray-400 mt-16 italic">Search to find symbols...</p>';
  document.getElementById('icon-search-input').value = "";
  document.getElementById('input-upload-image').value = ""; // clear file input
  
  modal.classList.remove('hidden');
  modal.showModal();
}

function closeModal() {
  const modal = document.getElementById('edit-modal');
  modal.close();
  modal.classList.add('hidden');
  state.activeCellId = null;
}

function saveModalDetails() {
  if(!state.activeCellId) return closeModal();
  
  const cell = state.cells.find(c => c.id === state.activeCellId);
  if (cell) {
    cell.text = document.getElementById('cell-text').value.trim();
    cell.bgColor = document.getElementById('cell-color').value;
    cell.textColor = document.getElementById('cell-text-color').value;
    // Image is updated immediately when clicked in search results to provide quick feedback
  }
  
  renderGrid();
  closeModal();
}

/** API INTEGRATION - OPENSYMBOLS */
async function searchIcons() {
  const query = document.getElementById('icon-search-input').value.trim();
  if(!query) return;
  const resEl = document.getElementById('icon-results');
  resEl.innerHTML = '<p class="text-blue-500 font-semibold p-4 col-span-full text-center">Searching OpenSymbols...</p>';
  
  try {
    const url = `https://www.opensymbols.org/api/v2/symbols?q=${encodeURIComponent(query)}&locale=en`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("API failed");
    
    let data = await response.json();
    let items = Array.isArray(data) ? data : (data.symbols || data.items || []);
    
    resEl.innerHTML = '';
    if(items.length === 0) {
      resEl.innerHTML = '<p class="text-gray-500 p-4 col-span-full text-center">No results found.</p>';
      return;
    }
    
    items.slice(0, 30).forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'border p-1 bg-white hover:bg-blue-100 ring-1 ring-transparent hover:ring-blue-400 transition-all rounded aspect-square flex flex-col items-center justify-center overflow-hidden';
      // Use img.src
      btn.innerHTML = `<img src="${item.image_url}" crossorigin="anonymous" class="w-full h-full object-contain pointer-events-none" />`;
      
      btn.onclick = async (e) => {
        // Show loading state inline
        resEl.innerHTML = '<div class="col-span-full flex justify-center items-center h-full p-4"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><span class="ml-3 text-blue-600 font-semibold">Processing Image...</span></div>';
        await applyImage(item.image_url);
        // Automatically save and close after a successful pick (common UX for AAC builders)
        saveModalDetails();
      };
      
      resEl.appendChild(btn);
    });
  } catch(e) {
    console.error(e);
    resEl.innerHTML = '<p class="text-red-500 p-4 col-span-full text-center">Error fetching symbols.</p>';
  }
}

/** IMAGE PROCESSING (Canvas Base64 conversion for self-contained exports) */
async function applyImage(urlOrBlob) {
  try {
    const isFile = urlOrBlob instanceof File;
    const url = isFile ? URL.createObjectURL(urlOrBlob) : urlOrBlob;
    
    // To cleanly bypass simple CORS limits, fetch the blob directly if it's an external URL 
    let finalSrc = url;
    if (!isFile && url.startsWith('http')) {
       try {
           const res = await fetch(url);
           const blob = await res.blob();
           finalSrc = URL.createObjectURL(blob);
       } catch (e) {
           console.warn("Proxy blob fetch failed, falling back to direct URL (crossOrigin may fail)", e);
       }
    }

    const base64Data = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // Limits
        const max = 512;
        let {width, height} = img;
        if (width > max || height > max) {
            if (width > height) { height = Math.round(max * height / width); width = max; }
            else { width = Math.round(max * width / height); height = max; }
        }
        canvas.width = width; canvas.height = height;
        // Draw transparent/PNG compatible
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/png'));
        
        // Clean up object URLs
        if(finalSrc.startsWith('blob:')) URL.revokeObjectURL(finalSrc);
      };
      img.onerror = (e) => reject("Image failed to load via Canvas");
      img.src = finalSrc;
    });

    const activeCell = state.cells.find(c => c.id === state.activeCellId);
    if(activeCell) activeCell.image = base64Data;
    
  } catch(err) {
    console.error("Canvas processing failed", err);
    // Fallback: strictly assign the URL itself, might fail JSON export embedding
    if (typeof urlOrBlob === 'string') {
        const activeCell = state.cells.find(c => c.id === state.activeCellId);
        if(activeCell) activeCell.image = urlOrBlob;
    } else {
        alert("Could not process local image.");
    }
  }
}

async function handleImageUpload(e) {
  const file = e.target.files[0];
  if(!file) return;
  document.getElementById('icon-results').innerHTML = '<div class="col-span-full flex justify-center items-center h-full p-4"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><span class="ml-3 text-blue-600 font-semibold">Processing Upload...</span></div>';
  await applyImage(file);
  saveModalDetails();
}

/** TEMPLATE BOARDS */
function clearBoard() {
  state.cells = state.cells.map(c => ({ id: c.id, ...DEFAULT_CELL }));
  renderGrid();
}

function loadCafeTemplate() {
  document.getElementById('slider-rows').value = 4;
  document.getElementById('slider-cols').value = 5;
  document.getElementById('slider-rows').dispatchEvent(new Event('input'));
  document.getElementById('slider-cols').dispatchEvent(new Event('input'));
  
  state.title = "Cafe Order Board";
  document.getElementById('input-title').value = state.title;
  document.getElementById('board-display-title').textContent = state.title;

  const demoItems = [
    { text: "I want", c: "#dbeafe" }, { text: "Coffee", c: "#fef08a" }, { text: "Tea", c: "#fef08a" }, { text: "Juice", c: "#fef08a" }, { text: "Water", c: "#e0f2fe" },
    { text: "Please", c: "#dcfce3" }, { text: "Hot", c: "#ffedd5" }, { text: "Cold", c: "#e0f2fe" }, { text: "Milk", c: "#f3f4f6" }, { text: "Sugar", c: "#f3f4f6" },
    { text: "Yes", c: "#dcfce3" }, { text: "No", c: "#fee2e2" }, { text: "Stop", c: "#fee2e2" }, { text: "Thank You", c: "#dcfce3" }, { text: "More", c: "#dbeafe" },
    { text: "Food", c: "#fef08a" }, { text: "Sandwich", c: "#fef08a" }, { text: "Cake", c: "#fef08a" }, { text: "Small", c: "#f3e8ff" }, { text: "Large", c: "#f3e8ff" }
  ];

  // Try to load basic text quickly, images can be added later by user locally
  state.cells.forEach((cell, i) => {
    if(demoItems[i]) {
      cell.text = demoItems[i].text;
      cell.bgColor = demoItems[i].c;
      cell.image = ""; // Clears existing base64
    }
  });

  renderGrid();
}

/** JSON IMPORT EXPORT */
function exportJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", (state.title || "AAC_Board").replace(/\\s+/g, '_') + ".json");
  document.body.appendChild(dlAnchorElem);
  dlAnchorElem.click();
  dlAnchorElem.remove();
}

function importJSON(e) {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const loaded = JSON.parse(event.target.result);
      if(loaded.cells && Array.isArray(loaded.cells)) {
        state = { ...state, ...loaded };
        
        // Setup UI to match
        document.getElementById('input-title').value = state.title;
        document.getElementById('board-display-title').textContent = state.title;
        document.getElementById('slider-cols').value = state.cols;
        document.getElementById('val-cols').textContent = state.cols;
        document.getElementById('slider-rows').value = state.rows;
        document.getElementById('val-rows').textContent = state.rows;
        
        syncCells();
        checkPrintWarning();
      } else {
        alert("Invalid board format.");
      }
    } catch(err) {
      alert("Failed to parse JSON.");
    }
    // reset input
    e.target.value = '';
  };
  reader.readAsText(file);
}

// Kickoff
document.addEventListener('DOMContentLoaded', initApp);
