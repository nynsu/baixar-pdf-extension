# Baixar PDF (Chrome Extension)

Extensão para o Google Chrome desenvolvida em Manifest V3 para exportar e recortar páginas de documentos em visualizadores baseados no **PDF.js** (como visualizadores de normas técnicas, GEDWeb, portais acadêmicos e PDFs web).

## 🚀 Funcionalidades

- **Download Direto:** Extrai o PDF diretamente da memória da aplicação do visualizador (`PDFViewerApplication.pdfDocument`).
- **Recorte de Bordas Personalizado:**
  - Opção para cortar bordas indesejadas (marcas d'água, tarjas laterais, cabeçalhos/rodapés).
  - Seleção de lado: **Esquerda**, **Direita**, **Topo** ou **Baixo**.
  - Definição da margem em **milímetros (mm)**.
- **Nomeação do Arquivo:** Permite definir o nome do arquivo final antes de baixar.
- **Processamento 100% Local:** Os dados do PDF não são enviados para nenhum servidor externo.

## 📦 Como Instalar no Google Chrome

1. Clone ou baixe este repositório no seu computador:
   ```bash
   git clone https://github.com/nynsu/baixar-pdf-extension.git
   ```
2. Abra o Google Chrome e acesse `chrome://extensions/`.
3. No canto superior direito, ative a opção **Modo do desenvolvedor** (Developer mode).
4. Clique no botão **Carregar sem compactação** (Load unpacked) no canto superior esquerdo.
5. Selecione a pasta onde os arquivos da extensão estão salvos.
6. Fixe o ícone da extensão na barra de ferramentas do navegador.

## 🛠️ Tecnologias Utilizadas

- **JavaScript / Chrome Extension API** (Manifest V3)
- **[pdf-lib](https://pdf-lib.js.org/)** para manipulação e recorte das páginas do documento.
