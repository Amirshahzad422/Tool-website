"use client";

import { useState, useCallback, useEffect } from "react";

type TimeUnit = {
  id: string;
  name: string;
  symbol: string;
  factor: number;
};

type TimeCategory = {
  id: string;
  name: string;
  icon: string;
  units: TimeUnit[];
};

const timeCategories: TimeCategory[] = [
  {
    id: "standard",
    name: "Standard Units",
    icon: "⏰",
    units: [
      { id: "nanosecond", name: "Nanosecond", symbol: "ns", factor: 0.000001 },
      { id: "microsecond", name: "Microsecond", symbol: "μs", factor: 0.001 },
      { id: "millisecond", name: "Millisecond", symbol: "ms", factor: 1 },
      { id: "second", name: "Second", symbol: "s", factor: 1000 },
      { id: "minute", name: "Minute", symbol: "min", factor: 60000 },
      { id: "hour", name: "Hour", symbol: "h", factor: 3600000 },
      { id: "day", name: "Day", symbol: "day", factor: 86400000 },
      { id: "week", name: "Week", symbol: "week", factor: 604800000 },
      { id: "month", name: "Month (30 days)", symbol: "month", factor: 2592000000 },
      { id: "year", name: "Year (365 days)", symbol: "year", factor: 31536000000 },
    ],
  },
  {
    id: "extended",
    name: "Extended Units",
    icon: "📅",
    units: [
      { id: "decade", name: "Decade", symbol: "decade", factor: 315360000000 },
      { id: "century", name: "Century", symbol: "century", factor: 3153600000000 },
      { id: "millennium", name: "Millennium", symbol: "millennium", factor: 31536000000000 },
      { id: "fortnight", name: "Fortnight", symbol: "fortnight", factor: 1209600000 },
      { id: "quarter", name: "Quarter (3 months)", symbol: "quarter", factor: 7776000000 },
      { id: "semester", name: "Semester (6 months)", symbol: "semester", factor: 15552000000 },
    ],
  },
  {
    id: "astronomical",
    name: "Astronomical Units",
    icon: "🌙",
    units: [
      { id: "leap_year", name: "Leap Year", symbol: "leap year", factor: 31622400000 },
      { id: "sidereal_day", name: "Sidereal Day", symbol: "sidereal day", factor: 86164090 },
      { id: "sidereal_year", name: "Sidereal Year", symbol: "sidereal year", factor: 31558149500 },
      { id: "lunar_month", name: "Lunar Month", symbol: "lunar month", factor: 2551443000 },
    ],
  },
];

export default function TimeConverterClient() {
  const [selectedCategory, setSelectedCategory] = useState("standard");
  const [fromUnit, setFromUnit] = useState("second");
  const [toUnit, setToUnit] = useState("minute");
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState<any>(null);
  const [isConverting, setIsConverting] = useState(false);

  const currentCategory = timeCategories.find(cat => cat.id === selectedCategory);

  const convertValue = useCallback(async () => {
    if (!inputValue || !currentCategory) return;

    const fromUnitData = currentCategory.units.find(unit => unit.id === fromUnit);
    const toUnitData = currentCategory.units.find(unit => unit.id === toUnit);

    if (!fromUnitData || !toUnitData) return;

    const value = parseFloat(inputValue);
    if (isNaN(value)) return;

    setIsConverting(true);

    // Try API conversion first for validation, fallback to client-side
    try {
      const response = await fetch('/api/convert/time-converter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value,
          fromUnit,
          toUnit,
          conversionType: selectedCategory
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.convertedValue.toString());
        setAdditionalInfo(data.additionalInfo);
        setIsConverting(false);
        return;
      }
    } catch (error) {
      console.log('API conversion failed, using client-side fallback');
    }

    // Client-side fallback
    const milliseconds = value * fromUnitData.factor;
    const convertedValue = milliseconds / toUnitData.factor;
    
    setResult(convertedValue.toFixed(10).replace(/\.?0+$/, ""));
    
    // Calculate additional info for client-side
    const seconds = milliseconds / 1000;
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;
    const weeks = days / 7;
    const months = days / 30;
    const years = days / 365;

    setAdditionalInfo({
      totalMilliseconds: milliseconds,
      totalSeconds: seconds,
      totalMinutes: minutes,
      totalHours: hours,
      totalDays: days,
      totalWeeks: weeks,
      totalMonths: months,
      totalYears: years,
      humanReadable: formatHumanReadable(milliseconds)
    });
    setIsConverting(false);
  }, [inputValue, fromUnit, toUnit, selectedCategory, currentCategory]);

  const formatHumanReadable = (milliseconds: number): string => {
    const absMs = Math.abs(milliseconds);
    
    if (absMs < 1000) {
      return `${milliseconds.toFixed(0)} ms`;
    }
    
    const seconds = absMs / 1000;
    if (seconds < 60) {
      return `${(milliseconds / 1000).toFixed(2)} seconds`;
    }
    
    const minutes = seconds / 60;
    if (minutes < 60) {
      return `${(milliseconds / 60000).toFixed(2)} minutes`;
    }
    
    const hours = minutes / 60;
    if (hours < 24) {
      return `${(milliseconds / 3600000).toFixed(2)} hours`;
    }
    
    const days = hours / 24;
    if (days < 7) {
      return `${(milliseconds / 86400000).toFixed(2)} days`;
    }
    
    const weeks = days / 7;
    if (weeks < 4) {
      return `${(milliseconds / 604800000).toFixed(2)} weeks`;
    }
    
    const months = days / 30;
    if (months < 12) {
      return `${(milliseconds / 2592000000).toFixed(2)} months`;
    }
    
    const years = days / 365;
    return `${(milliseconds / 31536000000).toFixed(2)} years`;
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setIsConverting(false);
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setInputValue(value);
    }
  };

  useEffect(() => {
    if (inputValue && !isNaN(parseFloat(inputValue))) {
      convertValue();
    } else {
      setResult("");
      setAdditionalInfo(null);
    }
  }, [inputValue, fromUnit, toUnit, convertValue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#080c2a] mb-3">Time Converter</h1>
          <p className="text-slate-600 text-lg">Convert between time units instantly with precision</p>
        </div>

        {/* Category Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-slate-200">
          <h2 className="text-xl font-semibold text-[#080c2a] mb-5 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
            Select Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {timeCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`group relative overflow-hidden px-4 py-5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${selectedCategory === category.id
                    ? "bg-gradient-to-br from-[#080c2a] to-indigo-900 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 hover:from-slate-100 hover:to-slate-200 border border-slate-200"
                  }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <span className="text-xs font-semibold">{category.name}</span>
                </div>
                {selectedCategory === category.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conversion Interface */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[#080c2a] flex items-center gap-3">
              <span className="text-3xl">{currentCategory?.icon}</span>
              {currentCategory?.name} Conversion
            </h2>
            <button
              onClick={() => { setInputValue(""); setResult(""); setAdditionalInfo(null); }}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#080c2a] bg-slate-100 hover:bg-slate-200 rounded-lg transition-all duration-200"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* From Section */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">From Unit</label>
                <select
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-[#080c2a] bg-white hover:border-[#080c2a] focus:outline-none focus:border-[#080c2a] transition-all duration-200 font-medium"
                >
                  {currentCategory?.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Value</label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Enter time value"
                  className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-[#080c2a] bg-white hover:border-[#080c2a] focus:outline-none focus:border-[#080c2a] transition-all duration-200 text-lg"
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex items-center justify-center">
              <button
                onClick={swapUnits}
                className="p-2.5 rounded-lg bg-gradient-to-br from-[#080c2a] to-indigo-900 text-white shadow-md transition-all duration-300"
                title="Swap units"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* To Section */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">To Unit</label>
              </div>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-[#080c2a] bg-white hover:border-[#080c2a] focus:outline-none focus:border-[#080c2a] transition-all duration-200 font-medium"
              >
                {currentCategory?.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Result</label>
                <input
                  type="text"
                  value={result}
                  readOnly
                  placeholder="Result will appear here"
                  className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-[#080c2a] bg-white hover:border-[#080c2a] focus:outline-none focus:border-[#080c2a] transition-all duration-200 text-lg"
                />
              </div>
            </div>
          </div>

          {/* Convert Button */}
          <button
            onClick={convertValue}
            disabled={!inputValue || isConverting}
            className="mt-8 w-full py-4 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative z-10"
          >
            <span className="flex items-center justify-center gap-3">
              {isConverting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Converting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Convert Time
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
