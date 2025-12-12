"use client";

import { Caveat } from "next/font/google";
import { useState } from "react";
import CreateCampaignModal from "./CreateCampaignModal";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

export default function Hero() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleModalClose = (navigated) => {
    setIsCreateModalOpen(false);
  };

  return (
    <>
      <section className="bg-yellow-400 text-black py-12 sm:py-16 md:py-24 border-0 shadow-none -mt-px">
        <div className="mx-auto w-full max-w-screen-xl px-3 sm:px-4 md:px-6 text-center">
          <h1 className={`${caveat.className} text-5xl sm:text-7xl md:text-8xl font-bold text-emerald-700 whitespace-nowrap`}>
            Frame Your Voice
          </h1>
          <p className="mt-3 sm:mt-4 md:mt-6 text-sm sm:text-base md:text-lg opacity-90">
            Create and share frames that amplify your message, celebrate your cause, and inspire others to join in.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-row items-center justify-center gap-3 sm:gap-5 flex-nowrap">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-base btn-primary px-4 py-2.5 sm:px-7 sm:py-4 text-sm sm:text-base md:text-lg font-semibold whitespace-nowrap"
            >
              Create Campaign
            </button>
            <a
              href="/campaigns"
              className="btn-base btn-secondary border-2 border-emerald-700 px-4 py-2.5 sm:px-7 sm:py-4 text-emerald-800 text-sm sm:text-base md:text-lg font-semibold whitespace-nowrap"
            >
              Browse Campaigns
            </a>
          </div>
        </div>
      </section>

      <CreateCampaignModal 
        isOpen={isCreateModalOpen} 
        onClose={handleModalClose} 
      />
    </>
  );
}
