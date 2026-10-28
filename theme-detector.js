const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

function sendTheme() {
  try {
    chrome.runtime.sendMessage({
      type: 'THEME_CHANGED',
      isDark: mediaQuery.matches
    }).catch(() => {});
  } catch (e) {
    // Contexto da extensão pode estar temporariamente inválido
  }
}

// Envia o tema atual ao carregar a página
sendTheme();

// Escuta alterações dinâmicas do tema no navegador/sistema
mediaQuery.addEventListener('change', sendTheme);
