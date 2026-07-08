import hashlib
import hmac
import urllib.parse
from datetime import datetime

class VNPay:
    def __init__(self, tmn_code: str, hash_secret: str, payment_url: str):
        self.tmn_code = tmn_code.strip() if tmn_code else ""
        self.hash_secret = hash_secret.strip() if hash_secret else ""
        self.payment_url = payment_url.strip() if payment_url else ""
        self.requestData = {}
        self.responseData = {}

    def get_payment_url(self, return_url: str, txn_ref: str, amount: int, ip_addr: str, order_info: str) -> str:
        self.requestData = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": self.tmn_code,
            "vnp_Amount": str(int(amount * 100)),
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": str(txn_ref),
            "vnp_OrderInfo": order_info,
            "vnp_OrderType": "other",
            "vnp_Locale": "vn",
            "vnp_ReturnUrl": return_url,
            "vnp_IpAddr": ip_addr or "127.0.0.1",
            "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
        }
        
        # --- FROM OFFICIAL SDK (DO NOT MODIFY ALGORITHM) ---
        inputData = sorted(self.requestData.items())
        queryString = ''
        seq = 0
        for key, val in inputData:
            if seq == 1:
                queryString = queryString + "&" + key + '=' + urllib.parse.quote_plus(str(val))
            else:
                seq = 1
                queryString = key + '=' + urllib.parse.quote_plus(str(val))

        hashValue = self.__hmacsha512(self.hash_secret, queryString)
        final_url = self.payment_url + "?" + queryString + '&vnp_SecureHash=' + hashValue
        # --- END OF OFFICIAL SDK CODE ---
        
        # Debug logs exactly as requested
        print(f"[VNPAY DEBUG] --- CREATE PAYMENT URL ---")
        print(f"[VNPAY DEBUG] Danh sach params truoc khi hash: {self.requestData}")
        print(f"[VNPAY DEBUG] Chuoi hashData chinh xac: {queryString}")
        print(f"[VNPAY DEBUG] Gia tri vnp_SecureHash tao ra: {hashValue}")
        print(f"[VNPAY DEBUG] URL cuoi cung gui sang VNPAY: {final_url}")
        
        return final_url

    def verify_payment(self, params: dict) -> bool:
        self.responseData = dict(params)
        
        # --- FROM OFFICIAL SDK (DO NOT MODIFY ALGORITHM) ---
        vnp_SecureHash = self.responseData['vnp_SecureHash']
        # Remove hash params
        if 'vnp_SecureHash' in self.responseData.keys():
            self.responseData.pop('vnp_SecureHash')

        if 'vnp_SecureHashType' in self.responseData.keys():
            self.responseData.pop('vnp_SecureHashType')

        inputData = sorted(self.responseData.items())
        hasData = ''
        seq = 0
        for key, val in inputData:
            if str(key).startswith('vnp_'):
                if seq == 1:
                    hasData = hasData + "&" + str(key) + '=' + urllib.parse.quote_plus(str(val))
                else:
                    seq = 1
                    hasData = str(key) + '=' + urllib.parse.quote_plus(str(val))
        hashValue = self.__hmacsha512(self.hash_secret, hasData)
        # --- END OF OFFICIAL SDK CODE ---

        is_valid = vnp_SecureHash == hashValue
        
        # Debug logs exactly as requested
        print(f"[VNPAY DEBUG] --- VERIFY IPN/RETURN PAYMENT ---")
        print(f"[VNPAY DEBUG] Danh sach params truoc khi hash: {self.responseData}")
        print(f"[VNPAY DEBUG] Chuoi hashData chinh xac: {hasData}")
        print(f"[VNPAY DEBUG] Gia tri vnp_SecureHash tao ra: {hashValue}")
        print(f"[VNPAY DEBUG] Ket qua doi soat chu ky: {is_valid}")

        return is_valid

    @staticmethod
    def __hmacsha512(key, data):
        byteKey = key.encode('utf-8')
        byteData = data.encode('utf-8')
        return hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()
