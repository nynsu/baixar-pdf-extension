# Diretrizes do Projeto: Baixar PDF

## 1. Fluxo Obrigatório de Versão, Commit e Release
- **NÃO altere a versão prematuramente:** Durante as alterações de código intermediárias e testes, mantenha a versão no `manifest.json` intacta. A versão **NUNCA** deve subir a cada simples interação ou ajuste.
- Após realizar as modificações nos arquivos, apresente apenas o resumo das alterações e instruções para o usuário recarregar e testar a extensão localmente.
- **Gatilho de Minuta:** As minutas de Commit e de Release **NÃO** devem ser apresentadas de imediato. Apresente-as **exclusivamente quando o usuário enviar a mensagem "commit e release"** no chat.
- Ao receber o comando `"commit e release"` do usuário, proponha a nova versão e apresente claramente no chat a minuta completa:
  - **Do Commit:** Título exato e lista de tópicos da mensagem.
  - **Do Release:** Número da versão proposta, nome da tag Git, título do release e o texto completo das notas de lançamento (Release Notes).
- **Momento da Atualização e Publicação:** Prossiga **apenas** quando o usuário ler as minutas e confirmar expressamente a autorização de envio. Nesse instante:
  1. Atualize a `"version"` no `manifest.json`.
  2. Execute o commit e push para o Git.
  3. Crie e envie a tag Git.
  4. Gere o arquivo ZIP e publique a Release no GitHub.

## 2. Padrão de Versionamento (SemVer)
Para qualquer atualização, release, pacote ou commit de versão:
- Sempre utilize a nomenclatura SemVer completa **`X.X.X`** (MAJOR.MINOR.PATCH) e **nunca** a forma reduzida `X.X`.
- **No código (`manifest.json`):** mantenha `"version": "X.X.X"` (ex: `"2.1.1"`, `"2.2.0"`).
- **Nas tags do Git e títulos de Release:** utilize o prefixo `v` seguido de três números: `vX.X.X` (ex: `v2.1.1`, `v2.2.0`).
- **No pacote ZIP de distribuição:** utilize a nomenclatura `baixar-pdf-vX.X.X.zip` (ex: `baixar-pdf-v2.1.1.zip`).

## 3. Padrão de Mensagens de Commit
Os commits devem seguir o seguinte formato:
- **Primeira linha (Título):** Frase em português clara e direta sobre a funcionalidade adicionada ou alterada.
- **Linha em branco.**
- **Corpo do commit:** Itens com marcadores `- `, detalhando as mudanças técnicas ou visuais implementadas.

*Exemplo:*
```text
Suporte a múltiplos idiomas (PT-BR, EN, ES) na interface

- Detecta o idioma ativo no navegador via navigator.language
- Adiciona traduções para Português, Inglês e Espanhol
- Aplica fallback padrão em Inglês para outros idiomas
```

## 4. Padrão de Texto para Releases no GitHub
As notas de Release no GitHub devem começar com o cabeçalho `## 🌐 O que há de novo na vX.X.X` e estruturar os tópicos associando emojis contextualmente relacionados à função ou melhoria descrita em cada linha:

*Exemplo:*
```markdown
## 🌐 O que há de novo na vX.X.X

- 🎨 **Preview Real do Documento:** Janela ampliada renderizando a primeira folha real do PDF com máscara de corte proporcional.
- ⚡ **Carregamento Local:** Biblioteca PDF empacotada localmente para maior velocidade e conformidade com diretrizes de segurança.
- 🌐 **Internacionalização (i18n):** Suporte automático a múltiplos idiomas:
  - 🇧🇷 **Português (pt-BR):** Interface completa em português.
  - 🇪🇸 **Espanhol (es):** Tradução completa.
  - 🇺🇸 **Inglês (en):** Idioma padrão de fallback.
- 🐛 **Correções e Estabilidade:** Ajustes finos de renderização e responsividade.
```
