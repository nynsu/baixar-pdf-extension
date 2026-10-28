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

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: "MAIN",
    func: async () => {
      if (typeof PDFViewerApplication === "undefined" || !PDFViewerApplication.pdfDocument) {
        alert("O objeto PDFViewerApplication não foi encontrado nesta página.");
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
        ">
          <div style="
            background: #ffffff; padding: 20px 24px; border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3); width: 340px; color: #333;
          ">
            <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #111;">Exportar PDF</h3>
            
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 5px;">Nome do arquivo:</label>
            <input type="text" id="pdf-filename" value="NBR.pdf" style="
              width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc;
              border-radius: 4px; margin-bottom: 15px; font-size: 14px;
            "/>

            <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="pdf-crop-check" style="cursor: pointer; width: 16px; height: 16px;"/>
              <label for="pdf-crop-check" style="font-size: 14px; cursor: pointer;">Cortar borda da página</label>
            </div>

            <div id="pdf-crop-options" style="display: none; padding: 10px; background: #f5f5f5; border-radius: 6px; margin-bottom: 15px;">
              <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px;">Lado a cortar:</label>
              <select id="pdf-crop-side" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 10px;">
                <option value="esquerda">Esquerda</option>
                <option value="direita">Direita</option>
                <option value="topo">Topo (Superior)</option>
                <option value="baixo">Baixo (Inferior)</option>
              </select>

              <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px;">Quantidade (mm):</label>
              <input type="number" id="pdf-crop-amount" value="6" min="1" step="0.5" style="
                width: 100%; padding: 6px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;
              "/>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button id="pdf-cancel-btn" style="
                padding: 8px 14px; background: #e0e0e0; border: none; border-radius: 4px; cursor: pointer;
              ">Cancelar</button>
              <button id="pdf-confirm-btn" style="
                padding: 8px 14px; background: #0066cc; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;
              ">Baixar</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Eventos dos elementos
      const cropCheck = document.getElementById("pdf-crop-check");
      const cropOptions = document.getElementById("pdf-crop-options");
      const cancelBtn = document.getElementById("pdf-cancel-btn");
      const confirmBtn = document.getElementById("pdf-confirm-btn");

      cropCheck.addEventListener("change", () => {
        cropOptions.style.display = cropCheck.checked ? "block" : "none";
      });

      cancelBtn.addEventListener("click", () => {
        modal.remove();
      });

      confirmBtn.addEventListener("click", async () => {
        let filename = document.getElementById("pdf-filename").value.trim();
        if (!filename) filename = "documento.pdf";
        if (!filename.toLowerCase().endsWith(".pdf")) filename += ".pdf";

        const aplicarCorte = cropCheck.checked;
        const lado = document.getElementById("pdf-crop-side").value;
        const mm = parseFloat(document.getElementById("pdf-crop-amount").value) || 0;

        confirmBtn.innerText = "Processando...";
        confirmBtn.disabled = true;

        try {
          // Garante o carregamento da biblioteca PDFLib
          if (typeof PDFLib === "undefined") {
            await new Promise((resolve, reject) => {
              const script = document.createElement("script");
              script.src = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js";
              script.onload = resolve;
              script.onerror = () => reject(new Error("Erro ao carregar a biblioteca de PDF."));
              document.head.appendChild(script);
            });
          }

          const rawData = await PDFViewerApplication.pdfDocument.getData();

          if (!aplicarCorte || mm <= 0) {
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
            const cortePontos = mm * 2.83465; // Converte mm para pontos de PDF

            pages.forEach((page) => {
              const { x, y, width, height } = page.getCropBox() || page.getMediaBox();

              let newX = x, newY = y, newWidth = width, newHeight = height;

              if (lado === "esquerda") {
                newX = x + cortePontos;
                newWidth = width - cortePontos;
              } else if (lado === "direita") {
                newWidth = width - cortePontos;
              } else if (lado === "topo") {
                newHeight = height - cortePontos;
              } else if (lado === "baixo") {
                newY = y + cortePontos;
                newHeight = height - cortePontos;
              }

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
          alert("Erro ao gerar o arquivo: " + err.message);
          confirmBtn.innerText = "Baixar";
          confirmBtn.disabled = false;
        }
      });
    }
  });
});