import Link from "next/link";
import { Caveat } from "next/font/google";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

/**
 * FrameLogo Component
 * Reusable header logo for authentication pages
 * 
 * @param {string} zIndex - Tailwind z-index class (default: "z-50")
 */
export default function FrameLogo({ zIndex = "z-50" }) {
  return (
    <div className={`absolute top-6 left-6 ${zIndex} mb-8`}>
      <Link 
        href="/" 
        className={`${caveat.className} text-2xl md:text-3xl font-bold text-emerald-700 hover:text-emerald-800 transition-all duration-300 hover:scale-110`}
      >
        Frame
      </Link>
    </div>
  );
}
