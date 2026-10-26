# 🛡️ Guia de Restauração em 1 Clique • BuscaPreço (Mercaro)

Este diretório contém o **Único Backup Completo e Atualizado** do projeto **BuscaPreço / Mercaro**, incluindo todo o código-fonte, configurações do GitHub Actions, robôs e todo o banco de dados Firebase Realtime Database.

Data do Backup: 26 de Outubro de 2026.

---

## 📁 O Que Está Salvo Aqui

1. `codigo_e_configs/`:
   * `index.html`: Site principal com vitrine inteligente, comparador de preços lado a lado (SuperKoch ↔ Fort Atacadista), central de controle com senha `1420`, lista de compras e telemetria ao vivo.
   * `robo.js`: Script do robô infiltrado para console do navegador (funciona tanto no SuperKoch quanto no Fort Atacadista).
   * `scripts/extrator-cloud.mjs`: Motor de extração na nuvem via GitHub Actions (com enxame de 1 a 10 máquinas/IPs e motor de vinculação inteligente).
   * `scripts/rotas-mercados.mjs`: Rotas oficiais de categorias (121 rotas do SuperKoch e 140 rotas do Fort Atacadista).
   * `.github/workflows/robo-koch.yml`: Workflow do GitHub Actions para execução paralela na nuvem.
   * `package.json`, `netlify.toml`, `.gitignore`, `icone.png`: Arquivos de configuração e identidade visual.

2. `firebase_db/`:
   * `koch_loja_1408.json`: Catálogo completo do SuperKoch Loja 1408 Itapema (~9.3 MB).
   * `fort_loja_1644.json`: Catálogo completo do Fort Atacadista Loja 1644 Porto Belo (~6.8 MB).
   * `vinculos_produtos.json`: Banco de casamentos inteligentes entre os dois mercados (~873 KB).
   * `robo_controle.json`: Histórico de telemetrias, logs, enxame e comandos (~5.7 MB).
   * `firebase_raiz_completo.json`: Imagem completa de todo o Firebase Realtime Database (~22.8 MB).

3. `ULTIMO_BACKUP_COMPLETO.zip`:
   * Arquivo compactado contendo tudo acima para guardar no Google Drive, pendrive ou onde preferir.

---

## 🚀 Como Restaurar

### Opção A: Restaurar o Código do Projeto (Caso queira voltar os arquivos)
Basta copiar todos os arquivos da pasta `codigo_e_configs` de volta para a raiz do projeto:
```powershell
Copy-Item -Recurse -Force backups\ultimo_backup_completo\codigo_e_configs\* .\
```

### Opção B: Restaurar o Banco Firebase (Caso queira resetar o Firebase)
Basta importar os arquivos JSON da pasta `firebase_db` direto pelo Console do Firebase:
1. Abra o Console: https://console.firebase.google.com/project/mercaro-e6035/database
2. Clique nos 3 pontinhos no canto superior direito do Realtime Database e selecione **"Importar JSON"**.
3. Selecione o arquivo `firebase_raiz_completo.json` para restaurar tudo de uma vez, ou selecione cada arquivo específico (`koch_loja_1408.json`, `fort_loja_1644.json`, etc.).
