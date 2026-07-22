from pydantic import BaseModel


class SubmitRequest(BaseModel):
    problem_id: str
    language: str
    source_code: str


class TestCaseResult(BaseModel):
    case: int
    input: list
    expected: str
    actual: str
    passed: bool


class SubmitResponse(BaseModel):
    results: list[TestCaseResult]
    passed_count: int
    total_count: int
    all_passed: bool