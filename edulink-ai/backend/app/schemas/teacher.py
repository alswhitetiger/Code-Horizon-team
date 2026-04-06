from pydantic import BaseModel
from typing import Optional, List, Literal

class CourseCreate(BaseModel):
    title: str
    subject: str
    grade_level: Optional[str] = None

class QuestionGenerateRequest(BaseModel):
    subject: str
    grade_level: str
    topic: str
    question_type: Literal["객관식", "단답형", "서술형"]
    difficulty: Literal["쉬움", "보통", "어려움"]
    count: int = 5
    course_id: Optional[str] = None

class AssessmentCreate(BaseModel):
    course_id: str
    title: str
    questions: List[dict]

class GradeRequest(BaseModel):
    score: Optional[float] = None
    feedback: Optional[str] = None
