import React from 'react';
import { Volume2, Lightbulb, SkipForward, StopCircle } from 'lucide-react';

const GameInterface = ({
  game, setGame, hintState, setHintState, feedbackState,
  submitWord, requestHint, speak, quizOptions, currentWord
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-500 to-blue-600">
      <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex justify-between text-sm font-bold mb-8">
          <span>{game.mode.toUpperCase()} • {game.gameType.toUpperCase()}</span>
          <span>{game.timeLeft > 0 ? `${game.timeLeft}s` : '∞'}</span>
          <span>{game.index + 1}/{game.words.length}</span>
        </div>

        {/* Speak Button (Always show for spelling in test/practice) */}
        {game.gameType === 'spelling' && currentWord && (
          <button
            onClick={() => speak(currentWord.word)}
            className="mx-auto mb-8 bg-yellow-400 p-6 rounded-full shadow-lg hover:scale-110 transition-transform"
          >
            <Volume2 size={48} className="text-yellow-900" />
          </button>
        )}

        {/* Hint */}
        {hintState.currentHintText && (
          <div className="bg-blue-50 p-4 rounded-xl mb-6 text-blue-800 font-bold">
            {hintState.currentHintText}
          </div>
        )}

        {/* Word Display */}
        <div className="text-5xl font-black text-center mb-8 text-gray-800">
          {currentWord?.word || 'Loading...'}
        </div>

        {/* Input or Quiz */}
        {game.gameType === 'quiz' ? (
          <div className="space-y-4">
            {quizOptions.map((opt, i) => (
              <button key={i} onClick={() => submitWord(opt.isCorrect)} className="w-full p-4 bg-gray-100 rounded-xl hover:bg-yellow-100 transition">
                {opt.text}
              </button>
            ))}
          </div>
        ) : (
          <>
            <input
              autoFocus
              type="text"
              value={game.input}
              onChange={(e) => setGame({ ...game, input: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && submitWord()}
              className="w-full text-center text-4xl font-bold border-b-4 border-gray-300 focus:border-yellow-500 outline-none mb-8"
              placeholder="Type here..."
            />
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => submitWord()} className="bg-green-500 text-white font-bold py-4 rounded-xl">SUBMIT</button>
              <button onClick={() => submitWord('skip')} className="bg-gray-300 font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                <SkipForward /> Skip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GameInterface;