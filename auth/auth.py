from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import hashlib
import hmac
import os

# secret key (keep safe, use env var in production)
SECRET_KEY = "mysecretkey123"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# password hashing
def get_password_hash(password: str) -> str:
    salt = os.urandom(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return salt.hex() + ':' + pwd_hash.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt_hex, pwd_hash_hex = hashed_password.split(':')
        salt = bytes.fromhex(salt_hex)
        pwd_hash = bytes.fromhex(pwd_hash_hex)
        new_pwd_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
        return hmac.compare_digest(new_pwd_hash, pwd_hash)
    except (ValueError, IndexError):
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)