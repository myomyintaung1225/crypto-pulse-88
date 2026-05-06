import React from 'react';

const TradeResultModal = ({ isOpen, onClose, tradeResult }) => {
  if (!isOpen || !tradeResult) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content result-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Trade Result</h2>
        <div className="result-details">
          <div className="result-row">
            <span className="result-label">Order ID:</span>
            <span className="result-value">{tradeResult.orderId}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Position Size:</span>
            <span className="result-value">${tradeResult.amount.toLocaleString()}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Open Price:</span>
            <span className="result-value">${tradeResult.openPrice.toFixed(2)}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Close Price:</span>
            <span className="result-value">${tradeResult.closePrice.toFixed(2)}</span>
          </div>
          <div className="result-row profit-row">
            <span className="result-label">Profit/Loss:</span>
            <span className={`result-value profit-amount ${tradeResult.win ? 'profit-win' : 'profit-loss'}`}>
              {tradeResult.win ? '+' : '-'}${Math.abs(tradeResult.profit).toFixed(2)}
            </span>
          </div>
        </div>
        <button className="buy-btn" onClick={onClose}>Continue Trading</button>
      </div>
    </div>
  );
};

export default TradeResultModal;