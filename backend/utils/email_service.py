import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import os

class EmailService:
    def __init__(self):
        # For development, we'll just log to console
        # In production, configure these with real SMTP settings
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@daugia.com")
    
    def send_otp_email(self, to_email: str, otp: str) -> bool:
        """Send OTP email for password reset"""
        subject = "Mã xác nhận đặt lại mật khẩu - BIDPRO"
        body = f"""
        <html>
        <body>
            <h2>Mã xác nhận đặt lại mật khẩu</h2>
            <p>Xin chào,</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản BIDPRO của mình.</p>
            <p><strong>Mã OTP của bạn là: {otp}</strong></p>
            <p>Mã này sẽ hết hạn sau 5 phút.</p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            <p>Trân trọng,<br>Đội ngũ BIDPRO</p>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, body)
    
    def send_welcome_email(self, to_email: str, username: str) -> bool:
        """Send welcome email after registration"""
        subject = "Chào mừng bạn đến với BIDPRO"
        body = f"""
        <html>
        <body>
            <h2>Chào mừng {username} đến với BIDPRO!</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại BIDPRO.</p>
            <p>Tài khoản của bạn đã sẵn sàng để tham gia các phiên đấu giá.</p>
            <p>Truy cập <a href="http://localhost:5173">BIDPRO</a> để bắt đầu.</p>
            <p>Trân trọng,<br>Đội ngũ BIDPRO</p>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, body)
    
    def send_auction_won_email(self, to_email: str, product_title: str, price: int) -> bool:
        """Send email when user wins an auction"""
        subject = "Chúc mừng! Bạn đã thắng đấu giá"
        body = f"""
        <html>
        <body>
            <h2>Chúc mừng! 🎉</h2>
            <p>Bạn đã thắng phiên đấu giá cho sản phẩm:</p>
            <p><strong>{product_title}</strong></p>
            <p>Giá thắng: <strong>{price:,} VNĐ</strong></p>
            <p>Vui lòng thanh toán trong vòng 24 giờ để hoàn tất giao dịch.</p>
            <p>Truy cập <a href="http://localhost:5173">BIDPRO</a> để xem chi tiết.</p>
            <p>Trân trọng,<br>Đội ngũ BIDPRO</p>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, body)
    
    def send_outbid_email(self, to_email: str, product_title: str, current_price: int) -> bool:
        """Send email when user is outbid"""
        subject = "Bạn đã bị vượt giá"
        body = f"""
        <html>
        <body>
            <h2>Thông báo vượt giá</h2>
            <p>Bạn đã bị vượt giá trong phiên đấu giá:</p>
            <p><strong>{product_title}</strong></p>
            <p>Giá hiện tại: <strong>{current_price:,} VNĐ</strong></p>
            <p>Truy cập <a href="http://localhost:5173">BIDPRO</a> để đặt giá lại nếu bạn muốn.</p>
            <p>Trân trọng,<br>Đội ngũ BIDPRO</p>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, body)
    
    def send_email(self, to_email: str, subject: str, body: str) -> bool:
        """Send email using SMTP or console log for development"""
        # Always log to console for development visibility
        try:
            print(f"[EMAIL SERVICE] To: {to_email}")
            print(f"[EMAIL SERVICE] Subject: {subject}")
            print(f"[EMAIL SERVICE] Body: {body[:200]}...")
        except UnicodeEncodeError:
            # Fallback for Windows CP1252 consoles to prevent crash
            try:
                print(f"[EMAIL SERVICE] To: {to_email}")
                print(f"[EMAIL SERVICE] Subject: {subject.encode('ascii', errors='replace').decode('ascii')}")
                print(f"[EMAIL SERVICE] Body: {body[:200].encode('ascii', errors='replace').decode('ascii')}...")
            except Exception:
                print(f"[EMAIL SERVICE] Email logged (contains unicode characters)")
        
        # Check if SMTP credentials are provided. If not, simulate success
        if not self.smtp_username or not self.smtp_password:
            print("[EMAIL SERVICE] SMTP username or password is empty. Simulating success in console.")
            return True
            
        try:
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'html'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            print(f"[EMAIL SERVICE] Email successfully sent to {to_email} via SMTP.")
            return True
        except Exception as e:
            print(f"[EMAIL SERVICE] Error sending email via SMTP: {e}")
            return False

email_service = EmailService()