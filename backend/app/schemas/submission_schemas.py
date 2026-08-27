from pydantic import BaseModel


class SubmitRequest(BaseModel):
    problem_id: str
    language: str
    source_code: str
    # problem_id above is already required and passed through unchanged —
    # this note just confirms it now also gets persisted onto the
    # submissions row itself (see submission_routes.py), not just used
    # to fetch the problem for grading.


class TestCaseResult(BaseModel):
    case: int
    input: list
    expected: str
    actual: str
    passed: bool


class AntiPattern(BaseModel):
    key: str
    message: str


class AnalysisResult(BaseModel):
    complexity: str
    anti_patterns: list[AntiPattern]
    feedback: str
    reordered_topic: str | None = None


class SubmitResponse(BaseModel):
    results: list[TestCaseResult]
    passed_count: int
    total_count: int
    all_passed: bool
    analysis: AnalysisResult | None = None