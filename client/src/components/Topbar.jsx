import React from 'react';

const Topbar = ({ title, actionLabel, onAction }) => {
  return (
    <header className="bg-white border-b flex items-center justify-between px-4" style={{ height: '52px' }}>
      <div className="text-lg font-semibold">{title}</div>
      <div>
        {actionLabel && (
          <button
            onClick={onAction}
            className="bg-[#1a56db] hover:bg-[#164ab8] text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </header>
  );
};

export default Topbar;
