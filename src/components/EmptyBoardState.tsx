import React from 'react';
import picnicImg from '../assets/images/empty_board_picnic_1790680089187.jpg';
import friendsImg from '../assets/images/empty_board_friends_1790680103430.jpg';

interface EmptyBoardStateProps {
  onCreateBoard: () => void;
}

export const EmptyBoardState: React.FC<EmptyBoardStateProps> = ({
  onCreateBoard,
}) => {
  return (
    <div className="w-full max-w-[480px] sm:max-w-[520px] mx-auto px-4 py-8 sm:py-12 animate-in fade-in zoom-in-95 duration-200">
      {/* Container card matching Image 3 strictly */}
      <div className="bg-[#F8F9FB] rounded-[32px] sm:rounded-[40px] px-6 sm:px-10 py-12 sm:py-16 flex flex-col items-center justify-center text-center shadow-none select-none">
        
        {/* Overlapping tilted photo cards matching Image 3 */}
        <div className="relative w-64 sm:w-72 h-52 sm:h-56 flex items-center justify-center my-2">
          {/* Card 1: Picnic Blanket (Tilted left ~ -10deg) */}
          <div 
            className="absolute -left-1 sm:left-1 w-36 sm:w-40 h-44 sm:h-48 rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border-[3px] border-white -rotate-12 transform hover:-rotate-6 transition-transform duration-300"
            style={{ zIndex: 1 }}
          >
            <img 
              src={picnicImg} 
              alt="Outdoor picnic snacks" 
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>

          {/* Card 2: Friends smiling with drinks at mural (Tilted right ~ +8deg, overlapping on top) */}
          <div 
            className="absolute -right-1 sm:right-1 w-38 sm:w-44 h-48 sm:h-52 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border-[3.5px] border-white rotate-6 transform hover:rotate-3 transition-transform duration-300"
            style={{ zIndex: 2 }}
          >
            <img 
              src={friendsImg} 
              alt="Friends celebrating together" 
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        </div>

        {/* Text exactly matching Image 3: Group planning made effortless No more endless chat scrolls */}
        <div className="mt-8 sm:mt-10 mb-6 max-w-[300px] sm:max-w-[340px]">
          <h2 className="text-[#1A1B25] text-lg sm:text-[20px] font-extrabold tracking-tight leading-snug font-['Nunito']">
            Group planning made effortless No more endless chat scrolls
          </h2>
        </div>

        {/* Dark pill button: Create Plan Board */}
        <button
          type="button"
          onClick={onCreateBoard}
          className="w-full max-w-[280px] sm:max-w-[300px] py-3.5 sm:py-4 px-6 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white text-sm sm:text-[15px] font-bold tracking-wide transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
        >
          Create Plan Board
        </button>
      </div>
    </div>
  );
};
