# 🛡️ BACKUP COMPLETO DO PROJETO E FIREBASE (ESTADO ATUAL V10)
**Data do Backup:** 20/10/2026  
**Commit Git Oficial:** `858ecab5a729f045fe796dd47efebfebeae76285`  
**Branch:** `main` (Repositório: `https://github.com/Weedman047/mercaroBOT.git`)  
**Firebase RTDB:** `https://mercaro-e6035-default-rtdb.firebaseio.com/`

---

## 📦 Conteúdo Deste Ponto de Restauração:
1. **`codigo_e_configs/`**:
   - `index.html` (Interface BuscaPreço + Central do Robô V10 completa com seletor de máquinas, 2A/2B, lote size, proxy, abas Fila/Ao Vivo/Config/Logs)
   - `robo.js` (Script do robô injetável no navegador com todas as configurações sincronizadas)
   - `.github/workflows/robo-koch.yml` (Workflow do GitHub Actions com enxame dinâmico de máquinas matrix)
   - `scripts/extrator-cloud.mjs` (Script dos workers/maestro na nuvem com controle unificado)
   - `netlify.toml` (Configurações de publicação contínua no Netlify)
   - `package.json`, `.gitignore`, `icone.png`

2. **`firebase_db/`**:
   - `koch_loja_1408.json` (Banco de dados completo da loja Koch 1408 com todos os milhares de produtos e históricos intactos)
   - `robo_controle.json` (Estado completo da telemetria, comandos e filas do robô)
   - `firebase_raiz_completo.json` (Cópia espelho de toda a raiz do Firebase)

---

## ⚡ Como Restaurar em 1 Clique:

### 1. Para Restaurar Todo o Código e Configurações (Resetar o Projeto para o V10):
Dê um duplo clique no arquivo:
👉 **`RESTAURAR_CODIGO_E_CONFIGS.bat`**  
*(Ele copia todos os arquivos e pastas deste backup de volta para a raiz do projeto instantaneamente).*

### 2. Para Restaurar o Banco de Dados do Firebase (Subir o estado salvo deste momento):
Dê um duplo clique no arquivo:
👉 **`RESTAURAR_BANCO_FIREBASE.bat`**  
*(Ele envia o `koch_loja_1408.json` e `robo_controle.json` direto para o Firebase usando o curl oficial).*

### 3. Para Restaurar via Git no Terminal:
```bash
git reset --hard 858ecab
git clean -fd
git push origin main --force
```
