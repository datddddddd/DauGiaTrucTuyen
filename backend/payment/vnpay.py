import hmac
import hashlib
import urllib.parse
from datetime import datetime

class VNPay:
    def __init__(self, tmn_code: str, hash_secret: str, payment_url: str):
        self.tmn_code = tmn_code.strip().strip('"').strip("'") if tmn_code else ""
        self.hash_secret = hash_secret.strip().strip('"').strip("'") if hash_secret else ""
        self.payment_url = payment_url.strip().strip('"').strip("'") if payment_url else ""

    def get_payment_url(self, return_url: str, txn_ref: str, amount: int, ip_addr: str, order_info: str) -> str:
        requestData = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": self.tmn_code,
            "vnp_Amount": str(int(amount * 100)),  # VNPAY requires amount * 100 (in cents/VND)
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": str(txn_ref),
            "vnp_OrderInfo": order_info,
            "vnp_OrderType": "other",
            "vnp_Locale": "vn",
            "vnp_ReturnUrl": return_url,
            "vnp_IpAddr": ip_addr or "127.0.0.1",
            "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
        }
        
        # Sort and build query string exactly like VNPAY official SDK (using quote_plus)
        inputData = sorted(requestData.items())
        queryString = ''
        seq = 0
        for key, val in inputData:
            if seq == 1:
                queryString = queryString + "&" + key + '=' + urllib.parse.quote_plus(str(val))
            else:
                seq = 1
                queryString = key + '=' + urllib.parse.quote_plus(str(val))
                
        # Generate HMAC-SHA512 checksum exactly like official SDK
        byteKey = self.hash_secret.encode('utf-8')
        byteData = queryString.encode('utf-8')
        hashValue = hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()
        
        final_url = self.payment_url + "?" + queryString + '&vnp_SecureHash=' + hashValue
        
        # Print debug logs exactly as requested by the user
        print(f"[VNPAY DEBUG] --- CREATE PAYMENT URL (OFFICIAL ALGORITHM) ---")
        print(f"[VNPAY DEBUG] Danh sach params truoc khi hash: {requestData}")
        print(f"[VNPAY DEBUG] Chuoi hashData chinh xac: {queryString}")
        print(f"[VNPAY DEBUG] Gia tri vnp_SecureHash tao ra: {hashValue}")
        print(f"[VNPAY DEBUG] URL cuoi cung gui sang VNPAY: {final_url}")
        
        return final_url

    def verify_payment(self, params: dict) -> bool:
        # Clone params to avoid mutating input dictionary
        responseData = dict(params)
        received_hash = responseData.get('vnp_SecureHash')
        
        print(f"[VNPAY DEBUG] --- VERIFY IPN/RETURN PAYMENT (OFFICIAL ALGORITHM) ---")
        print(f"[VNPAY DEBUG] Received Secure Hash: {received_hash}")
        
        if not received_hash:
            print(f"[VNPAY DEBUG] Verification Failed: Missing vnp_SecureHash")
            return False
            
        # Remove hash params exactly like VNPAY official SDK
        if 'vnp_SecureHash' in responseData.keys():
            responseData.pop('vnp_SecureHash')
        if 'vnp_SecureHashType' in responseData.keys():
            responseData.pop('vnp_SecureHashType')
            
        # Build query string exactly like VNPAY official SDK (filtering for vnp_ prefixed keys)
        inputData = sorted(responseData.items())
        hasData = ''
        seq = 0
        for key, val in inputData:
            if str(key).startswith('vnp_'):
                if seq == 1:
                    hasData = hasData + "&" + str(key) + '=' + urllib.parse.quote_plus(str(val))
                else:
                    seq = 1
                    hasData = str(key) + '=' + urllib.parse.quote_plus(str(val))
                    
        # Generate HMAC-SHA512 checksum exactly like official SDK
        byteKey = self.hash_secret.encode('utf-8')
        byteData = hasData.encode('utf-8')
        calculated_hash = hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()
        
        is_valid = calculated_hash.lower() == received_hash.lower()
        
        # Print debug logs exactly as requested by the user
        print(f"[VNPAY DEBUG] Danh sach params truoc khi hash: {responseData}")
        print(f"[VNPAY DEBUG] Chuoi hashData chinh xac: {hasData}")
        print(f"[VNPAY DEBUG] Gia tri vnp_SecureHash tao ra: {calculated_hash}")
        print(f"[VNPAY DEBUG] Ket qua doi soat chu ky: {is_valid}")
        
        return is_valid
