# main.py
import sys
import os
from datetime import timedelta, date
from typing import List

# from channels.whatsapp import send_whatsapp_message
from fastapi import FastAPI, Depends, HTTPException, Request, File, UploadFile
import shutil
from fastapi.responses import HTMLResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from jose import jwt, JWTError
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    SECRET_KEY,
    ALGORITHM,
)
from database.sessions import session_local
from database.database import User, Admin, get_user_by_email, Conversation
from backend.ragpipeline import router as rag_router
from adminbackend.inbox import get_inbox_dates, get_users_by_date, get_user_conversation_by_date
from backend.knowledgebase import update_knowledge_base
import schemas
from adminbackend import tickets as tickets_crud

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allows the Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


# Template setup
templates = Jinja2Templates(directory="templates")

# Serve static files if needed
app.mount("/static", StaticFiles(directory="static"), name="static")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

ALLOW_ADMIN_SIGNUP = os.getenv("ALLOW_ADMIN_SIGNUP", "False").lower() == "true"

def get_db():
    db = session_local()
    try:
        yield db
    finally:
        db.close()


def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    token = token.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError as e:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


# ---------- Serve UI ----------
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/dashboard", response_class=HTMLResponse)
def user_interface(request: Request):
    """Serve the dashboard - authentication is handled client-side"""
    return templates.TemplateResponse("userinterface.html", {"request": request})


# -------------------------
#  User Registration (Signup)
# -------------------------
class UserCreate(BaseModel):
    email: str
    password: str
    phone_number: str


@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    # check if user already exists by email
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # check if phone number already exists
    existing_phone = db.query(User).filter(User.phone_number == user.phone_number).first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    # hash password
    hashed_pw = get_password_hash(user.password)

    # create user object with phone number
    new_user = User(
        email=user.email, 
        password=hashed_pw, 
        phone_number=user.phone_number
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # generate token for new user
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )

    # try:
    #     client.messages.create(
    #         from_=TWILIO_WHATSAPP_NUMBER,
    #         body=f"Hello {new_user.email}! 👋 Welcome to our platform.",
    #         to=f"whatsapp:{new_user.phone_number}"
    #     )
    # except Exception as e:
    #     print("Failed to send WhatsApp message:", e)
    return {
        "msg": "User registered successfully",
        "access_token": access_token,
        "token_type": "bearer",
    }


# -------------------------
#  User Login (Existing)
# -------------------------
@app.post("/token")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# -------------------------
#  Protected Route (Profile)
# -------------------------
@app.get("/users/me")
def read_users_me(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"email": email}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def test_dependency():
    print("--- In test_dependency ---")
    sys.stdout.flush()


@app.get("/test", dependencies=[Depends(test_dependency)])
def test_endpoint():
    return {"message": "Test endpoint works!"}


@app.get("/debug")
def debug_endpoint():
    """Debug endpoint to test server"""
    return {"message": "Debug endpoint works!", "routes": "ui route should work"}


@app.get("/favicon.ico")
def favicon():
    """Return empty response for favicon to prevent 404 errors"""
    return Response(content="", media_type="image/x-icon")


# -------------------------
#  Admin Registration & Login
# -------------------------
class AdminCreate(BaseModel):
    email: str
    password: str
    name: str = None
    phone_number: str = None


def get_admin_by_email(db: Session, email: str):
    return db.query(Admin).filter(Admin.email == email).first()


def get_current_admin(request: Request, db: Session = Depends(get_db)):
    """Get current admin from JWT token"""
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    token = token.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_type: str = payload.get("type")  # "admin" or "user"
        if email is None or user_type != "admin":
            raise HTTPException(status_code=401, detail="Invalid admin token")
    except JWTError as e:
        raise HTTPException(status_code=401, detail="Invalid token")

    admin = get_admin_by_email(db, email)
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")

    return admin


@app.post("/admin/register")
def admin_register(admin: AdminCreate, db: Session = Depends(get_db)):
    # Check if admin already exists by email
    existing_admin = get_admin_by_email(db, admin.email)
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin email already registered")
    
    # Check if phone number already exists (if provided)
    if admin.phone_number:
        existing_phone = db.query(Admin).filter(Admin.phone_number == admin.phone_number).first()
        if existing_phone:
            raise HTTPException(status_code=400, detail="Phone number already registered")

    # Hash password
    hashed_pw = get_password_hash(admin.password)

    # Create admin object
    new_admin = Admin(
        email=admin.email,
        password=hashed_pw,
        name=admin.name,
        phone_number=admin.phone_number
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    # Generate token for new admin
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": new_admin.email, "type": "admin"}, expires_delta=access_token_expires
    )

    return {
        "msg": "Admin registered successfully",
        "access_token": access_token,
        "token_type": "bearer",
    }


@app.post("/admin/token")
def admin_login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    admin = get_admin_by_email(db, form_data.username)
    if not admin or not verify_password(form_data.password, admin.password):
        raise HTTPException(status_code=400, detail="Invalid admin credentials")

    if not admin.is_active:
        raise HTTPException(status_code=400, detail="Admin account is deactivated")

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": admin.email, "type": "admin"}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/admin/me")
def read_admin_me(request: Request, db: Session = Depends(get_db)):
    admin = get_current_admin(request, db)
    return {
        "id": admin.id,
        "email": admin.email,
        "name": admin.name,
        "role": admin.role
    }


@app.get("/admin", response_class=HTMLResponse)
def admin_interface(request: Request):
    """Serve the admin dashboard"""
    return templates.TemplateResponse("admininterface.html", {"request": request})


# -------------------------
#  Admin Inbox
# -------------------------




class UserResponse(BaseModel):
    id: int
    email: str
    phone_number: str | None
    name: str | None
    
    class Config:
        from_attributes = True

from datetime import datetime

class ConversationResponse(BaseModel):
    id: int
    user_id: int
    interaction: dict
    resolved: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# -------------------------
#  Admin Channels
# -------------------------

@app.get("/admin/channels", response_model=List[str])
def list_channels(db: Session = Depends(get_db)):
    """Return a list of unique channel names from conversations."""
    # This query is complex to do in pure SQLAlchemy, so we use a little trick.
    # We get all conversations, extract the channel name from the interaction JSON,
    # and then find the unique set.
    conversations = db.query(Conversation).all()
    channel_set = {c.interaction.get("channel") for c in conversations if c.interaction.get("channel")}
    return sorted(list(channel_set))

@app.get("/admin/channels/{channel_name}/users", response_model=List[UserResponse])
def get_users_by_channel(channel_name: str, db: Session = Depends(get_db)):
    """Return a list of users who have interacted on a specific channel."""
    # Find all conversations for the given channel
    conversations = db.query(Conversation).filter(Conversation.interaction["channel"].astext == channel_name).all()
    if not conversations:
        return []
    
    # Get the unique user IDs from those conversations
    user_ids = {c.user_id for c in conversations}
    
    # Get the user objects for those IDs
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    return users

@app.get("/admin/channels/{channel_name}/users/{user_id}/conversations", response_model=List[ConversationResponse])
def get_user_conversations_by_channel(channel_name: str, user_id: int, db: Session = Depends(get_db)):
    """Return all conversations for a specific user on a specific channel."""
    conversations = (
        db.query(Conversation)
        .filter(
            Conversation.user_id == user_id,
            Conversation.interaction["channel"].astext == channel_name
        )
        .order_by(Conversation.created_at.asc())
        .all()
    )
    return conversations


@app.get("/admin/inbox/dates", response_model=List[date])
def get_inbox_dates_route(db: Session = Depends(get_db)):
    return get_inbox_dates(db)


@app.get("/admin/inbox/users", response_model=List[UserResponse])
def get_users_by_date_route(date: date, db: Session = Depends(get_db)):
    return get_users_by_date(db, date)


@app.get("/admin/inbox/conversations", response_model=List[ConversationResponse])
def get_user_conversation_by_date_route(user_id: int, date: date, db: Session = Depends(get_db)):
    return get_user_conversation_by_date(db, user_id, date)


@app.post("/create-admin")
def create_admin_user(admin: AdminCreate, db: Session = Depends(get_db)):
    if not ALLOW_ADMIN_SIGNUP:
        raise HTTPException(status_code=404, detail="Not Found")

    existing_admin = get_admin_by_email(db, admin.email)
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin email already registered")

    if admin.phone_number:
        existing_phone = db.query(Admin).filter(Admin.phone_number == admin.phone_number).first()
        if existing_phone:
            raise HTTPException(status_code=400, detail="Phone number already registered")

    hashed_pw = get_password_hash(admin.password)

    new_admin = Admin(
        email=admin.email,
        password=hashed_pw,
        name=admin.name,
        phone_number=admin.phone_number
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return {"msg": "Admin created successfully"}


# -------------------------
#  Omnichannel Webhooks
# -------------------------
from twilio.rest import Client
from backend.ragpipeline import retrieval_chain, save_conversation
from channels.builders.web import WebMessageBuilder
from channels.builders.twilio import TwilioMessageBuilder
from channels.builders.sms import SmsMessageBuilder # New import
from channels.schemas import StandardizedMessage
from typing import Dict, Any

# --- Twilio Configuration ---
# It is strongly recommended to use environment variables for these
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER") # e.g., 'whatsapp:+14155238886'
TWILIO_SMS_NUMBER = os.getenv("TWILIO_SMS_NUMBER") # New SMS number env var

# Initialize the Twilio client if credentials are provided
twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
else:
    print("WARNING: Twilio credentials not found. WhatsApp/SMS replies will be disabled.")


@app.post("/hooks/web")
async def handle_web_message(payload: Dict[Any, Any], db: Session = Depends(get_db)):
    """
    Handles incoming messages from the web chat, gets an AI response, and returns it.
    """
    try:
        builder = WebMessageBuilder(payload)
        standardized_message = builder.build()
        question = standardized_message.content

        # --- Find user and save their message ---
        user = db.query(User).filter(User.email == standardized_message.sender_id).first()
        if not user:
            raise HTTPException(status_code=404, detail=f"User with email '{standardized_message.sender_id}' not found.")

        save_conversation(
            db=db, 
            user_id=user.id, 
            source="user", 
            content=question, 
            channel=standardized_message.channel_name
        )

        # --- Generate and Save AI Response ---
        result = retrieval_chain.invoke({"input": question})
        ai_response_text = result.get("answer", "I could not find an answer.")

        save_conversation(
            db=db, 
            user_id=user.id, 
            source="bot", 
            content=ai_response_text, 
            channel=standardized_message.channel_name
        )

        # Return the AI response to the frontend
        return {"answer": ai_response_text}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/hooks/twilio")
async def handle_twilio_message(request: Request, db: Session = Depends(get_db)):
    """
    Handles incoming SMS from Twilio, gets an AI response, and sends a reply.
    """
    try:
        payload = await request.form()
        builder = TwilioMessageBuilder(payload)
        standardized_message = builder.build()
        question = standardized_message.content

        # --- Find user and save their message ---
        user = db.query(User).filter(User.phone_number == standardized_message.sender_id).first()
        if not user:
            print(f"User with phone number '{standardized_message.sender_id}' not found.")
            return Response(content="", media_type="application/xml")

        save_conversation(
            db=db, 
            user_id=user.id, 
            source="user", 
            content=question, 
            channel=standardized_message.channel_name
        )

        # --- Generate and Send AI Response ---
        result = retrieval_chain.invoke({"input": question})
        ai_response_text = result.get("answer", "I could not find an answer.")

        save_conversation(
            db=db, 
            user_id=user.id, 
            source="bot", 
            content=ai_response_text, 
            channel=standardized_message.channel_name
        )

        # --- Send Reply via Twilio ---
        if twilio_client and TWILIO_WHATSAPP_NUMBER:
            try:
                to_number = f"whatsapp:{standardized_message.sender_id}"
                twilio_client.messages.create(
                    from_=TWILIO_WHATSAPP_NUMBER,
                    body=ai_response_text,
                    to=to_number
                )
            except Exception as e:
                print(f"ERROR: Failed to send Twilio message: {e}")
        
        return Response(content="", media_type="application/xml")

    except Exception as e:
        print(f"An unexpected error occurred in handle_twilio_message: {e}")
        return Response(content="", media_type="application/xml")


@app.post("/hooks/sms")
async def handle_sms_message(request: Request, db: Session = Depends(get_db)):
    """
    Handles incoming SMS from Twilio, gets an AI response, and sends a reply.
    """
    try:
        payload = await request.form()
        builder = SmsMessageBuilder(payload)
        standardized_message = builder.build()
        question = standardized_message.content

        # --- Find user and save their message ---
        user = db.query(User).filter(User.phone_number == standardized_message.sender_id).first()
        if not user:
            print(f"User with phone number '{standardized_message.sender_id}' not found.")
            return Response(content="", media_type="application/xml")

        save_conversation(
            db=db, 
            user_id=user.id, 
            source="user", 
            content=question, 
            channel=standardized_message.channel_name
        )

        # --- Generate and Send AI Response ---
        result = retrieval_chain.invoke({"input": question})
        ai_response_text = result.get("answer", "I could not find an answer.")

        save_conversation(
            db=db, 
            user_id=user.id, 
            source="bot", 
            content=ai_response_text, 
            channel=standardized_message.channel_name
        )

        # --- Send Reply via Twilio ---
        if twilio_client and TWILIO_SMS_NUMBER:
            try:
                # For SMS, no special prefix is needed for the 'to' number
                twilio_client.messages.create(
                    from_=TWILIO_SMS_NUMBER,
                    body=ai_response_text,
                    to=standardized_message.sender_id
                )
            except Exception as e:
                print(f"ERROR: Failed to send SMS message: {e}")
        
        return Response(content="", media_type="application/xml")

    except Exception as e:
        print(f"An unexpected error occurred in handle_sms_message: {e}")
        return Response(content="", media_type="application/xml")


# Include the router from ragpipeline.py
app.include_router(rag_router)


@app.post("/admin/upload-document")
async def upload_document(file: UploadFile = File(...)):
    upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "uploaded_docs")
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Trigger knowledgebase update
    update_knowledge_base()
    return {"success": True, "filename": file.filename}

@app.get("/admin/get-documents")
async def get_documents():
    upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "uploaded_docs")
    documents = os.listdir(upload_dir)
    return documents


@app.post("/users/me/tickets", response_model=schemas.Ticket)
def create_ticket_for_user(
    ticket: schemas.TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return tickets_crud.create_ticket(db=db, ticket=ticket, user_id=current_user.id)


@app.get("/users/me/tickets", response_model=List[schemas.Ticket])
def read_tickets_for_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return tickets_crud.get_user_tickets(db=db, user_id=current_user.id)


@app.get("/admin/tickets", response_model=List[schemas.Ticket])
def read_all_tickets(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return tickets_crud.get_all_tickets(db=db)


@app.get("/admin/tickets/{ticket_id}")
def read_ticket_details(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    ticket = tickets_crud.get_ticket_details(db=db, ticket_id=ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    user = db.query(User).filter(User.id == ticket.user_id).first()
    
    return {
        "ticket": ticket,
        "user": {
            "email": user.email,
            "phone_number": user.phone_number,
        }
    }


@app.patch("/users/me/tickets/{ticket_id}/resolve", response_model=schemas.Ticket)
def resolve_user_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = tickets_crud.get_ticket_details(db=db, ticket_id=ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to resolve this ticket")
    if ticket.status == "resolved":
        raise HTTPException(status_code=400, detail="Ticket is already resolved")

    return tickets_crud.update_ticket_status(db=db, ticket_id=ticket_id, new_status="resolved")





