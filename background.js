function updateIcon(isDark) {
  const iconPath = isDark ? "icon-dark.png" : "icon.png";
  chrome.action.setIcon({ path: iconPath }).catch(() => {});
  chrome.storage.local.set({ isDark }).catch(() => {});
}

function restoreIcon() {
  chrome.storage.local.get("isDark", (data) => {
    if (typeof data.isDark === "boolean") {
      updateIcon(data.isDark);
    }
  });
}

chrome.runtime.onStartup.addListener(restoreIcon);
chrome.runtime.onInstalled.addListener(restoreIcon);

chrome.runtime.onMessage.addListener((message) => {
  if (message && message.type === "THEME_CHANGED") {
    updateIcon(message.isDark);
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;

  const pdfLibUrl = chrome.runtime.getURL("pdf-lib.min.js");

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: "MAIN",
    args: [pdfLibUrl],
    func: async (localPdfLibUrl) => {
      // Dicionário de traduções (pt, es, fallback en)
      const translations = {
        pt: {
          appNotFound: "O objeto PDFViewerApplication não foi encontrado nesta página.",
          title: "Exportar PDF",
          filenameLabel: "Nome do arquivo:",
          cropCheck: "Cortar bordas da página",
          previewLabel: "Visualização do corte:",
          cutAreaLegend: "Área vermelha = corte",
          loadingPreview: "Carregando página...",
          pageSelectLabel: "Página de visualização:",
          pageOf: "de",
          sides: {
            top: "Topo (mm):",
            bottom: "Inferior (mm):",
            left: "Esquerda (mm):",
            right: "Direita (mm):"
          },
          cancelBtn: "Cancelar",
          downloadBtn: "Baixar",
          processing: "Processando...",
          libError: "Erro ao carregar a biblioteca local de PDF.",
          generateError: "Erro ao gerar o arquivo: "
        },
        en: {
          appNotFound: "The PDFViewerApplication object was not found on this page.",
          title: "Export PDF",
          filenameLabel: "File name:",
          cropCheck: "Crop page margins",
          previewLabel: "Crop preview:",
          cutAreaLegend: "Red area = cut",
          loadingPreview: "Loading page...",
          pageSelectLabel: "Preview page:",
          pageOf: "of",
          sides: {
            top: "Top (mm):",
            bottom: "Bottom (mm):",
            left: "Left (mm):",
            right: "Right (mm):"
          },
          cancelBtn: "Cancel",
          downloadBtn: "Download",
          processing: "Processing...",
          libError: "Failed to load local PDF library.",
          generateError: "Error generating file: "
        },
        es: {
          appNotFound: "No se encontró el objeto PDFViewerApplication en esta página.",
          title: "Exportar PDF",
          filenameLabel: "Nombre del archivo:",
          cropCheck: "Recortar márgenes de la página",
          previewLabel: "Vista previa del recorte:",
          cutAreaLegend: "Área roja = corte",
          loadingPreview: "Cargando página...",
          pageSelectLabel: "Página de vista previa:",
          pageOf: "de",
          sides: {
            top: "Superior (mm):",
            bottom: "Inferior (mm):",
            left: "Izquierda (mm):",
            right: "Derecha (mm):"
          },
          cancelBtn: "Cancelar",
          downloadBtn: "Descargar",
          processing: "Procesando...",
          libError: "Error al cargar la biblioteca local de PDF.",
          generateError: "Error al generar el archivo: "
        }
      };

      // Detecta idioma com fallback para 'en'
      const userLang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
      let lang = "en";
      if (userLang.startsWith("pt")) lang = "pt";
      else if (userLang.startsWith("es")) lang = "es";

      const t = translations[lang] || translations.en;

      if (typeof PDFViewerApplication === "undefined" || !PDFViewerApplication.pdfDocument) {
        alert(t.appNotFound);
        return;
      }

      const totalPages = PDFViewerApplication.pdfDocument.numPages || 1;

      // Remove modal antigo se existir
      const modalAntigo = document.getElementById("pdf-downloader-modal");
      if (modalAntigo) modalAntigo.remove();

      // Cria a estrutura do Modal HTML ampliado (layout em 2 colunas para telas médias/grandes)
      const modal = document.createElement("div");
      modal.id = "pdf-downloader-modal";
      modal.innerHTML = `
        <div style="
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0, 0, 0, 0.6); z-index: 999999; display: flex;
          align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          box-sizing: border-box; padding: 20px;
        ">
          <div style="
            background: #ffffff; padding: 24px 28px; border-radius: 12px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.35); width: 850px; max-width: 96vw; color: #333;
            box-sizing: border-box; max-height: 94vh; overflow-y: auto;
          ">
            <!-- Cabeçalho -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid #f0f0f0; padding-bottom: 12px;">
              <h3 style="margin: 0; font-size: 20px; color: #111; font-weight: 700;">${t.title}</h3>
              <div style="font-size: 13px; color: #666; font-weight: 500;">Total: ${totalPages} páginas</div>
            </div>

            <!-- Corpo em 2 Colunas -->
            <div style="display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start;">
              
              <!-- Coluna da Esquerda: Configurações e Cortes -->
              <div style="flex: 1 1 300px; min-width: 280px;">
                <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #444;">${t.filenameLabel}</label>
                <input type="text" id="pdf-filename" value="documento.pdf" style="
                  width: 100%; padding: 9px 12px; box-sizing: border-box; border: 1px solid #ced4da;
                  border-radius: 6px; margin-bottom: 16px; font-size: 14px; outline: none;
                "/>

                <div style="margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                  <input type="checkbox" id="pdf-crop-check" style="cursor: pointer; width: 18px; height: 18px; accent-color: #0066cc;"/>
                  <label for="pdf-crop-check" style="font-size: 14px; cursor: pointer; font-weight: 600; color: #222;">${t.cropCheck}</label>
                </div>

                <div id="pdf-crop-options" style="display: none; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 16px;">
                  <div style="font-size: 12px; font-weight: 700; color: #495057; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                    Margens de Corte (mm)
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div>
                      <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #495057;">${t.sides.top}</label>
                      <input type="number" id="pdf-crop-top" value="0" min="0" step="0.5" style="width: 100%; padding: 7px 10px; box-sizing: border-box; border: 1px solid #ced4da; border-radius: 5px; font-size: 13px;"/>
                    </div>
                    <div>
                      <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #495057;">${t.sides.bottom}</label>
                      <input type="number" id="pdf-crop-bottom" value="0" min="0" step="0.5" style="width: 100%; padding: 7px 10px; box-sizing: border-box; border: 1px solid #ced4da; border-radius: 5px; font-size: 13px;"/>
                    </div>
                    <div>
                      <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #495057;">${t.sides.left}</label>
                      <input type="number" id="pdf-crop-left" value="0" min="0" step="0.5" style="width: 100%; padding: 7px 10px; box-sizing: border-box; border: 1px solid #ced4da; border-radius: 5px; font-size: 13px;"/>
                    </div>
                    <div>
                      <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #495057;">${t.sides.right}</label>
                      <input type="number" id="pdf-crop-right" value="0" min="0" step="0.5" style="width: 100%; padding: 7px 10px; box-sizing: border-box; border: 1px solid #ced4da; border-radius: 5px; font-size: 13px;"/>
                    </div>
                  </div>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 20px;">
                  <button id="pdf-cancel-btn" style="
                    flex: 1; padding: 10px 16px; background: #e9ecef; color: #333; border: 1px solid #ced4da;
                    border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;
                  ">${t.cancelBtn}</button>
                  <button id="pdf-confirm-btn" style="
                    flex: 1.5; padding: 10px 18px; background: #0066cc; color: #fff; border: none;
                    border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 14px;
                  ">${t.downloadBtn}</button>
                </div>
              </div>

              <!-- Coluna da Direita: Área de Preview Grande com Seletor de Página -->
              <div id="pdf-preview-column" style="display: none; flex: 1.2 1 420px; min-width: 320px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 10px; padding: 16px; box-sizing: border-box;">
                
                <!-- Barra superior do Preview: Seletor de Página e Legenda -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 10px; flex-wrap: wrap;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-size: 12px; font-weight: 600; color: #444;">${t.pageSelectLabel}</label>
                    <div style="display: flex; align-items: center; gap: 4px;">
                      <button id="pdf-prev-page" style="padding: 3px 8px; border: 1px solid #ced4da; background: #fff; border-radius: 4px; cursor: pointer; font-weight: bold;">◀</button>
                      <input type="number" id="pdf-page-num" value="1" min="1" max="${totalPages}" style="width: 50px; text-align: center; padding: 4px; border: 1px solid #ced4da; border-radius: 4px; font-size: 13px; font-weight: 600;"/>
                      <span style="font-size: 12px; color: #666;">/ ${totalPages}</span>
                      <button id="pdf-next-page" style="padding: 3px 8px; border: 1px solid #ced4da; background: #fff; border-radius: 4px; cursor: pointer; font-weight: bold;">▶</button>
                    </div>
                  </div>

                  <span style="font-size: 11px; color: #dc3545; font-weight: 700; background: #ffebee; padding: 4px 8px; border-radius: 4px; border: 1px solid #ffcdd2;">
                    ${t.cutAreaLegend}
                  </span>
                </div>

                <!-- Contêiner Centralizado da Folha -->
                <div style="
                  display: flex; justify-content: center; align-items: center;
                  background: #eaedf0; border-radius: 8px; padding: 20px 10px;
                  min-height: 480px; position: relative; overflow: hidden;
                ">
                  <div id="pdf-preview-loading" style="font-size: 13px; color: #555; font-weight: 600;">
                    ${t.loadingPreview}
                  </div>

                  <div id="pdf-preview-wrapper" style="
                    display: none; position: relative; background: #ffffff;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.3); overflow: hidden; border: 1px solid #ced4da;
                  ">
                    <canvas id="pdf-preview-canvas" style="display: block;"></canvas>
                    
                    <!-- Faixas de corte vermelhas -->
                    <div id="cut-mask-top" style="position: absolute; top: 0; left: 0; right: 0; height: 0; background: rgba(220, 53, 69, 0.45); border-bottom: 2px dashed #dc3545; pointer-events: none; box-sizing: border-box;"></div>
                    <div id="cut-mask-bottom" style="position: absolute; bottom: 0; left: 0; right: 0; height: 0; background: rgba(220, 53, 69, 0.45); border-top: 2px dashed #dc3545; pointer-events: none; box-sizing: border-box;"></div>
                    <div id="cut-mask-left" style="position: absolute; top: 0; bottom: 0; left: 0; width: 0; background: rgba(220, 53, 69, 0.45); border-right: 2px dashed #dc3545; pointer-events: none; box-sizing: border-box;"></div>
                    <div id="cut-mask-right" style="position: absolute; top: 0; bottom: 0; right: 0; width: 0; background: rgba(220, 53, 69, 0.45); border-left: 2px dashed #dc3545; pointer-events: none; box-sizing: border-box;"></div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Elementos do modal
      const cropCheck = document.getElementById("pdf-crop-check");
      const cropOptions = document.getElementById("pdf-crop-options");
      const previewColumn = document.getElementById("pdf-preview-column");
      const cancelBtn = document.getElementById("pdf-cancel-btn");
      const confirmBtn = document.getElementById("pdf-confirm-btn");

      const inputTop = document.getElementById("pdf-crop-top");
      const inputBottom = document.getElementById("pdf-crop-bottom");
      const inputLeft = document.getElementById("pdf-crop-left");
      const inputRight = document.getElementById("pdf-crop-right");

      const previewLoading = document.getElementById("pdf-preview-loading");
      const previewWrapper = document.getElementById("pdf-preview-wrapper");
      const previewCanvas = document.getElementById("pdf-preview-canvas");

      const pageNumInput = document.getElementById("pdf-page-num");
      const prevPageBtn = document.getElementById("pdf-prev-page");
      const nextPageBtn = document.getElementById("pdf-next-page");

      const maskTop = document.getElementById("cut-mask-top");
      const maskBottom = document.getElementById("cut-mask-bottom");
      const maskLeft = document.getElementById("cut-mask-left");
      const maskRight = document.getElementById("cut-mask-right");

      let currentPageIndex = 1;
      let pagePtWidth = 595.28;
      let pagePtHeight = 841.89;
      let canvasDisplayWidth = 350;
      let canvasDisplayHeight = 495;
      let isRendering = false;

      async function renderPage(num) {
        if (num < 1) num = 1;
        if (num > totalPages) num = totalPages;
        currentPageIndex = num;
        pageNumInput.value = num;

        if (isRendering) return;
        isRendering = true;

        previewLoading.style.display = "block";
        previewLoading.innerText = t.loadingPreview;
        previewWrapper.style.display = "none";

        try {
          const page = await PDFViewerApplication.pdfDocument.getPage(num);
          const viewportBase = page.getViewport({ scale: 1 });
          pagePtWidth = viewportBase.width;
          pagePtHeight = viewportBase.height;

          // Área ampliada do preview: máx 420px de largura e 560px de altura
          const maxPreviewW = 420;
          const maxPreviewH = 560;

          // Proporção base de exibição na tela (CSS pixels)
          const scaleRatio = Math.min(maxPreviewW / pagePtWidth, maxPreviewH / pagePtHeight);
          canvasDisplayWidth = Math.round(pagePtWidth * scaleRatio);
          canvasDisplayHeight = Math.round(pagePtHeight * scaleRatio);

          // Fator de escala em alta definição (HiDPI / Retina): mínimo de 2x para nitidez nítida dos textos
          const dpr = Math.max(window.devicePixelRatio || 1, 2);

          // O canvas interno é renderizado em resolução ultra nítida (HiDPI)
          const viewportHiDPI = page.getViewport({ scale: scaleRatio * dpr });
          previewCanvas.width = Math.round(viewportHiDPI.width);
          previewCanvas.height = Math.round(viewportHiDPI.height);

          // Mas o tamanho exibido na tela é ajustado via CSS, mantendo as proporções e bordas perfeitas
          previewCanvas.style.width = `${canvasDisplayWidth}px`;
          previewCanvas.style.height = `${canvasDisplayHeight}px`;
          previewWrapper.style.width = `${canvasDisplayWidth}px`;
          previewWrapper.style.height = `${canvasDisplayHeight}px`;

          const renderContext = {
            canvasContext: previewCanvas.getContext("2d"),
            viewport: viewportHiDPI
          };

          await page.render(renderContext).promise;

          previewLoading.style.display = "none";
          previewWrapper.style.display = "block";
          updatePreview();
        } catch (e) {
          previewLoading.innerText = "Erro ao renderizar página " + num;
        } finally {
          isRendering = false;
        }
      }

      function updatePreview() {
        const topMm = Math.max(0, parseFloat(inputTop.value) || 0);
        const bottomMm = Math.max(0, parseFloat(inputBottom.value) || 0);
        const leftMm = Math.max(0, parseFloat(inputLeft.value) || 0);
        const rightMm = Math.max(0, parseFloat(inputRight.value) || 0);

        const ptTop = topMm * 2.83465;
        const ptBottom = bottomMm * 2.83465;
        const ptLeft = leftMm * 2.83465;
        const ptRight = rightMm * 2.83465;

        const pxPerPtX = canvasDisplayWidth / pagePtWidth;
        const pxPerPtY = canvasDisplayHeight / pagePtHeight;

        const topPx = Math.min(ptTop * pxPerPtY, canvasDisplayHeight / 2);
        const bottomPx = Math.min(ptBottom * pxPerPtY, canvasDisplayHeight / 2);
        const leftPx = Math.min(ptLeft * pxPerPtX, canvasDisplayWidth / 2);
        const rightPx = Math.min(ptRight * pxPerPtX, canvasDisplayWidth / 2);

        maskTop.style.height = `${topPx}px`;
        maskBottom.style.height = `${bottomPx}px`;
        maskLeft.style.width = `${leftPx}px`;
        maskRight.style.width = `${rightPx}px`;
      }

      // Eventos de mudança nos mm de corte
      [inputTop, inputBottom, inputLeft, inputRight].forEach((input) => {
        input.addEventListener("input", updatePreview);
      });

      // Seletor de Página
      prevPageBtn.addEventListener("click", () => {
        if (currentPageIndex > 1) renderPage(currentPageIndex - 1);
      });

      nextPageBtn.addEventListener("click", () => {
        if (currentPageIndex < totalPages) renderPage(currentPageIndex + 1);
      });

      pageNumInput.addEventListener("change", () => {
        let val = parseInt(pageNumInput.value, 10) || 1;
        renderPage(val);
      });

      // Habilitar/desabilitar opções de corte e preview
      cropCheck.addEventListener("change", () => {
        const isChecked = cropCheck.checked;
        cropOptions.style.display = isChecked ? "block" : "none";
        previewColumn.style.display = isChecked ? "block" : "none";
        if (isChecked) {
          renderPage(currentPageIndex);
        }
      });

      cancelBtn.addEventListener("click", () => {
        modal.remove();
      });

      confirmBtn.addEventListener("click", async () => {
        let filename = document.getElementById("pdf-filename").value.trim();
        if (!filename) filename = "documento.pdf";
        if (!filename.toLowerCase().endsWith(".pdf")) filename += ".pdf";

        const aplicarCorte = cropCheck.checked;
        const topMm = Math.max(0, parseFloat(inputTop.value) || 0);
        const bottomMm = Math.max(0, parseFloat(inputBottom.value) || 0);
        const leftMm = Math.max(0, parseFloat(inputLeft.value) || 0);
        const rightMm = Math.max(0, parseFloat(inputRight.value) || 0);

        confirmBtn.innerText = t.processing;
        confirmBtn.disabled = true;

        try {
          if (typeof PDFLib === "undefined") {
            await new Promise((resolve, reject) => {
              const script = document.createElement("script");
              script.src = localPdfLibUrl;
              script.onload = resolve;
              script.onerror = () => reject(new Error(t.libError));
              document.head.appendChild(script);
            });
          }

          const rawData = await PDFViewerApplication.pdfDocument.getData();
          const temCorte = aplicarCorte && (topMm > 0 || bottomMm > 0 || leftMm > 0 || rightMm > 0);

          if (!temCorte) {
            const blob = new Blob([rawData], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);
          } else {
            const pdfDoc = await PDFLib.PDFDocument.load(rawData);
            const pages = pdfDoc.getPages();

            const ptTop = topMm * 2.83465;
            const ptBottom = bottomMm * 2.83465;
            const ptLeft = leftMm * 2.83465;
            const ptRight = rightMm * 2.83465;

            pages.forEach((page) => {
              const { x, y, width, height } = page.getCropBox() || page.getMediaBox();

              const newX = x + ptLeft;
              const newY = y + ptBottom;
              const newWidth = Math.max(1, width - ptLeft - ptRight);
              const newHeight = Math.max(1, height - ptTop - ptBottom);

              page.setCropBox(newX, newY, newWidth, newHeight);
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);
          }

          modal.remove();
        } catch (err) {
          alert(t.generateError + (err && err.message ? err.message : err));
          confirmBtn.innerText = t.downloadBtn;
          confirmBtn.disabled = false;
        }
      });
    }
  });
});
