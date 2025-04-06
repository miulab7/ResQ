# バックエンドサービス

## セットアップ

> [!Note]
> 本プロジェクトのDockerを使用した開発環境のセットアップについては、プロジェクトトップの`README.md`を参照してください。

1. 仮想環境の作成とライブラリのインストール

    本プロジェクトでは仮想環境・Pythonライブラリ管理ツールとして、[uv](https://docs.astral.sh/uv/) を採用しています。コンテナ内で以下のコマンドを実行して、仮想環境内に必要なライブラリをインストールしてください：

    ```bash
    uv sync
    ```

2. 開発サーバーの起動

    ```bash
    poe run-backend-dev
    ```

    これで http://localhost:8000 でサーバーが起動します。

3. APIエンドポイントの利用

    http://localhost:8000/docs にアクセスすることで、Swagger UIから実際のエンドポイントの挙動を確認できます。

    ![swagger ui sample](/docs/images/swagger_ui_sample.png)

## 開発ガイド

### フォルダ構成

本プロジェクトのバックエンドは、シンプルなレイヤードアーキテクチャを採用しています。

```
src/
├── api/           # プレゼンテーション層：HTTPインターフェース
│   ├── routes.py  # エンドポイント定義
│   └── schemas.py # リクエスト/レスポンススキーマ定義
│
├── domain/        # ドメイン層：ビジネスロジック
│   ├── models/    # ドメインモデル定義
│   └── services/  # ビジネスロジック実装
│       └── llm/   # LLM関連の実装
│
└── main.py        # アプリケーションのエントリーポイント
```

### APIエンドポイント

- `GET /api/health`: ヘルスチェック
- `POST /api/questions`: メール内容に基づく質問の生成（SSE Streaming）
- `POST /api/reply`: メールへの返信文の生成（SSE Streaming）


### 開発用コマンド

本プロジェクトでは、タスクランナーに [poethepoet](https://poethepoet.natn.io/index.html) を採用しています。以下のコマンドで、開発時に頻繁に使用するタスクを実行できます：

```bash
# 開発サーバーの起動
poe run-backend-dev

# コードフォーマット
poe format

# リンター実行
poe lint

# テスト実行
poe test

# 全チェック実行
poe test-all
```

コード品質管理には以下のツールを利用しています。

- **[ruff](https://docs.astral.sh/ruff/)**: リンティングとフォーマッティング
- **[mypy](https://www.mypy-lang.org/)**: 静的型チェック
- **[pytest](https://docs.pytest.org/en/stable/)**: テスティング
- **[mdformat](https://github.com/hukkin/mdformat)**: Markdownフォーマッティング

## FAQ

### Q. 新しいPythonパッケージを追加したい場合はどうすればいいですか？

A. `uv add <LIBRARY_NAME>`を使って必要なライブラリを追加するか、 `pyproject.toml` のdependenciesを直接編集して `uv sync` で仮想環境を更新してください。その他の `uv` のコマンドの詳細については[こちら](https://docs.astral.sh/uv/reference/cli/)を参照して下さい。

### Q: エンドポイントのストリーミングレスポンスの詳細が知りたいです

A: 質問生成と応答生成のエンドポイントでは、クライアントからのPOSTリクエストに対する応答として[Server-sent-event](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)を使ったストリーミングレスポンスを実装しています。

各イベントの形式の定義は[こちら](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format)を、クライアント側のイベント処理の手順については[こちら](https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation)を参考にしてください。

### Q: システムプロンプトやテンプレートはどこで管理されていますか？

A: `data/`ディレクトリ配下で管理されています：
- `system_prompts/`: LLMのシステムプロンプト
- `templates/`: プロンプトテンプレート（Jinja2形式）

これらは、各LLMサービスの具象クラス（`QuestionGenerationLLM`, `ReplyGenerationLLM`）のコンストラクタ（`__init__`）で読み込まれています。

プロンプトテンプレートは Jinja2 形式で記述され、以下のような情報をコード上で生成・代入して使用しています：
- メール情報（件名、本文、送信者情報など）
- ユーザー情報（名前、役職、好みなど）
- カスタマイズ設定（トーン、スタイルなど）

### Q: 本番環境での実行方法は？

A: 以下のコマンドで本番用サーバーを起動できます：
```bash
poe run-backend-prod
```
これにより、4つのワーカープロセスで動作するGunicornサーバーが起動します。

現状は特に開発用のサーバーを使用してもらう形で問題ないですが、AWSなどのクラウドサービスにデプロイする際には上記のコマンドを使用してください。

### Q: 新しいLLM機能を追加するにはどうすればよいですか？

A: 以下の手順で実装できます：

1. `src/domain/services/llm/`に新しいLLMクラスを作成
   ```python
   class NewFeatureLLM(LLMBase[InputType, OutputType]):
       def __init__(self, prompt_directory: pathlib.Path) -> None:
           template_path = prompt_directory / "templates" / "new_feature_template.jinja2"
           system_prompt_path = prompt_directory / "system_prompts" / "new_feature_system_prompt.txt"
           super().__init__(template_path, system_prompt_path)
   ```


2. `LLMBase`を継承し、必要なメソッドを実装
   - `astream`: ストリーミング形式でのレスポンス生成
   - `acompletion`: 一括形式でのレスポンス生成

3. `data/`に必要なプロンプトとテンプレートを追加
   - システムプロンプト: LLMの役割や制約を定義
   - テンプレート: 入力データの構造化フォーマットを定義

4. `ChatService`に（もしくは必要に応じて新たなサービスクラスを作成して）新機能を統合

> [!IMPORTANT]
> `LLMBase`では`astream`や`acompletion`の入出力の型安全性を確保するためジェネリクスを使用しています。従って、継承して具象クラスを定義する際には、適切な型引数（`InputType`, `OutputType`）を指定してください。

## システム構成の詳細

### クラス図

```mermaid
classDiagram
    class FastAPI {
        +include_router()
        +add_middleware()
    }

    class APIRouter {
        +get()
        +post()
    }

    class ChatService {
        -_question_generation_llm: QuestionGenerationLLM
        -_reply_generation_llm: ReplyGenerationLLM
        +generate_questions_stream()
        +generate_reply_stream()
    }

    class LLMBase~InputType, OutputType~ {
        <<abstract>>
        #_async_client: AsyncOpenAI
        #_env: Environment
        #_template: Template
        #_system_prompt: str
        +astream()*
        +acompletion()*
        #_astream()
        #_acompletion()
    }

    class QuestionGenerationLLM {
        +astream()
        +acompletion()
    }

    class ReplyGenerationLLM {
        +astream()
        +acompletion()
    }

    class EmailInformation {
        +subject: str
        +body: str
        +sender: str
        +get_template_values()
    }

    class UserInformation {
        +name: str
        +role: str
        +preferences: dict
        +get_template_values()
    }

    FastAPI --> APIRouter: uses
    APIRouter --> ChatService: uses
    ChatService --> QuestionGenerationLLM: uses
    ChatService --> ReplyGenerationLLM: uses
    QuestionGenerationLLM --|> LLMBase: inherits
    ReplyGenerationLLM --|> LLMBase: inherits
    QuestionGenerationLLM ..> EmailInformation: uses
    QuestionGenerationLLM ..> UserInformation: uses
    ReplyGenerationLLM ..> EmailInformation: uses
    ReplyGenerationLLM ..> UserInformation: uses
```

### シーケンス図（質問生成フロー）

```mermaid
sequenceDiagram
    participant Client
    participant FastAPI
    participant ChatService
    participant QuestionLLM as QuestionGenerationLLM
    participant OpenAI

    Client->>FastAPI: POST /api/questions
    activate FastAPI
    FastAPI->>ChatService: generate_questions_stream()
    activate ChatService
    ChatService->>QuestionLLM: astream()
    activate QuestionLLM

    QuestionLLM->>QuestionLLM: テンプレート展開
    QuestionLLM->>OpenAI: chat.completions.create()
    activate OpenAI

    loop ストリーミング
        OpenAI-->>QuestionLLM: チャンクデータ
        QuestionLLM-->>ChatService: yield content
        ChatService-->>FastAPI: yield content
        FastAPI-->>Client: SSE: data: content
    end

    deactivate OpenAI
    deactivate QuestionLLM
    deactivate ChatService
    deactivate FastAPI
```

### シーケンス図（返信生成フロー）

```mermaid
sequenceDiagram
    participant Client
    participant FastAPI
    participant ChatService
    participant ReplyLLM as ReplyGenerationLLM
    participant OpenAI

    Client->>FastAPI: POST /api/reply
    activate FastAPI
    FastAPI->>ChatService: generate_reply_stream()
    activate ChatService
    ChatService->>ReplyLLM: astream()
    activate ReplyLLM

    ReplyLLM->>ReplyLLM: テンプレート展開
    ReplyLLM->>OpenAI: chat.completions.create()
    activate OpenAI

    loop ストリーミング
        OpenAI-->>ReplyLLM: チャンクデータ
        ReplyLLM-->>ChatService: yield content
        ChatService-->>FastAPI: yield content
        FastAPI-->>Client: SSE: data: content
    end

    deactivate OpenAI
    deactivate ReplyLLM
    deactivate ChatService
    deactivate FastAPI
```
