import random
import string
from datetime import datetime, timedelta
from typing import Optional

class OTPManager:
    def __init__(self):
        self.otps = {}  # {email: {"otp": "123456", "expires_at": datetime}}
    
    def generate_otp(self, email: str, expiry_minutes: int = 5) -> str:
        """Generate OTP and store with expiry time"""
        otp = ''.join(random.choices(string.digits, k=6))
        expires_at = datetime.now() + timedelta(minutes=expiry_minutes)
        self.otps[email] = {
            "otp": otp,
            "expires_at": expires_at
        }
        return otp
    
    def verify_otp(self, email: str, otp: str) -> bool:
        """Verify OTP for given email"""
        if email not in self.otps:
            return False
        
        stored_data = self.otps[email]
        if datetime.now() > stored_data["expires_at"]:
            del self.otps[email]
            return False
        
        if stored_data["otp"] == otp:
            del self.otps[email]  # Remove after successful verification
            return True
        
        return False
    
    def cleanup_expired(self):
        """Remove expired OTPs"""
        now = datetime.now()
        expired_emails = [
            email for email, data in self.otps.items()
            if now > data["expires_at"]
        ]
        for email in expired_emails:
            del self.otps[email]

otp_manager = OTPManager()