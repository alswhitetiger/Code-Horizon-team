from pydantic import BaseModel
from typing import Dict

class SubmissionCreate(BaseModel):
    assessment_id: str
    answers: Dict[str, str]

class LearningLogCreate(BaseModel):
    course_id: str
    event_type: str
    duration_sec: int = 0
    metadata: dict = {}
