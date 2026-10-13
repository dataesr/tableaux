import { useEffect, useMemo, useRef } from "react";

interface YearRangeSliderProps {
    end: number;
    hint?: string;
    id: string;
    label: string;
    max: number;
    messageBuilder?: (start: number, end: number) => string;
    min: number;
    onChange: (start: number, end: number) => void;
    start: number;
    valuePrefix?: string;
    yearLabels?: Record<number, string>;
}

export default function YearRangeSlider({
    end,
    hint,
    id,
    label,
    max,
    messageBuilder,
    min,
    onChange,
    start,
    valuePrefix = "",
    yearLabels,
}: YearRangeSliderProps) {
    const rangeRef = useRef<HTMLDivElement>(null);

    const labelId = `${id}-label`;
    const messagesId = `${id}-messages`;
    const startId = `${id}-start`;
    const endId = `${id}-end`;

    const startLabel = yearLabels?.[start] ?? String(start);
    const endLabel = yearLabels?.[end] ?? String(end);

    useEffect(() => {
        const node = rangeRef.current;
        if (!node) return;
        const range = max - min || 1;
        const isSm = node.classList.contains("fr-range--sm");
        const thumb = isSm ? 16 : 24; // px
        const width = node.getBoundingClientRect().width || 1;
        const usable = Math.max(width - thumb, 1);
        const left = ((start - min) / range) * usable + thumb / 2;
        const right = ((end - min) / range) * usable + thumb / 2;
        node.style.setProperty("--progress-left", `${(left / width) * 100}%`);
        node.style.setProperty("--progress-right", `${(right / width) * 100}%`);
    }, [start, end, min, max]);

    const message = useMemo(() => {
        if (messageBuilder) return messageBuilder(start, end);
        return yearLabels
            ? `Période active : ${startLabel} → ${endLabel}`
            : `${startLabel} – ${endLabel}`;
    }, [messageBuilder, start, end, startLabel, endLabel, yearLabels]);

    return (
        <div className="fr-range-group" id={id}>
            <label className="fr-label" id={labelId} htmlFor={startId}>
                {label}
                {hint && <span className="fr-hint-text">{hint}</span>}
            </label>
            <div
                ref={rangeRef}
                aria-labelledby={labelId}
                className="fr-range fr-range--double fr-range--sm"
                data-fr-prefix={valuePrefix}
                role="group"
            >
                <span className="fr-range__output" aria-hidden="true">
                    {`${valuePrefix}${start} - ${valuePrefix}${end}`}
                </span>
                <input
                    aria-label={`${label} : début`}
                    aria-valuetext={startLabel}
                    id={startId}
                    max={max}
                    min={min}
                    name={startId}
                    onChange={(event) => {
                        const value = Math.min(Number(event.target.value), end);
                        if (value !== start) onChange(value, end);
                    }}
                    step={1}
                    type="range"
                    value={start}
                />
                <input
                    aria-label={`${label} : fin`}
                    aria-valuetext={endLabel}
                    id={endId}
                    max={max}
                    min={min}
                    name={endId}
                    onChange={(event) => {
                        const value = Math.max(Number(event.target.value), start);
                        if (value !== end) onChange(start, value);
                    }}
                    step={1}
                    type="range"
                    value={end}
                />
                <span className="fr-range__min" aria-hidden="true">
                    {`${valuePrefix}${min}`}
                </span>
                <span className="fr-range__max" aria-hidden="true">
                    {`${valuePrefix}${max}`}
                </span>
            </div>
            <div className="fr-messages-group" id={messagesId} aria-live="polite">
                <p className="fr-message">{message}</p>
            </div>
        </div>
    );
}
