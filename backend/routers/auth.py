from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import EmailStr
from datetime import datetime, timedelta, timezone
import bcrypt
import jwt

import database, models
from schemas.user import UserRegister, UserLogin, UserUpdate, UserProfile, ChangePassword, ForgotPassword, ResetPassword, RoleUpdate
from utils.logger import otp_manager
from utils.email_service import email_service
from utils.system_logger import create_log

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

SECRET_KEY = "NHOM_MINH_DAT_SIEU_BAO_MAT_CHONG_HACK_2026"
ALGORITHM = "HS256"
security_bearer = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_bearer), db: Session = Depends(database.get_db)):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    if getattr(user, 'is_blocked', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn đã bị khóa bởi Quản trị viên! Vui lòng liên hệ hỗ trợ."
        )
    return user

def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Quyền truy cập bị từ chối! Tính năng này chỉ dành riêng cho Quản trị viên (Admin)."
        )
    return current_user

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(database.get_db)):
    # Validate password confirmation
    if user_data.password != user_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Mật khẩu xác nhận không khớp!"
        )
    
    user_exists = db.query(models.User).filter(
        (models.User.username == user_data.username) | (models.User.email == user_data.email)
    ).first()
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Tên tài khoản hoặc Email này đã được sử dụng!"
        )
    
    password_bytes = user_data.password.encode('utf-8')
    hashed_pwd = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')
    
    new_user = models.User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pwd,
        role="buyer"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create wallet for new user
    new_wallet = models.Wallet(user_id=new_user.id, balance=0)
    db.add(new_wallet)
    db.commit()
    
    # Log registration
    create_log(db, new_user.id, "register", f"User {new_user.username} registered")
    
    # Send welcome email
    email_service.send_welcome_email(user_data.email, user_data.username)
    
    return {"status": "success", "message": "Chúc mừng bạn tạo tài khoản thành công!"}

# Đảm bảo bạn có import Request từ fastapi ở đầu file nếu dùng: from fastapi import Request
@router.post("/login")
def login(user_data: UserLogin, db: Session = Depends(database.get_db)): # Bỏ tham số request=None gây lỗi mapping
    user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if not user or not bcrypt.checkpw(user_data.password.encode('utf-8'), user.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tài khoản hoặc mật khẩu không chính xác")
    if getattr(user, 'is_blocked', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn đã bị khóa bởi Quản trị viên!"
        )
    
    token_expiry = datetime.now(timezone.utc) + timedelta(days=7 if user_data.remember_me else 1)
    token_payload = {
        "sub": user.username,
        "role": user.role,
        "exp": token_expiry
    }
    token = jwt.encode(token_payload, SECRET_KEY, algorithm=ALGORITHM)
    
    # Ghi log đăng nhập tài khoản
    create_log(db, user.id, "login", f"User {user.username} logged in")
    
    return {
        "status": "success",
        "access_token": token,
        "username": user.username,
        "role": user.role
    }

@router.get("/me") # Sửa lại thành /me để khớp với đầu gọi /api/auth/me ở Frontend
def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    bid_count = db.query(models.Bid).filter(models.Bid.user_id == current_user.id).count()
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "full_name": getattr(current_user, 'full_name', None),
        "phone": getattr(current_user, 'phone', None),
        "address": getattr(current_user, 'address', None),
        "avatar": getattr(current_user, 'avatar', None),
        "is_blocked": getattr(current_user, 'is_blocked', False),
        "is_verified": getattr(current_user, 'is_verified', False),
        "bid_count": bid_count
    }

@router.put("/profile")
def update_profile(
    profile_data: UserUpdate, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(database.get_db)
):
    updates = profile_data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có dữ liệu để cập nhật")
    
    for field, value in updates.items():
        if hasattr(current_user, field):
            setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    create_log(db, current_user.id, "profile_update", f"User {current_user.username} updated profile")
    
    return {"status": "success", "message": "Cập nhật thông tin thành công!"}

@router.post("/change-password")
def change_password(
    password_data: ChangePassword,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    # Verify current password
    if not bcrypt.checkpw(password_data.current_password.encode('utf-8'), current_user.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mật khẩu hiện tại không chính xác")
    
    # Validate new password confirmation
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mật khẩu mới không khớp!")
    
    # Hash new password
    hashed_pwd = bcrypt.hashpw(password_data.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    current_user.hashed_password = hashed_pwd
    
    db.commit()
    
    create_log(db, current_user.id, "password_change", f"User {current_user.username} changed password")
    
    return {"status": "success", "message": "Đổi mật khẩu thành công!"}

@router.post("/forgot-password")
async def forgot_password(request_data: ForgotPassword, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request_data.email).first()
    if not user:
        # For security, don't reveal if email exists or not
        return {"status": "success", "message": "Nếu email tồn tại, bạn sẽ nhận được mã OTP."}
    
    # Generate OTP
    otp = otp_manager.generate_otp(request_data.email)
    
    # Send OTP email
    email_service.send_otp_email(request_data.email, otp)
    
    create_log(db, user.id, "password_reset_request", f"User {user.username} requested password reset")
    
    return {"status": "success", "message": "Mã OTP đã được gửi đến email của bạn."}

@router.post("/reset-password")
async def reset_password(reset_data: ResetPassword, db: Session = Depends(database.get_db)):
    # Verify OTP
    if not otp_manager.verify_otp(reset_data.email, reset_data.otp):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mã OTP không hợp lệ hoặc đã hết hạn!")
    
    # Validate new password confirmation
    if reset_data.new_password != reset_data.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mật khẩu mới không khớp!")
    
    user = db.query(models.User).filter(models.User.email == reset_data.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
    
    # Hash new password
    hashed_pwd = bcrypt.hashpw(reset_data.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.hashed_password = hashed_pwd
    
    db.commit()
    
    create_log(db, user.id, "password_reset", f"User {user.username} reset password via OTP")
    
    return {"status": "success", "message": "Đặt lại mật khẩu thành công!"}

@router.post("/logout")
def logout(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    create_log(db, current_user.id, "logout", f"User {current_user.username} logged out")
    return {"status": "success", "message": "Đăng xuất thành công!"}