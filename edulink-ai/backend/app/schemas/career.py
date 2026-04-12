from pydantic import BaseModel
from typing import Optional


class CareerGoalCreate(BaseModel):
    career_name: str
    reason: Optional[str] = None


class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class CareerChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class CareerQuestionsRequest(BaseModel):
    career_name: str
    subject: Optional[str] = None   # 특정 과목 연계 (선택)
    count: int = 5
