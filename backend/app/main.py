from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Optional
import asyncio, json
import numpy as np
import os

# ユーティリティ/環境/MARL/メトリクス
from .utils import make_id
from .env import SwarmEnv
from .marl import MADDPGSystem
from .metrics import coverage_m1, uniformity_m2

# LLMモジュール
from .llm.router import router as llm_router
from .llm.client import generate_prior_reward_dsl
from .llm.dsl_runtime import build_prior_fn, build_reward_fn

app = FastAPI(title="LAMARL Backend API", version="1.0.0")

# LLMルーターを登録
app.include_router(llm_router)

# CORS設定（フロントエンドからのアクセスを許可）
# 環境変数からフロントエンドURLを取得（本番 + プレビュー）
origins = [
    os.getenv("FRONTEND_URL"),
    os.getenv("FRONTEND_URL_PREVIEW"),
    "http://localhost:5173",  # ローカル開発環境
    "http://localhost:5174",  # Vite alternative port
    "http://localhost:3000",
    "https://lamarl-playground-git-main-dionaea-tech-project.vercel.app",  # Vercel本番環境
]

# Vercelプレビューデプロイメント用の動的オリジンチェック
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",  # すべてのVercelデプロイメントを許可
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# エピソードの「状態」をメモリ保持（本スコープではDBレス運用）
EPISODES: Dict[str, dict] = {}

# ------- リクエストモデル（Pydantic） -------

class EpisodeCreate(BaseModel):
    """
    エピソード作成時の設定。
    形状やロボット数などを受け取り、環境とRLシステムを初期化。
    """
    shape: str = "circle"
    seed: int = 1234
    n_robot: int = 30
    r_sense: float = 0.4
    r_avoid: float = 0.1
    nhn: int = 6
    nhc: int = 80
    grid_size: int = 64
    l_cell: float = 1.0

class TrainStart(BaseModel):
    """
    学習開始リクエスト。
    - episodes: 何エピソード回すか
    - episode_len: 1エピソードあたりのステップ数
    - use_llm: LLM生成のPrior/Rewardを使用するか
    - task_description: LLM生成用のタスク記述
    - llm_model: 使用するLLMモデル
    """
    episode_id: str
    episodes: int = 1
    episode_len: int = 200
    use_llm: bool = False
    task_description: Optional[str] = None
    llm_model: str = "gemini-2.0-flash-exp"

# ------- 基本ヘルスチェック -------

@app.get("/health")
def health():
    """稼働確認用エンドポイント。"""
    return {"status": "ok"}

# ------- エピソード作成 -------

@app.post("/episodes")
def create_ep(cfg: EpisodeCreate):
    """
    環境と MADDPG を初期化し、エピソードIDを払い出す。
    - 幾何条件（収容可能性）もチェック
    - メモリ上の EPISODES に登録
    """
    ep_id = make_id("ep")

    # 環境を仮作成して mask 情報（セル数など）を確認
    env = SwarmEnv(shape=cfg.shape, grid_size=cfg.grid_size, n_robot=cfg.n_robot,
                   r_sense=cfg.r_sense, r_avoid=cfg.r_avoid, nhn=cfg.nhn, nhc=cfg.nhc,
                   l_cell=cfg.l_cell, seed=cfg.seed)
    n_cell = int((env.mask == 1).sum())

    # 幾何条件: 4 * n_robot * r_avoid^2 ≤ n_cell * l_cell^2
    if 4 * cfg.n_robot * (cfg.r_avoid**2) > n_cell * (cfg.l_cell**2):
        raise HTTPException(400, "Geometry condition not satisfied")

    # 観測次元を推定（MADDPG のネットワーク構成に必要）
    obs0 = env.observe()
    obs_dim = obs0.shape[1]

    # MADDPG（n_agents=ロボット数, 局所Q）
    # パフォーマンス改善: batch_sizeとwarmup_stepsを削減
    maddpg = MADDPGSystem(
        n_agents=cfg.n_robot, obs_dim=obs_dim,
        gamma=0.99, batch=128, lr_actor=1e-4, lr_critic=1e-3,
        noise=0.1, tau=0.005, capacity=1_000_000, warmup_steps=1000
    )

    # メモリに保持（DBレス）
    EPISODES[ep_id] = {
        "cfg": cfg,
        "env": env,
        "rl": maddpg,
        "metrics": {"timeline": []},  # SSEで流すイベントを蓄積
        "should_stop": False,  # 学習停止フラグ
    }
    return {"episode_id": ep_id}

# ------- 学習開始（非同期タスク起動） -------

@app.post("/train")
async def start_train(req: TrainStart):
    """
    学習ループを asyncio タスクで起動。
    - このAPIは即時に {started: true} を返し、
      実際の進捗は /stream の SSE で受け取る。
    - use_llm=True の場合、LLM生成のPrior/Rewardを使用
    """
    if req.episode_id not in EPISODES:
        raise HTTPException(404, "episode not found")
    store = EPISODES[req.episode_id]
    store["episodes_total"] = req.episodes
    store["episode_len"] = req.episode_len
    store["should_stop"] = False  # 停止フラグをリセット
    store["metrics"]["timeline"].clear()  # 古いイベントをクリア
    
    # LLM生成のPrior/Reward設定
    if req.use_llm:
        try:
            print(f"🤖 LLM生成開始: model={req.llm_model}")
            cfg = store["cfg"]
            
            # タスク記述のデフォルト生成
            task_desc = req.task_description or f"{cfg.n_robot}台のロボットで{cfg.shape}形状を形成する"
            
            # LLM生成
            env_params = {
                "shape": cfg.shape,
                "n_robot": cfg.n_robot,
                "r_sense": cfg.r_sense,
                "r_avoid": cfg.r_avoid,
                "n_hn": cfg.nhn,
                "n_hc": cfg.nhc,
            }
            
            dsl = generate_prior_reward_dsl(
                task_description=task_desc,
                env_params=env_params,
                model=req.llm_model,
                temperature=0.7,
                use_cot=True,
                use_basic_apis=True
            )
            
            # DSLから実行可能な関数を構築
            prior_fn = build_prior_fn(dsl["prior"])
            reward_fn = build_reward_fn(dsl["reward"])
            
            # MADDPGSystemに設定
            maddpg: MADDPGSystem = store["rl"]
            maddpg.set_prior_policy(prior_fn)
            maddpg.set_reward_function(reward_fn)
            
            # メタデータを保存
            store["llm_dsl"] = dsl
            store["use_llm"] = True
            
            print(f"✅ LLM生成完了: Prior={len(dsl['prior']['terms'])}項, Reward={dsl['reward']['formula']}")
            
        except Exception as e:
            print(f"⚠️ LLM生成エラー: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(500, f"LLM生成失敗: {str(e)}")
    else:
        store["use_llm"] = False

    # 学習タスク（同プロセス/同スレッド）をバックグラウンドで開始
    asyncio.create_task(_train_loop(req.episode_id))
    return {"started": True, "use_llm": req.use_llm}

# ------- 学習停止 -------

@app.post("/stop")
async def stop_train(episode_id: str):
    """
    学習ループを停止させる。
    - should_stop フラグを立てることで、_train_loop が次のステップで停止する。
    """
    if episode_id not in EPISODES:
        raise HTTPException(404, "episode not found")
    
    EPISODES[episode_id]["should_stop"] = True
    return {"stopped": True}

# ------- SSE ストリーム -------

@app.get("/stream")
async def stream(request: Request, episode_id: str):
    """
    SSE (Server-Sent Events) によるリアルタイム配信。
    - /train で起動した学習ループが metrics.timeline にイベントを積む
    - ここではそれを順次クライアントへ送る（心拍＋可視化データ）
    """
    if episode_id not in EPISODES:
        raise HTTPException(404, "episode not found")

    async def event_gen():
        last_idx = 0
        last_cleanup = 0
        while True:
            # クライアント切断を検知したら終了
            if await request.is_disconnected():
                break
            store = EPISODES.get(episode_id)
            if not store:
                break
            tl = store["metrics"]["timeline"]
            # 未送信のイベントを順に送信
            while last_idx < len(tl):
                ev = tl[last_idx]; last_idx += 1
                yield f"data: {json.dumps(ev)}\n\n"
            
            # メモリリーク防止: 送信済みイベントを定期的に削除（1000イベントごと）
            if last_idx - last_cleanup > 1000:
                # 送信済みのイベントを削除（最新200件は保持）
                keep_from = max(0, last_idx - 200)
                store["metrics"]["timeline"] = tl[keep_from:]
                last_idx = len(store["metrics"]["timeline"])
                last_cleanup = last_idx
            
            await asyncio.sleep(0.05)  # ポーリング間隔（CPU過負荷防止）

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control":"no-cache"}
    )

# ------- 内部: 学習ループ本体 -------

async def _train_loop(ep_id: str):
    """
    学習のメインループ（非同期）。
    - 各ステップで:
        * 行動選択 → 環境更新
        * M1/M2 計算、成功判定（スパース報酬）
        * リプレイバッファ格納 → 更新（ウォームアップ後）
        * SSE用イベントを metrics.timeline にpush
    - エピソード終了時に metrics.json / final_shape.png を保存
    """
    store = EPISODES[ep_id]
    env: SwarmEnv = store["env"]
    maddpg: MADDPGSystem = store["rl"]
    cfg = store["cfg"]
    E = store["episodes_total"]; T = store["episode_len"]
    
    # ---- SSE イベント: 環境設定を最初に送信 ----
    store["metrics"]["timeline"].append({
        "type": "env_config",
        "shape": cfg.shape,
        "n_robot": cfg.n_robot,
        "r_sense": cfg.r_sense,
        "r_avoid": cfg.r_avoid,
        "n_hn": cfg.nhn,
        "n_hc": cfg.nhc,
        "grid_size": env.grid_size,
        "l_cell": env.lc,
        "use_llm": store.get("use_llm", False),
    })
    
    global_step = 0  # 全エピソードを通じた累積ステップ数

    for ep in range(E):
        # 停止フラグチェック
        if store.get("should_stop", False):
            print(f"⏹️ Training stopped by user request (ep_id={ep_id})")
            break
            
        obs = env.reset()
        episode_stopped = False  # エピソード内での停止フラグ
        
        for t in range(T):
            # 停止フラグチェック
            if store.get("should_stop", False):
                print(f"⏹️ Training stopped by user request (ep_id={ep_id})")
                episode_stopped = True
                break
            
            # 行動サンプリング（全エージェント分）
            # LLM Prior Policyを使用する場合は、状態辞書を渡す
            # パフォーマンス改善: get_state_dicts()は重いので、5ステップごとに計算
            state_dicts = None
            if store.get("use_llm", False) and t % 5 == 0:
                state_dicts = env.get_state_dicts()
            
            acts = maddpg.act(obs, deterministic=False, state_dicts=state_dicts)

            # 環境1ステップ
            nobs, col_pairs = env.step(acts)

            # 報酬計算: シンプルな報酬（メトリクス計算を省略）
            # パフォーマンス改善: M1/M2計算はエピソード終了時のみ
            # ステップごとの報酬は簡易版（衝突ペナルティのみ）
            n_collisions = len(col_pairs)
            rew_scalar = -0.01 * n_collisions  # 衝突ペナルティ
            done = 0.0  # エピソード途中では終了しない

            # 各エージェントに同一報酬（協調タスクの最小実装）
            for i in range(cfg.n_robot):
                maddpg.buffers[i].push(
                    obs[i], acts[i],
                    np.array([rew_scalar], dtype=np.float32),
                    nobs[i], np.array([done], dtype=np.float32)
                )

            # ウォームアップ後にパラメータ更新
            # パフォーマンス改善: 更新を5ステップごとに実行（asyncioオーバーヘッド削減）
            if t % 5 == 0:
                upd = maddpg.step_update()
            else:
                upd = None

            # ---- SSE イベント: tick（間引き送信: 20ステップ毎） ----
            # パフォーマンス改善: 可視化更新をさらに削減
            if t % 20 == 0:
                store["metrics"]["timeline"].append({
                    "type": "tick",
                    "episode": ep,
                    "step": t,
                    "global_step": global_step,
                    "positions": env.p.tolist(),
                    "velocities": env.v.tolist(),
                    "collisions": col_pairs,
                })
            
            # ---- SSE イベント: metrics_update（エピソード終了時のみ） ----
            # パフォーマンス改善: ステップごとのメトリクス送信を削除

            # グローバルステップをインクリメント
            global_step += 1

            # イベントループに制御を返す（SSE送信を可能にする）
            # パフォーマンス改善: 50ステップごとに1回のみ
            if global_step % 50 == 0:
                await asyncio.sleep(0)

            obs = nobs
            if done == 1.0:
                # 成功判定で早期終了（収束扱い）
                break

        # ユーザーによる停止の場合はエピソード終了イベントを送らずに終了
        if episode_stopped:
            break

        # エピソード終了: メトリクス計算（エピソードごとに1回のみ）
        M1 = coverage_m1(env.mask, env.p, cfg.r_avoid)
        M2 = uniformity_m2(env.p, env.mask)
        
        # エピソード終了:  SSE 通知
        store["metrics"]["timeline"].append({
            "type": "episode_end",
            "episode_id": ep_id,
            "episode": ep,
            "step": t,  # エピソード内の最終ステップ
            "global_step": global_step - 1,  # 最後にインクリメントしているので-1
            "M1": float(M1),
            "M2": float(M2),
            "final_positions": env.p.tolist(),  # エピソード終了時の最終位置
            "final_velocities": env.v.tolist(),  # エピソード終了時の最終速度
        })
        
        # エピソード間でもイベントループに制御を返す
        await asyncio.sleep(0)
