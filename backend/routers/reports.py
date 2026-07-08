from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

import database, models
from schemas.report import ReportCreate, ReportResponse
from routers.auth import get_current_user, get_current_admin
from utils.system_logger import create_log

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.post("", status_code=status.HTTP_201_CREATED)
def create_report(
    report_data: ReportCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    new_report = models.Report(
        user_id=current_user.id,
        product_id=report_data.product_id,
        reported_user_id=report_data.reported_user_id,
        report_type=report_data.report_type,
        description=report_data.description,
        status="pending"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    # Log action
    product_title = ""
    if report_data.product_id:
        p = db.query(models.Product).filter(models.Product.id == report_data.product_id).first()
        if p:
            product_title = p.title
    create_log(db, current_user.id, "report_created", f"User {current_user.username} reported product: {product_title or report_data.product_id}")
    
    return {"status": "success", "message": "Gửi báo cáo vi phạm thành công!"}

@router.get("")
def get_reports(
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    reports = db.query(models.Report).order_by(models.Report.created_at.desc()).all()
    
    result = []
    for r in reports:
        reporter = db.query(models.User).filter(models.User.id == r.user_id).first()
        product = db.query(models.Product).filter(models.Product.id == r.product_id).first() if r.product_id else None
        reported_user = db.query(models.User).filter(models.User.id == r.reported_user_id).first() if r.reported_user_id else None
        
        reporter_str = f"{reporter.username} (Khách hàng)" if reporter else "Unknown"
        reported_str = ""
        if product:
            reported_str = f"{product.title} (Sản phẩm)"
        elif reported_user:
            reported_str = f"{reported_user.username} ({reported_user.role})"
        else:
            reported_str = "N/A"
            
        # Map DB status to UI display status
        # UI has: "Đang chờ xử lý", "Đang điều tra", "Đã phân xử xong"
        display_status = "Đang chờ xử lý"
        if r.status == "reviewed":
            display_status = "Đang điều tra"
        elif r.status == "resolved":
            display_status = "Đã phân xử xong"
        elif r.status == "dismissed":
            display_status = "Đã bác bỏ"
            
        result.append({
            "id": r.id,
            "reporter": reporter_str,
            "reported": reported_str,
            "reason": r.description,
            "status": display_status,
            "db_status": r.status,
            "date": r.created_at.strftime("%Y-%m-%d") if r.created_at else None,
            "product_id": r.product_id,
            "reported_user_id": r.reported_user_id
        })
    return result

@router.put("/{report_id}/resolve")
def resolve_report(
    report_id: int,
    action_data: dict,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy báo cáo!")
        
    action = action_data.get("action", "resolve")
    if action == "resolve":
        report.status = "resolved"
    elif action == "dismiss":
        report.status = "dismissed"
    elif action == "investigate":
        report.status = "reviewed"
    else:
        report.status = "resolved"
        
    report.reviewed_at = datetime.utcnow()
    report.reviewed_by = current_admin.id
    db.commit()
    
    create_log(db, current_admin.id, "report_resolved", f"Admin resolved report {report_id} as {report.status}")
    return {"status": "success", "message": "Đã xử lý khiếu nại thành công!"}
