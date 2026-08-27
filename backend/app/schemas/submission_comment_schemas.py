from pydantic import BaseModel


class AddCommentRequest(BaseModel):
    comment: str