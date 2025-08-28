from pydantic import BaseModel
from datetime import datetime

class TicketBase(BaseModel):
    topic: str

class TicketCreate(TicketBase):
    pass

class Ticket(TicketBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
