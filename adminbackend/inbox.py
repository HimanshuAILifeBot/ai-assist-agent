# inbox.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.sessions import get_db
from database.database import Conversation, User


def get_inbox_dates(db: Session):
    """
    Returns all distinct dates where interactions happened.
    """
    dates = (
        db.query(func.date(Conversation.created_at).label("date"))
        .distinct()
        .order_by(func.date(Conversation.created_at).desc())
        .all()
    )
    return [d.date for d in dates]

def get_users_by_date(db: Session, date):
    """
    Returns all unique users who interacted with the bot on a given date.
    """
    users = (
        db.query(User)
        .join(Conversation, Conversation.user_id == User.id)
        .filter(func.date(Conversation.created_at) == date)
        .group_by(User.id)
        .all()
    )
    return users

def get_user_conversation_by_date(db: Session, user_id: int, date):
    """
    Returns all conversations of a given user on a given date.
    """
    conversations = (
        db.query(Conversation)
        .filter(
            Conversation.user_id == user_id,
            func.date(Conversation.created_at) == date
        )
        .order_by(Conversation.created_at.asc())
        .all()
    )
    return conversations

