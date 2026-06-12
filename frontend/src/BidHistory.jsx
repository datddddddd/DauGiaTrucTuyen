import './BidHistory.css';

export default function BidHistory({ bids }) {
  return (
    <div className="bid-history-container">
      <h3>📊 Nhật Ký Lượt Đặt</h3>
      <div className="timeline">
        {bids && bids.length > 0 ? (
          bids.map((bid, index) => (
            <div key={index} className={`bid-item ${index === 0 ? 'latest' : ''}`}>
              <div className="dot"></div>
              <div className="content">
                <span className="time">{bid.time || bid.created_at}</span>
                <span className="user"><strong>{bid.username}</strong></span>
                <span className="amount">{(bid.bid_amount || bid.amount || 0).toLocaleString()} đ</span>
              </div>
            </div>
          ))
        ) : (
          <p className="no-bids">Chưa có lượt đặt giá nào</p>
        )}
      </div>
    </div>
  );
}