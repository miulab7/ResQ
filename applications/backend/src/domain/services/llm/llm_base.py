import pathlib
from abc import ABC, abstractmethod
from datetime import datetime
from typing import AsyncGenerator, Generic, TypeVar
from zoneinfo import ZoneInfo

from jinja2 import Environment, FileSystemLoader, StrictUndefined, Template
from openai import AsyncOpenAI, AsyncStream
from openai.types import CompletionUsage
from openai.types.chat import ChatCompletion, ChatCompletionChunk
from openai.types.chat.chat_completion_chunk import Choice as ChunkChoice
from openai.types.chat.chat_completion_chunk import ChoiceDelta

from src.settings import settings
from src.utils import setup_logger

logger = setup_logger(__name__)


InputDomainModel = TypeVar("InputDomainModel")
OutputDomainModel = TypeVar("OutputDomainModel")


class LLMBase(ABC, Generic[InputDomainModel, OutputDomainModel]):
    """Base class for LLM services with common streaming functionality."""

    def __init__(
        self,
        template_path: pathlib.Path,
        system_prompt_path: pathlib.Path,
    ) -> None:
        """Initialize the LLM service.

        Args:
            template_path (pathlib.Path): Path to the template file
            system_prompt_path (pathlib.Path): Path to the system prompt file
        """
        # Initialize OpenAI client
        self._async_client: AsyncOpenAI = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY.get_secret_value()
        )

        # Setup Jinja2 environment
        self._env: Environment = Environment(
            loader=FileSystemLoader(template_path.parent),
            trim_blocks=True,
            lstrip_blocks=True,
            undefined=StrictUndefined,
        )
        self._template: Template = self._env.get_template(template_path.name)

        # Load system prompt
        with open(system_prompt_path, "r", encoding="utf-8") as f:
            self._system_prompt: str = f.read()

    async def _astream(
        self, template_values: dict[str, str], log_prefix: str
    ) -> AsyncGenerator[str, None]:
        """Process the stream from OpenAI API.

        Args:
            template_values (dict[str, str]): Values to be inserted into the template
            log_prefix (str): Prefix for logging the generated content

        Yields:
            str: The generated content chunks
        """
        try:
            # Render the template
            input_message: str = self._template.render(**template_values)
            logger.info(
                f"Input Message:\n{input_message}", color="gray", show_prefix=True
            )

            stream: AsyncStream[
                ChatCompletionChunk
            ] = await self._async_client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": self._system_prompt},
                    {"role": "user", "content": input_message},
                ],
                # response_format={"type": "json_object"},
                stream=True,
                stream_options={"include_usage": True},
            )

            generated_content: str = ""

            async for chunk in stream:
                # Check if the chunk is a ChatCompletionChunk
                if not isinstance(chunk, ChatCompletionChunk):
                    raise TypeError(f"Expected ChatCompletionChunk, got {type(chunk)}")

                # Extract the chunk data
                completion_id: str = chunk.id
                created_timestamp: int = chunk.created
                datetime_tokyo: datetime = datetime.fromtimestamp(
                    float(created_timestamp), tz=ZoneInfo("Asia/Tokyo")
                )

                usage: CompletionUsage | None = chunk.usage
                if usage is not None:
                    logger.info(
                        f"Completion ID: {completion_id}",
                        color="gray",
                        show_prefix=True,
                    )
                    logger.info(
                        f"Created Timestamp: {datetime_tokyo}",
                        color="gray",
                        show_prefix=True,
                    )
                    logger.info(
                        f"Completion Tokens: {usage.completion_tokens}",
                        color="green",
                        show_prefix=True,
                    )
                    logger.info(
                        f"Prompt Tokens: {usage.prompt_tokens}",
                        color="green",
                        show_prefix=False,
                    )
                    logger.info(
                        f"Total: {usage.total_tokens}", color="green", show_prefix=False
                    )

                choices: list[ChunkChoice] = chunk.choices
                if len(choices) == 0:
                    continue
                if len(choices) != 1:
                    raise ValueError(
                        f"Expected 1 choice, got {len(choices)}. This error may occur if the chat completion `create` method is called with `n` greater than 1."
                    )

                # Extract the chunk content data
                chunk_content: ChoiceDelta = choices[0].delta
                content_message: str | None = chunk_content.content
                refusal_message: str | None = chunk_content.refusal
                if content_message is not None:
                    if refusal_message is not None:
                        raise ValueError(
                            "Both content message and refusal message are not None."
                        )
                else:
                    if refusal_message is not None:
                        raise ValueError(
                            f"The OpenAI API server refused to process the input for the following reason.\n{refusal_message}"
                        )
                    content_message = ""

                generated_content += content_message
                yield f"data:{content_message}\n\n"

            logger.info(
                f"{log_prefix}: {generated_content}",
                color="magenta",
                show_prefix=True,
            )

        except Exception as e:
            logger.error(e)
            yield f"Error: {str(e)}"

    async def _acompletion(
        self, template_values: dict[str, str], log_prefix: str
    ) -> str:
        """Process a completion request from OpenAI API.

        Args:
            template_values (dict[str, str]): Values to be inserted into the template
            log_prefix (str): Prefix for logging the generated content

        Returns:
            str: The generated content
        """
        try:
            # Render the template
            input_message: str = self._template.render(**template_values)
            logger.info(
                f"Input Message:\n{input_message}", color="gray", show_prefix=True
            )

            response: ChatCompletion = await self._async_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": self._system_prompt},
                    {"role": "user", "content": input_message},
                ],
                response_format={"type": "json_object"},
            )

            generated_content: str | None = response.choices[0].message.content or ""
            if generated_content is None:
                generated_content = ""
            logger.info(
                f"{log_prefix}: {generated_content}",
                color="magenta",
                show_prefix=True,
            )

            return generated_content

        except Exception as e:
            logger.error(e)
            return f"Error: {str(e)}"

    @abstractmethod
    async def astream(self, input: InputDomainModel) -> AsyncGenerator[str, None]:
        """Abstract method for generating content using streaming."""
        pass

    @abstractmethod
    async def acompletion(self, input: InputDomainModel) -> OutputDomainModel:
        """Abstract method for generating content using completion."""
        pass
