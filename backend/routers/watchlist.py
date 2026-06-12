from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import database, models
from schemas.watchlist import WatchlistCreate, WatchlistResponse
from routers.auth import get_current_user

router = APIRouter(prefix="/api/watchlist", tags=["Watchlist"])

@router.post("", status_code=status.HTTP_201_CREATED)
def add_to_watchlist(
    watchlist_data: WatchlistCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    # Check if product exists
    product = db.query(models.Product).filter(models.Product.id == watchlist_data.product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sản phẩm không tồn tại")
    
    # Check if already in watchlist
    existing = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == current_user.id,
        models.Watchlist.product_id == watchlist_data.product_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Sản phẩm này đã có trong danh sách yêu thích của bạn!"
        )
    
    new_item = models.Watchlist(
        user_id=current_user.id,
        product_id=watchlist_data.product_id
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    return {"status": "success", "message": "Đã thêm vào danh sách yêu thích!"}

@router.get("", response_model=List[WatchlistResponse])
def get_watchlist(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    watchlist_items = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == current_user.id
    ).all()
    
    result = []
    for item in watchlist_items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            result.append({
                "id": item.id,
                "user_id": item.user_id,
                "product_id": item.product_id,
                "product_title": product.title,
                "current_price": product.current_price,
                "end_time": product.end_time.isoformat() if product.end_time else None
            })
    
    return result

@router.delete("/{watchlist_id}")
def remove_from_watchlist(
    watchlist_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    item = db.query(models.Watchlist).filter(
        models.Watchlist.id == watchlist_id,
        models.Watchlist.user_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy mục yêu thích này!")
    
    db.delete(item)
    db.commit()
    
    return {"status": "success", "message": "Đã xóa khỏi danh sách yêu thích!"}

@router.delete("/product/{product_id}")
def remove_product_from_watchlist(
    product_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    item = db.query(models.Watchlist).filter(
        models.Watchlist.product_id == product_id,
        models.Watchlist.user_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sản phẩm không có trong danh sách yêu thích!")
    
    db.delete(item)
    db.commit()
    
    return {"status": "success", "message": "Đã xóa sản phẩm khỏi danh sách yêu thích!"}