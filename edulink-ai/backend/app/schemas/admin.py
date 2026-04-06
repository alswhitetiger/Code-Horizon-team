from pydantic import BaseModel
from typing import Optional

class ReportRequest(BaseModel):
    course_id: Optional[str] = None
    period: str = "week"
