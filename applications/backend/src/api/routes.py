import pathlib
from typing import Any

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from src.api.schemas import (
    HealthCheckResponse,
    QuestionGenerationRequest,
    ReplyGenerationRequest,
)
from src.domain.models import (
    EmailInformation,
    QuestionGenerationInput,
    ReplyGenerationInput,
    UserInformation,
)
from src.domain.services.chat_service import ChatService

router = APIRouter()


@router.get("/health", response_model=HealthCheckResponse)
async def health_check() -> Any:
    """Health check endpoint.

    Returns:
        HealthCheckResponse: The status of the health check.
    """
    return {"status": "ok"}


@router.post("/questions")
async def generate_questions(request: QuestionGenerationRequest) -> StreamingResponse:
    """Generate questions based on the mail information.

    Args:
        request (QuestionGenerationRequest): The request for generating questions.

    Returns:
        StreamingResponse: The generated question.
    """
    # Convert request to domain model
    question_input = QuestionGenerationInput(
        email_info=EmailInformation(**request.email_information.model_dump()),
        user_info=UserInformation(**request.user_information.model_dump()),
    )

    chat_service: ChatService = ChatService(prompt_directory=pathlib.Path("data"))
    return StreamingResponse(
        chat_service.generate_questions_stream(question_input),
        media_type="text/event-stream",
    )


@router.post("/reply")
async def generate_reply(request: ReplyGenerationRequest) -> StreamingResponse:
    """Generate replies based on the reply prompt information.

    Args:
        request (ReplyGenerationRequest): The request for generating replies.

    Returns:
        StreamingResponse: The generated reply.
    """
    # Convert request to domain model
    reply_input = ReplyGenerationInput(
        email_info=EmailInformation(**request.email_information.model_dump()),
        user_info=UserInformation(**request.user_information.model_dump()),
        customization=request.customization,
        selected_choices=request.selected_choices,
        current_reply=request.current_reply,
    )

    chat_service: ChatService = ChatService(prompt_directory=pathlib.Path("data"))
    return StreamingResponse(
        chat_service.generate_reply_stream(reply_input),
        media_type="text/event-stream",
    )
