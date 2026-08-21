/* eslint-disable react/prop-types */
import { useCallback, useRef, useState } from "react";
import "./game-panel.css";

export const RISK_LOW_MEDIUM_HIGH = [
  { value: "Low", label: "Low", shortLabel: "Low", tone: "low" },
  { value: "Medium", label: "Medium", shortLabel: "Med", tone: "medium" },
  { value: "High", label: "High", shortLabel: "High", tone: "high" },
];

export const PLINKO_RISK_OPTIONS = [
  { value: "Easy", label: "Easy", shortLabel: "Easy", tone: "low" },
  { value: "Medium", label: "Medium", shortLabel: "Med", tone: "medium" },
  { value: "Hard", label: "Hard", shortLabel: "Hard", tone: "high" },
  { value: "Expert", label: "Expert", shortLabel: "Exp", tone: "high" },
];

export const DIFFICULTY_LOW_MEDIUM_HIGH = [
  { value: "low", label: "Low", shortLabel: "Low", tone: "low" },
  { value: "medium", label: "Medium", shortLabel: "Med", tone: "medium" },
  { value: "high", label: "High", shortLabel: "High", tone: "high" },
];

export const KENO_RISK_OPTIONS = [
  { value: "Classic", label: "Classic", shortLabel: "Cls", tone: "neutral" },
  { value: "Low", label: "Low", shortLabel: "Low", tone: "low" },
  { value: "Medium", label: "Medium", shortLabel: "Med", tone: "medium" },
  { value: "High", label: "High", shortLabel: "High", tone: "high" },
];

export const TOWER_DIFFICULTY_OPTIONS = [
  { value: "Easy", label: "Easy", shortLabel: "Easy", tone: "low" },
  { value: "Medium", label: "Medium", shortLabel: "Med", tone: "medium" },
  { value: "Hard", label: "Hard", shortLabel: "Hard", tone: "high" },
  { value: "Extreme", label: "Extreme", shortLabel: "Extr", tone: "high" },
  {
    value: "Nightmare",
    label: "Nightmare",
    shortLabel: "Night",
    tone: "high",
  },
];

export const GameAutoModeSwitch = ({ enabled, disabled, onToggle }) => (
  <button
    type="button"
    role="switch"
    aria-checked={enabled}
    aria-label="Auto bet mode"
    disabled={disabled}
    onClick={onToggle}
    className={`game-auto-switch ${
      enabled ? "game-auto-switch--on" : "game-auto-switch--off"
    }${disabled ? " game-auto-switch--disabled" : ""}`}
  >
    <span className="game-auto-switch__knob" />
  </button>
);

export const GameSegmentBar = ({
  options,
  value,
  disabled,
  onChange,
  ariaLabel = "Risk level",
  draggable = false,
}) => {
  const compact = options.length > 3;
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const dragMovedRef = useRef(false);

  const pickValueFromClientX = useCallback(
    (clientX) => {
      const track = trackRef.current;
      if (!track || !options.length) return null;

      const rect = track.getBoundingClientRect();
      if (!rect.width) return null;

      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const index = Math.min(
        options.length - 1,
        Math.max(0, Math.floor(ratio * options.length))
      );
      return options[index].value;
    },
    [options]
  );

  const applyDragValue = useCallback(
    (clientX) => {
      if (disabled) return;
      const next = pickValueFromClientX(clientX);
      if (next != null && next !== value) {
        onChange(next);
      }
    },
    [disabled, onChange, pickValueFromClientX, value]
  );

  const handlePointerDown = (event) => {
    if (disabled || !draggable) return;
    dragMovedRef.current = false;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    applyDragValue(event.clientX);
  };

  const handlePointerMove = (event) => {
    if (!dragging || disabled || !draggable) return;
    dragMovedRef.current = true;
    applyDragValue(event.clientX);
  };

  const handlePointerUp = (event) => {
    if (!dragging) return;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      ref={trackRef}
      className={`game-segment-bar${compact ? " game-segment-bar--compact" : ""}${
        draggable ? " game-segment-bar--draggable" : ""
      }${dragging ? " game-segment-bar--dragging" : ""}${
        disabled ? " game-segment-bar--disabled" : ""
      }`}
      role="radiogroup"
      aria-label={ariaLabel}
      onPointerDownCapture={draggable ? handlePointerDown : undefined}
      onPointerMove={draggable ? handlePointerMove : undefined}
      onPointerUp={draggable ? handlePointerUp : undefined}
      onPointerCancel={draggable ? handlePointerUp : undefined}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => {
              if (draggable && dragMovedRef.current) return;
              onChange(option.value);
            }}
            className={`game-segment-bar__option game-segment-bar__option--${option.tone}${
              active ? " game-segment-bar__option--active" : ""
            }`}
          >
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sm:hidden">{option.shortLabel ?? option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export const GameLabeledSegmentRow = ({
  label,
  options,
  value,
  onChange,
  disabled = false,
  className = "",
  ariaLabel,
  draggable = false,
}) => (
  <div className={`mb-2 mt-1 w-full ${className}`.trim()}>
    <div className="mb-1.5 pl-[2px] text-[11px] font-semibold uppercase tracking-wide text-label">
      {label}
    </div>
    <GameSegmentBar
      options={options}
      value={value}
      disabled={disabled}
      onChange={onChange}
      ariaLabel={ariaLabel ?? label}
      draggable={draggable}
    />
  </div>
);

export const GameValueSlider = ({
  min,
  max,
  value,
  onChange,
  disabled = false,
  ariaLabel,
  step = 1,
}) => {
  const safeMin = Number(min);
  const safeMax = Number(max);
  const numericValue = Number(value);
  const span = safeMax - safeMin || 1;
  const percent = ((numericValue - safeMin) / span) * 100;

  return (
    <input
      type="range"
      min={safeMin}
      max={safeMax}
      step={step}
      value={numericValue}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-valuemin={safeMin}
      aria-valuemax={safeMax}
      aria-valuenow={numericValue}
      onChange={(event) => onChange(Number(event.target.value))}
      className="game-value-slider"
      style={{
        background: `linear-gradient(to right, #00d4aa ${percent}%, rgb(47 69 83) ${percent}%)`,
      }}
    />
  );
};

export const GameLabeledSliderRow = ({
  label,
  min,
  max,
  value,
  onChange,
  disabled = false,
  className = "",
  ariaLabel,
  step = 1,
}) => (
  <div className={`game-labeled-slider-row ${className}`.trim()}>
    <span className="game-labeled-slider-row__label">{label}</span>
    <GameValueSlider
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      disabled={disabled}
      ariaLabel={ariaLabel ?? label}
    />
    <span className="game-labeled-slider-row__value">{value}</span>
  </div>
);

export const GameDifficultySelectRow = ({
  label = "Difficulty",
  options,
  value,
  onChange,
  disabled = false,
  className = "",
  ariaLabel,
}) => (
  <div className={`mb-3 mt-1 w-full ${className}`.trim()}>
    <div className="mb-1.5 pl-[2px] text-[11px] font-semibold uppercase tracking-wide text-label">
      {label}
    </div>
    <select
      value={value}
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      onChange={(event) => onChange(event.target.value)}
      className="game-difficulty-select w-full"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export const GameDifficultyDropdownRow = ({
  label = "Difficulty",
  options,
  value,
  onChange,
  segmentDisabled = false,
  betMode,
  setBetMode,
  modeSwitchDisabled = false,
  onModeSwitch,
  className = "",
  ariaLabel,
}) => {
  const isAuto = betMode === "auto";

  const toggleAutoMode = () => {
    if (modeSwitchDisabled) return;
    const next = isAuto ? "manual" : "auto";
    if (onModeSwitch) {
      onModeSwitch(next);
      return;
    }
    setBetMode(next);
  };

  return (
    <div className={`order-1 mb-3 mt-1 w-full ${className}`.trim()}>
      <div className="mb-1.5 pl-[2px] text-[11px] font-semibold uppercase tracking-wide text-label">
        {label}
      </div>
      <div className="flex items-center gap-2.5">
        <select
          value={value}
          disabled={segmentDisabled}
          aria-label={ariaLabel ?? label}
          onChange={(event) => onChange(event.target.value)}
          className="game-difficulty-select"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex shrink-0 flex-col items-center gap-1">
          <span
            className={`game-auto-switch-label ${
              isAuto ? "game-auto-switch-label--on" : "game-auto-switch-label--off"
            }`}
          >
            Auto
          </span>
          <GameAutoModeSwitch
            enabled={isAuto}
            disabled={modeSwitchDisabled}
            onToggle={toggleAutoMode}
          />
        </div>
      </div>
    </div>
  );
};

export const GameRiskAutoRow = ({
  label = "Risk",
  options,
  value,
  onChange,
  segmentDisabled = false,
  betMode,
  setBetMode,
  modeSwitchDisabled = false,
  onModeSwitch,
  className = "",
  ariaLabel,
}) => {
  const isAuto = betMode === "auto";

  const toggleAutoMode = () => {
    if (modeSwitchDisabled) return;
    const next = isAuto ? "manual" : "auto";
    if (onModeSwitch) {
      onModeSwitch(next);
      return;
    }
    setBetMode(next);
  };

  return (
    <div className={`order-1 mb-3 mt-1 w-full ${className}`.trim()}>
      <div className="mb-1.5 pl-[2px] text-[11px] font-semibold uppercase tracking-wide text-label">
        {label}
      </div>
      <div className="flex items-center gap-2.5">
        <GameSegmentBar
          options={options}
          value={value}
          disabled={segmentDisabled}
          onChange={onChange}
          ariaLabel={ariaLabel ?? `${label} level`}
        />

        <div className="flex shrink-0 flex-col items-center gap-1">
          <span
            className={`game-auto-switch-label ${
              isAuto ? "game-auto-switch-label--on" : "game-auto-switch-label--off"
            }`}
          >
            Auto
          </span>
          <GameAutoModeSwitch
            enabled={isAuto}
            disabled={modeSwitchDisabled}
            onToggle={toggleAutoMode}
          />
        </div>
      </div>
    </div>
  );
};

export const GameAutoModeRow = ({
  betMode,
  setBetMode,
  modeSwitchDisabled = false,
  onModeSwitch,
  className = "",
}) => {
  const isAuto = betMode === "auto";

  const toggleAutoMode = () => {
    if (modeSwitchDisabled) return;
    const next = isAuto ? "manual" : "auto";
    if (onModeSwitch) {
      onModeSwitch(next);
      return;
    }
    setBetMode(next);
  };

  return (
    <div
      className={`order-1 mb-3 mt-1 flex items-center justify-end gap-2 ${className}`.trim()}
    >
      <span
        className={`game-auto-switch-label ${
          isAuto ? "game-auto-switch-label--on" : "game-auto-switch-label--off"
        }`}
      >
        Auto
      </span>
      <GameAutoModeSwitch
        enabled={isAuto}
        disabled={modeSwitchDisabled}
        onToggle={toggleAutoMode}
      />
    </div>
  );
};
