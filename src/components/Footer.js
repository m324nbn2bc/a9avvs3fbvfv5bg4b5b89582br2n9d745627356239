"use client";

import { Caveat } from "next/font/google";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

const countries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahrain", "Bangladesh", "Belarus", "Belgium", "Bolivia", "Bosnia and Herzegovina", "Brazil", "Bulgaria",
  "Cambodia", "Canada", "Chile", "China", "Colombia", "Croatia", "Czech Republic",
  "Denmark", "Ecuador", "Egypt", "Estonia", "Ethiopia",
  "Finland", "France", "Georgia", "Germany", "Ghana", "Greece",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait",
  "Latvia", "Lebanon", "Lithuania", "Malaysia", "Mexico", "Morocco",
  "Netherlands", "New Zealand", "Nigeria", "Norway",
  "Pakistan", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Saudi Arabia", "Serbia", "Singapore", "Slovakia", "Slovenia", 
  "South Africa", "South Korea", "Spain", "Sri Lanka", "Sweden", "Switzerland",
  "Thailand", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Venezuela", "Vietnam"
];

export default function Footer() {
  const [selectedCountry, setSelectedCountry] = useState("United States");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const filteredCountries = countries.filter(country => 
    country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Move selected country to top of filtered list
  const sortedCountries = [
    ...filteredCountries.filter(country => country === selectedCountry),
    ...filteredCountries.filter(country => country !== selectedCountry)
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  return (
    <footer className="bg-white text-black border-t border-gray-100 shadow-sm">
      {/* Main Footer Section */}
      <div className="mx-auto w-full max-w-screen-xl px-3 sm:px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand and App Downloads */}
          <div className="lg:col-span-2">
            <Link 
              href="/" 
              className={`${caveat.className} text-3xl font-bold text-emerald-700 hover:text-emerald-800 transition-colors duration-200 mb-6 inline-block`}
            >
              Frame
            </Link>
            
            {/* App Download Buttons */}
            <div className="mb-6">
              <p className="text-gray-600 mb-3">Download our app:</p>
              <div className="flex flex-row gap-2">
                <button className="btn-base bg-black text-white hover:bg-gray-800 py-2 px-3 flex-1 gap-1.5">
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left min-w-0">
                    <div className="text-xs text-gray-300">GET IT ON</div>
                    <div className="text-xs font-semibold truncate">Google Play</div>
                  </div>
                </button>
                
                <button className="btn-base bg-black text-white hover:bg-gray-800 py-2 px-3 flex-1 gap-1.5">
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
                  </svg>
                  <div className="text-left min-w-0">
                    <div className="text-xs text-gray-300">Download on the</div>
                    <div className="text-xs font-semibold truncate">App Store</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Country Dropdown */}
            <div className="w-full sm:w-auto relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="btn-base btn-secondary w-full sm:w-64 px-3 py-2 text-sm text-left"
              >
                <span className="truncate">
                  {selectedCountry || "Choose country (or region)"}
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-hidden">
                  {/* Search Input */}
                  <div className="p-2 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="Search countries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                    />
                  </div>
                  
                  {/* Country List */}
                  <div className="max-h-48 overflow-y-auto">
                    {sortedCountries.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">No countries found</div>
                    ) : (
                      sortedCountries.map((country) => (
                        <button
                          key={country}
                          onClick={() => handleCountrySelect(country)}
                          className={`btn-base w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                            country === selectedCountry 
                              ? 'bg-yellow-400 text-black font-medium' 
                              : 'text-gray-700'
                          }`}
                        >
                          {country}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Discover Column - Removed "Explore" */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Discover</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-emerald-700 transition-colors duration-200">Campaigns</a></li>
              <li><a href="#" className="text-gray-600 hover:text-emerald-700 transition-colors duration-200">Leaderboard</a></li>
              <li><a href="#" className="text-gray-600 hover:text-emerald-700 transition-colors duration-200">Pricing</a></li>
              <li><a href="#" className="text-gray-600 hover:text-emerald-700 transition-colors duration-200">Help Center</a></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-emerald-700 transition-colors duration-200">For Creators</a></li>
              <li><a href="#" className="text-gray-600 hover:text-emerald-700 transition-colors duration-200">What is a Twibbon?</a></li>
              <li><a href="#" className="text-gray-600 hover:text-emerald-700 transition-colors duration-200">Use Cases</a></li>
              <li><a href="#" className="text-gray-600 hover:text-emerald-700 transition-colors duration-200">Testimonials</a></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-2 mb-6">
              <li><a href="#" className="text-gray-600 hover:text-emerald-700 transition-colors duration-200">About</a></li>
              <li><a href="#" className="text-gray-600 hover:text-emerald-700 transition-colors duration-200">Blog</a></li>
              <li><a href="#" className="text-gray-600 hover:text-emerald-700 transition-colors duration-200">Media Assets</a></li>
              <li><a href="#" className="text-gray-600 hover:text-emerald-700 transition-colors duration-200">Contact Us</a></li>
            </ul>

            {/* Join Us - Social Media */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Join Us</h4>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 bg-gray-100 hover:bg-emerald-100 rounded-full flex items-center justify-center transition-colors duration-200">
                  <svg className="w-4 h-4 text-gray-600 hover:text-emerald-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="w-8 h-8 bg-gray-100 hover:bg-emerald-100 rounded-full flex items-center justify-center transition-colors duration-200">
                  <svg className="w-4 h-4 text-gray-600 hover:text-emerald-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a href="#" className="w-8 h-8 bg-gray-100 hover:bg-emerald-100 rounded-full flex items-center justify-center transition-colors duration-200">
                  <svg className="w-4 h-4 text-gray-600 hover:text-emerald-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.22.083.402-.09.353-.293 1.178-.334 1.345-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
                <a href="#" className="w-8 h-8 bg-gray-100 hover:bg-emerald-100 rounded-full flex items-center justify-center transition-colors duration-200">
                  <svg className="w-4 h-4 text-gray-600 hover:text-emerald-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trademark/Legal Section */}
      <div className="border-t border-gray-200">
        <div className="mx-auto w-full max-w-screen-xl px-3 sm:px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-600 mb-4 md:mb-0">
              © 2024 Frame. All rights reserved.
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <a href="/privacy" className="text-gray-600 hover:text-emerald-700 transition-colors duration-200">Privacy Policy</a>
              <a href="/terms" className="text-gray-600 hover:text-emerald-700 transition-colors duration-200">Terms & Conditions</a>
              <a href="#" className="text-gray-600 hover:text-emerald-700 transition-colors duration-200">Cookie Policy</a>
              <a href="#" className="text-gray-600 hover:text-emerald-700 transition-colors duration-200">Site Map</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
