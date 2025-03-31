# Understanding and Supporting Formal Email Exchange by Answering AI-Generated Questions

The repository contains the code that accompanies our CHI 2025 paper.

## Abstract

Replying to formal emails is time-consuming and cognitively demanding, as it requires crafting polite phrasing and providing an adequate response to the sender's demands. Although systems with Large Language Models (LLMs) were designed to simplify the email replying process, users still need to provide detailed prompts to obtain the expected output. Therefore, we propose and evaluate an LLM-powered question-and-answer (QA)-based approach for users to reply to emails by answering a set of simple and short questions generated from the incoming email. We developed a prototype system, ResQ, and conducted controlled and field experiments with 12 and 8 participants. Our results demonstrated that the QA-based approach improves the efficiency of replying to emails and reduces workload while maintaining email quality, compared to a conventional prompt-based approach that requires users to craft appropriate prompts to obtain email drafts. We discuss how the QA-based approach influences the email reply process and interpersonal relationship dynamics, as well as the opportunities and challenges associated with using a QA-based approach in AI-mediated communication.

## ResQ - LLMを使ったメール返信アシスタント

ResQは、OpenAIのLLMを活用してメールの返信を支援するシステムです。メールの内容を分析し、返信のための質問生成や、実際の返信文の生成を行うことができます。
実際のChrome拡張機能は、[リンク](https://chromewebstore.google.com/detail/diibecmhllgfkglodjgifjapchbanimk?utm_source=item-share-cb)から使用することができます。

### 特徴

- 💬 **インタラクティブな質問生成**: メールの内容を理解し、返信に必要な情報を引き出すための質問を生成
- ✍️ **コンテキストを考慮した返信生成**: メールの文脈、ユーザー情報、選択された返答を考慮した適切な返信を生成
- 🚀 **ストリーミングレスポンス**: 生成された内容をリアルタイムでクライアントに送信

### プロジェクト構成

本プロジェクトはDockerを使用した開発環境を提供しています。開発環境では、docker composeによって以下の2つのサービスがマイクロサービスとして管理されます：

- `applications/backend`: LLMを活用したメール返信支援のバックエンドサービス
- `applications/chrome-extension`: Chrome拡張機能として動作するアプリケーション

各サービスの詳細については、`docs/`内にある各サービスのドキュメントを参照してください。

#### フォルダ構成

```
ResQ/
├── .github/                   # GitHub関連
│   ├── ci.yaml                # コードチェックを行うワークフロー定義
│   ├── deploy.yaml            # アプリケーションのデプロイを行うワークフロー定義
│   ├── terraform-ecr.yml      # Terraformによる Amazon ECR のプロビジョニングを行うワークフロー定義 (Reusable Workflows)
│   └── terraform-complete.yml # Terraformによる Amazon ECR と AWS lambda のプロビジョニングを行うワークフロー定義 (Reusable Workflows)
├── applications/              # アプリケーションの実装
│   ├── backend/               # バックエンド実装（詳しくは docs/backend.md を参照）
│   └── chrome-extension/      # 拡張機能のフロントエンド実装
├── docs/                      # ドキュメント関連
├── environments/              # Docker関連
│   ├── ci/                    # CI用のcompose定義
│   ├── deploy/                # デプロイ用のcompose定義
│   ├── dev/                   # 開発用のcompose定義
│   ├── Dockerfile.backend     # バックエンド用のDockerfile
│   ├── Dockerfile.chrome      # Chrome拡張用のDockerfile
│   └── Dockerfile.deploy      # デプロイ用のDockerfile
├── terraform/                 # インフラ定義
│   ├── modules/               # Terraformモジュール
│   │   ├── ecr/               # ECRリポジトリとIAMロール定義
│   │   └── lambda/            # Lambda関数とその関連リソース定義
│   ├── provider.tf            # AWSプロバイダー設定
│   ├── variables.tf           # 変数定義
│   └── main.tf                # モジュールの使用定義
└── README.md
```

### 開発環境のセットアップ

以下の手順で開発環境を構築できます：

1. 必要なツールのインストール
   - Docker [リンク](https://docs.docker.com/engine/install/)
   - Docker Compose [リンク](https://docs.docker.com/compose/install/)

2. 環境変数の設定
   ```bash
   # 開発環境の環境変数ファイルを作成
   cp environments/backend.env.sample environments/backend.env
   ```

   作成された`backend.env`に必要な環境変数を指定する

> [!Note]
> `OPENAI_API_KEY`には、OpenAIの[ダッシュボード](https://platform.openai.com/api-keys)で発行できるAPIキーを指定して下さい。
> `CORS_ALLOW_ORIGINS`には、バックエンドへの接続を許容するオリジンを記入してください。

3. コンテナの起動
   ```bash
   # 開発環境のコンテナを起動
   cd environments/dev
   docker compose up -d
   ```

4. コンテナにアクセス
   - バックエンド
       ```bash
       # environments/dev下で実行
       docker compose exec backend bash
       ```

   - Chrome拡張アプリケーション
       ```bash
       # environments/dev下で実行
       docker compose exec chrome-extension bash
       ```

起動したコンテナに入った後のセットアップ手順については、それぞれの`docs`内にある各サービスのドキュメントを参照してください。

## Acknowledgements

We thank the [Ascender](https://github.com/cvpaperchallenge/Ascender) for making this work possible.

