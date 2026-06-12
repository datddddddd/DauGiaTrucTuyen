from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import database, models
from schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from routers.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/api/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(database.get_db)):
    categories = db.query(models.Category).all()
    
    result = []
    for cat in categories:
        product_count = db.query(models.Product).filter(models.Product.category_id == cat.id).count()
        result.append({
            "id": cat.id,
            "name": cat.name,
            "description": cat.description,
            "product_count": product_count
        })
    
    return result

@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(database.get_db)):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy danh mục!")
    
    product_count = db.query(models.Product).filter(models.Product.category_id == category_id).count()
    
    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "product_count": product_count
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    # Check if category name already exists
    existing = db.query(models.Category).filter(models.Category.name == category_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Danh mục với tên này đã tồn tại!"
        )
    
    new_category = models.Category(
        name=category_data.name,
        description=category_data.description
    )
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    
    return {"status": "success", "message": "Đã tạo danh mục thành công!", "category_id": new_category.id}

@router.put("/{category_id}")
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy danh mục!")
    
    updates = category_data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có dữ liệu để cập nhật")
    
    for field, value in updates.items():
        if hasattr(category, field):
            setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    
    return {"status": "success", "message": "Đã cập nhật danh mục thành công!"}

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy danh mục!")
    
    # Check if category has products
    product_count = db.query(models.Product).filter(models.Product.category_id == category_id).count()
    if product_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Không thể xóa danh mục này vì vẫn còn {product_count} sản phẩm!"
        )
    
    db.delete(category)
    db.commit()
    
    return {"status": "success", "message": "Đã xóa danh mục thành công!"}