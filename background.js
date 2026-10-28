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
      // Dicionário de traduções (pt, es, com fallback automático para en)
      const translations = {
        pt: {
          appNotFound: "O objeto PDFViewerApplication não foi encontrado nesta página.",
          title: "Exportar PDF",
          filenameLabel: "Nome do arquivo:",
          cropCheck: "Cortar bordas da página",
          previewLabel: "Visualização do corte (primeira página):",
          cutAreaLegend: "Área vermelha = corte",
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
          previewLabel: "Crop preview (first page):",
          cutAreaLegend: "Red area = cut",
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
          previewLabel: "Vista previa del recorte (primera página):",
          cutAreaLegend: "Área roja = corte",
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

      // Detecta o idioma do navegador: se começar com pt ou es usa ele, qualquer outro cai no 'en'
      const userLang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
      let lang = "en";
      if (userLang.startsWith("pt")) lang = "pt";
      else if (userLang.startsWith("es")) lang = "es";

      const t = translations[lang] || translations.en;

      if (typeof PDFViewerApplication === "undefined" || !PDFViewerApplication.pdfDocument) {
        alert(t.appNotFound);
        return;
      }

      // Remove modal antigo se existir
      const modalAntigo = document.getElementById("pdf-downloader-modal");
      if (modalAntigo) modalAntigo.remove();

      // Cria a estrutura do Modal HTML
      const modal = document.createElement("div");
      modal.id = "pdf-downloader-modal";
      modal.innerHTML = `
        <div style="
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0, 0, 0, 0.5); z-index: 999999; display: flex;
          align-items: center; justify-content: center; font-family: sans-serif;
          box-sizing: border-box;
        ">
          <div style="
            background: #ffffff; padding: 20px 24px; border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3); width: 380px; max-width: 90vw; color: #333;
            box-sizing: border-box; max-height: 90vh; overflow-y: auto;
          ">
            <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #111;">${t.title}</h3>
            
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 5px;">${t.filenameLabel}</label>
            <input type="text" id="pdf-filename" value="documento.pdf" style="
              width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc;
              border-radius: 4px; margin-bottom: 15px; font-size: 14px;
            "/>

            <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="pdf-crop-check" style="cursor: pointer; width: 16px; height: 16px;"/>
              <label for="pdf-crop-check" style="font-size: 14px; cursor: pointer; font-weight: 500;">${t.cropCheck}</label>
            </div>

            <div id="pdf-crop-options" style="display: none; padding: 12px; background: #f8f9fa; border-radius: 6px; margin-bottom: 15px; border: 1px solid #e9ecef;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                <div>
                  <label style="display: block; font-size: 11px; font-weight: bold; margin-bottom: 4px; color: #555;">${t.sides.top}</label>
                  <input type="number" id="pdf-crop-top" value="0" min="0" step="0.5" style="width: 100%; padding: 6px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;"/>
                </div>
                <div>
                  <label style="display: block; font-size: 11px; font-weight: bold; margin-bottom: 4px; color: #555;">${t.sides.bottom}</label>
                  <input type="number" id="pdf-crop-bottom" value="0" min="0" step="0.5" style="width: 100%; padding: 6px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;"/>
                </div>
                <div>
                  <label style="display: block; font-size: 11px; font-weight: bold; margin-bottom: 4px; color: #555;">${t.sides.left}</label>
                  <input type="number" id="pdf-crop-left" value="0" min="0" step="0.5" style="width: 100%; padding: 6px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;"/>
                </div>
                <div>
                  <label style="display: block; font-size: 11px; font-weight: bold; margin-bottom: 4px; color: #555;">${t.sides.right}</label>
                  <input type="number" id="pdf-crop-right" value="0" min="0" step="0.5" style="width: 100%; padding: 6px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;"/>
                </div>
              </div>

              <!-- Miniatura Interativa de Preview -->
              <div style="border-top: 1px solid #dee2e6; padding-top: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <span style="font-size: 11px; font-weight: bold; color: #444;">${t.previewLabel}</span>
                  <span style="font-size: 10px; color: #dc3545; font-weight: 600;">${t.cutAreaLegend}</span>
                </div>
                <div style="display: flex; justify-content: center; background: #e9ecef; border-radius: 4px; padding: 10px;">
                  <div id="pdf-preview-sheet" style="
                    position: relative; width: 140px; height: 198px; background: #ffffff;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.25); overflow: hidden; border: 1px solid #ced4da;
                  ">
                    <!-- Linhas indicadoras de texto para parecer folha -->
                    <div style="position: absolute; top: 20px; left: 15px; right: 15px; height: 3px; background: #e0e0e0; border-radius: 2px;"></div>
                    <div style="position: absolute; top: 30px; left: 15px; right: 25px; height: 3px; background: #f0f0f0; border-radius: 2px;"></div>
                    <div style="position: absolute; top: 40px; left: 15px; right: 18px; height: 3px; background: #f0f0f0; border-radius: 2px;"></div>
                    <div style="position: absolute; top: 50px; left: 15px; right: 30px; height: 3px; background: #f0f0f0; border-radius: 2px;"></div>
                    
                    <!-- Faixas de corte vermelhas -->
                    <div id="cut-mask-top" style="position: absolute; top: 0; left: 0; right: 0; height: 0; background: rgba(220, 53, 69, 0.45); border-bottom: 1.5px dashed #dc3545; transition: height 0.1s ease; pointer-events: none;"></div>
                    <div id="cut-mask-bottom" style="position: absolute; bottom: 0; left: 0; right: 0; height: 0; background: rgba(220, 53, 69, 0.45); border-top: 1.5px dashed #dc3545; transition: height 0.1s ease; pointer-events: none;"></div>
                    <div id="cut-mask-left" style="position: absolute; top: 0; bottom: 0; left: 0; width: 0; background: rgba(220, 53, 69, 0.45); border-right: 1.5px dashed #dc3545; transition: width 0.1s ease; pointer-events: none;"></div>
                    <div id="cut-mask-right" style="position: absolute; top: 0; bottom: 0; right: 0; width: 0; background: rgba(220, 53, 69, 0.45); border-left: 1.5px dashed #dc3545; transition: width 0.1s ease; pointer-events: none;"></div>
                  </div>
                </div>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button id="pdf-cancel-btn" style="
                padding: 8px 14px; background: #e0e0e0; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;
              ">${t.cancelBtn}</button>
              <button id="pdf-confirm-btn" style="
                padding: 8px 14px; background: #0066cc; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px;
              ">${t.downloadBtn}</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Elementos do modal
      const cropCheck = document.getElementById("pdf-crop-check");
      const cropOptions = document.getElementById("pdf-crop-options");
      const cancelBtn = document.getElementById("pdf-cancel-btn");
      const confirmBtn = document.getElementById("pdf-confirm-btn");

      const inputTop = document.getElementById("pdf-crop-top");
      const inputBottom = document.getElementById("pdf-crop-bottom");
      const inputLeft = document.getElementById("pdf-crop-left");
      const inputRight = document.getElementById("pdf-crop-right");

      const maskTop = document.getElementById("cut-mask-top");
      const maskBottom = document.getElementById("cut-mask-bottom");
      const maskLeft = document.getElementById("cut-mask-left");
      const maskRight = document.getElementById("cut-mask-right");

      // Dimensões da folha de preview em pixels (A4: 210mm x 297mm -> 140px x 198px aprox)
      const previewWidthPx = 140;
      const previewHeightPx = 198;
      // Proporção mm para px no preview (210mm = 140px => ~0.666 px/mm)
      const pxPerMmX = previewWidthPx / 210;
      const pxPerMmY = previewHeightPx / 297;

      function updatePreview() {
        const topMm = Math.max(0, parseFloat(inputTop.value) || 0);
        const bottomMm = Math.max(0, parseFloat(inputBottom.value) || 0);
        const leftMm = Math.max(0, parseFloat(inputLeft.value) || 0);
        const rightMm = Math.max(0, parseFloat(inputRight.value) || 0);

        const topPx = Math.min(topMm * pxPerMmY, previewHeightPx / 2);
        const bottomPx = Math.min(bottomMm * pxPerMmY, previewHeightPx / 2);
        const leftPx = Math.min(leftMm * pxPerMmX, previewWidthPx / 2);
        const rightPx = Math.min(rightMm * pxPerMmX, previewWidthPx / 2);

        maskTop.style.height = `${topPx}px`;
        maskBottom.style.height = `${bottomPx}px`;
        maskLeft.style.width = `${leftPx}px`;
        maskRight.style.width = `${rightPx}px`;
      }

      [inputTop, inputBottom, inputLeft, inputRight].forEach((input) => {
        input.addEventListener("input", updatePreview);
      });

      cropCheck.addEventListener("change", () => {
        cropOptions.style.display = cropCheck.checked ? "block" : "none";
        if (cropCheck.checked) {
          updatePreview();
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
          // Garante o carregamento da biblioteca local PDFLib
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
            // Download sem alterações
            const blob = new Blob([rawData], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);
          } else {
            // Processa o corte
            const pdfDoc = await PDFLib.PDFDocument.load(rawData);
            const pages = pdfDoc.getPages();

            // 1 mm = 72 / 25.4 pontos ~= 2.83465
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
