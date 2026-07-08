import hmac
import hashlib
import urllib.parse
from datetime import datetime

class VNPay:
    def __init__(self, tmn_code: str, hash_secret: str, payment_url: str):
        self.tmn_code = tmn_code
        self.hash_secret = hash_secret
        self.payment_url = payment_url

    def get_payment_url(self, return_url: str, txn_ref: str, amount: int, ip_addr: str, order_info: str) -> str:
        params = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": self.tmn_code,
            "vnp_Amount": str(amount * 100),  # VNPAY requires amount * 100 (in cents/VND)
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": str(txn_ref),
            "vnp_OrderInfo": order_info,
            "vnp_OrderType": "other",
            "vnp_Locale": "vn",
            "vnp_ReturnUrl": return_url,
            "vnp_IpAddr": ip_addr or "127.0.0.1",
            "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
        }
        
        # Sort parameters alphabetically by key
        sorted_params = sorted(params.items())
        
        # Build query string using standard urllib.parse.urlencode
        query_string = urllib.parse.urlencode(sorted_params)
        
        # Generate HMAC-SHA512 checksum
        secure_hash = hmac.new(
            self.hash_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
        
        return f"{self.payment_url}?{query_string}&vnp_SecureHash={secure_hash}"

    def verify_payment(self, params: dict) -> bool:
        received_hash = params.get("vnp_SecureHash")
        if not received_hash:
            return False
            
        # Extract and sort VNPAY parameters, excluding empty or null values
        clean_params = {
            k: v for k, v in params.items()
            if k.startswith("vnp_") 
            and k not in ["vnp_SecureHash", "vnp_SecureHashType"]
            and v is not None 
            and str(v).strip() != ""
        }
        sorted_params = sorted(clean_params.items())
        
        # Generate query string using standard urllib.parse.urlencode
        query_string = urllib.parse.urlencode(sorted_params)
        
        # Generate hash
        calculated_hash = hmac.new(
            self.hash_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
        
        return calculated_hash.lower() == received_hash.lower()
