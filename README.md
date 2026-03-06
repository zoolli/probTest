## 專案操作說明

本專案支援多專案切換與共用測試流程。

### 1. 切換目標專案
在執行測試前，需先指定要測試的專案。此指令會更新根目錄下的 `src` 連結。

```bash
npm run select-project <專案名稱>
```
*範例：`npm run select-project 0002-math`*

### 2. 執行共用測試
切換專案後，即可執行統一的測試流程 `maintTest.ts`。該測試會自動偵測並顯示目前連結的專案。

```bash
npm run test-shared
```

### 3. 其他指令
- `npm run dev`: 執行舊有的 `mainTest.ts` (專案特定)。
- `npm run build`: 編譯 TypeScript 專案。