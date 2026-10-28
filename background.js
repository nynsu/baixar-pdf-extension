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
      // Dicionário de traduções (pt, en, es)
      const translations = {
        pt: {
          appNotFound: "O objeto PDFViewerApplication não foi encontrado nesta página.",
          title: "Exportar PDF",
          filenameLabel: "Nome do arquivo:",
          cropCheck: "Cortar borda da página",
          cropSideLabel: "Lado a cortar:",
          sides: {
            esquerda: "Esquerda",
            direita: "Direita",
            topo: "Topo (Superior)",
            baixo: "Baixo (Inferior)"
          },
          cropAmountLabel: "Quantidade (mm):",
          cancelBtn: "Cancelar",
          downloadBtn: "Baixar",
          processing: "Processando...",
          libError: "Erro ao carregar a biblioteca de PDF.",
          generateError: "Erro ao gerar o arquivo: "
        },
        en: {
          appNotFound: "The PDFViewerApplication object was not found on this page.",
          title: "Export PDF",
          filenameLabel: "File name:",
          cropCheck: "Crop page margin",
          cropSideLabel: "Side to crop:",
          sides: {
            esquerda: "Left",
            direita: "Right",
            topo: "Top (Upper)",
            baixo: "Bottom (Lower)"
          },
          cropAmountLabel: "Amount (mm):",
          cancelBtn: "Cancel",
          downloadBtn: "Download",
          processing: "Processing...",
          libError: "Failed to load PDF library.",
          generateError: "Error generating file: "
        },
        es: {
          appNotFound: "No se encontró el objeto PDFViewerApplication en esta página.",
          title: "Exportar PDF",
          filenameLabel: "Nombre del archivo:",
          cropCheck: "Recortar borde de la página",
          cropSideLabel: "Lado a recortar:",
          sides: {
            esquerda: "Izquierda",
            direita: "Derecha",
            topo: "Superior (Arriba)",
            baixo: "Inferior (Abajo)"
          },
          cropAmountLabel: "Cantidad (mm):",
          cancelBtn: "Cancelar",
          downloadBtn: "Descargar",
          processing: "Procesando...",
          libError: "Error al cargar la biblioteca de PDF.",
          generateError: "Error al generar el archivo: "
        }
      };

      // Detecta o idioma do navegador
      const userLang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
      let lang = "en";
      if (userLang.startsWith("pt")) lang = "pt";
      else if (userLang.startsWith("es")) lang = "es";

      const t = translations[lang];

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
        ">
          <div style="
            background: #ffffff; padding: 20px 24px; border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3); width: 340px; color: #333;
          ">
            <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #111;">${t.title}</h3>
            
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 5px;">${t.filenameLabel}</label>
            <input type="text" id="pdf-filename" value="documento.pdf" style="
              width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc;
              border-radius: 4px; margin-bottom: 15px; font-size: 14px;
            "/>

            <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="pdf-crop-check" style="cursor: pointer; width: 16px; height: 16px;"/>
              <label for="pdf-crop-check" style="font-size: 14px; cursor: pointer;">${t.cropCheck}</label>
            </div>

            <div id="pdf-crop-options" style="display: none; padding: 10px; background: #f5f5f5; border-radius: 6px; margin-bottom: 15px;">
              <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px;">${t.cropSideLabel}</label>
              <select id="pdf-crop-side" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 10px;">
                <option value="esquerda">${t.sides.esquerda}</option>
                <option value="direita">${t.sides.direita}</option>
                <option value="topo">${t.sides.topo}</option>
                <option value="baixo">${t.sides.baixo}</option>
              </select>

              <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px;">${t.cropAmountLabel}</label>
              <input type="number" id="pdf-crop-amount" value="6" min="1" step="0.5" style="
                width: 100%; padding: 6px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;
              "/>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button id="pdf-cancel-btn" style="
                padding: 8px 14px; background: #e0e0e0; border: none; border-radius: 4px; cursor: pointer;
              ">${t.cancelBtn}</button>
              <button id="pdf-confirm-btn" style="
                padding: 8px 14px; background: #0066cc; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;
              ">${t.downloadBtn}</button>
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

        confirmBtn.innerText = t.processing;
        confirmBtn.disabled = true;

        try {
          // Garante o carregamento da biblioteca PDFLib
          if (typeof PDFLib === "undefined") {
            await new Promise((resolve, reject) => {
              const script = document.createElement("script");
              script.src = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js";
              script.onload = resolve;
              script.onerror = () => reject(new Error(t.libError));
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
          alert(t.generateError + err.message);
          confirmBtn.innerText = t.downloadBtn;
          confirmBtn.disabled = false;
        }
      });
    }
  });
});
