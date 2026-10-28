# Diretrizes do Projeto: Baixar PDF

## Padrão de Versionamento (SemVer)
Para qualquer atualização, release, pacote ou commit de versão:
- Sempre utilize a nomenclatura SemVer completa **`X.X.X`** (MAJOR.MINOR.PATCH) e **nunca** a forma reduzida `X.X`.
- **No código (`manifest.json`):** mantenha `"version": "X.X.X"` (ex: `"2.1.1"`, `"2.2.0"`).
- **Nas tags do Git e títulos de Release:** utilize o prefixo `v` seguido de três números: `vX.X.X` (ex: `v2.1.1`, `v2.2.0`).
- **No pacote ZIP de distribuição:** utilize a nomenclatura `baixar-pdf-vX.X.X.zip` (ex: `baixar-pdf-v2.1.1.zip`).
