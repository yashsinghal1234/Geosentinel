from pydantic import BaseModel, Field
from typing import Optional

class UserBase(BaseModel):
    username: str
    role: str # operator / admin

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    password_hash: str

class User(UserBase):
    id: Optional[str] = Field(None, alias="_id")

    class Config:
        populate_by_name = True
