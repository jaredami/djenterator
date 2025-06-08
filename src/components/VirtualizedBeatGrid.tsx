import { FC, memo, useCallback, useMemo, useState, useEffect } from 'react';

interface VirtualizedBeatGridProps {
  activations: {
    [key: string]: boolean[];
  };
  currentBeat: number;
  toggleBeat: (instrument: string, beat: number) => void;
  totalNumberOfBeats: number;
}

const BEAT_WIDTH = 14; // Match the CSS width
const VISIBLE_BEATS = 64; // Number of beats to render at once
const SCROLL_THRESHOLD = 16; // Start scrolling when within this many beats of the edge

const VirtualizedBeatGrid: FC<VirtualizedBeatGridProps> = memo(({
  activations,
  currentBeat,
  toggleBeat,
  totalNumberOfBeats,
}) => {
  const [scrollOffset, setScrollOffset] = useState(0);

  // Auto-scroll to follow the current beat
  useEffect(() => {
    const currentBeatPosition = currentBeat * (BEAT_WIDTH + 4); // Include gap
    const viewportStart = scrollOffset;
    const viewportEnd = scrollOffset + (VISIBLE_BEATS * (BEAT_WIDTH + 4));

    // Check if we need to scroll to keep current beat visible
    if (currentBeatPosition < viewportStart + (SCROLL_THRESHOLD * (BEAT_WIDTH + 4))) {
      setScrollOffset(Math.max(0, currentBeatPosition - (SCROLL_THRESHOLD * (BEAT_WIDTH + 4))));
    } else if (currentBeatPosition > viewportEnd - (SCROLL_THRESHOLD * (BEAT_WIDTH + 4))) {
      setScrollOffset(Math.min(
        (totalNumberOfBeats - VISIBLE_BEATS) * (BEAT_WIDTH + 4),
        currentBeatPosition - (VISIBLE_BEATS - SCROLL_THRESHOLD) * (BEAT_WIDTH + 4)
      ));
    }
  }, [currentBeat, scrollOffset, totalNumberOfBeats]);

  // Calculate which beats to render
  const { startBeat, endBeat, visibleBeats } = useMemo(() => {
    const start = Math.floor(scrollOffset / (BEAT_WIDTH + 4));
    const end = Math.min(start + VISIBLE_BEATS, totalNumberOfBeats);
    const visible = end - start;

    return {
      startBeat: start,
      endBeat: end,
      visibleBeats: visible
    };
  }, [scrollOffset, totalNumberOfBeats]);

  // Memoize the toggle function
  const memoizedToggleBeat = useCallback((instrument: string, beat: number) => {
    toggleBeat(instrument, beat);
  }, [toggleBeat]);

  const handleScroll = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const newOffset = Math.max(
      0,
      Math.min(
        (totalNumberOfBeats - VISIBLE_BEATS) * (BEAT_WIDTH + 4),
        scrollOffset + e.deltaX
      )
    );
    setScrollOffset(newOffset);
  }, [scrollOffset, totalNumberOfBeats]);

  const instruments = Object.keys(activations);

  // Create grid template columns string to match the regular grid
  const gridColumnString = [
    'auto', // For the label column
    ...Array(visibleBeats).fill('1fr'), // For the beat columns
  ].join(' ');

  return (
    <div className="virtualized-container" style={{ position: 'relative' }}>
      <div
        className="grid"
        onWheel={handleScroll}
        style={{
          gridTemplateColumns: gridColumnString,
          overflowX: 'hidden',
          position: 'relative'
        }}
      >
        {instruments.map((instrument, instrumentIndex) => (
          <div key={instrument} className="instrument-row">
            {/* Instrument label */}
            <div className="label">
              {instrument.toUpperCase()}
            </div>

            {/* Visible beats for this instrument */}
            {Array.from({ length: visibleBeats }, (_, index) => {
              const beatIndex = startBeat + index;
              const isActive = activations[instrument][beatIndex];
              const isCurrent = beatIndex + 1 === currentBeat;

              return (
                <div
                  key={beatIndex}
                  className={`beat ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
                  onClick={() => memoizedToggleBeat(instrument, beatIndex)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div
        className="scroll-indicator"
        style={{
          position: 'absolute',
          bottom: '-20px',
          left: '104px', // Align with the beat columns (label width + gap)
          right: '0',
          height: '4px',
          backgroundColor: '#352f2f',
          borderRadius: '2px',
          margin: '0 4px'
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: '#a8e6cf',
            borderRadius: '2px',
            width: `${Math.min(100, (visibleBeats / totalNumberOfBeats) * 100)}%`,
            marginLeft: `${(startBeat / totalNumberOfBeats) * 100}%`,
            transition: 'all 0.1s ease'
          }}
        />
      </div>

      {/* Navigation hints */}
      <div
        style={{
          position: 'absolute',
          bottom: '-40px',
          left: '104px',
          color: '#f5f5f5',
          fontSize: '12px',
          opacity: 0.7
        }}
      >
        Scroll horizontally to navigate • Showing beats {startBeat + 1}-{startBeat + visibleBeats} of {totalNumberOfBeats}
      </div>
    </div>
  );
});

VirtualizedBeatGrid.displayName = 'VirtualizedBeatGrid';

export default VirtualizedBeatGrid;