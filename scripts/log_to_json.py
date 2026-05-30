#!/usr/bin/env python3
"""
log_to_json.py
==============
daytrade_bot の .log ファイルを読み込んで
dashboard が使う data.json を生成するスクリプト。

使い方:
  python scripts/log_to_json.py \
      --logs logs/20260527.log logs/20260528.log logs/20260529.log \
      --output public/data.json

定期実行例 (cron / タスクスケジューラ):
  # 毎日 15:35 に自動生成
  35 15 * * 1-5 cd /path/to/daytrade_bot && python scripts/log_to_json.py ...
"""

import re
import json
import argparse
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# ── 正規表現パターン ────────────────────────────────────────────────────

RE_ENTRY    = re.compile(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}):\d{2},\d+ .+? エントリー: (\w*)\((.+?)\) (BUY|SELL) (\d+)株 @ ([\d,.]+)円  損切=([\d,]+)  利確=([\d,]+)')
RE_PRICE    = re.compile(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}):\d{2},\d+ .+? (\w+) 現在値: ([\d,]+\.?\d*)円')
RE_PNL      = re.compile(r'(\d{4}-\d{2}-\d{2}) \d{2}:\d{2}.+? 本日確定損益: ([+\-\d,]+)円')
RE_DONE     = re.compile(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}):\d{2}.+? ✅ 発注完了: (\w+) (買い|売り) (\d+)株')
RE_PICK     = re.compile(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}):\d{2}.+?候補: (\w+) (.+?) スコア=(\d+)')
RE_BALANCE  = re.compile(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}):\d{2}.+? 買付余力: ([\d,]+)円')
RE_RESTORE  = re.compile(r'復元: (\w+)\((.+?)\) (\d+)株 @ ([\d,]+\.?\d*)円 損切=([\d,]+) 利確=([\d,]+)')
RE_SENTIMENT= re.compile(r'(強気|弱気|中立)')
RE_TOPIC    = re.compile(r'(\d{4}-\d{2}-\d{2}) \d{2}:\d{2}.+分析完了: (\d+)銘柄を選定')


def parse_num(s: str) -> float:
    return float(s.replace(",", ""))


def parse_logs(log_paths: list[str]) -> dict:
    entries       = []
    price_history = defaultdict(list)  # code -> [{t, p}]
    pnl_by_date   = {}
    balance_hist  = []
    done_orders   = set()
    picks_by_date = defaultdict(list)  # date -> [{code, name, score}]
    holdings      = {}
    seen_entries  = set()             # deduplicate

    for path in sorted(log_paths):
        text = Path(path).read_text(encoding="utf-8", errors="replace")
        date_str = Path(path).stem  # e.g. 20260527 → use as fallback

        for line in text.splitlines():

            # 発注完了
            m = RE_DONE.search(line)
            if m:
                done_orders.add(m.group(2))

            # エントリー
            m = RE_ENTRY.search(line)
            if m and "logger.info" not in line:
                key = (m.group(1), m.group(2), m.group(4))
                if key not in seen_entries:
                    seen_entries.add(key)
                    code = m.group(2)
                    entries.append({
                        "datetime": m.group(1),
                        "code":     code,
                        "name":     m.group(3),
                        "dir":      m.group(4),
                        "qty":      int(m.group(5)),
                        "entry":    parse_num(m.group(6)),
                        "sl":       parse_num(m.group(7)),
                        "tp":       parse_num(m.group(8)),
                        "status":   "✅ 発注完了" if code in done_orders else "発注試行",
                    })

            # 現在値
            m = RE_PRICE.search(line)
            if m:
                code = m.group(2)
                if code and code.strip():
                    price_history[code].append({
                        "t": m.group(1)[5:],   # "MM-DD HH:mm"
                        "p": parse_num(m.group(3)),
                    })

            # 損益
            m = RE_PNL.search(line)
            if m:
                d   = m.group(1)
                val = int(m.group(2).replace(",", "").replace("+", ""))
                pnl_by_date[d] = val

            # 買付余力
            m = RE_BALANCE.search(line)
            if m:
                balance_hist.append({
                    "t": m.group(1)[5:],
                    "v": parse_num(m.group(2)),
                })

            # 候補銘柄
            m = RE_PICK.search(line)
            if m:
                date = m.group(1)[:10]
                score = int(m.group(4))
                if score >= 7:
                    picks_by_date[date].append({
                        "code":  m.group(2),
                        "name":  m.group(3),
                        "score": score,
                    })

            # ポジション復元
            m = RE_RESTORE.search(line)
            if m:
                code = m.group(1)
                holdings[code] = {
                    "code":    code,
                    "name":    m.group(2),
                    "qty":     int(m.group(3)),
                    "avgCost": parse_num(m.group(4)),
                    "sl":      parse_num(m.group(5)),
                    "tp":      parse_num(m.group(6)),
                }

    # 重複除去して最新だけ残す (balance_hist)
    seen_bt = set()
    balance_dedup = []
    for b in balance_hist:
        k = b["t"][:5]  # "MM-DD"
        if k not in seen_bt:
            seen_bt.add(k)
            balance_dedup.append(b)

    # picks を日付ごとに dedupe (code+score の高い方を優先)
    picks_clean = {}
    for date, picks in picks_by_date.items():
        seen_code = {}
        for p in picks:
            c = p["code"]
            if c not in seen_code or p["score"] > seen_code[c]["score"]:
                seen_code[c] = p
        picks_clean[date] = sorted(seen_code.values(), key=lambda x: -x["score"])[:5]

    # 価格履歴を間引き（最大40点）
    ph_clean = {}
    for code, pts in price_history.items():
        if len(pts) > 40:
            step = len(pts) // 40
            pts = pts[::step]
        ph_clean[code] = pts

    # holdings に価格履歴をマージ
    for code, h in holdings.items():
        h["priceHistory"] = ph_clean.get(code, [])

    # PnL timeline
    pnl_timeline = [
        {"date": d, "pnl": v, "cumPnl": v}
        for d, v in sorted(pnl_by_date.items())
    ]
    cum = 0
    for row in pnl_timeline:
        cum += row["pnl"]
        row["cumPnl"] = cum

    return {
        "generatedAt":  datetime.now().isoformat(),
        "trades":       entries,
        "holdings":     list(holdings.values()),
        "pnlTimeline":  pnl_timeline,
        "balanceHist":  balance_dedup,
        "picksByDate":  picks_clean,
        "priceHistory": ph_clean,
        "summary": {
            "totalTrades":   len(entries),
            "successTrades": len(done_orders),
            "totalPnl":      sum(pnl_by_date.values()),
            "latestBalance": balance_dedup[-1]["v"] if balance_dedup else 0,
        }
    }


def merge_live_holdings(data: dict, live_path: str) -> dict:
    """
    trader.py が書き出した holdings_live.json を読み込み、
    data["holdings"] の currentPrice / pnl / pnlPct / buyingPower を上書きする。
    価格履歴の末尾にも最新値を追記する。
    """
    p = Path(live_path)
    if not p.exists():
        print(f"⚠️  {live_path} が見つかりません（Bot未起動 or 未生成）。ログの値を使用します。")
        return data

    try:
        live = json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"⚠️  {live_path} の読み込み失敗: {e}")
        return data

    live_map = {h["code"]: h for h in live.get("holdings", [])}
    updated_at = live.get("updatedAt", "")
    label = updated_at[5:16].replace("T", " ") if updated_at else "live"  # "MM-DD HH:mm"

    for h in data["holdings"]:
        code = h.get("code")
        if code not in live_map:
            continue
        lh = live_map[code]

        # 現在値・損益を上書き
        h["currentPrice"] = lh.get("currentPrice", h.get("avgCost", 0))
        h["pnl"]          = lh.get("pnl",          0)
        h["pnlPct"]       = lh.get("pnlPct",        0.0)
        h["liveUpdatedAt"] = updated_at

        # sl/tp を live から補完（ログに無い場合）
        if not h.get("sl") and lh.get("sl"):
            h["sl"] = lh["sl"]
        if not h.get("tp") and lh.get("tp"):
            h["tp"] = lh["tp"]

        # priceHistory: live側に日足データがあればそれを優先、なければログ値末尾に追記
        live_hist = lh.get("priceHistory", [])
        if live_hist:
            # SBIから取得した日足履歴を使用（完全な履歴）
            h["priceHistory"] = live_hist
            print(f"    📊 {code} 価格履歴: SBI日足 {len(live_hist)}件")
        else:
            # 従来通りログ値に最新値を追記
            hist = h.get("priceHistory", [])
            if not hist or hist[-1]["p"] != h["currentPrice"]:
                hist.append({"t": label, "p": h["currentPrice"]})
                h["priceHistory"] = hist

        print(f"  📡 {code} 現在値上書き: {h['currentPrice']:,}円 | 損益: {h['pnl']:+,}円 ({h['pnlPct']:+.2f}%)")

    # 買付余力も上書き
    if live.get("buyingPower") is not None:
        data["summary"]["latestBalance"] = live["buyingPower"]
        # balanceHist にも追記
        data["balanceHist"].append({"t": label, "v": live["buyingPower"]})

    # 総損益も上書き
    data["summary"]["totalPnl"] = live.get("totalPnl", data["summary"]["totalPnl"])
    data["liveUpdatedAt"] = updated_at

    print(f"✅ holdings_live.json マージ完了 ({updated_at})")
    return data


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--logs",          nargs="+", required=True, help=".log ファイルのパス")
    parser.add_argument("--output",        default="public/data.json",       help="出力JSONパス")
    parser.add_argument("--live-holdings", default=None,                      help="holdings_live.json のパス（省略可）")
    args = parser.parse_args()

    print(f"📂 ログ読み込み: {args.logs}")
    data = parse_logs(args.logs)

    # holdings_live.json があればマージして現在値を上書き
    live_path = args.live_holdings
    if live_path is None:
        # デフォルト: daytrade_bot/logs/holdings_live.json を自動検索
        candidates = [
            "logs/holdings_live.json",
            "../daytrade_bot/logs/holdings_live.json",
            "C:/Users/Owner/Desktop/claude/daytrade_bot/logs/holdings_live.json",
        ]
        for c in candidates:
            if Path(c).exists():
                live_path = c
                break

    if live_path:
        print(f"📡 リアルタイムデータ: {live_path}")
        data = merge_live_holdings(data, live_path)
    else:
        print("ℹ️  holdings_live.json なし。ログの値のみ使用します。")
        print("   Bot起動中に自動生成されます（10分ごと更新）")

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    s = data["summary"]
    print(f"\n✅ 書き出し完了: {out}")
    print(f"   取引試行: {s['totalTrades']}件 | 発注成功: {s['successTrades']}件")
    print(f"   確定損益: {s['totalPnl']:+,}円 | 買付余力: {s['latestBalance']:,}円")


if __name__ == "__main__":
    main()
