import React, { useState, useMemo } from 'react';
import { 
  Search, X, Plus, Check, Pill, ShieldAlert, 
  Info, AlertTriangle, ChevronDown, ChevronUp, Sparkles, BookOpen 
} from 'lucide-react';
import { 
  PINK_BOOK_MEDICATIONS, 
  PINK_BOOK_CATEGORIES, 
  calculatePresetDose 
} from '../data/pediatricPinkBookData';

export default function PediatricDosingSearchableDropdown({
  weightKg = null,
  age = '',
  ageUnit = 'years',
  onSelectPreset,
  compact = false,
  className = ''
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(!compact);

  const numWeight = parseFloat(weightKg);
  const hasValidWeight = !isNaN(numWeight) && numWeight > 0;

  // Filter presets based on search term and category
  const filteredPresets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return PINK_BOOK_MEDICATIONS.filter(preset => {
      // Category match
      if (selectedCategory !== 'All' && preset.category !== selectedCategory) {
        return false;
      }

      // If no search term, return all matching category
      if (!term) return true;

      // Text search match
      const nameMatch = preset.name?.toLowerCase().includes(term);
      const genericMatch = preset.genericName?.toLowerCase().includes(term);
      const categoryMatch = preset.category?.toLowerCase().includes(term);
      const indicationMatch = preset.indication?.toLowerCase().includes(term);
      const notesMatch = preset.notes?.toLowerCase().includes(term);
      const formsMatch = preset.forms?.toLowerCase().includes(term);
      const aliasMatch = Array.isArray(preset.aliases) && preset.aliases.some(a => a.toLowerCase().includes(term));

      return nameMatch || genericMatch || categoryMatch || indicationMatch || notesMatch || formsMatch || aliasMatch;
    });
  }, [searchTerm, selectedCategory]);

  const handleSelect = (preset, calculation) => {
    if (!hasValidWeight) {
      alert('Please record current weight (cwt in kg) in the vitals section first to calculate precise patient doses.');
      return;
    }

    const payload = {
      preset,
      calculation,
      drug: preset.name,
      dose: calculation ? calculation.fullDoseString : `${preset.dosePerKg}${preset.unit}/kg`,
      route: calculation?.route || preset.route,
      frequency: calculation?.frequency || preset.frequency,
      indication: preset.indication,
      isStat: preset.isStat,
      notes: preset.notes
    };

    if (onSelectPreset) {
      onSelectPreset(payload);
    }

    // Flash success checkmark feedback
    setRecentlyAddedId(preset.id);
    setTimeout(() => {
      setRecentlyAddedId(prev => (prev === preset.id ? null : prev));
    }, 1800);
  };

  const getCategoryBadgeColor = (cat) => {
    switch (cat) {
      case 'Antibiotics':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Emergency & Resuscitation':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Anticonvulsants & Sedatives':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Respiratory & Asthma':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'Steroids':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'GI & Fluids':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'Cardiovascular':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Vitamins & Minerals':
        return 'bg-lime-100 text-lime-800 border-lime-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header bar */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white px-4 py-3 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-emerald-950 uppercase tracking-tight">
                Pink Book Pediatric Dosing Library
              </h4>
              <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.2 rounded-full">
                Botswana PMH
              </span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Searchable weight-adjusted formulary &bull; 60+ presets &bull; 1-click add to MAR & Plan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasValidWeight ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100/90 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 shadow-2xs">
              <span className="text-emerald-700 font-normal">Active Weight:</span>
              <span className="font-mono text-emerald-900">{numWeight} kg</span>
              {age && (
                <span className="text-[11px] text-emerald-800 font-medium">({age} {ageUnit})</span>
              )}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 border border-amber-300 rounded-lg text-[11px] font-bold text-amber-900 shadow-2xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              Weight needed for calculations
            </div>
          )}

          {compact && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-emerald-100 text-emerald-800 rounded-lg transition"
              title={isExpanded ? "Collapse library" : "Expand library"}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search drug name, brand, indication (e.g., ceftriaxone, ORS, fever, asthma, croup)..."
              className="w-full pl-11 pr-9 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
            {PINK_BOOK_CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer text-[11px] ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-2xs' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Results stats */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
            <span>
              Showing <strong className="text-slate-800">{filteredPresets.length}</strong> of {PINK_BOOK_MEDICATIONS.length} medications
              {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
              {searchTerm ? ` matching "${searchTerm}"` : ''}
            </span>
            {hasValidWeight ? (
              <span className="text-emerald-700 font-semibold">
                Doses calculated live for {numWeight} kg
              </span>
            ) : (
              <span className="text-amber-700 font-semibold">
                Enter cwt in vitals for exact mg/ml values
              </span>
            )}
          </div>

          {/* Presets Grid / List */}
          <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {filteredPresets.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                <Pill className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-xs text-slate-700">No matching pediatric medications found</p>
                <p className="text-[11px] text-slate-400 mt-1">Try searching another term like "amoxicillin", "fever", "seizure", or clear the filter.</p>
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                  className="mt-3 text-xs text-emerald-700 font-semibold hover:underline"
                >
                  Reset search & categories
                </button>
              </div>
            ) : (
              filteredPresets.map(preset => {
                const calculation = hasValidWeight 
                  ? calculatePresetDose(preset, numWeight, age, ageUnit)
                  : null;

                const isAdded = recentlyAddedId === preset.id;

                return (
                  <div
                    key={preset.id}
                    className="p-3 bg-white hover:bg-emerald-50/30 rounded-xl border border-slate-200 hover:border-emerald-300 shadow-2xs transition group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Drug info */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-950">
                          {preset.name}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryBadgeColor(preset.category)}`}>
                          {preset.category}
                        </span>

                        {preset.isStat && (
                          <span className="text-[10px] bg-rose-100 text-rose-900 border border-rose-300 font-bold px-1.5 py-0.2 rounded-md uppercase">
                            STAT
                          </span>
                        )}
                      </div>

                      {preset.aliases && preset.aliases.length > 0 && (
                        <p className="text-[11px] text-slate-500">
                          Also known as: <span className="font-medium text-slate-700">{preset.aliases.join(', ')}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-600">
                        <span><strong>Indication:</strong> {preset.indication}</span>
                        {preset.forms && (
                          <span className="text-slate-500"><strong>Forms:</strong> {preset.forms}</span>
                        )}
                      </div>

                      {preset.notes && (
                        <p className="text-[10.5px] text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200/60 inline-block">
                          {preset.notes}
                        </p>
                      )}
                    </div>

                    {/* Calculated dose + Action */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {hasValidWeight && calculation ? (
                        <div className="text-left sm:text-right">
                          <div className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100/70 px-2 py-1 rounded-md inline-block">
                            {calculation.formattedDose} {calculation.formulaDisplay}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Route: <strong className="text-slate-800">{calculation.route}</strong> &bull; Freq: <strong className="text-slate-800">{calculation.frequency}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="text-left sm:text-right">
                          <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {preset.dosePerKg > 0 ? `${preset.dosePerKg}${preset.unit}/kg` : preset.route}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Route: {preset.route} &bull; {preset.frequency}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleSelect(preset, calculation)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-900 hover:text-white border border-emerald-300 hover:border-emerald-600'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" /> Added to MAR & Plan!
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Add to MAR & Plan
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
