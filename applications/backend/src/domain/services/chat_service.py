import pathlib
from typing import AsyncGenerator

from src.domain.models import QuestionGenerationInput, ReplyGenerationInput
from src.domain.services.llm import QuestionGenerationLLM, ReplyGenerationLLM
from src.utils import setup_logger

logger = setup_logger(__name__)


class ChatService:
    """The service for interacting with the OpenAI chat API."""

    def __init__(self, prompt_directory: pathlib.Path) -> None:
        """Initialize the ChatService.

        Args:
            prompt_directory (pathlib.Path): The directory containing the prompt files.
        """
        # Initialize LLM services
        self._question_generation_llm = QuestionGenerationLLM(prompt_directory)
        self._reply_generation_llm = ReplyGenerationLLM(prompt_directory)

    async def generate_questions(
        self, input: QuestionGenerationInput
    ) -> str:
        """Generate questions based on the mail information.

        Args:
            input (QuestionGenerationInput): The input for generating questions.

        Returns:
            str: The generated question.
        """
        return await self._question_generation_llm.acompletion(input)

    async def generate_reply_stream(
        self, input: ReplyGenerationInput
    ) -> AsyncGenerator[str, None]:
        """Generate a reply based on the reply prompt information.

        Args:
            input (ReplyGenerationInput): The input for generating replies.

        Yields:
            str: The generated reply.
        """
        async for content in self._reply_generation_llm.astream(input):
            yield content
