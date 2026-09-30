import React from 'react';
import picnicImg from '../assets/images/empty_state_picnic_1790771492180.jpg';
import friendsImg from '../assets/images/empty_state_friends_1790771507069.jpg';

interface BoardEmptyStateProps {
  onCreatePlanBoard: () => void;
}

export const BoardEmptyState: React.FC<BoardEmptyStateProps> = ({
  onCreatePlanBoard,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10 max-w-7xl mx-auto w-full select-none font-['Nunito']">
      {/* 
        Central Card Container strictly matching reference image:
        - Filled background #F8F9FB (Gray 0)
        - Generous rounded corners (rounded-[36px] on mobile, rounded-[44px] on tablet/desktop)
        - Zero drop shadow / no stroke
        - Responsive sizing
      */}
      <div className="w-full max-w-[370px] sm:max-w-[440px] md:max-w-[480px] bg-[#F8F9FB] rounded-[36px] sm:rounded-[44px] px-6 sm:px-10 pt-10 sm:pt-14 pb-10 sm:pb-12 flex flex-col items-center text-center transition-all">
        
        {/* Overlapping tilted photo cards matching reference */}
        <div className="relative flex items-center justify-center pt-2 sm:pt-4 pb-2 w-full">
          {/* Left Photo: Picnic blanket with straw hat, basket & snacks (tilted counter-clockwise) */}
          <div className="relative w-[145px] h-[195px] sm:w-[175px] sm:h-[235px] rounded-[22px] sm:rounded-[26px] overflow-hidden -rotate-[8.5deg] shadow-lg shadow-black/8 shrink-0 z-0 transition-transform duration-300 hover:-rotate-[6deg]">
            <img
              src={picnicImg}
              alt="Picnic planning"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>

          {/* Right Photo: Two friends cheering with drinks in front of colorful mural (tilted clockwise, in front) */}
          <div className="relative w-[155px] h-[205px] sm:w-[185px] sm:h-[245px] rounded-[22px] sm:rounded-[26px] overflow-hidden rotate-[6.5deg] -ml-7 sm:-ml-9 shadow-xl shadow-black/12 shrink-0 z-10 transition-transform duration-300 hover:rotate-[4deg]">
            <img
              src={friendsImg}
              alt="Friends celebrating together"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        </div>

        {/* Headline text matching reference:
            "Group planning made effortless No
             more endless chat scrolls"
        */}
        <div className="mt-8 sm:mt-10 mb-6 sm:mb-8 max-w-[275px] sm:max-w-[320px] mx-auto">
          <h2 className="text-[#1A1B25] font-extrabold text-[17px] sm:text-xl md:text-[22px] leading-snug tracking-tight">
            Group planning made effortless No more endless chat scrolls
          </h2>
        </div>

        {/* Primary CTA Button: Create Plan Board */}
        <button
          type="button"
          onClick={onCreatePlanBoard}
          className="w-full max-w-[280px] sm:max-w-[320px] mx-auto py-3.5 sm:py-4 px-6 rounded-full bg-[#1A1B25] hover:bg-[#272835] active:scale-[0.98] text-white font-extrabold text-sm sm:text-base transition-all cursor-pointer shadow-xs"
        >
          Create Plan Board
        </button>
      </div>
    </div>
  );
};
