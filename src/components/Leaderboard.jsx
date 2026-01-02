import React from 'react';

const Leaderboard = ({ type = "Leaderboard", data = [], currentUser }) => {
  const sorted = [...data].sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-yellow-200">
      <h3 className="text-xl font-black mb-4 flex items-center gap-2">
        <span role="img" aria-label="trophy">🏆</span> {type}
      </h3>
      {data.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No results yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {sorted.slice(0, 10).map((r, i) => (
            <div key={i} className={`flex justify-between items-center p-3 rounded-xl ${r.student === currentUser?.name ? 'bg-blue-50 border border-blue-300' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg w-8">#{i + 1}</span>
                <div>
                  <div className="font-bold">{r.student} {r.student === currentUser?.name && '(You)'}</div>
                  <div className="text-xs text-gray-500">{r.mode || 'Practice'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-lg">{r.score}/{r.total}</div>
                <div className="text-xs text-gray-500">{Math.round(r.timeTaken || 0)}s</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;