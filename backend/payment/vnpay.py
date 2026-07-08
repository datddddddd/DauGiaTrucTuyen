import hmac
import hashlib
import urllib.parse
from datetime import datetime

class VNPay:
    def __init__(self, tmn_code: str, hash_secret: str, payment_url: str):
        self.tmn_code = tmn_code.strip() if tmn_code else ""
        self.hash_secret = hash_secret.strip() if hash_secret else ""
        self.payment_url = payment_url.strip() if payment_url else ""

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
        
        # Build query string using urllib.parse.quote to force %20 instead of +
        query_string = urllib.parse.urlencode(sorted_params, quote_via=urllib.parse.quote)
        
        # Generate HMAC-SHA512 checksum
        secure_hash = hmac.new(
            self.hash_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
        
        final_url = f"{self.payment_url}?{query_string}&vnp_SecureHash={secure_hash}"
        
        # Print debug logs exactly as requested
        print(f"[VNPAY DEBUG] --- CREATE PAYMENT URL ---")
        print(f"[VNPAY DEBUG] Danh sach params truoc khi hash: {params}")
        print(f"[VNPAY DEBUG] Chuoi hashData chinh xac: {query_string}")
        print(f"[VNPAY DEBUG] Gia tri vnp_SecureHash tao ra: {secure_hash}")
        print(f"[VNPAY DEBUG] URL cuoi cung gui sang VNPAY: {final_url}")
        
        return final_url

    def verify_payment(self, params: dict) -> bool:
        received_hash = params.get("vnp_SecureHash")
        
        print(f"[VNPAY DEBUG] --- VERIFY IPN/RETURN PAYMENT ---")
        print(f"[VNPAY DEBUG] Received Secure Hash: {received_hash}")
        
        if not received_hash:
            print(f"[VNPAY DEBUG] Verification Failed: Missing vnp_SecureHash")
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
        
        # Generate query string using urllib.parse.quote to force %20 instead of +
        query_string = urllib.parse.urlencode(sorted_params, quote_via=urllib.parse.quote)
        
        # Generate hash
        calculated_hash = hmac.new(
            self.hash_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
        
        is_valid = calculated_hash.lower() == received_hash.lower()
        
        # Print debug logs exactly as requested
        print(f"[VNPAY DEBUG] Danh sach params truoc khi hash: {clean_params}")
        print(f"[VNPAY DEBUG] Chuoi hashData chinh xac: {query_string}")
        print(f"[VNPAY DEBUG] Gia tri vnp_SecureHash tao ra: {calculated_hash}")
        print(f"[VNPAY DEBUG] Ket qua doi soat chu ky: {is_valid}")
        
        return is_valid
