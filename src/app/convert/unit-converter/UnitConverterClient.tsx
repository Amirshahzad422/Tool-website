"use client";

import { useState, useCallback, useEffect } from "react";
import { FaRuler, FaWeight, FaThermometerHalf, FaExpand, FaCube, FaClock, FaTachometerAlt, FaWind, FaExchangeAlt, FaArrowRight } from "react-icons/fa";

type UnitCategory = {
  id: string;
  name: string;
  icon: React.ReactNode;
  units: {
    id: string;
    name: string;
    symbol: string;
    factor: number;
  }[];
};

const unitCategories: UnitCategory[] = [
  {
    id: "length",
    name: "Length",
    icon: <FaRuler />,
    units: [
      { id: "mm", name: "Millimeter", symbol: "mm", factor: 0.001 },
      { id: "cm", name: "Centimeter", symbol: "cm", factor: 0.01 },
      { id: "m", name: "Meter", symbol: "m", factor: 1 },
      { id: "km", name: "Kilometer", symbol: "km", factor: 1000 },
      { id: "in", name: "Inch", symbol: "in", factor: 0.0254 },
      { id: "ft", name: "Foot", symbol: "ft", factor: 0.3048 },
      { id: "yd", name: "Yard", symbol: "yd", factor: 0.9144 },
      { id: "mi", name: "Mile", symbol: "mi", factor: 1609.344 },
    ],
  },
  {
    id: "weight",
    name: "Weight",
    icon: <FaWeight />,
    units: [
      { id: "mg", name: "Milligram", symbol: "mg", factor: 0.000001 },
      { id: "g", name: "Gram", symbol: "g", factor: 0.001 },
      { id: "kg", name: "Kilogram", symbol: "kg", factor: 1 },
      { id: "oz", name: "Ounce", symbol: "oz", factor: 0.0283495 },
      { id: "lb", name: "Pound", symbol: "lb", factor: 0.453592 },
      { id: "ton", name: "Metric Ton", symbol: "t", factor: 1000 },
    ],
  },
  {
    id: "temperature",
    name: "Temperature",
    icon: <FaThermometerHalf />,
    units: [
      { id: "c", name: "Celsius", symbol: "°C", factor: 1 },
      { id: "f", name: "Fahrenheit", symbol: "°F", factor: 1 },
      { id: "k", name: "Kelvin", symbol: "K", factor: 1 },
    ],
  },
  {
    id: "area",
    name: "Area",
    icon: <FaExpand />,
    units: [
      { id: "mm2", name: "Square Millimeter", symbol: "mm²", factor: 0.000001 },
      { id: "cm2", name: "Square Centimeter", symbol: "cm²", factor: 0.0001 },
      { id: "m2", name: "Square Meter", symbol: "m²", factor: 1 },
      { id: "km2", name: "Square Kilometer", symbol: "km²", factor: 1000000 },
      { id: "in2", name: "Square Inch", symbol: "in²", factor: 0.00064516 },
      { id: "ft2", name: "Square Foot", symbol: "ft²", factor: 0.092903 },
      { id: "yd2", name: "Square Yard", symbol: "yd²", factor: 0.836127 },
      { id: "acre", name: "Acre", symbol: "ac", factor: 4046.86 },
    ],
  },
  {
    id: "volume",
    name: "Volume",
    icon: <FaCube />,
    units: [
      { id: "ml", name: "Milliliter", symbol: "ml", factor: 0.000001 },
      { id: "l", name: "Liter", symbol: "L", factor: 0.001 },
      { id: "m3", name: "Cubic Meter", symbol: "m³", factor: 1 },
      { id: "floz", name: "Fluid Ounce", symbol: "fl oz", factor: 0.0000295735 },
      { id: "cup", name: "Cup", symbol: "cup", factor: 0.000236588 },
      { id: "pt", name: "Pint", symbol: "pt", factor: 0.000473176 },
      { id: "qt", name: "Quart", symbol: "qt", factor: 0.000946353 },
      { id: "gal", name: "Gallon", symbol: "gal", factor: 0.00378541 },
    ],
  },
  {
    id: "time",
    name: "Time",
    icon: <FaClock />,
    units: [
      { id: "ms", name: "Millisecond", symbol: "ms", factor: 0.001 },
      { id: "s", name: "Second", symbol: "s", factor: 1 },
      { id: "min", name: "Minute", symbol: "min", factor: 60 },
      { id: "h", name: "Hour", symbol: "h", factor: 3600 },
      { id: "day", name: "Day", symbol: "day", factor: 86400 },
      { id: "week", name: "Week", symbol: "week", factor: 604800 },
      { id: "month", name: "Month", symbol: "month", factor: 2629746 },
      { id: "year", name: "Year", symbol: "year", factor: 31556952 },
    ],
  },
  {
    id: "speed",
    name: "Speed",
    icon: <FaTachometerAlt />,
    units: [
      { id: "mps", name: "Meter per Second", symbol: "m/s", factor: 1 },
      { id: "kmh", name: "Kilometer per Hour", symbol: "km/h", factor: 0.277778 },
      { id: "mph", name: "Mile per Hour", symbol: "mph", factor: 0.44704 },
      { id: "fps", name: "Foot per Second", symbol: "ft/s", factor: 0.3048 },
      { id: "knot", name: "Knot", symbol: "kn", factor: 0.514444 },
    ],
  },
  {
    id: "pressure",
    name: "Pressure",
    icon: <FaWind />,
    units: [
      { id: "pa", name: "Pascal", symbol: "Pa", factor: 1 },
      { id: "kpa", name: "Kilopascal", symbol: "kPa", factor: 1000 },
      { id: "bar", name: "Bar", symbol: "bar", factor: 100000 },
      { id: "psi", name: "PSI", symbol: "psi", factor: 6894.76 },
      { id: "atm", name: "Atmosphere", symbol: "atm", factor: 101325 },
    ],
  },
];

export default function UnitConverterPro() {
  const [selectedCategory, setSelectedCategory] = useState("length");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("ft");
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState("");
  const [rotated, setRotated] = useState(false);

  const currentCategory = unitCategories.find(cat => cat.id === selectedCategory);

  const convertValue = useCallback(() => {
    if (!inputValue || !currentCategory) {
      setResult("");
      return;
    }

    const fromUnitData = currentCategory.units.find(unit => unit.id === fromUnit);
    const toUnitData = currentCategory.units.find(unit => unit.id === toUnit);

    if (!fromUnitData || !toUnitData) return;

    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      setResult("");
      return;
    }

    let convertedValue: number;

    if (selectedCategory === "temperature") {
      convertedValue = convertTemperature(value, fromUnit, toUnit);
    } else {
      const baseValue = value * fromUnitData.factor;
      convertedValue = baseValue / toUnitData.factor;
    }

    setResult(convertedValue.toFixed(8).replace(/\.?0+$/, ""));
  }, [inputValue, fromUnit, toUnit, selectedCategory, currentCategory]);

  useEffect(() => {
    convertValue();
  }, [inputValue, fromUnit, toUnit, convertValue]);

  const convertTemperature = (value: number, from: string, to: string): number => {
    let celsius: number;
    switch (from) {
      case "c":
        celsius = value;
        break;
      case "f":
        celsius = (value - 32) * 5 / 9;
        break;
      case "k":
        celsius = value - 273.15;
        break;
      default:
        celsius = value;
    }

    switch (to) {
      case "c":
        return celsius;
      case "f":
        return celsius * 9 / 5 + 32;
      case "k":
        return celsius + 273.15;
      default:
        return celsius;
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const category = unitCategories.find(cat => cat.id === categoryId);
    if (category) {
      setFromUnit(category.units[0].id);
      setToUnit(category.units[1]?.id || category.units[0].id);
    }
    setInputValue("");
    setResult("");
  };

  const swapUnits = () => {
    setRotated(!rotated);
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    if (result) {
      setInputValue(result);
    }
  };

  const clearAll = () => {
    setInputValue("");
    setResult("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#080c2a] mb-3">
            Unit Converter Pro
          </h1>
          <p className="text-slate-600 text-lg">
            Convert between units instantly with precision
          </p>
        </div>

        {/* Category Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-slate-200">
          <h2 className="text-xl font-semibold text-[#080c2a] mb-5 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
            Select Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {unitCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`group relative overflow-hidden px-4 py-5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${selectedCategory === category.id
                    ? "bg-gradient-to-br from-[#080c2a] to-indigo-900 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 hover:from-slate-100 hover:to-slate-200 border border-slate-200"
                  }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className={`text-2xl transition-transform duration-300 group-hover:scale-110 ${selectedCategory === category.id ? "text-white" : "text-[#080c2a]"
                    }`}>
                    {category.icon}
                  </span>
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
              onClick={clearAll}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#080c2a] bg-slate-100 hover:bg-slate-200 rounded-lg transition-all duration-200"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* From Section */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  From
                </label>
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Value
                </label>
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter value"
                  className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-[#080c2a] bg-white hover:border-[#080c2a] focus:outline-none focus:border-[#080c2a] transition-all duration-200 font-semibold text-lg"
                />
              </div>
            </div>
            <div className="flex items-center justify-center">
      <button
        onClick={swapUnits}
        className={`p-2.5 rounded-lg bg-gradient-to-br from-[#080c2a] to-indigo-900 text-white shadow-md transition-all duration-300 transform ${
          rotated ? "rotate-180" : ""
        }`}
        title="Swap units"
      >
        <FaExchangeAlt className="w-4 h-4" />
      </button>
    </div>
            {/* To Section */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">
                  To
                </label>
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Result
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={result}
                    readOnly
                    placeholder="Result appears here"
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-[#080c2a] bg-white hover:border-[#080c2a] focus:outline-none focus:border-[#080c2a] transition-all duration-200 font-semibold text-lg"
                  />
                  {result && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          {inputValue && result && (
            <div className="mt-8 p-4 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3 text-sm">
                <FaArrowRight className="text-[#080c2a]" />
                <span className="font-semibold text-[#080c2a]">
                  {inputValue} {currentCategory?.units.find(u => u.id === fromUnit)?.symbol}
                </span>
                <span className="text-slate-500">=</span>
                <span className="font-semibold text-[#080c2a]">
                  {result} {currentCategory?.units.find(u => u.id === toUnit)?.symbol}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Accurate conversions • Real-time results • 8 categories • 50+ units
          </p>
        </div>
      </div>
    </div>
  );
}