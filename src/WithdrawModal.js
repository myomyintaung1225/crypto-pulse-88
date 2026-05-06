import React, { useState } from 'react';

const WithdrawModal = ({ isOpen, onClose, user, onWithdraw }) => {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');

  const handleSubmit = () => {
    if (withdrawPin === user.pin) {
      onWithdraw(withdrawAmount, walletAddress);
      setWithdrawAmount('');
      setWalletAddress('');
      setWithdrawPin('');
      onClose();
    } else {
      alert("Wrong PIN");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Withdraw Assets</h2>
        <input
          className="login-input"
          type="number"
          placeholder="Amount (USDT)"
          value={withdrawAmount}
          onChange={e => setWithdrawAmount(e.target.value)}
        />
        <input
          className="login-input"
          placeholder="Wallet Address (TRC20)"
          value={walletAddress}
          onChange={e => setWalletAddress(e.target.value)}
        />
        <input
          className="login-input"
          type="password"
          maxLength="4"
          placeholder="Security PIN"
          value={withdrawPin}
          onChange={e => setWithdrawPin(e.target.value)}
        />
        <button className="buy-btn" onClick={handleSubmit}>Verify & Submit</button>
      </div>
    </div>
  );
};

export default WithdrawModal;