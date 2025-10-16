# LAMARL Playground - 使用方法

バックエンドとフロントエンドを接続して、リアルタイムで学習過程を可視化できるようになりました！

## 🚀 起動方法

### 1. バックエンドの起動

```bash
cd backend && source .venv/bin/activate
# または: .venv\Scripts\activate (Windows)

# サーバー起動
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

バックエンドが `http://localhost:8000` で起動します。

### 2. フロントエンドの起動

別のターミナルで：

```bash
cd frontend
# 依存関係のインストール（初回のみ）
pnpm install

# 開発サーバー起動
pnpm dev
```

フロントエンドが `http://localhost:5173` で起動します。

## 📊 使い方

### MARLタブで学習を開始

1. ブラウザで `http://localhost:5173` を開く
2. 上部タブから **「MARL Module」** を選択
3. 左パネルの **Training Controls** で ▶ボタンをクリック
4. 学習が開始され、ロボットの動きがリアルタイムで表示されます！

### 表示される情報

- **🤖 Robot Formation**: ロボットの位置と動きをリアルタイム可視化
  - 灰色のセル：目標形状
  - 青い点：ロボット
  - 薄い円：感知半径
  - 赤い線：衝突

- **Coverage Rate (M₁)**: 形状カバー率（0.8以上が目標）
- **Uniformity (M₂)**: 配置の均一性（0.2以下が目標）
- **Actor/Critic Loss**: 学習の進捗

### コントロール

- ▶ / ⏸ ボタン：学習の開始/停止
- 🔄 ボタン：学習のリセット
- Episode / Step：学習の進行状況

## 🎯 動作確認のポイント

### バックエンドが正常に動作している場合

- `/health` エンドポイントが正常に応答
- エピソードが作成される（コンソールに `✅ Episode created:` と表示）
- 学習開始時に SSE 接続が確立される

### フロントエンドが正常に動作している場合

- MARLタブを開くと自動的にエピソードが作成される
- ▶ボタンをクリックすると学習が開始される
- ロボットが動き、メトリクスがリアルタイムで更新される

## 🐛 トラブルシューティング

### CORSエラーが出る場合

バックエンドの `main.py` に CORS 設定が追加されています。
フロントエンドのポートが 5173 以外の場合は、`allow_origins` に追加してください。

### 接続できない場合

1. バックエンドが起動しているか確認：
   ```bash
   curl http://localhost:8000/health
   # 期待される応答: {"status":"ok"}
   ```

2. フロントエンドのAPI URLを確認：
   - デフォルト: `http://localhost:8000`
   - 変更する場合は `.env` ファイルを作成：
     ```
     VITE_API_URL=http://localhost:8000
     ```

### ロボットが表示されない場合

- ブラウザのコンソールを確認
- SSE 接続が確立されているか確認
- バックエンドのログを確認

## 📝 次のステップ

現在、LAMARL の核心機能（Prior Policy統合）が未実装です。
詳細は `.docs/haveToDo.md` を参照してください。

- [ ] Prior Policy 統合（Actor損失の正則化）
- [ ] 報酬関数の可変化
- [ ] 結果保存機能（metrics.json, final_shape.png）

## 🎉 完了！

これで、MARLタブから学習を開始して、ロボットの動きをリアルタイムで観察できます！

