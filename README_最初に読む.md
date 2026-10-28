# 総合AI会社｜精鋭5名・初期2名試験 v6（Claude Code限定）

**前回v4は導入していません。v6は別の新規ZIPです。旧版の移行・削除・上書きは不要です。**

## 作業の境界
- 5名（受付、調査、下書き、監査、記録）を定義、稼働は受付と下書きだけ。
- 試験1往復だけ。作成できる新規ファイルを作業票 `workspace/01-intake/JOB-TEST-001.md` と草稿 `workspace/03-drafts/DRAFT-TEST-001.md` に厳密限定。
- `.claude/settings.json` のパスルールは **Edit(/workspace/...) が Write にも効く** Claude Code CLI **v2.1.210以上**を前提。旧版では禁止。
- `.claude/hooks/guard.cjs` はNode.js標準ライブラリのみ使用（追加npm依存なし）。**Node.jsがなければ中止**、新しいインストールの課金や承認を進めない。
- `PreToolUse`ガードで、書込元社員と書込先を照合し、既存ファイル・シンボリックリンク・プロジェクト外のファイルを拒否する。親セッションの書込も拒否。監査役など3名の起動を拒否する。
- **Agent呼び出しには `run_in_background: false` の明示が必須。省略・true・入れ子起動はガードが拒否する。** Claude Codeでは既定がバックグラウンドになり得るため、明示なしの起動は禁止。
- 同時起動させない。フック判定と実書込の間には競合余地があるため、厳密なファイルシステム権限やOS隔離と同等ではない。
- 外部Web閲覧・MCP・コマンド実行・外部送信・公開・決済・削除・正本書込は禁止。**Claude Code使用自体はAnthropicサービスとの通信と利用枠消費を伴う**。
- `CLAUDE_PROJECT_DIR`が取得できない場合はフックが拒否する。

## 導入条件
1. ZIPを**新しい空フォルダ**に展開。他のプロジェクトの中に展開しない。`~/.claude/`にもコピーしない。
2. 対象フォルダをClaude Code **CLI**で開く。CLI版v2.1.210以上を確認し、`/permissions` で `dontAsk` と適用元を目視。DesktopはdontAskを直接選択できないことがあるため、初回はCLI推奨。
3. `node`が存在するか確認。なければ中止。下記の「静的検査・拒否テスト」のみ実施した状態で稼働済みと報告しない。
4. 新規ファイル2個が作成済みなら停止（再実行で上書きしない）。
5. `CLAUDE_CODE_一括指示.txt` を一括コピーして実行。成功を必ず保存→Read再確認→2ファイル比較で判断する。

## 検証の限界
- ZIPとガードの単体試験はこの配布環境で実施。Claude Code自体がフックを呼び出すか、`/permissions` が有効かは**利用者PCで未検証**。
- Claude Codeのユーザー・組織側の権限や別プラグインの例外は利用者PCで監査する必要がある。実機の否定テストに不合格なら即中止。
- ガードが意図的に無効化された場合は防御にならない。確実な隔離が必要ならOSの別アカウント・仮想環境を用意する。
- HookはClaude Codeから実行されるローカルのポリシーチェックスクリプト。**社員自体にコマンド実行権は渡していない**。
- フックは `Agent`, `Read`, `Write`, `Edit`, `Glob`, `Grep` を対象とする。`@`によるファイル参照はPreToolUseを経由しない場合があるので、許可外資料をプロジェクトに入れない。
- `Write`は本来既存ファイルを上書き可能。ここでは作成前フックが**既存ファイルを拒否**する。ただしガード有効性を必ず実機で確かめる。
- ルーク正本v1（Google Sheets ID: 1JqLB4T-APCXEq6WNbcDTtUlMvmwu9X9gVuUZ4I_K53k）はこのZIPに複製しない。社員は直接アクセスしない。

## 内容
- `.claude/agents/*.md`：5名（初期2名のみ許可）
- `.claude/settings.json`：プロジェクト専用権限＋PreToolUseフック
- `.claude/hooks/guard.cjs`：役割・作成先・新規ファイル・範囲の照合
- `workspace/00-requests/JOB-TEST-001.md`：試験入力
- `CLAUDE_CODE_一括指示.txt`：1回だけ試すためのコピー用指示
- `CHECKSUMS_SHA256.txt`：ZIPに含む全作成ファイルのチェックサム

参考公式仕様：
- https://code.claude.com/docs/en/permissions
- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/hooks
