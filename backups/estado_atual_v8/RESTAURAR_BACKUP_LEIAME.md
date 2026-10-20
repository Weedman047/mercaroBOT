# 🛡️ Backup Completo do Projeto Mercaro / BuscaPreço (V8)

Este diretório contém a cópia integral e blindada de **todo o estado do projeto**:
1. **Códigos-fonte completos** (`index.html`, `robo.js`, `scripts/extrator-cloud.mjs`, `icone.png`)
2. **Configurações de Nuvem e Deploy** (`netlify.toml`, `.github/workflows/robo-koch.yml`, `package.json`, `.gitignore`)
3. **Banco de Dados Firebase Completo** (`firebase_db/firebase_raiz_completo.json` e `firebase_db/koch_loja_1408.json`)

---

## 🔗 Endereços e Configurações Oficiais Salvas

- **Repositório Git / GitHub:** `https://github.com/Weedman047/mercaroBOT.git`
- **Branch Principal:** `main`
- **Branch / Tag de Backup no Git:** `backup-estavel-v8` / Tag `v8.0-backup-seguro`
- **Banco de Dados Firebase (Realtime Database):** `https://mercaro-e6035-default-rtdb.firebaseio.com/`
  - **Catálogo de Produtos:** `https://mercaro-e6035-default-rtdb.firebaseio.com/koch_loja_1408.json`
  - **Telemetria Ao Vivo do Robô:** `https://mercaro-e6035-default-rtdb.firebaseio.com/robo_controle/telemetria.json`
  - **Comandos Remotos (Celular/Web):** `https://mercaro-e6035-default-rtdb.firebaseio.com/robo_controle/comandos.json`
- **Configuração Netlify (`netlify.toml`):**
  - Publish directory: `.` (raiz)
  - Build command: `echo 'Deploy estático BuscaPreço + Central do Robô concluído!'`

---

## 🔄 Como Restaurar Qualquer Parte (Se Precisar no Futuro)

### 1. Restaurar os Arquivos de Código e Configurações
Basta copiar o conteúdo da pasta `codigo_e_configs/` de volta para a raiz `c:\Users\Jelado\Desktop\mercaro\`, ou rodar pelo Git:
```powershell
git checkout backup-estavel-v8
```

### 2. Restaurar o Banco de Dados Firebase Inteiro (`koch_loja_1408`)
Caso um dia queira restaurar os produtos salvos neste backup diretamente para o Firebase, basta executar no PowerShell:
```powershell
Invoke-RestMethod -Uri "https://mercaro-e6035-default-rtdb.firebaseio.com/koch_loja_1408.json" -Method Put -InFile "backups\estado_atual_v8\firebase_db\koch_loja_1408.json" -ContentType "application/json; charset=utf-8"
```
