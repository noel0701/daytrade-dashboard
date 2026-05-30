# Daytrade Bot BI Dashboard

SBI証券 × Claude AI デイトレBotのトレード履歴・保有株式・相場分析を  
PCとスマホで確認できるダッシュボードです。**完全無料で運用できます。**

---

## 📁 フォルダ構成

```
daytrade_dashboard/
├── public/
│   └── data.json          ← ログから自動生成（Gitで管理）
├── scripts/
│   └── log_to_json.py     ← ログ→JSON変換スクリプト
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   └── Dashboard.jsx      ← ダッシュボード本体
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── update_data.bat        ← ワンクリック更新スクリプト（Windows）
└── README.md
```

---

## 🚀 セットアップ手順

### ステップ1: GitHubにリポジトリを作る

1. https://github.com にアクセスしてログイン（アカウントがなければ無料で作成）
2. 右上の「+」→「New repository」をクリック
3. Repository name: `daytrade-dashboard`
4. Public を選択（Vercel無料枠はPublicが条件）
5. 「Create repository」をクリック

### ステップ2: このフォルダをGitHubにアップロード

コマンドプロンプトで実行：

```bat
cd C:\Users\Owner\Desktop\claude\daytrade_dashboard

git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/daytrade-dashboard.git
git push -u origin main
```

### ステップ3: Vercelにデプロイ

1. https://vercel.com にアクセスしてGitHubアカウントでログイン
2. 「Add New Project」をクリック
3. `daytrade-dashboard` リポジトリを選択
4. そのまま「Deploy」をクリック
5. 1〜2分でデプロイ完了 → URLが発行されます

**例: `https://daytrade-dashboard-xxx.vercel.app`**

---

## 🔄 データ更新方法

### 手動更新（シンプル）

```bat
REM update_data.bat をダブルクリックするだけ
C:\Users\Owner\Desktop\claude\daytrade_dashboard\update_data.bat
```

ログを読んで `data.json` を生成し、GitHubにpushします。  
Vercelが自動でデプロイを開始し、約1分でサイトに反映されます。

### ログファイルのパスを変える場合

`update_data.bat` の以下の部分を編集してください：

```bat
SET BOT_DIR=C:\Users\Owner\Desktop\claude\daytrade_bot
SET DASH_DIR=C:\Users\Owner\Desktop\claude\daytrade_dashboard
```

### 新しいログを追加する場合

`update_data.bat` の `--logs` の行に追加してください：

```bat
python scripts\log_to_json.py ^
  --logs logs\20260527.log ^
        logs\20260528.log ^
        logs\20260529.log ^
        logs\20260530.log ^  ← 追加
  --output public\data.json
```

---

## 💻 ローカルで確認する場合

```bat
cd C:\Users\Owner\Desktop\claude\daytrade_dashboard
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開く

---

## 📱 スマホからアクセスする方法

Vercelのダッシュボードに表示されたURLをそのまま  
スマホのブラウザで開くだけです。  
ホーム画面に追加してアプリのように使えます。

---

## 💰 料金について

| サービス | 料金 |
|---------|------|
| GitHub  | 無料 |
| Vercel  | 無料（月間100GB帯域まで） |
| Python実行 | 無料（自分のPC） |
| **合計** | **¥0** |

---

## ⚠️ トラブルシューティング

**「data.json が見つかりません」と表示される**  
→ `update_data.bat` を実行して `public/data.json` を生成してください

**グラフが表示されない**  
→ ログファイルのパスを確認してください

**Vercelのビルドが失敗する**  
→ `npm install && npm run build` をローカルで実行して確認
