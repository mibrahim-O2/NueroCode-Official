from pydantic import BaseModel


class AddDiscussionRequest(BaseModel):
    comment: str