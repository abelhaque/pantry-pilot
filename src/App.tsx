import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  ChefHat, 
  LayoutDashboard, 
  Package, 
  ArrowRightLeft, 
  Trash2, 
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  FileDown,
  Filter,
  X,
  Pencil,
  Edit2,
  Share2,
  Mic,
  Check,
  LogOut,
  ChevronDown,
  Settings,
  Users,
  Home,
  Copy,
  CheckCircle,
  QrCode,
  CloudOff,
  Cloud,
  Camera,
  Calendar,
  Pencil as EditIcon
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeCanvas } from 'qrcode.react';
import { usePantry } from './hooks/usePantry';
import { supabase } from './supabaseClient';
import { CATEGORIES, Category, Item, Location, Zone, OFFICIAL_ICONS, User, Household } from './types';
// --- Utilities ---

const playClick = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05);
  } catch (e) {}
};

const playDoubleDing = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playDing = (time: number, freq: number) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, time);
      gainNode.gain.setValueAtTime(0.05, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start(time);
      oscillator.stop(time + 0.1);
    };

    playDing(audioCtx.currentTime, 1200);
    playDing(audioCtx.currentTime + 0.1, 1500);
  } catch (e) {}
};

const playDelete = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const bufferSize = audioCtx.sampleRate * 0.2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    noise.start();
  } catch (e) {}
};

const playSuccess = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1500, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {}
};

const playBlip = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05);
  } catch (e) {}
};

const playSparkle = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    const playTone = (time: number, freq: number, duration: number) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, time);
      gainNode.gain.setValueAtTime(0.03, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start(time);
      oscillator.stop(time + duration);
    };

    playTone(now, 1500, 0.1);
    playTone(now + 0.05, 1800, 0.1);
    playTone(now + 0.1, 2100, 0.1);
  } catch (e) {}
};

const SMART_AUTO_CATEGORIES: { keywords: string[], category: Category }[] = [
  { keywords: ['apple', 'banana', 'carrot', 'onion', 'potato', 'pepper', 'tomato', 'fruit', 'veg', 'salad', 'berry', 'melon', 'citrus', 'grape', 'plum', 'broccoli', 'lettuce', 'squash', 'leaf', 'mushroom', 'garlic', 'herb'], category: 'Veg' },
  { keywords: ['chicken', 'beef', 'pork', 'lamb', 'steak', 'sausage', 'bacon', 'mince', 'fish', 'salmon', 'tuna', 'meat', 'fillet', 'chop', 'rib', 'wing', 'breast', 'joint', 'ham', 'gammon', 'venison', 'prawn'], category: 'Meat' },
  { keywords: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'mayo', 'marg', 'spread', 'cheddar', 'brie', 'feta'], category: 'Dairy' },
  { keywords: ['toothpaste', 'toothbrush', 'shampoo', 'conditioner', 'shower gel', 'deodorant', 'razor', 'blade', 'balm', 'lotion', 'cream', 'soap', 'floss', 'mouthwash', 'sanitary', 'pad', 'tampon', 'cotton', 'sun', 'tan'], category: 'Personal Care' },
  { keywords: ['washing up', 'laundry', 'soap', 'detergent', 'powder', 'softener', 'gloves', 'sponge', 'bleach', 'cleaner', 'wipes', 'spray', 'disinfectant', 'scrub', 'polish', 'tissue', 'roll', 'foil', 'film', 'bag', 'battery'], category: 'Household' },
  { keywords: ['dog', 'cat', 'pet', 'kibble', 'litter', 'chew', 'treat', 'flea', 'puppy', 'kitten', 'bird', 'seed', 'hamster'], category: 'Pet Care' },
  { keywords: ['bread', 'bagel', 'croissant', 'muffin', 'loaf', 'roll', 'bun', 'pastry', 'donut', 'naan', 'pitta', 'wrap'], category: 'Bakery' },
  { keywords: ['pasta', 'rice', 'cereal', 'oats', 'bean', 'lentil'], category: 'Pasta & Grains' },
  { keywords: ['flour', 'sugar', 'baking'], category: 'Baking & Flour' },
  { keywords: ['oil', 'sauce', 'honey', 'jam'], category: 'Sauces & Oils' },
  { keywords: ['soup', 'tin', 'can', 'stock', 'cube'], category: 'Tins & Jars' },
  { keywords: ['spice', 'salt', 'pepper', 'seasoning'], category: 'Spices & Seasoning' },
  { keywords: ['tea', 'coffee'], category: 'Coffee & Tea' },
  { keywords: ['water', 'juice', 'soda', 'pop', 'coke', 'lemonade', 'squash', 'wine', 'beer', 'cider', 'spirit', 'tonic'], category: 'Drinks' },
];

const triggerHapticClick = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(5);
  }
};

const triggerHapticDelete = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([40, 30, 10]);
  }
};

const triggerHapticSuccess = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(15);
  }
};

const triggerHapticDoubleTap = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([10, 50, 10]);
  }
};

const suggestIconByName = (name: string): string => {
  const lowerName = name.toLowerCase();
  const match = OFFICIAL_ICONS.find(item => 
    item.keywords.some(keyword => lowerName.includes(keyword))
  );
  return match ? match.icon : '🏠';
};

const withFeedback = (fn: any, type: 'click' | 'delete' | 'success' = 'click') => (e: any) => {
  if (type === 'delete') {
    triggerHapticDelete();
    playDelete();
  } else if (type === 'success') {
    triggerHapticSuccess();
    playSuccess();
  } else {
    triggerHapticClick();
    playClick();
  }
  if (fn) fn(e);
};

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }: any) => {
  const variants: any = {
    primary: 'bg-sage text-forest hover:opacity-90 shadow-lg font-bold',
    secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/10',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20',
    outline: 'border border-white/20 text-white hover:bg-white/10',
    ghost: 'text-white/40 hover:text-white hover:bg-white/5'
  };

  const handleClick = (e: any) => {
    if (variant === 'danger') {
      triggerHapticDelete();
      playDelete();
    } else {
      triggerHapticClick();
      playClick();
    }
    if (onClick) onClick(e);
  };
  
  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={handleClick} 
      className={`px-4 py-2 rounded-xl font-medium transition-all tactile-button disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 min-h-[44px] ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, onClick, className = '' }: any) => {
  const handleClick = (e: any) => {
    if (onClick) {
      triggerHapticClick();
      playClick();
      onClick(e);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`rounded-[20px] p-4 bg-white/5 border border-white/10 backdrop-blur-md ${onClick ? 'cursor-pointer hover:border-sage/50 transition-all' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

const Badge = ({ children, color = 'zinc' }: any) => {
  const colors: any = {
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    zinc: 'bg-white/5 text-white/40 border-white/10'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[color]}`}>
      {children}
    </span>
  );
};

const GroupHeader = ({ title, icon, className = '' }: any) => (
  <div className={`bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl px-5 py-3 flex items-center gap-3 mb-6 sticky top-20 z-10 ${className}`}>
    <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center text-xl text-sage">
      {icon}
    </div>
    <h3 className="font-bold text-white/60 uppercase text-xs tracking-widest">{title}</h3>
  </div>
);

const SwipeableItem = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  leftIcon, 
  rightIcon,
  leftColor = "bg-sage", // Sage Green
  rightColor = "bg-red-500", // Red
  leftFeedbackType = 'success',
  rightFeedbackType = 'delete'
}: any) => {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const handleDrag = (_: any, info: any) => {
    if (info.offset.x < -20) setSwipeDirection('left');
    else if (info.offset.x > 20) setSwipeDirection('right');
    else setSwipeDirection(null);
  };

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 100;
    if (info.offset.x < -threshold && onSwipeLeft) {
      if (leftFeedbackType === 'success') { triggerHapticSuccess(); playSuccess(); }
      else if (leftFeedbackType === 'delete') { triggerHapticDelete(); playDelete(); }
      else { triggerHapticClick(); playClick(); }
      onSwipeLeft();
    } else if (info.offset.x > threshold && onSwipeRight) {
      if (rightFeedbackType === 'success') { triggerHapticSuccess(); playSuccess(); }
      else if (rightFeedbackType === 'delete') { triggerHapticDelete(); playDelete(); }
      else { triggerHapticClick(); playClick(); }
      onSwipeRight();
    }
    setSwipeDirection(null);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl group">
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between">
        <div className={`absolute left-0 top-0 bottom-0 flex items-center pl-6 pr-12 ${rightColor} text-white transition-opacity duration-200 ${swipeDirection === 'right' ? 'opacity-100' : 'opacity-0'}`}>
          {rightIcon}
        </div>
        <div className={`absolute right-0 top-0 bottom-0 flex items-center pr-6 pl-12 ${leftColor} text-white transition-opacity duration-200 ${swipeDirection === 'left' ? 'opacity-100' : 'opacity-0'}`}>
          {leftIcon}
        </div>
      </div>

      {/* Foreground Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="relative z-10 cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
};

const VoiceInput = ({ value, defaultValue, onChange, placeholder, className, required, name, type = "text", iconLeft, clearable, onClear, onFocus, onClick, disabled }: any) => {
  const [isListening, setIsListening] = useState(false);
  const [internalValue, setInternalValue] = useState(value !== undefined ? value : (defaultValue || ''));

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const startListening = () => {
    if (disabled) return;
    
    setIsListening(true);
    
    // Play double ding and haptic feedback
    playDoubleDing();
    triggerHapticDoubleTap();
    playClick(); // Keep the mechanical click as requested
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInternalValue(transcript);
      if (onChange) {
        // Create a synthetic event
        onChange({ target: { value: transcript, name } });
      }
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleClear = () => {
    if (disabled) return;
    setInternalValue('');
    if (onChange) {
      onChange({ target: { value: '', name } });
    }
    if (onClear) onClear();
  };

  const displayValue = value !== undefined ? value : internalValue;

  return (
    <div className="relative w-full">
      {iconLeft && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
          {iconLeft}
        </div>
      )}
      <input
        type={type}
        name={name}
        required={required}
        value={displayValue}
        disabled={disabled}
        onChange={(e) => {
          setInternalValue(e.target.value);
          if (onChange) onChange(e);
        }}
        onFocus={onFocus}
        onClick={onClick}
        placeholder={placeholder}
        className={`w-full py-3 rounded-[20px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-sage/20 transition-all ${clearable && displayValue ? 'pr-20' : 'pr-12'} ${iconLeft ? 'pl-12' : 'px-4'} ${className}`}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {clearable && displayValue && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="p-1.5 text-zinc-400 hover:text-black rounded-full transition-all disabled:opacity-50"
          >
            <X size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={startListening}
          disabled={disabled}
          className={`p-2 rounded-[20px] transition-all flex items-center justify-center disabled:opacity-50
            ${isListening ? 'bg-[#8DAA81] text-white animate-pulse shadow-[0_0_20px_rgba(141,170,129,0.6)]' : 'text-[#2C3A2B] hover:bg-zinc-100'}
          `}
          title="Voice Input"
        >
          <Mic size={18} />
        </button>
      </div>
    </div>
  );
};

const Combobox = ({ options, value, onChange, placeholder, className = '', name }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt: any) => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((opt: any) => opt.value === value);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input type="hidden" name={name} value={value} />
      <div 
        className={`w-full px-4 py-3 bg-white/5 rounded-[20px] border border-white/10 focus-within:ring-2 focus-within:ring-sage/20 flex items-center justify-between cursor-text ${className}`}
        onClick={() => setIsOpen(true)}
      >
        {isOpen ? (
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full bg-transparent outline-none"
          />
        ) : (
          <span className={selectedOption ? 'text-black' : 'text-zinc-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        )}
        <ChevronDown size={16} className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-zinc-100 max-h-60 overflow-y-auto py-2">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-2 text-sm text-zinc-500">No results found.</div>
          ) : (
            filteredOptions.map((opt: any) => (
              <div
                key={opt.value}
                className={`px-4 py-2 hover:bg-zinc-50 cursor-pointer flex items-center justify-between ${opt.value === value ? 'bg-primary/5 text-primary font-medium' : 'text-charcoal'}`}
                onClick={() => {
                  onChange(opt.value);
                  setSearch('');
                  setIsOpen(false);
                }}
              >
                {opt.label}
                {opt.value === value && <Check size={16} />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const AutocompleteInput = ({ name, value, onChange, placeholder, className = '', options, onSelect }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt: any) => 
    opt.name.toLowerCase().includes((value || '').toLowerCase())
  ).slice(0, 5); // show top 5

  return (
    <div ref={wrapperRef} className="relative w-full">
      <VoiceInput
        name={name}
        value={value}
        onChange={(e: any) => {
          onChange(e);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        placeholder={placeholder}
        className={className}
      />
      {isOpen && value && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-zinc-100 max-h-60 overflow-y-auto py-2">
          {filteredOptions.map((opt: any) => (
            <div
              key={opt.id || opt.name}
              className="px-4 py-2 hover:bg-zinc-50 cursor-pointer flex items-center justify-between text-charcoal"
              onClick={() => {
                onSelect(opt);
                setIsOpen(false);
              }}
            >
              <div className="flex items-center gap-2">
                <span>{opt.icon || '📦'}</span>
                <span>{opt.name}</span>
              </div>
              <span className="text-xs text-zinc-400">{opt.storageCategory || opt.shoppingCategory}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import { BarcodeScanner } from './components/BarcodeScanner';
import { mapOpenFoodFactsCategory } from './utils/categoryMapper';

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pantry_pilot_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [household, setHousehold] = useState<Household | null>(null);
  const [isHouseholdSettingsOpen, setIsHouseholdSettingsOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'choice' | 'create' | 'join'>('choice');
  const [householdError, setHouseholdError] = useState<string | null>(null);
  const [isProcessingHousehold, setIsProcessingHousehold] = useState(false);
  const [view, setView] = useState<'dashboard' | 'inventory' | 'shopping' | 'recipes'>('dashboard');
  const [inventoryGrouping, setInventoryGrouping] = useState<'category' | 'location'>('category');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState<'pantry' | 'shopping'>('pantry');
  const [modalItem, setModalItem] = useState<any>(null);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isUnpackMenuOpen, setIsUnpackMenuOpen] = useState(false);
  const [unpackSuccessMessage, setUnpackSuccessMessage] = useState<string | null>(null);
  const [isAutoSortReviewOpen, setIsAutoSortReviewOpen] = useState(false);
  const [autoSortPlan, setAutoSortPlan] = useState<{ [locationId: string]: string[] }>({});
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [transferItem, setTransferItem] = useState<Item | null>(null);
  const [lastDeletedShoppingItem, setLastDeletedShoppingItem] = useState<any>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedData, setScannedData] = useState<{ name: string; category: Category } | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isCameraAvailable, setIsCameraAvailable] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editingMealValue, setEditingMealValue] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientCategory, setNewIngredientCategory] = useState<Category>('Other');
  const [hasManuallySelectedCategory, setHasManuallySelectedCategory] = useState(false);
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);

  useEffect(() => {
    const checkCamera = async () => {
      try {
        // Check if in iframe
        if (window.self !== window.top) {
          setIsCameraAvailable(false);
          return;
        }
        
        // Check permissions if supported
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (result.state === 'denied') {
            setIsCameraAvailable(false);
            return;
          }
        }
      } catch (e) {
        // Ignore errors, assume available until proven otherwise
      }
    };
    checkCamera();
  }, []);

  useEffect(() => {
    setSelectedItemIds(new Set());
    setIsUnpackMenuOpen(false);
  }, [selectedLocationId]);

  useEffect(() => {
    if (!isItemModalOpen) {
      setHasManuallySelectedCategory(false);
      setIsAutoCategorizing(false);
    }
  }, [isItemModalOpen]);

  const handleScan = async (barcode: string) => {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      if (data.status === 1 && data.product) {
        const name = data.product.product_name || data.product.product_name_en || 'Unknown Product';
        const categoryStr = data.product.categories || '';
        const mappedCategory = mapOpenFoodFactsCategory(categoryStr);
        setScannedData({ name, category: mappedCategory });
        setIsScannerOpen(false);
        setManualBarcode('');
      } else {
        alert('Product not found in database.');
        setIsScannerOpen(false);
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
      alert('Failed to fetch product data.');
      setIsScannerOpen(false);
    }
  };

  const handleBulkMove = (targetLocationId: string) => {
    const targetZone = state.zones.find(z => z.location_id === targetLocationId);
    if (!targetZone) return;

    const itemsToMove = selectedItemIds.size > 0 
      ? Array.from(selectedItemIds)
      : state.items.filter(i => {
          const zone = state.zones.find(z => z.id === i.zone_id);
          return zone?.location_id === selectedLocationId;
        }).map(i => i.id);

    if (itemsToMove.length === 0) return;

    dispatch({
      type: 'BULK_TRANSFER_ITEMS',
      payload: {
        itemIds: itemsToMove,
        targetZoneId: targetZone.id
      }
    });

    const targetLoc = state.locations.find(l => l.id === targetLocationId);
    setUnpackSuccessMessage(`All items moved to ${targetLoc?.name}! 🏠`);
    setSelectedItemIds(new Set());
    setIsUnpackMenuOpen(false);
    setTimeout(() => setUnpackSuccessMessage(null), 3000);
  };

  const handleDeleteShoppingItem = (item: any) => {
    setLastDeletedShoppingItem(item);
    setShowUndoToast(true);
    dispatch({ type: 'DELETE_SHOPPING_ITEM', payload: { id: item.id } });
    setTimeout(() => setShowUndoToast(false), 3000);
  };

  const handleUndoDelete = () => {
    if (lastDeletedShoppingItem) {
      dispatch({ 
        type: 'ADD_TO_SHOPPING', 
        payload: {
          name: lastDeletedShoppingItem.name,
          storageCategory: lastDeletedShoppingItem.storageCategory,
          shoppingCategory: lastDeletedShoppingItem.shoppingCategory,
          icon: lastDeletedShoppingItem.icon,
          quantity: lastDeletedShoppingItem.quantity,
          unit_type: lastDeletedShoppingItem.unit_type,
          store: lastDeletedShoppingItem.store,
          item_id: lastDeletedShoppingItem.item_id
        }
      });
      setLastDeletedShoppingItem(null);
      setShowUndoToast(false);
    }
  };

  const handlePrepareAutoSort = () => {
    const mapping: Record<string, string> = {
      'Meat': '🌬️',
      'Fish': '🌬️',
      'Dairy': '🌬️',
      'Veg': '🌬️',
      'Fruit': '🌬️',
      'Frozen': '❄️',
      'Desserts': '❄️',
      'Ready Meals': '❄️',
      'Tins & Jars': '🥫',
      'Pasta & Grains': '🥫',
      'Baking & Flour': '🥫',
      'Spices & Seasoning': '🥫',
      'Sauces & Oils': '🥫',
      'Snacks': '🥫',
      'Bakery': '🥫',
      'Drinks': '🥫',
      'Coffee & Tea': '🥫',
      'Cleaning': '🧺',
      'Personal Care': '🧼',
      'Household': '📦',
      'Pet Care': '🥫',
      'Other': '📦',
    };

    const plan: Record<string, string[]> = {};
    const itemsInBag = state.items.filter(i => {
      const zone = state.zones.find(z => z.id === i.zone_id);
      return zone?.location_id === selectedLocationId;
    });

    itemsInBag.forEach(item => {
      const targetIcon = mapping[item.storageCategory];
      if (targetIcon) {
        const targetLoc = state.locations.find(l => l.icon === targetIcon);
        if (targetLoc) {
          if (!plan[targetLoc.id]) plan[targetLoc.id] = [];
          plan[targetLoc.id].push(item.id);
        }
      }
    });

    if (Object.keys(plan).length === 0) {
      setUnpackSuccessMessage("No items in the bag have a clear destination home. 📦");
      setTimeout(() => setUnpackSuccessMessage(null), 3000);
      return;
    }

    setAutoSortPlan(plan);
    setIsAutoSortReviewOpen(true);
  };

  const handleConfirmAutoSort = () => {
    playSuccess();
    triggerHapticSuccess();
    Object.entries(autoSortPlan).forEach(([locationId, itemIds]) => {
      const targetZone = state.zones.find(z => z.location_id === locationId);
      if (targetZone) {
        dispatch({
          type: 'BULK_TRANSFER_ITEMS',
          payload: {
            itemIds,
            targetZoneId: targetZone.id
          }
        });
      }
    });

    setUnpackSuccessMessage(`Magic Sort Complete! ✨ Items moved to their units.`);
    setIsAutoSortReviewOpen(false);
    setAutoSortPlan({});
    setTimeout(() => setUnpackSuccessMessage(null), 3000);
  };

  const [recipes, setRecipes] = useState<any[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [shoppingStoreFilter, setShoppingStoreFilter] = useState<string | null>(null);
  const [isStoreSortingEnabled, setIsStoreSortingEnabled] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [addedToCartId, setAddedToCartId] = useState<string | null>(null);

  const [formLocationName, setFormLocationName] = useState('');
  const [formLocationIcon, setFormLocationIcon] = useState('🏠');

  useEffect(() => {
    if (editingLocation) {
      setFormLocationName(editingLocation.name);
      setFormLocationIcon(editingLocation.icon || '🏠');
    } else {
      setFormLocationName('');
      setFormLocationIcon('🏠');
    }
  }, [editingLocation]);

  // Form states for auto-population
  const [formItemName, setFormItemName] = useState('');
  const [formStorageCategory, setFormStorageCategory] = useState<Category>('Other');
  const [formShoppingCategory, setFormShoppingCategory] = useState<Category>('Other');
  const [formUnitType, setFormUnitType] = useState('items');
  const [formZoneId, setFormZoneId] = useState('');

  const { state, dispatch, isConnected, isSyncing } = usePantry(user?.household_id);
  const [showSyncToast, setShowSyncToast] = useState(false);

  // Hard Reset on Navigation: Clear search and filters instantly when switching views or units
  useEffect(() => {
    setSearchQuery('');
    setSelectedCategory(null);
  }, [view, selectedLocationId]);

  useEffect(() => {
    const handleSyncComplete = () => {
      triggerHapticSuccess();
      playSuccess();
      setShowSyncToast(true);
      setTimeout(() => setShowSyncToast(false), 3000);
    };
    window.addEventListener('pantry-sync-complete', handleSyncComplete);
    return () => window.removeEventListener('pantry-sync-complete', handleSyncComplete);
  }, []);

  // Auto-lookup category when modalItem changes (for editing)
  useEffect(() => {
    if (modalItem) {
      // If it's a shopping item being assigned, try to find the linked pantry item for latest data
      const linkedItem = modalItem.item_id ? state.items.find((i: any) => i.id === modalItem.item_id) : null;
      const source = linkedItem || modalItem;

      setFormItemName(source.name || '');
      setFormStorageCategory((source.storageCategory || 'Other') as Category);
      setFormShoppingCategory((source.shoppingCategory || 'Other') as Category);
      setFormUnitType(source.unit_type || 'items');
      setFormZoneId(source.zone_id || '');
    } else {
      setFormItemName('');
      setFormStorageCategory('Other');
      setFormShoppingCategory('Other');
      setFormUnitType('items');
      
      // Context-aware zone selection
      const currentLocation = selectedLocationId ? state.locations.find(l => l.id === selectedLocationId) : null;
      const isShoppingBags = currentLocation?.name === '🛍️ Shopping Bags';
      
      if (selectedLocationId && !isShoppingBags) {
        const firstZone = state.zones.find(z => z.location_id === selectedLocationId);
        setFormZoneId(firstZone?.id || '');
      } else {
        setFormZoneId('');
      }
    }
  }, [modalItem, selectedLocationId, state.locations, state.zones]);

  // Pre-fill form when barcode is scanned
  useEffect(() => {
    if (scannedData) {
      setFormItemName(scannedData.name);
      setFormStorageCategory(scannedData.category);
      setFormShoppingCategory(scannedData.category);
      setScannedData(null);
    }
  }, [scannedData]);

  const lookupCategories = (name: string) => {
    const normalized = name.toLowerCase().trim();
    
    // 1. USER PREFERENCE MEMORY (localStorage) - CHECK FIRST
    if (!hasManuallySelectedCategory) {
      const userMapping = JSON.parse(localStorage.getItem('userCategoryMapping') || '{}');
      if (userMapping[normalized]) {
        const cat = userMapping[normalized] as Category;
        return {
          storage: cat,
          shopping: cat,
          store: null,
          unit_type: 'items',
          isLearned: true
        };
      }
    }

    // 2. Check library
    const fromLibrary = state.library.find(l => l.name.toLowerCase() === normalized);
    if (fromLibrary) {
      return {
        storage: (fromLibrary.storageCategory || 'Other') as Category,
        shopping: (fromLibrary.shoppingCategory || 'Other') as Category,
        store: fromLibrary.store || null,
        unit_type: fromLibrary.unit_type || 'items'
      };
    }
    
    // 3. Then check current items
    const fromItems = state.items.find(i => i.name.toLowerCase() === normalized);
    if (fromItems) {
      return {
        storage: (fromItems.storageCategory || 'Other') as Category,
        shopping: (fromItems.shoppingCategory || 'Other') as Category,
        store: null,
        unit_type: fromItems.unit_type || 'items',
        zone_id: fromItems.zone_id || ''
      };
    }

    // 4. SMART AUTO-CATEGORIZATION ENGINE (Master Dictionary Fallback)
    if (!hasManuallySelectedCategory) {
      for (const entry of SMART_AUTO_CATEGORIES) {
        if (entry.keywords.some(keyword => normalized.includes(keyword))) {
          return {
            storage: entry.category,
            shopping: entry.category,
            store: null,
            unit_type: 'items',
            isAuto: true
          };
        }
      }
    }

    return null;
  };

  // Official Supabase Auth Session Tracking
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Map Auth User to our App User type
        const appUser = {
          id: session.user.id,
          email: session.user.email || '',
          household_id: session.user.user_metadata?.household_id || null
        };
        setUser(appUser as User);
        if (appUser.household_id) {
          fetchHousehold(appUser.household_id);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const appUser = {
          id: session.user.id,
          email: session.user.email || '',
          household_id: session.user.user_metadata?.household_id || null
        };
        setUser(appUser as User);
        localStorage.setItem('pantry_pilot_user', JSON.stringify(appUser));
        if (appUser.household_id) {
          fetchHousehold(appUser.household_id);
        }
      } else {
        // Only clear if explicitly logged out or session expired
        // But the user wants persistent identity, so we might want to keep the local state
        // for "Guest-like" behavior if possible, but standard auth requires session.
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Legacy session sync (can be removed later)
    const savedUser = localStorage.getItem('pantry_pilot_user');
    if (savedUser && !user) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        if (parsedUser.household_id) {
          fetchHousehold(parsedUser.household_id);
        }
      } catch (e) {
        localStorage.removeItem('pantry_pilot_user');
      }
    }
  }, []);

  const fetchHousehold = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('households')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (data) {
        setHousehold(data);
      }
    } catch (err) {
      console.error('Failed to fetch household:', err);
    }
  };

  const handleAuth = async (email: string) => {
    if (!email) return;
    setIsLoggingIn(true);
    setAuthError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase(),
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
      
      setAuthError('Check your email for the magic link!');
    } catch (err: any) {
      // AbortError can happen due to React Strict Mode double-render or fast navigation
      // If we got here, the request was either sent or aborted.
      // We ignore AbortErrors specifically as they don't represent a failure to the user.
      if (err.name === 'AbortError' || err.message?.includes('AbortError')) {
        setAuthError('Check your email for the magic link!');
        return;
      }
      
      console.error('Auth error:', err);
      setAuthError(err.message || 'Failed to send magic link');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCreateHousehold = async (name: string) => {
    if (!user) return;
    setIsProcessingHousehold(true);
    setHouseholdError(null);
    try {
      const newHouseholdId = uuidv4();
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // 1. Create household
      const { data: newHousehold, error: hError } = await supabase
        .from('households')
        .insert([{ id: newHouseholdId, name, invite_code: inviteCode }])
        .select()
        .single();
      
      if (hError) throw hError;

      // 2. Update user with household_id
      const { error: uError } = await supabase
        .from('users')
        .update({ household_id: newHouseholdId })
        .eq('id', user.id);
      
      if (uError) throw uError;

      setHousehold(newHousehold);
      const updatedUser = { ...user, household_id: newHousehold.id, household_name: newHousehold.name };
      setUser(updatedUser);
      localStorage.setItem('pantry_pilot_user', JSON.stringify(updatedUser));
    } catch (err: any) {
      setHouseholdError(err.message || 'Failed to create household');
    } finally {
      setIsProcessingHousehold(false);
    }
  };

  const handleJoinHousehold = async (inviteCode: string) => {
    if (!user) return;
    setIsProcessingHousehold(true);
    setHouseholdError(null);
    try {
      // 1. Find household by invite code
      const { data: householdToJoin, error: hError } = await supabase
        .from('households')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();
      
      if (hError || !householdToJoin) {
        throw new Error('Invalid invite code');
      }

      // 2. Update user with household_id
      const { error: uError } = await supabase
        .from('users')
        .update({ household_id: householdToJoin.id })
        .eq('id', user.id);
      
      if (uError) throw uError;

      setHousehold(householdToJoin);
      const updatedUser = { ...user, household_id: householdToJoin.id, household_name: householdToJoin.name };
      setUser(updatedUser);
      localStorage.setItem('pantry_pilot_user', JSON.stringify(updatedUser));
    } catch (err: any) {
      setHouseholdError(err.message || 'Failed to join household');
    } finally {
      setIsProcessingHousehold(false);
    }
  };

  // Computed Data
  const filteredItems = useMemo(() => {
    if (!state.items || !Array.isArray(state.items)) return [];
    const query = searchQuery.toLowerCase().trim();
    return state.items.filter(item => {
      if (!item || !item.name) return false;
      const matchesSearch = !query || 
        item.name.toLowerCase().includes(query) || 
        (item.storageCategory || '').toLowerCase().includes(query) ||
        (item.shoppingCategory || '').toLowerCase().includes(query);
      const matchesCategory = !selectedCategory || 
        item.storageCategory === selectedCategory || 
        item.shoppingCategory === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [state.items, searchQuery, selectedCategory]);

  const expiringSoon = useMemo(() => {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    return filteredItems.filter(item => {
      if (!item.expiry_date) return false;
      const expiry = new Date(item.expiry_date);
      return expiry <= threeDaysFromNow;
    });
  }, [filteredItems]);

  const lowStock = useMemo(() => {
    return filteredItems.filter(item => item.quantity <= item.low_stock_threshold);
  }, [filteredItems]);

  const fetchRecipes = async () => {
    setIsLoadingRecipes(true);
    const suggestions = await getRecipeSuggestions(state.items);
    setRecipes(suggestions);
    setIsLoadingRecipes(false);
  };

  const exportShoppingListPDF = () => {
    const doc = new jsPDF();
    const filteredShoppingList = state.shoppingList.filter(i => 
      !i.purchased && (!shoppingStoreFilter || i.store === shoppingStoreFilter)
    );

    // Header
    doc.setFont('times', 'bold');
    doc.setFontSize(24);
    doc.text('Pantry Pilot: Shopping List', 20, 25);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Household: ${user?.household_name || 'My Home'}`, 20, 35);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);
    
    doc.setDrawColor(230);
    doc.line(20, 45, 190, 45);

    let currentY = 55;

    // Grouping
    const grouped = filteredShoppingList.reduce((acc, item) => {
      const store = item.store || 'Any Store';
      const cat = item.shoppingCategory || 'Other';
      if (!acc[store]) acc[store] = {};
      if (!acc[store][cat]) acc[store][cat] = [];
      acc[store][cat].push(item);
      return acc;
    }, {} as Record<string, Record<string, typeof filteredShoppingList>>);

    const categoryOrder = [
      'Fruit', 'Veg', 'Meat', 'Fish', 'Dairy', 'Bakery', 'Ready Meals', 
      'Pasta & Grains', 'Tins & Jars', 'Baking & Flour', 'Spices & Seasoning', 
      'Sauces & Oils', 'Snacks', 'Desserts', 'Drinks', 'Coffee & Tea', 
      'Frozen', 'Cleaning', 'Personal Care', 'Household', 'Pet Care', 'Other'
    ];

    const stores = Object.keys(grouped).sort();
    
    if (stores.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.text('Your shopping list is empty.', 20, currentY);
    } else {
      stores.forEach(storeName => {
        // Check for page break before store heading
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text(storeName, 20, currentY);
        currentY += 12;

        const storeCategories = grouped[storeName];
        const sortedCats = Object.keys(storeCategories).sort((a, b) => {
          const indexA = categoryOrder.indexOf(a);
          const indexB = categoryOrder.indexOf(b);
          if (indexA === -1 && indexB === -1) return a.localeCompare(b);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });

        sortedCats.forEach(catName => {
          // Check for page break before category subheading
          if (currentY > 260) { doc.addPage(); currentY = 20; }
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(150);
          doc.text(catName.toUpperCase(), 25, currentY);
          currentY += 4;

          const items = storeCategories[catName];
          const tableData = items.map(item => [
            `[  ]  ${item.name}`,
            `${item.quantity} ${item.unit_type}`
          ]);

          autoTable(doc, {
            startY: currentY,
            margin: { left: 25, right: 20 },
            body: tableData,
            theme: 'plain',
            styles: { 
              fontSize: 11, 
              cellPadding: 3,
              textColor: 50,
              font: 'helvetica'
            },
            columnStyles: {
              0: { cellWidth: 'auto' },
              1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
            }
          });
          
          currentY = (doc as any).lastAutoTable.finalY + 12;
        });
        
        currentY += 5; // Extra space between stores
      });
    }

    doc.save(`shopping-list-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const stores = useMemo(() => {
    const s = new Set<string>();
    state.shoppingList.forEach(item => {
      if (item.store) s.add(item.store);
    });
    return Array.from(s);
  }, [state.shoppingList]);

  // --- Renderers ---

  if (!user) {
    return (
      <div className="min-h-screen bg-forest flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl bg-white/10 backdrop-blur-xl"
            >
              <img src="/icon.png" alt="Pantry Pilot Logo" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=512&auto=format&fit=crop'; }} />
            </motion.div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Pantry Pilot</h1>
            <p className="text-sage mt-2 text-lg">Intelligent inventory for the modern home</p>
          </div>

          <div className="grid gap-4 pt-4">
            <Button 
              size="lg"
              className="h-24 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-3xl flex flex-col items-center justify-center gap-2 group transition-all backdrop-blur-md"
              onClick={() => setOnboardingStep('join')}
            >
              <Users size={28} className="text-sage group-hover:scale-110 transition-transform" />
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold">Join Household</span>
                <span className="text-[10px] uppercase tracking-widest text-sage/60 font-medium">Use an invite code</span>
              </div>
            </Button>

            <Button 
              size="lg"
              variant="secondary"
              className="h-24 rounded-3xl flex flex-col items-center justify-center gap-2 group transition-all"
              onClick={() => setOnboardingStep('create')}
            >
              <PlusCircle size={28} className="group-hover:scale-110 transition-transform" />
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold">Start New</span>
                <span className="text-[10px] uppercase tracking-widest opacity-60 font-medium">Create your home sync</span>
              </div>
            </Button>
          </div>

          <AnimatePresence>
            {(onboardingStep === 'create' || onboardingStep === 'join') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white/10 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 shadow-2xl space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-white">
                    {onboardingStep === 'create' ? 'Create Your Home' : 'Join a Household'}
                  </h2>
                  <button onClick={() => setOnboardingStep('choice')} className="text-white/40 hover:text-white transition-all">
                    <X size={20} />
                  </button>
                </div>

                {authError && (
                  <div className="p-4 bg-red-500/20 text-red-100 text-sm rounded-2xl border border-red-500/20 mb-4 flex items-center gap-3">
                    <AlertTriangle size={18} />
                    {authError}
                  </div>
                )}

                <form onSubmit={(e: any) => {
                  e.preventDefault();
                  handleAuth(emailInput);
                }} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-sage/60 mb-2 block">Your Email</label>
                    <input 
                      name="email"
                      type="email" 
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-sage/20 transition-all font-medium"
                    />
                  </div>
                  <Button type="submit" disabled={isLoggingIn} className="w-full h-14 rounded-2xl bg-sage hover:bg-sage/90 text-forest font-bold text-lg">
                    {isLoggingIn ? 'Identifying...' : 'Continue'}
                  </Button>
                  <p className="text-[10px] text-center text-white/40 uppercase tracking-widest font-bold">
                    We'll send a magic link to your email
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-white/20 text-xs font-medium pt-8">
            Pantry Pilot v2.0 • Zero Credentials Auth
          </p>
        </div>
      </div>
    );
  }

  if (!user.household_id) {
    return (
      <div className="min-h-screen bg-forest flex items-center justify-center p-6 text-white">
        <Card className="w-full max-w-md p-8 bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Setup Your Household</h2>
            <button 
              onClick={() => {
                supabase.auth.signOut();
                setUser(null);
                localStorage.removeItem('pantry_pilot_user');
              }}
              className="text-zinc-400 hover:text-red-500 transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
          
          {householdError && (
            <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-xl border border-red-500/20 mb-6 flex items-center gap-2">
              <AlertTriangle size={16} />
              {householdError}
            </div>
          )}

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setOnboardingStep('create')}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${onboardingStep === 'create' ? 'border-sage bg-sage/5' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
              >
                <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center text-sage">
                  <PlusCircle size={24} />
                </div>
                <span className="text-sm font-bold text-white">Create New</span>
              </button>
              <button 
                onClick={() => setOnboardingStep('join')}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${onboardingStep === 'join' ? 'border-sage bg-sage/5' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
              >
                <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center text-sage">
                  <Users size={24} />
                </div>
                <span className="text-sm font-bold text-white">Join Existing</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {onboardingStep === 'create' && (
                <motion.form 
                  key="create"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={(e: any) => {
                    e.preventDefault();
                    handleCreateHousehold(e.target.name.value);
                  }} 
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-sage/40 mb-1 block">Household Name</label>
                    <input 
                      name="name"
                      required
                      placeholder="e.g. The Smith Family"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-sage/20 transition-all"
                    />
                  </div>
                  <Button type="submit" disabled={isProcessingHousehold} className="w-full bg-sage text-forest hover:bg-sage/90 font-bold">
                    {isProcessingHousehold ? 'Creating...' : 'Create Household'}
                  </Button>
                </motion.form>
              )}

              {onboardingStep === 'join' && (
                <motion.form 
                  key="join"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={(e: any) => {
                    e.preventDefault();
                    handleJoinHousehold(e.target.code.value);
                  }} 
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-sage/40 mb-1 block">Invite Code</label>
                    <input 
                      name="code"
                      required
                      placeholder="e.g. PX-4022"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-sage/20 transition-all uppercase"
                    />
                  </div>
                  <Button type="submit" variant="secondary" disabled={isProcessingHousehold} className="w-full">
                    {isProcessingHousehold ? 'Joining...' : 'Join Household'}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-forest/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm border-2 border-white">
            <img src="/icon.png" alt="Pantry Pilot" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=512&auto=format&fit=crop'; }} />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-white flex items-center gap-2">
              Pantry Pilot
              {!isConnected && <CloudOff size={14} className="text-red-400" />}
            </h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                {isConnected ? 'Live Sync' : 'Offline Mode'}
              </span>
              <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest ml-2 border-l border-white/10 pl-2">
                {household?.name || 'My Home'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
        <Button variant="ghost" className="w-10 h-10 p-0 rounded-full text-white/40 hover:text-white" onClick={() => setIsHouseholdSettingsOpen(true)}>
          <Settings size={18} />
        </Button>
        <Button variant="ghost" className="w-10 h-10 p-0 rounded-full text-white/40 hover:text-red-400" onClick={() => {
          supabase.auth.signOut();
          setUser(null);
          localStorage.removeItem('pantry_pilot_user');
        }}>
          <LogOut size={18} />
        </Button>
      </div>
    </header>

      {/* Sync Toast */}
      <AnimatePresence>
        {showSyncToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-charcoal text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium pointer-events-none"
          >
            <Cloud size={16} className="text-emerald-400" />
            Syncing...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 pt-6">
        
        {/* Search & Categories - Only visible on Inventory View */}
        {view === 'inventory' && (
          <div className="mb-8 space-y-4">
            <div className="relative">
              <VoiceInput
                value={searchQuery}
                onChange={(e: any) => {
                  setSearchQuery(e.target.value);
                }}
                placeholder="Search pantry..."
                className="bg-white/5 border border-white/10 text-white placeholder:text-white/20"
                iconLeft={<Search size={18} className="text-white/40" />}
                clearable={true}
                onClear={() => setSearchQuery('')}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <button 
                onClick={() => {
                  setSelectedCategory(null);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${!selectedCategory ? 'bg-sage text-forest' : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'}`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat.name}
                  onClick={() => {
                    const newCat = cat.name === selectedCategory ? null : cat.name;
                    setSelectedCategory(newCat);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${selectedCategory === cat.name ? 'bg-sage text-forest' : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'}`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              className="space-y-8"
            >
              {/* Primary Feature Cards */}
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <Card 
                  className="flex flex-col items-center justify-center h-44 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group p-4 text-center bg-primary text-white"
                  onClick={() => setView('inventory')}
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🏠</div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest font-sans mb-1">Total Items</span>
                    <span className="text-4xl font-bold text-white tracking-tight leading-none">{state.items.length}</span>
                  </div>
                </Card>
                <Card 
                  className="flex flex-col items-center justify-center h-44 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group p-4 text-center bg-secondary text-white"
                  onClick={() => setView('shopping')}
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📝</div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest font-sans mb-1">To Buy</span>
                    <span className="text-4xl font-bold text-white tracking-tight leading-none">{state.shoppingList.filter(i => !i.purchased).length}</span>
                  </div>
                </Card>
              </div>

              {/* Quick Filters / Stats Pills */}
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => {
                    setSelectedCategory(null);
                    setView('inventory');
                  }}
                  className="px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center gap-2 hover:bg-white/10 transition-all group tactile-button"
                >
                  <div className={`w-2 h-2 rounded-full ${expiringSoon.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-white/20'}`}></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-white/60">Expiring Soon</span>
                  <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full text-white/40">{expiringSoon.length}</span>
                </button>
                <button 
                  onClick={() => {
                    setSelectedCategory(null);
                    setView('inventory');
                  }}
                  className="px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center gap-2 hover:bg-white/10 transition-all group tactile-button"
                >
                  <div className={`w-2 h-2 rounded-full ${lowStock.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`}></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-white/60">Low Stock</span>
                  <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full text-white/40">{lowStock.length}</span>
                </button>
              </div>

              {/* Alerts */}
              {(expiringSoon.length > 0 || lowStock.length > 0) && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-sage/60">Attention Required</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[...expiringSoon.slice(0, 2), ...lowStock.slice(0, 2)].slice(0, 4).map(item => {
                      const isLowStock = item.quantity <= item.low_stock_threshold;
                      const isExpiring = item.expiry_date && new Date(item.expiry_date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                      
                      return (
                        <div key={item.id} className={`flex items-center gap-4 p-4 border rounded-2xl backdrop-blur-md ${isLowStock ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                          <div className="text-2xl">{item.icon}</div>
                          <div className="flex-1 overflow-hidden">
                            <h4 className="font-bold text-sm truncate text-white">{item.name}</h4>
                            <div className="flex items-center gap-2">
                              {isExpiring && <p className="text-[10px] text-amber-500/80 font-bold">Expires: {item.expiry_date}</p>}
                              {isLowStock && <p className="text-[10px] text-red-500/80 font-bold">Low Stock: {item.quantity} {item.unit_type}</p>}
                              {(() => {
                                const zone = state.zones.find(z => z.id === item.zone_id);
                                const location = state.locations.find(l => l.id === zone?.location_id);
                                return (
                                  <p className="text-[10px] text-white/30 truncate">
                                    in {location?.name}
                                  </p>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            {isLowStock ? <AlertTriangle className="text-red-400" size={18} /> : <AlertTriangle className="text-amber-400" size={18} />}
                            <button 
                              onClick={withFeedback(() => {
                                const libraryItem = state.library.find(l => l.name.toLowerCase() === item.name.toLowerCase());
                                dispatch({
                                  type: 'ADD_TO_SHOPPING',
                                  payload: {
                                    name: item.name,
                                    storageCategory: item.storageCategory,
                                    shoppingCategory: item.shoppingCategory,
                                    icon: item.icon,
                                    quantity: 1,
                                    unit_type: item.unit_type,
                                    store: libraryItem?.store || null,
                                    item_id: item.id
                                  }
                                });
                                setAddedToCartId(item.id);
                                setTimeout(() => setAddedToCartId(null), 2000);
                              })}
                              className={`p-1.5 transition-all bg-white/10 rounded-lg border border-white/10 ${addedToCartId === item.id ? 'text-emerald-400 scale-110' : 'text-white/20 hover:text-sage'}`}
                              title="Add to shopping list"
                            >
                              {addedToCartId === item.id ? <Check size={12} /> : <ShoppingCart size={12} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Locations Overview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-accent">Storage Units</h3>
                  <Button variant="ghost" className="text-xs" onClick={() => setIsAddingLocation(true)}>
                    <Plus size={14} /> Add Unit
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {state.locations && state.locations.length > 0 ? (
                    <>
                      {/* Hero Card: Shopping Bags */}
                      {(() => {
                        const shoppingBags = state.locations.find(l => l.name.includes('Shopping Bags'));
                        if (!shoppingBags) return null;
                        const locItems = filteredItems.filter(i => {
                          const zone = state.zones?.find(z => z.id === i.zone_id);
                          return zone?.location_id === shoppingBags.id;
                        });
                        return (
                          <Card 
                            key={shoppingBags.id}
                            className="bg-white/5 border-white/10 hover:border-sage/50 transition-all relative overflow-hidden group !p-6 backdrop-blur-md"
                            onClick={() => {
                              setSelectedLocationId(shoppingBags.id);
                              setView('inventory');
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-sage/10 flex items-center justify-center text-2xl group-hover:bg-sage group-hover:text-forest transition-all">
                                  {shoppingBags.icon || '🛍️'}
                                </div>
                                <div>
                                  <h4 className="font-bold text-lg text-white">
                                    {shoppingBags.name}
                                  </h4>
                                  <p className="text-xs text-sage/60 font-medium">{locItems.length} items to sort</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setModalItem(null);
                                    setModalContext('pantry');
                                    setSelectedLocationId(shoppingBags.id);
                                    setIsItemModalOpen(true);
                                  }}
                                  className="w-10 h-10 bg-sage text-forest rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-20"
                                  title="Quick add to Shopping Bags"
                                >
                                  <Plus size={20} />
                                </button>
                                <ChevronRight size={24} className="text-white/20 group-hover:text-sage transition-colors" />
                              </div>
                            </div>
                          </Card>
                        );
                      })()}

                      {/* Other Units Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {state.locations.filter(l => !l.name.includes('Shopping Bags')).map(loc => {
                          const locItems = filteredItems.filter(i => {
                            const zone = state.zones?.find(z => z.id === i.zone_id);
                            return zone?.location_id === loc.id;
                          });
                          
                          if (locItems.length === 0 && (searchQuery || selectedCategory)) return null;
                          
                          return (
                            <Card 
                              key={loc.id} 
                              className="group cursor-pointer border-white/10 hover:border-sage transition-all relative bg-white/5 !p-3 backdrop-blur-sm" 
                              onClick={() => {
                                setSelectedLocationId(loc.id);
                                setView('inventory');
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-lg group-hover:bg-sage group-hover:text-forest transition-colors">
                                  {loc.icon || '📦'}
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingLocation(loc);
                                    setIsAddingLocation(true);
                                  }}
                                  className="p-1 text-white/20 hover:text-sage transition-all"
                                >
                                  <Pencil size={12} />
                                </button>
                              </div>
                              <div className="overflow-hidden mb-4">
                                <h4 className="font-bold text-sm truncate text-white">
                                  {loc.name.replace(/^[^\w\s]+/, '').replace('Snowflake Freezer', 'Freezer').trim()}
                                </h4>
                                <p className="text-[10px] text-sage/60 font-medium">{locItems.length} items</p>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setModalItem(null);
                                  setModalContext('pantry');
                                  setSelectedLocationId(loc.id);
                                  setIsItemModalOpen(true);
                                }}
                                className="absolute bottom-2 right-2 w-8 h-8 bg-sage text-forest rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-20"
                                title={`Quick add to ${loc.name}`}
                              >
                                <Plus size={16} />
                              </button>
                            </Card>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="py-12 border-2 border-dashed border-zinc-100 rounded-3xl flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 text-zinc-300">
                        <Package size={32} />
                      </div>
                      <h4 className="font-bold text-zinc-900">No storage units yet</h4>
                      <p className="text-sm text-zinc-400 max-w-[200px] mt-1">Add your first fridge, pantry or cupboard to start.</p>
                      <Button variant="outline" className="mt-6" onClick={() => setIsAddingLocation(true)}>
                        <Plus size={16} /> Create Unit
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'inventory' && (
            <motion.div 
              key="inventory"
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-4">
                <div className="flex flex-col items-center sm:flex-row gap-4 relative w-full sm:w-auto">
                  <Button 
                    variant="ghost" 
                    className="absolute left-0 sm:static p-2"
                    onClick={() => {
                      if (selectedLocationId) {
                        setSelectedLocationId(null);
                      } else {
                        setView('dashboard');
                      }
                    }}
                  >
                    {selectedLocationId ? <ArrowRightLeft className="rotate-180" size={18} /> : <LayoutDashboard size={18} />}
                  </Button>
                  <div className="flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-4">
                    {selectedLocationId && (
                      <span className="text-4xl sm:text-2xl mb-1 sm:mb-0">{state.locations.find(l => l.id === selectedLocationId)?.icon}</span>
                    )}
                    <h2 className="text-2xl sm:text-2xl font-bold tracking-tight text-center sm:text-left">
                      {selectedLocationId ? (state.locations.find(l => l.id === selectedLocationId)?.name || 'Storage Unit').replace(/^[^\w\s]+/, '').trim() : 'All Inventory'}
                    </h2>
                  </div>
                </div>
                <div className="flex flex-row gap-2 relative w-full sm:w-auto">
                  {!selectedLocationId && (
                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button 
                      onClick={() => setInventoryGrouping('category')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${inventoryGrouping === 'category' ? 'bg-sage text-forest shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                      Categories
                    </button>
                    <button 
                      onClick={() => setInventoryGrouping('location')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${inventoryGrouping === 'location' ? 'bg-sage text-forest shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                      Units
                    </button>
                  </div>
                  )}
                  {selectedLocationId && (state.locations.find(l => l.id === selectedLocationId)?.name === '🛍️ Shopping Bags' || state.locations.find(l => l.id === selectedLocationId)?.name === 'Shopping Bags') && (
                    <div className="relative flex-1 sm:flex-none">
                      <Button 
                        variant="outline" 
                        className="w-full sm:w-auto py-2 px-3 text-sm border-white/10 text-white hover:bg-white/10"
                        onClick={() => setIsUnpackMenuOpen(!isUnpackMenuOpen)}
                      >
                        <ArrowRightLeft size={16} className="mr-1" />
                        <span className="truncate">{selectedItemIds.size > 0 ? `Move (${selectedItemIds.size})` : 'Unpack'}</span>
                      </Button>
                      
                      <AnimatePresence>
                        {isUnpackMenuOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 top-full mt-2 w-56 bg-forest rounded-2xl shadow-2xl border border-white/10 p-2 z-50 backdrop-blur-xl"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-widest text-sage/60 px-3 py-2">Move to Storage Unit</p>
                            {state.locations.filter(l => l.name !== '🛍️ Shopping Bags').map(loc => (
                              <button
                                key={loc.id}
                                onClick={() => handleBulkMove(loc.id)}
                                className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl flex items-center gap-3 transition-all group"
                              >
                                <span className="text-xl">{loc.icon}</span>
                                <span className="text-sm font-medium text-white/80 group-hover:text-sage">{loc.name.replace(/^[^\w\s]+/, '').trim()}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  {selectedLocationId && (state.locations.find(l => l.id === selectedLocationId)?.name === '🛍️ Shopping Bags' || state.locations.find(l => l.id === selectedLocationId)?.name === 'Shopping Bags') && (
                    <Button 
                      className="flex-1 sm:flex-none py-2 px-3 text-sm bg-sage text-forest hover:bg-sage/90 shadow-2xl font-bold"
                      onClick={handlePrepareAutoSort}
                    >
                      ✨ Auto-Sort
                    </Button>
                  )}
                  {selectedLocationId && 
                    state.locations.find(l => l.id === selectedLocationId)?.name !== '🛍️ Shopping Bags' && 
                    state.locations.find(l => l.id === selectedLocationId)?.name !== 'Shopping Bags' && (
                    <Button 
                      variant="outline" 
                      className="flex-1 sm:flex-none py-2 px-3 text-sm border-primary/20 text-primary hover:bg-primary/5"
                      onClick={() => setIsAddingZone(true)}
                    >
                      <PlusCircle size={16} /> Zone
                    </Button>
                  )}
                  <Button 
                    className="flex-1 sm:flex-none py-2 px-3 text-sm bg-primary text-white hover:bg-primary/90"
                    onClick={() => {
                      setModalItem(null);
                      setModalContext('pantry');
                      setIsItemModalOpen(true);
                    }}
                    disabled={state.locations.length === 0}
                    title={state.locations.length === 0 ? "Create a storage unit first" : ""}
                  >
                    <Plus size={16} /> Item
                  </Button>
                </div>
              </div>

              {/* Zones & Items */}
              <div className="space-y-12">
                <AnimatePresence>
                  {unpackSuccessMessage && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-primary text-white px-6 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 font-bold"
                    >
                      <Check size={20} />
                      {unpackSuccessMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                {(() => {
                  const itemsInView = selectedLocationId
                    ? filteredItems.filter(i => {
                        const zone = state.zones.find(z => z.id === i.zone_id);
                        return zone?.location_id === selectedLocationId;
                      })
                    : filteredItems;

                  if (itemsInView.length === 0) {
                    return (
                      <div className="text-center py-20 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
                        <Package className="mx-auto text-zinc-300 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-zinc-500">No items found</h3>
                        <p className="text-zinc-400 text-sm mb-6">
                          {searchQuery || selectedCategory 
                            ? "Try clearing your filters to see all items." 
                            : "This storage unit is currently empty."}
                        </p>
                        {(searchQuery || selectedCategory) && (
                          <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}>
                            Clear All Filters
                          </Button>
                        )}
                      </div>
                    );
                  }

                  // Grouping Logic
                  let groups: { title: string, icon: string, items: Item[] }[] = [];

                  if (selectedLocationId || inventoryGrouping === 'category') {
                    // Group by Category
                    const catGroups = itemsInView.reduce((acc, item) => {
                      const cat = item.storageCategory || 'Other';
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(item);
                      return acc;
                    }, {} as Record<string, Item[]>);

                    const categoryOrder = CATEGORIES.map(c => c.name);

                    Object.keys(catGroups).sort((a, b) => {
                      const indexA = categoryOrder.indexOf(a as any);
                      const indexB = categoryOrder.indexOf(b as any);
                      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                      if (indexA === -1) return 1;
                      if (indexB === -1) return -1;
                      return indexA - indexB;
                    }).forEach(catName => {
                      const categoryObj = CATEGORIES.find(c => c.name === catName);
                      groups.push({ 
                        title: catName === 'Other' ? '📦 General' : catName, 
                        icon: categoryObj ? categoryObj.icon : '📦', 
                        items: catGroups[catName] 
                      });
                    });
                  } else {
                    // Group by Location
                    state.locations.forEach(loc => {
                      const locItems = itemsInView.filter(i => {
                        const zone = state.zones.find(z => z.id === i.zone_id);
                        return zone?.location_id === loc.id;
                      });
                      if (locItems.length > 0) {
                        groups.push({ title: loc.name, icon: loc.icon || '📦', items: locItems });
                      }
                    });

                    // Fallback for items with no location/zone
                    const itemsWithNoLoc = itemsInView.filter(i => {
                      const zone = state.zones.find(z => z.id === i.zone_id);
                      return !zone || !state.locations.find(l => l.id === zone.location_id);
                    });
                    if (itemsWithNoLoc.length > 0) {
                      groups.push({ title: '📦 General', icon: '📦', items: itemsWithNoLoc });
                    }
                  }

                  return groups.map((group) => (
                    <div key={group.title} className="space-y-4">
                      <GroupHeader title={group.title} icon={group.icon} />
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                          {group.items.map(item => {
                            const isExpired = item.expiry_date && new Date(item.expiry_date) < new Date();
                            const isExpiringSoon = item.expiry_date && new Date(item.expiry_date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                            const isLowStock = item.quantity <= item.low_stock_threshold;
                            const isSelected = selectedItemIds.has(item.id);

                            return (
                              <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                              >
                                <SwipeableItem
                                  onSwipeLeft={() => {
                                    const libraryItem = state.library.find(l => l.name.toLowerCase() === item.name.toLowerCase());
                                    dispatch({
                                      type: 'ADD_TO_SHOPPING',
                                      payload: {
                                        name: item.name,
                                        storageCategory: item.storageCategory,
                                        shoppingCategory: item.shoppingCategory,
                                        icon: item.icon,
                                        quantity: 1,
                                        unit_type: item.unit_type,
                                        store: libraryItem?.store || null,
                                        item_id: item.id
                                      }
                                    });
                                    setAddedToCartId(item.id);
                                    setTimeout(() => setAddedToCartId(null), 2000);
                                  }}
                                  onSwipeRight={() => {
                                    if (window.confirm(`Mark ${item.name} as consumed?`)) {
                                      dispatch({ type: 'DELETE_ITEM', payload: { id: item.id } });
                                    }
                                  }}
                                  leftIcon={<ShoppingCart size={24} />}
                                  rightIcon={<Trash2 size={24} />}
                                >
                                  <Card className={`flex flex-col gap-4 relative transition-all bg-white/5 border-white/10 ${isSelected ? 'ring-2 ring-sage bg-sage/5' : ''}`}>
                                    {selectedLocationId && state.locations.find(l => l.id === selectedLocationId)?.name === '🛍️ Shopping Bags' && (
                                      <div className="absolute top-4 left-4 z-10">
                                        <input 
                                          type="checkbox" 
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const newSelected = new Set(selectedItemIds);
                                            if (e.target.checked) {
                                              newSelected.add(item.id);
                                            } else {
                                              newSelected.delete(item.id);
                                            }
                                            setSelectedItemIds(newSelected);
                                          }}
                                          className="w-5 h-5 rounded-lg border-white/10 bg-white/5 text-sage focus:ring-sage cursor-pointer"
                                        />
                                      </div>
                                    )}
                                    <div className={`flex items-start justify-between ${selectedLocationId && state.locations.find(l => l.id === selectedLocationId)?.name === '🛍️ Shopping Bags' ? 'pl-8' : ''}`}>
                                      <div className="flex items-center gap-3">
                                        <div className="text-3xl">{item.icon}</div>
                                        <div className="overflow-hidden">
                                          <h4 className="font-bold text-white leading-tight truncate" title={item.name}>{item.name}</h4>
                                          <div className="flex flex-col">
                                            <p className="text-[10px] text-sage/60 uppercase font-bold tracking-wider">{item.storageCategory || item.shoppingCategory}</p>
                                            {(() => {
                                              const zone = state.zones.find(z => z.id === item.zone_id);
                                              const location = state.locations.find(l => l.id === zone?.location_id);
                                              return (
                                                <p className="text-[9px] text-sage/40 font-bold truncate mt-0.5">
                                                  {location?.name} {zone ? `› ${zone.name}` : ''}
                                                </p>
                                              );
                                            })()}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1">
                                        {isExpired ? <Badge color="red">Expired</Badge> : isExpiringSoon ? <Badge color="amber">Soon</Badge> : <Badge color="green">Safe</Badge>}
                                        {isLowStock && <Badge color="red">Low Stock</Badge>}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                                      <div className="flex items-center gap-2">
                                        <button 
                                          onClick={() => dispatch({ type: 'UPDATE_ITEM', payload: { ...item, quantity: Math.max(0, item.quantity - (item.unit_type === 'items' ? 1 : 100)), unit_type: item.unit_type } })}
                                          className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 active:scale-90 transition-all"
                                        >
                                          -
                                        </button>
                                        <div className="flex flex-col items-center min-w-[60px]">
                                          <span className="text-sm font-bold text-white">{item.quantity}</span>
                                          <span className="text-[10px] text-sage/40 uppercase font-bold">{item.unit_type}</span>
                                        </div>
                                        <button 
                                          onClick={() => dispatch({ type: 'UPDATE_ITEM', payload: { ...item, quantity: item.quantity + (item.unit_type === 'items' ? 1 : 100), unit_type: item.unit_type } })}
                                          className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 active:scale-90 transition-all"
                                        >
                                          +
                                        </button>
                                      </div>
                                      <div className="flex gap-1">
                                        <button 
                                          onClick={withFeedback(() => {
                                            const libraryItem = state.library.find(l => l.name.toLowerCase() === item.name.toLowerCase());
                                            dispatch({
                                              type: 'ADD_TO_SHOPPING',
                                              payload: {
                                                name: item.name,
                                                storageCategory: item.storageCategory,
                                                shoppingCategory: item.shoppingCategory,
                                                icon: item.icon,
                                                quantity: 1,
                                                unit_type: item.unit_type,
                                                store: libraryItem?.store || null,
                                                item_id: item.id
                                              }
                                            });
                                            setAddedToCartId(item.id);
                                            setTimeout(() => setAddedToCartId(null), 2000);
                                          })}
                                          className={`p-2 transition-all ${addedToCartId === item.id ? 'text-emerald-400 scale-110' : 'text-white/20 hover:text-sage'}`}
                                          title="Add to shopping list"
                                        >
                                          {addedToCartId === item.id ? <Check size={16} /> : <ShoppingCart size={16} />}
                                        </button>
                                        <button 
                                          onClick={() => {
                                            setModalItem(item);
                                            setModalContext('pantry');
                                            setIsItemModalOpen(true);
                                          }} 
                                          className="p-2 text-white/20 hover:text-sage transition-all"
                                          title="Edit item"
                                        >
                                          <Pencil size={16} />
                                        </button>
                                        <button onClick={() => setTransferItem(item)} className="p-2 text-sage hover:opacity-80 transition-all">
                                          <ArrowRightLeft size={16} />
                                        </button>
                                        <button onClick={withFeedback(() => dispatch({ type: 'DELETE_ITEM', payload: { id: item.id } }), 'delete')} className="p-2 text-white/20 hover:text-red-500 transition-all">
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </div>
                                    {selectedLocationId && state.locations.find(l => l.id === selectedLocationId)?.name === '🛍️ Shopping Bags' && (
                                      <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-zinc-100">
                                        {state.locations.filter(l => l.name !== '🛍️ Shopping Bags').map(loc => (
                                          <button
                                            key={loc.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const firstZone = state.zones.find(z => z.location_id === loc.id);
                                              if (firstZone) {
                                                dispatch({ type: 'TRANSFER_ITEM', payload: { itemId: item.id, targetZoneId: firstZone.id } });
                                              }
                                            }}
                                            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-full text-[10px] font-bold uppercase tracking-wider text-zinc-600 transition-all"
                                          >
                                            + {loc.name.replace(/^[^\w\s]+/, '').trim()}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </Card>
                                </SwipeableItem>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          )}

          {view === 'shopping' && (
            <motion.div 
              key="shopping"
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight">Shopping List</h2>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={exportShoppingListPDF} className="border-white/10 text-white hover:bg-white/10">
                    <FileDown size={18} /> Export PDF
                  </Button>
                  <Button onClick={() => {
                    setModalItem(null);
                    setModalContext('shopping');
                    setIsItemModalOpen(true);
                  }} className="bg-sage text-forest hover:bg-sage/90">
                    <Plus size={18} /> Add Item
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isStoreSortingEnabled ? 'bg-sage text-forest' : 'bg-white/5 text-white/20'}`}>
                    <Filter size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Group by Store</h4>
                    <p className="text-[10px] text-sage/40 uppercase tracking-wider font-bold">Organize your list by shop</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsStoreSortingEnabled(!isStoreSortingEnabled)}
                  className={`w-12 h-6 rounded-full transition-all relative ${isStoreSortingEnabled ? 'bg-sage' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full ${isStoreSortingEnabled ? 'bg-forest' : 'bg-white/40'} transition-all ${isStoreSortingEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Quick Add */}
              <div className="p-2 rounded-2xl tactile-card">
                <form onSubmit={(e: any) => {
                  e.preventDefault();
                  const input = e.target.quickAdd.value.trim();
                  if (!input) return;
                  
                  // Simple parser: "2 kg Milk" or "Milk"
                  const match = input.match(/^([\d.]+)?\s*([a-zA-Z]+)?\s*(.+)$/);
                  let name = input;
                  let quantity = 1;
                  let unitType = 'items';
                  
                  if (match) {
                    const q = parseFloat(match[1]);
                    const u = match[2]?.toLowerCase();
                    const n = match[3];
                    
                    const validUnits = ['g', 'kg', 'ml', 'l', 'oz', 'lb', 'cups', 'tbsp', 'tsp', 'items'];
                    
                    if (!isNaN(q) && u && validUnits.includes(u)) {
                      quantity = q;
                      unitType = u;
                      name = n;
                    } else if (!isNaN(q) && !u) {
                      quantity = q;
                      name = n;
                    }
                  }

                  const cats = lookupCategories(name);
                  const category = cats ? CATEGORIES.find(c => c.name === cats.storage) || CATEGORIES[CATEGORIES.length - 1] : CATEGORIES.find(c => name.toLowerCase().includes(c.name.toLowerCase())) || CATEGORIES[CATEGORIES.length - 1];
                  const existingItem = state.items.find(i => i.name.toLowerCase() === name.toLowerCase());
                  
                  dispatch({
                    type: 'ADD_TO_SHOPPING',
                    payload: {
                      name: name.charAt(0).toUpperCase() + name.slice(1),
                      storageCategory: category.name,
                      shoppingCategory: category.name,
                      icon: category.icon,
                      quantity,
                      unit_type: unitType,
                      store: null,
                      item_id: existingItem?.id || null
                    }
                  });
                  e.target.quickAdd.value = '';
                  triggerHapticSuccess();
                  playSuccess();
                }} className="flex gap-2">
                  <VoiceInput 
                    name="quickAdd"
                    placeholder="Quick add: '2 kg Milk' or 'Eggs'..."
                    className="flex-1 bg-white/5 border-white/10 text-white text-sm"
                  />
                  <Button type="submit" className="px-6 h-[48px] bg-sage text-forest hover:bg-sage/90 font-bold">Add</Button>
                </form>
              </div>

              {/* Shopping Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button 
                  onClick={() => setShoppingStoreFilter(null)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${!shoppingStoreFilter ? 'bg-secondary text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                >
                  All Stores
                </button>
                {stores.map(store => (
                  <button 
                    key={store}
                    onClick={() => setShoppingStoreFilter(store === shoppingStoreFilter ? null : store)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${shoppingStoreFilter === store ? 'bg-secondary text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                  >
                    <Filter size={14} />
                    <span>{store}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {(() => {
                  const filteredItems = state.shoppingList.filter(i => !i.purchased && (!shoppingStoreFilter || i.store === shoppingStoreFilter));
                  
                  if (filteredItems.length === 0) {
                    return (
                      <div className="text-center py-20 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
                        <ShoppingCart className="mx-auto text-zinc-300 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-zinc-500">Your list is empty</h3>
                        <p className="text-zinc-400 text-sm">Add items to start your shopping trip.</p>
                      </div>
                    );
                  }

                  if (isStoreSortingEnabled) {
                    const storeGroups = filteredItems.reduce((acc, item) => {
                      const store = item.store || 'Any Store';
                      if (!acc[store]) acc[store] = [];
                      acc[store].push(item);
                      return acc;
                    }, {} as Record<string, typeof filteredItems>);

                    return Object.keys(storeGroups).sort().map(storeName => {
                      const storeItems = storeGroups[storeName];
                      const aisleGroups = storeItems.reduce((acc, item) => {
                        const cat = item.shoppingCategory || 'Other';
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(item);
                        return acc;
                      }, {} as Record<string, typeof storeItems>);

                      const categoryOrder = CATEGORIES.map(c => c.name);

                      const sortedAisles = Object.keys(aisleGroups).sort((a, b) => {
                        const indexA = categoryOrder.indexOf(a as any);
                        const indexB = categoryOrder.indexOf(b as any);
                        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                      });

                      return (
                        <div key={storeName} className="space-y-6">
                          <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                              <ShoppingCart size={16} />
                            </div>
                            <h3 className="text-lg font-serif font-bold text-charcoal">{storeName}</h3>
                          </div>
                          <div className="pl-4 border-l-2 border-secondary/20 space-y-10">
                            {sortedAisles.map(aisleName => {
                              const items = aisleGroups[aisleName];
                              const categoryObj = CATEGORIES.find(c => c.name === aisleName);
                              const icon = categoryObj ? categoryObj.icon : '📦';
                              return (
                                <div key={aisleName} className="space-y-4">
                                  <GroupHeader title={aisleName} icon={icon} />
                                  <div className="space-y-4">
                                    {items.map(item => (
                                      <SwipeableItem
                                        key={item.id}
                                        onSwipeLeft={() => handleDeleteShoppingItem(item)}
                                        leftIcon={<Trash2 size={24} />}
                                        leftColor="bg-red-400"
                                        leftFeedbackType="delete"
                                      >
                                        <Card 
                                          className="flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-all"
                                          onClick={() => {
                                            setModalItem(item);
                                            setModalContext('shopping');
                                            setIsItemModalOpen(true);
                                          }}
                                        >
                                          <div className="text-2xl">{item.icon}</div>
                                          <div className="flex-1">
                                            <h4 className="font-bold">{item.name}</h4>
                                            <p className="text-xs text-zinc-400">{item.shoppingCategory}</p>
                                          </div>
                                          <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-lg border border-zinc-100">
                                              <button 
                                                onClick={() => dispatch({ type: 'UPDATE_SHOPPING_ITEM', payload: { id: item.id, quantity: Math.max(0, item.quantity - (item.unit_type === 'items' ? 1 : 0.5)) } })}
                                                className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm hover:bg-zinc-100 transition-all text-xs font-bold"
                                              >
                                                -
                                              </button>
                                              <div className="flex flex-col items-center min-w-[40px]">
                                                <span className="text-xs font-bold">{item.quantity}</span>
                                                <span className="text-[8px] text-zinc-400 uppercase font-bold">{item.unit_type}</span>
                                              </div>
                                              <button 
                                                onClick={() => dispatch({ type: 'UPDATE_SHOPPING_ITEM', payload: { id: item.id, quantity: item.quantity + (item.unit_type === 'items' ? 1 : 0.5) } })}
                                                className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm hover:bg-zinc-100 transition-all text-xs font-bold"
                                              >
                                                +
                                              </button>
                                            </div>
                                            <Button variant="secondary" className="h-10 px-3" onClick={withFeedback(() => dispatch({ type: 'MARK_PURCHASED', payload: { id: item.id } }), 'success')}>
                                              <CheckCircle2 size={18} />
                                            </Button>
                                            <button onClick={withFeedback(() => handleDeleteShoppingItem(item), 'delete')} className="text-zinc-300 hover:text-red-500">
                                              <Trash2 size={18} />
                                            </button>
                                          </div>
                                        </Card>
                                      </SwipeableItem>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  } else {
                    // Group by Category
                    const catGroups = filteredItems.reduce((acc, item) => {
                      const cat = item.shoppingCategory || 'Other';
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(item);
                      return acc;
                    }, {} as Record<string, typeof filteredItems>);

                    const categoryOrder = CATEGORIES.map(c => c.name);

                    return Object.keys(catGroups).sort((a, b) => {
                      const indexA = categoryOrder.indexOf(a as any);
                      const indexB = categoryOrder.indexOf(b as any);
                      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                      if (indexA === -1) return 1;
                      if (indexB === -1) return -1;
                      return indexA - indexB;
                    }).map(catName => {
                      const items = catGroups[catName];
                      const categoryObj = CATEGORIES.find(c => c.name === catName);
                      const icon = categoryObj ? categoryObj.icon : '📦';
                      return (
                        <div key={catName} className="space-y-4">
                          <GroupHeader title={catName} icon={icon} />
                          <div className="space-y-4">
                            {items.map(item => (
                              <SwipeableItem
                                key={item.id}
                                onSwipeLeft={() => handleDeleteShoppingItem(item)}
                                leftIcon={<Trash2 size={24} />}
                                leftColor="bg-red-400"
                                leftFeedbackType="delete"
                              >
                                <Card 
                                  className="flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-all"
                                  onClick={() => {
                                    setModalItem(item);
                                    setModalContext('shopping');
                                    setIsItemModalOpen(true);
                                  }}
                                >
                                  <div className="text-2xl">{item.icon}</div>
                                  <div className="flex-1">
                                    <h4 className="font-bold">{item.name}</h4>
                                    <p className="text-xs text-zinc-400">{item.shoppingCategory}</p>
                                  </div>
                                  <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-lg border border-zinc-100">
                                      <button 
                                        onClick={() => dispatch({ type: 'UPDATE_SHOPPING_ITEM', payload: { id: item.id, quantity: Math.max(0, item.quantity - (item.unit_type === 'items' ? 1 : 0.5)) } })}
                                        className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm hover:bg-zinc-100 transition-all text-xs font-bold"
                                      >
                                        -
                                      </button>
                                      <div className="flex flex-col items-center min-w-[40px]">
                                        <span className="text-xs font-bold">{item.quantity}</span>
                                        <span className="text-[8px] text-zinc-400 uppercase font-bold">{item.unit_type}</span>
                                      </div>
                                      <button 
                                        onClick={() => dispatch({ type: 'UPDATE_SHOPPING_ITEM', payload: { id: item.id, quantity: item.quantity + (item.unit_type === 'items' ? 1 : 0.5) } })}
                                        className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm hover:bg-zinc-100 transition-all text-xs font-bold"
                                      >
                                        +
                                      </button>
                                    </div>
                                    <Button variant="secondary" className="h-10 px-3" onClick={withFeedback(() => dispatch({ type: 'MARK_PURCHASED', payload: { id: item.id } }), 'success')}>
                                      <CheckCircle2 size={18} />
                                    </Button>
                                    <button onClick={withFeedback(() => handleDeleteShoppingItem(item), 'delete')} className="text-zinc-300 hover:text-red-500">
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </Card>
                              </SwipeableItem>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  }
                })()}

                {state.shoppingList.filter(i => i.purchased).length > 0 && (
                  <div className="pt-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Purchased (Assign to Storage)</h3>
                      <Button variant="danger" className="h-8 px-3 text-xs" onClick={() => dispatch({ type: 'CLEAR_PURCHASED', payload: {} })}>
                        Clear All
                      </Button>
                    </div>
                    {state.shoppingList.filter(i => i.purchased).map(item => (
                      <SwipeableItem
                        key={item.id}
                        onSwipeLeft={() => handleDeleteShoppingItem(item)}
                        leftIcon={<Trash2 size={24} />}
                        leftColor="bg-red-400"
                        leftFeedbackType="delete"
                      >
                        <Card className="opacity-60 flex items-center gap-4">
                          <div className="text-2xl">{item.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-bold line-through">{item.name}</h4>
                            <p className="text-xs text-zinc-400">{item.store}</p>
                          </div>
                          <Button variant="outline" className="text-xs" onClick={() => {
                            setModalItem(item);
                            setModalContext('pantry');
                            setIsItemModalOpen(true);
                          }}>
                            Assign
                          </Button>
                          <button onClick={withFeedback(() => handleDeleteShoppingItem(item), 'delete')} className="text-zinc-300 hover:text-red-500">
                            <Trash2 size={18} />
                          </button>
                        </Card>
                      </SwipeableItem>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'recipes' && (
            <motion.div 
              key="meal-planner"
              className="w-full flex flex-col gap-8"
            >
              {/* BLOCK 1: Select Future Date Button (Native Input Fix) - AT THE VERY TOP */}
              <div className="w-full grid mb-2" style={{ gridTemplateAreas: "'stack'" }}>
                <input 
                  type="date" 
                  value={selectedDate}
                  onFocus={() => { playClick(); triggerHapticClick(); }}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      playClick();
                      triggerHapticClick();
                    }
                  }}
                  className="w-full appearance-none bg-[#8DAA81] text-white font-bold text-xl py-5 px-8 rounded-2xl shadow-[0_6px_0_0_#6b8a5f] active:translate-y-[4px] active:shadow-none cursor-pointer relative block border-none outline-none"
                  style={{ 
                    gridArea: 'stack',
                    colorScheme: 'dark',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Crect width='44' height='44' rx='12' fill='white' fill-opacity='0.95'/%3E%3Cg transform='translate(6, 6)'%3E%3Cpath d='M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z' stroke='%238DAA81' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3Cpath d='M16 2V6' stroke='%238DAA81' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M8 2V6' stroke='%238DAA81' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M3 10H21' stroke='%238DAA81' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 20px center',
                    backgroundSize: '44px 44px'
                  }}
                />
                <div className="pointer-events-none flex items-center px-8" style={{ gridArea: 'stack' }}>
                  <span className="text-xl font-bold text-white tracking-tight">Select Future Date</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Meal Planner</h2>
              </div>

              {/* BLOCK 2: 7-Day Rolling Scroll */}
              <div className="w-full relative">
                <div 
                  className="w-full min-h-[100px] overflow-x-auto no-scrollbar flex gap-3 px-2 py-2 bg-white/30 rounded-3xl border border-black/5 relative"
                >
                {(() => {
                  const today = new Date();
                  const days = [];
                  for (let i = 0; i < 7; i++) {
                    const d = new Date(today);
                    d.setDate(today.getDate() + i);
                    days.push(d.toISOString().split('T')[0]);
                  }
                  if (!days.includes(selectedDate)) {
                    days.push(selectedDate);
                    days.sort();
                  }
                  return days.map(dateStr => {
                    const isActive = selectedDate === dateStr;
                    const d = new Date(dateStr);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    return (
                      <button
                        key={dateStr}
                        onClick={withFeedback(() => setSelectedDate(dateStr))}
                        className={`flex-shrink-0 px-4 py-3 rounded-2xl border-2 transition-all flex flex-col items-center min-w-[80px] h-[80px] justify-center relative pointer-events-auto ${
                          isActive 
                            ? 'bg-primary border-primary text-white shadow-lg scale-105' 
                            : 'bg-white border-zinc-100 text-zinc-500 hover:border-primary/30'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                          {d.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="text-lg font-bold leading-none mt-1">
                          {d.getDate()}
                        </span>
                        {isToday && !isActive && (
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1" />
                        )}
                      </button>
                    );
                  });
                })()}
                </div>
              </div>

              {/* BLOCK 3: Daily Meal Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedDate}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full bg-white rounded-[32px] p-8 border border-black/5 shadow-xl shadow-black/5 flex flex-col gap-6 relative"
                >
                  <div className="w-full h-1.5 bg-primary/10 rounded-full mb-2" />
                  
                  <div className="flex flex-col gap-1">
                    <h3 className="text-3xl font-serif font-bold text-charcoal">
                      {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    <p className="text-zinc-400 text-sm">Plan your meals for the day</p>
                  </div>

                  <div className="flex flex-col gap-8">
                    {['Breakfast', 'Lunch', 'Dinner', 'Special Event/Snacks'].map(mealType => {
                      const meal = state.mealPlans.find(m => m.date === selectedDate && m.meal_type === mealType);
                      const isEditing = editingMealId === `${selectedDate}-${mealType}`;
                      
                      return (
                        <div key={mealType} className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{mealType}</span>
                            {!isEditing && (
                              <button 
                                onClick={withFeedback(() => {
                                  setEditingMealId(`${selectedDate}-${mealType}`);
                                  setEditingMealValue(meal?.name || '');
                                })}
                                className="p-1 text-zinc-400 hover:text-primary transition-all"
                              >
                                {meal ? <Edit2 size={14} /> : <Plus size={14} />}
                              </button>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="flex gap-2">
                              <input 
                                autoFocus
                                value={editingMealValue}
                                onChange={(e) => setEditingMealValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    dispatch({
                                      type: 'UPDATE_MEAL_PLAN',
                                      payload: {
                                        id: meal?.id || uuidv4(),
                                        date: selectedDate,
                                        meal_type: mealType,
                                        name: editingMealValue,
                                        ingredients: meal?.ingredients || '[]',
                                        household_id: household?.id
                                      }
                                    });
                                    setEditingMealId(null);
                                    playSuccess();
                                  }
                                  if (e.key === 'Escape') setEditingMealId(null);
                                }}
                                className="flex-1 p-3 rounded-xl border-2 border-primary bg-white text-charcoal font-bold focus:outline-none"
                                placeholder={`What's for ${mealType}?`}
                              />
                              <button 
                                onClick={withFeedback(() => {
                                  dispatch({
                                    type: 'UPDATE_MEAL_PLAN',
                                    payload: {
                                      id: meal?.id || uuidv4(),
                                      date: selectedDate,
                                      meal_type: mealType,
                                      name: editingMealValue,
                                      ingredients: meal?.ingredients || '[]',
                                      household_id: household?.id
                                    }
                                  });
                                  setEditingMealId(null);
                                })}
                                className="p-3 bg-primary text-white rounded-xl"
                              >
                                <Check size={20} />
                              </button>
                            </div>
                          ) : (
                            meal && (
                              <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xl font-bold text-charcoal">{meal.name}</h4>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={withFeedback(() => {
                                        const ingredients = JSON.parse(meal.ingredients || '[]');
                                        const ingredientList = ingredients.map((i: any) => `${i.amount} ${i.unit} ${i.name}`).join('\n');
                                        const text = `Meal: ${meal.name}\nType: ${mealType}\nDate: ${selectedDate}\n\nIngredients:\n${ingredientList}`;
                                        navigator.clipboard.writeText(text);
                                      }, 'success')}
                                      className="p-2 text-zinc-400 hover:text-primary transition-all"
                                    >
                                      <Share2 size={16} />
                                    </button>
                                    <button 
                                      onClick={withFeedback(() => {
                                        dispatch({ type: 'DELETE_MEAL_PLAN', payload: meal.id });
                                      }, 'delete')}
                                      className="p-2 text-zinc-400 hover:text-red-500 transition-all"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>

                                {/* Ingredients Section */}
                                <div className="flex flex-col gap-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Ingredients</span>
                                    <button 
                                      onClick={withFeedback(() => {
                                        const name = prompt('Ingredient name?');
                                        if (name) {
                                          const ingredients = JSON.parse(meal.ingredients || '[]');
                                          const cats = lookupCategories(name);
                                          if (cats && (cats as any).isLearned) playSparkle();
                                          else if (cats && (cats as any).isAuto) playBlip();
                                          const defaultCategory = cats ? cats.storage : 'Other';
                                          const category = prompt(`Category? (Produce, Meat, Dairy, Pantry, Frozen, Pet Care, Other)`, defaultCategory);
                                          ingredients.push({ name, amount: '1', unit: 'unit', category: category || 'Other' });
                                          dispatch({
                                            type: 'UPDATE_MEAL_PLAN',
                                            payload: { ...meal, ingredients: JSON.stringify(ingredients) }
                                          });
                                        }
                                      })}
                                      className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                                    >
                                      + Add
                                    </button>
                                  </div>

                                  {(() => {
                                    const ingredients = JSON.parse(meal.ingredients || '[]');
                                    if (ingredients.length === 0) return <p className="text-xs text-zinc-400 italic">No ingredients added yet</p>;

                                    const grouped: Record<string, { icon: string, items: string[] }> = {};
                                    ingredients.forEach((ing: any) => {
                                      const cat = ing.category || 'Other';
                                      if (!grouped[cat]) {
                                        const icon = 
                                          cat === 'Produce' ? '🥬' :
                                          cat === 'Meat' ? '🥩' :
                                          cat === 'Dairy' ? '🥛' :
                                          cat === 'Frozen' ? '❄️' :
                                          cat === 'Pet Care' ? '🐾' :
                                          cat === 'Pantry' ? '🥫' : '📦';
                                        grouped[cat] = { icon, items: [] };
                                      }
                                      grouped[cat].items.push(ing.name);
                                    });

                                    return Object.entries(grouped).map(([category, data]) => (
                                      <div key={category} className="flex flex-col gap-2">
                                        <div className="tactile-card inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border-b-2 border-zinc-200 bg-zinc-50">
                                          <span className="text-sm">{data.icon}</span>
                                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{category}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          {data.items.map((item, i) => (
                                            <div key={i} className="px-3 py-2 bg-white border border-zinc-100 rounded-xl text-xs text-zinc-700 font-medium shadow-sm flex items-center justify-between group/item">
                                              <span>{item}</span>
                                              <button 
                                                onClick={withFeedback(() => {
                                                  const newIngs = ingredients.filter((ing: any) => ing.name !== item);
                                                  dispatch({
                                                    type: 'UPDATE_MEAL_PLAN',
                                                    payload: {
                                                      ...meal,
                                                      ingredients: JSON.stringify(newIngs)
                                                    }
                                                  });
                                                }, 'delete')}
                                                className="opacity-0 group-hover/item:opacity-100 text-zinc-300 hover:text-red-500 transition-all"
                                              >
                                                <X size={12} />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ));
                                  })()}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-forest/80 backdrop-blur-md border-t border-white/10 px-6 py-4 flex items-center justify-around z-40">
        <button onClick={withFeedback(() => setView('dashboard'))} className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-sage' : 'text-white/40 hover:text-white'}`}>
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
        </button>
        <button onClick={withFeedback(() => {
          setSelectedLocationId(null);
          setView('inventory');
        })} className={`flex flex-col items-center gap-1 ${view === 'inventory' ? 'text-sage' : 'text-white/40 hover:text-white'}`}>
          <Package size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Pantry</span>
        </button>
        <button onClick={withFeedback(() => setView('shopping'))} className={`flex flex-col items-center gap-1 ${view === 'shopping' ? 'text-sage' : 'text-white/40 hover:text-white'}`}>
          <div className="relative">
            <ShoppingCart size={24} />
            {state.shoppingList.filter(i => !i.purchased).length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-sage text-forest text-[8px] flex items-center justify-center rounded-full font-bold">
                {state.shoppingList.filter(i => !i.purchased).length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">List</span>
        </button>
        <button onClick={withFeedback(() => setView('recipes'))} className={`flex flex-col items-center gap-1 ${view === 'recipes' ? 'text-sage' : 'text-white/40 hover:text-white'}`}>
          <ChefHat size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Cook</span>
        </button>
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {isScannerOpen && (
          <BarcodeScanner 
            onScan={handleScan} 
            onClose={() => setIsScannerOpen(false)} 
          />
        )}

        {isItemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => {
                setIsItemModalOpen(false);
                setModalItem(null);
                setManualBarcode('');
              }}
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-forest rounded-t-[20px] sm:rounded-[20px] p-8 overflow-y-auto max-h-[90vh] border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">
                  {modalItem?.id ? 'Edit Item' : modalContext === 'shopping' ? 'Add to List' : 'Add to Pantry'}
                </h3>
                <button onClick={() => {
                  setIsItemModalOpen(false);
                  setModalItem(null);
                  setManualBarcode('');
                }} className="text-white/20 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              {!modalItem?.id && (
                <div className="mb-6">
                  {isCameraAvailable ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsScannerOpen(true)}
                        className="w-full mb-4 flex items-center justify-center gap-2 bg-primary text-white p-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                      >
                        <Camera size={20} /> Scan Barcode
                      </button>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={manualBarcode}
                          onChange={(e) => setManualBarcode(e.target.value)}
                          placeholder="Or enter Barcode manually"
                          className="flex-1 p-3 rounded-xl border-2 border-zinc-200 focus:border-primary focus:outline-none bg-white text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (manualBarcode.trim()) {
                              // Play click sound using Web Audio API
                              try {
                                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                                const oscillator = audioCtx.createOscillator();
                                const gainNode = audioCtx.createGain();
                                oscillator.connect(gainNode);
                                gainNode.connect(audioCtx.destination);
                                oscillator.type = 'sine';
                                oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 800Hz beep
                                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                                oscillator.start();
                                oscillator.stop(audioCtx.currentTime + 0.1); // 100ms beep
                              } catch (e) {
                                console.error("Audio play failed", e);
                              }
                              handleScan(manualBarcode.trim());
                            }
                          }}
                          disabled={!manualBarcode.trim()}
                          className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center"
                        >
                          <Search size={20} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="bg-white p-4 rounded-xl border-2 border-zinc-200">
                      <p className="text-sm text-zinc-500 mb-4 text-center font-medium">
                        Camera access unavailable in this preview. Enter barcode manually to search.
                      </p>
                      <div className="flex flex-col gap-3">
                        <input
                          type="text"
                          value={manualBarcode}
                          onChange={(e) => setManualBarcode(e.target.value)}
                          placeholder="e.g. 0123456789"
                          className="w-full p-4 rounded-xl border-2 border-zinc-200 focus:border-primary focus:outline-none bg-off-white text-lg font-mono text-center tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (manualBarcode.trim()) {
                              // Play click sound using Web Audio API
                              try {
                                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                                const oscillator = audioCtx.createOscillator();
                                const gainNode = audioCtx.createGain();
                                oscillator.connect(gainNode);
                                gainNode.connect(audioCtx.destination);
                                oscillator.type = 'sine';
                                oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 800Hz beep
                                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                                oscillator.start();
                                oscillator.stop(audioCtx.currentTime + 0.1); // 100ms beep
                              } catch (e) {
                                console.error("Audio play failed", e);
                              }
                              handleScan(manualBarcode.trim());
                            }
                          }}
                          disabled={!manualBarcode.trim()}
                          className="w-full flex items-center justify-center gap-2 bg-primary text-white p-4 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-md shadow-primary/20 text-lg"
                        >
                          <Search size={24} /> Search Barcode
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const storageCategory = formData.get('storageCategory') as string;
                let shoppingCategory = formData.get('shoppingCategory') as string;
                
                if (!shoppingCategory || shoppingCategory === 'Other') {
                  shoppingCategory = storageCategory;
                }

                const categoryObj = CATEGORIES.find(c => c.name === storageCategory);
                const icon = categoryObj?.icon || '📦';
                const name = formData.get('name') as string;
                const quantity = parseFloat(formData.get('quantity') as string) || 0;
                const unit_type = formData.get('unitType') as string;

                if (modalContext === 'shopping') {
                  if (modalItem?.id && !modalItem.purchased) {
                    playClick();
                    dispatch({
                      type: 'UPDATE_SHOPPING_ITEM',
                      payload: {
                        id: modalItem.id,
                        name,
                        storageCategory,
                        shoppingCategory,
                        icon,
                        quantity,
                        unit_type,
                        store: formData.get('store')
                      }
                    });
                  } else {
                    playClick();
                    const existingItem = state.items.find(i => i.name.toLowerCase() === name.toLowerCase());
                    dispatch({
                      type: 'ADD_TO_SHOPPING',
                      payload: {
                        name,
                        storageCategory,
                        shoppingCategory,
                        icon,
                        quantity,
                        unit_type,
                        store: formData.get('store'),
                        item_id: modalItem?.id || existingItem?.id || null // Link to pantry item if adding from pantry or name matches
                      }
                    });
                  }
                } else {
                  const isAssigning = !!(modalItem?.id && modalItem.purchased);
                  const itemId = isAssigning ? modalItem.item_id : modalItem?.id;

                  dispatch({
                    type: itemId ? 'UPDATE_ITEM' : 'ADD_ITEM',
                    payload: {
                      id: itemId,
                      name,
                      storageCategory,
                      shoppingCategory,
                      icon,
                      quantity,
                      unit_type,
                      zone_id: formData.get('zoneId'),
                      expiry_date: formData.get('expiryDate'),
                      low_stock_threshold: parseFloat(formData.get('lowStockThreshold') as string) || 0
                    }
                  });
                  if (isAssigning) {
                    triggerHapticDelete();
                    playDelete();
                    playClick();
                    dispatch({ type: 'DELETE_SHOPPING_ITEM', payload: { id: modalItem.id } });
                  } else {
                    triggerHapticSuccess();
                    playSuccess();
                    playClick();
                  }
                }

                setIsItemModalOpen(false);
                setModalItem(null);
              }} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Item Name</label>
                    <AutocompleteInput 
                      name="name" 
                      required 
                      value={formItemName} 
                      placeholder="e.g. Whole Milk"
                      className="bg-white border border-primary/30" 
                      options={Array.from(new Map([...state.library, ...state.items].map(item => [item.name.toLowerCase(), item])).values())}
                      onSelect={(opt: any) => {
                        setFormItemName(opt.name);
                        setFormStorageCategory(opt.storageCategory || 'Other');
                        setFormShoppingCategory(opt.shoppingCategory || 'Other');
                        setFormUnitType(opt.unit_type || 'items');
                        if (opt.zone_id) setFormZoneId(opt.zone_id);
                        if (modalContext === 'shopping' && opt.store) {
                          const storeInput = document.querySelector('input[name="store"]') as HTMLInputElement;
                          if (storeInput) storeInput.value = opt.store;
                        }
                      }}
                      onChange={(e: any) => {
                        setFormItemName(e.target.value);
                        const cats = lookupCategories(e.target.value);
                        if (cats) {
                          setFormStorageCategory(cats.storage);
                          setFormShoppingCategory(cats.shopping);
                          setFormUnitType(cats.unit_type);
                          if (cats.zone_id) setFormZoneId(cats.zone_id);
                          // Auto-populate store if in shopping context
                          if (modalContext === 'shopping' && cats.store) {
                            const storeInput = document.querySelector('input[name="store"]') as HTMLInputElement;
                            if (storeInput && !storeInput.value) {
                              storeInput.value = cats.store;
                            }
                          }

                          // SMART FEEDBACK
                          if ((cats as any).isLearned) {
                            playSparkle();
                            setIsAutoCategorizing(true);
                            setTimeout(() => setIsAutoCategorizing(false), 800);
                          } else if ((cats as any).isAuto) {
                            playBlip();
                            setIsAutoCategorizing(true);
                            setTimeout(() => setIsAutoCategorizing(false), 800);
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Category</label>
                    <Combobox
                      name="storageCategory"
                      value={formStorageCategory}
                      onChange={(val: any) => {
                        setFormStorageCategory(val);
                        setFormShoppingCategory(val); // Map to both
                        setHasManuallySelectedCategory(true);
                        playClick(); // Mechanical click for manual change
                        
                        // Save to User Preference Memory
                        if (formItemName.trim()) {
                          const mapping = JSON.parse(localStorage.getItem('userCategoryMapping') || '{}');
                          mapping[formItemName.toLowerCase().trim()] = val;
                          localStorage.setItem('userCategoryMapping', JSON.stringify(mapping));
                        }
                      }}
                      options={CATEGORIES.map(c => ({ label: `${c.icon} ${c.name}`, value: c.name }))}
                      placeholder="Select Category"
                      className={isAutoCategorizing ? 'animate-pulse ring-2 ring-primary border-primary bg-primary/5' : ''}
                    />
                    {/* Hidden input to ensure shoppingCategory is submitted */}
                    <input type="hidden" name="shoppingCategory" value={formShoppingCategory} />
                  </div>

                  {modalContext === 'shopping' && (
                    <div className="col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Store (Optional)</label>
                      <VoiceInput name="store" placeholder="e.g. Tesco" defaultValue={modalItem?.store || ''} className="bg-white border border-primary/30" />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Quantity</label>
                    <input name="quantity" type="number" step="0.1" defaultValue={modalItem?.quantity || 1} required className="w-full px-4 py-3 bg-white rounded-[20px] border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Unit Type</label>
                    <Combobox
                      name="unitType"
                      value={formUnitType}
                      onChange={setFormUnitType}
                      options={[
                        { label: 'Items (pcs)', value: 'items' },
                        { label: 'Grams (g)', value: 'g' },
                        { label: 'Kilograms (kg)', value: 'kg' },
                        { label: 'Milliliters (ml)', value: 'ml' },
                        { label: 'Liters (L)', value: 'L' },
                        { label: 'Ounces (oz)', value: 'oz' },
                        { label: 'Pounds (lb)', value: 'lb' },
                        { label: 'Cups', value: 'cups' },
                        { label: 'Tbsp', value: 'tbsp' },
                        { label: 'Tsp', value: 'tsp' }
                      ]}
                      placeholder="Select Unit"
                    />
                  </div>

                  {modalContext === 'pantry' && (
                    <>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Low Stock Alert</label>
                        <input name="lowStockThreshold" type="number" step="0.1" defaultValue={modalItem?.low_stock_threshold || 0} className="w-full px-4 py-3 bg-white rounded-[20px] border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Storage Zone</label>
                        <select 
                          name="zoneId" 
                          required 
                          value={formZoneId}
                          onChange={(e) => setFormZoneId(e.target.value)}
                          className="w-full px-4 py-3 bg-white rounded-[20px] border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="" disabled>Select a zone...</option>
                          {state.zones.map(z => {
                            const loc = state.locations.find(l => l.id === z.location_id);
                            return (
                              <option key={z.id} value={z.id}>
                                {loc ? loc.name : 'Unknown Location'} - {z.name}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Expiry Date</label>
                        <input name="expiryDate" type="date" defaultValue={modalItem?.expiry_date || ''} className="w-full px-4 py-3 bg-white rounded-[20px] border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-4 pt-4">
                  <div className="flex gap-4">
                    <Button variant="secondary" className="flex-1" onClick={() => {
                      setIsItemModalOpen(false);
                      setModalItem(null);
                    }}>Cancel</Button>
                    <Button type="submit" variant="primary" className="flex-1">
                      {modalItem?.id && !modalItem.purchased ? 'Save Changes' : modalContext === 'shopping' ? 'Add to List' : 'Add to Pantry'}
                    </Button>
                  </div>
                  {modalItem?.id && (
                    <button 
                      type="button"
                      onClick={() => {
                        if (modalContext === 'shopping') {
                          dispatch({ type: 'DELETE_SHOPPING_ITEM', payload: { id: modalItem.id } });
                        } else {
                          dispatch({ type: 'DELETE_ITEM', payload: { id: modalItem.id } });
                        }
                        setIsItemModalOpen(false);
                        setModalItem(null);
                      }}
                      className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center justify-center gap-2 mt-2"
                    >
                      <Trash2 size={16} /> {modalContext === 'shopping' ? 'Remove from List' : 'Delete Item'}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isAddingLocation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => {
                setIsAddingLocation(false);
                setEditingLocation(null);
              }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} 
              className="relative w-full max-w-sm bg-off-white rounded-[20px] p-8 shadow-xl"
            >
              <h3 className="text-2xl font-serif font-bold text-charcoal mb-6">
                {editingLocation ? `Manage ${editingLocation.name}` : 'New Storage Unit'}
              </h3>
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const name = formLocationName;
                const icon = formLocationIcon;

                if (editingLocation) {
                  dispatch({ 
                    type: 'UPDATE_LOCATION', 
                    payload: { id: editingLocation.id, name, icon } 
                  });
                } else {
                  dispatch({ 
                    type: 'ADD_LOCATION', 
                    payload: { name, icon } 
                  });
                }
                setIsAddingLocation(false);
                setEditingLocation(null);
              }} className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 block">Unit Name</label>
                  <VoiceInput 
                    name="name" 
                    required 
                    value={formLocationName}
                    onChange={(e: any) => {
                      const newName = e.target.value;
                      setFormLocationName(newName);
                      if (!editingLocation) {
                        setFormLocationIcon(suggestIconByName(newName));
                      }
                    }}
                    disabled={editingLocation?.name === '🛍️ Shopping Bags' || editingLocation?.name === 'Shopping Bags'}
                    placeholder="e.g. Kitchen Fridge" 
                    className={`bg-white border border-primary/30 ${(editingLocation?.name === '🛍️ Shopping Bags' || editingLocation?.name === 'Shopping Bags') ? 'opacity-50 cursor-not-allowed' : ''}`} 
                  />
                  {(editingLocation?.name === '🛍️ Shopping Bags' || editingLocation?.name === 'Shopping Bags') && (
                    <p className="text-[10px] text-zinc-400 mt-1 italic">Core system unit cannot be renamed.</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 block">Select Icon</label>
                  <div className="grid grid-cols-5 gap-2">
                    {OFFICIAL_ICONS.map((item) => (
                      <label key={item.icon} className={`cursor-pointer group ${(editingLocation?.name === '🛍️ Shopping Bags' || editingLocation?.name === 'Shopping Bags') && item.icon !== '🛍️' ? 'opacity-30 pointer-events-none' : ''}`}>
                        <input 
                          type="radio" 
                          name="icon" 
                          value={item.icon} 
                          checked={formLocationIcon === item.icon}
                          onChange={() => setFormLocationIcon(item.icon)}
                          className="sr-only peer"
                        />
                        <div className="w-full aspect-square flex items-center justify-center text-xl rounded-xl bg-white border border-zinc-100 peer-checked:border-primary peer-checked:bg-primary/5 group-hover:bg-zinc-50 transition-all">
                          {item.icon}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    className="flex-1" 
                    onClick={() => {
                      setIsAddingLocation(false);
                      setEditingLocation(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1">
                    {editingLocation ? 'Save Changes' : 'Create Unit'}
                  </Button>
                </div>

                {editingLocation && (editingLocation.name !== '🛍️ Shopping Bags' && editingLocation.name !== 'Shopping Bags') && (
                  <div className="pt-4 border-t border-zinc-100 flex justify-center">
                    <button
                      type="button"
                      onClick={withFeedback(() => {
                        if (window.confirm('Are you sure? This will move all items in this unit to "Other".')) {
                          dispatch({ type: 'DELETE_LOCATION', payload: { id: editingLocation.id } });
                          setIsAddingLocation(false);
                          setEditingLocation(null);
                        }
                      }, 'delete')}
                      className="text-red-400 hover:text-red-600 text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Delete Unit
                    </button>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}

        {isAddingZone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddingZone(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-white rounded-3xl p-8">
              <h3 className="text-xl font-bold mb-6">New Storage Zone</h3>
              <form onSubmit={(e: any) => {
                e.preventDefault();
                dispatch({ type: 'ADD_ZONE', payload: { name: e.target.name.value, locationId: selectedLocationId } });
                setIsAddingZone(false);
              }} className="space-y-4">
                <VoiceInput name="name" required placeholder="e.g. Top Shelf" className="bg-zinc-100 border-none" />
                <Button type="submit" className="w-full">Create Zone</Button>
              </form>
            </motion.div>
          </div>
        )}

        {transferItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setTransferItem(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-white rounded-3xl p-8">
              <h3 className="text-xl font-bold mb-2">Transfer {transferItem.name}</h3>
              <p className="text-sm text-zinc-500 mb-6">Select target storage zone.</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {state.zones.map(z => (
                  <button 
                    key={z.id}
                    onClick={() => {
                      dispatch({ type: 'TRANSFER_ITEM', payload: { item_id: transferItem.id, target_zone_id: z.id } });
                      setTransferItem(null);
                    }}
                    className="w-full p-4 text-left bg-zinc-50 rounded-xl hover:bg-black hover:text-white transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{state.locations.find(l => l.id === z.location_id)?.icon}</span>
                      <div>
                        <div className="font-bold text-sm">{z.name}</div>
                        <div className="text-[10px] uppercase tracking-wider opacity-60">
                          {state.locations.find(l => l.id === z.location_id)?.name.replace(/^[^\w\s]+/, '').trim()}
                        </div>
                      </div>
                    </div>
                    <ArrowRightLeft size={14} className="opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
              <Button variant="secondary" className="w-full mt-6" onClick={() => setTransferItem(null)}>Cancel</Button>
            </motion.div>
          </div>
        )}

        {isAutoSortReviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsAutoSortReviewOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-2xl">✨</div>
                <div>
                  <h3 className="text-xl font-bold text-charcoal">Magic Sort Review</h3>
                  <p className="text-sm text-zinc-500">Ready to organize your shopping bag?</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {(Object.entries(autoSortPlan) as [string, string[]][]).map(([locationId, itemIds]) => {
                  const loc = state.locations.find(l => l.id === locationId);
                  return (
                    <div key={locationId} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{loc?.icon}</span>
                        <span className="font-bold text-charcoal">{loc?.name}</span>
                      </div>
                      <Badge color="green">{itemIds.length} items</Badge>
                    </div>
                  );
                })}
                {(() => {
                  const itemsInBag = state.items.filter(i => {
                    const zone = state.zones.find(z => z.id === i.zone_id);
                    return zone?.location_id === selectedLocationId;
                  });
                  const movedCount = (Object.values(autoSortPlan) as string[][]).flat().length;
                  const remainingCount = itemsInBag.length - movedCount;
                  
                  if (remainingCount > 0) {
                    return (
                      <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📦</span>
                          <span className="font-bold text-amber-700">Stay in Bag</span>
                        </div>
                        <Badge color="amber">{remainingCount} items</Badge>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsAutoSortReviewOpen(false)}>Cancel</Button>
                <Button className="flex-1 bg-secondary text-white shadow-lg shadow-secondary/20" onClick={handleConfirmAutoSort}>
                  Confirm Sort
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {isHouseholdSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsHouseholdSettingsOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-forest rounded-[32px] p-8 shadow-2xl border border-white/10 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-sage/10 rounded-2xl flex items-center justify-center text-sage">
                    <Home size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Household Settings</h3>
                    <p className="text-sm text-sage/40">Manage your shared space</p>
                  </div>
                </div>
                <button onClick={() => setIsHouseholdSettingsOpen(false)} className="text-white/20 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <Card className="p-6 bg-zinc-50 border-none shadow-none">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 block">Household Name</label>
                  <div className="flex gap-2">
                    <input 
                      defaultValue={household?.name}
                      onBlur={async (e) => {
                        if (household && e.target.value !== household.name) {
                          await fetch(`/api/households/${household.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: e.target.value })
                          });
                          fetchHousehold(household.id);
                        }
                      }}
                      className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-lg p-0"
                    />
                    <Pencil size={16} className="text-zinc-300" />
                  </div>
                </Card>

                <Card className="p-6 bg-white border-zinc-100">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Invite Code</label>
                    <button 
                      onClick={() => {
                        if (household) {
                          navigator.clipboard.writeText(household.invite_code);
                          triggerHapticSuccess();
                          playSuccess();
                        }
                      }}
                      className="text-secondary hover:opacity-80 flex items-center gap-1 text-xs font-bold uppercase tracking-widest"
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                  </div>
                  <div className="text-3xl font-mono font-bold tracking-widest text-sage mb-6 text-center bg-white/5 py-4 rounded-2xl border border-dashed border-white/10">
                    {household?.invite_code}
                  </div>
                  
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                      <QRCodeCanvas 
                        value={household?.invite_code || ''} 
                        size={160}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-xs text-zinc-400 text-center px-8">
                      Share this code or QR with your household members to sync your pantry automatically.
                    </p>
                  </div>
                </Card>

                <div className="pt-4">
                  <Button variant="outline" className="w-full" onClick={() => setIsHouseholdSettingsOpen(false)}>
                    Close Settings
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showUndoToast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] pointer-events-none w-full max-w-md px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-charcoal text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-4 justify-between border border-white/10 backdrop-blur-md pointer-events-auto"
            >
              <span className="text-sm font-medium">Item removed.</span>
              <button 
                onClick={withFeedback(handleUndoDelete, 'success')}
                className="text-sage font-bold text-sm uppercase tracking-widest hover:opacity-80 transition-all"
              >
                Undo
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
