import React, { forwardRef } from 'react';

interface PreviewProps {
  playing?: boolean;
  onTimeUpdate?: (time: number) => void;
}

const Preview = forwardRef<HTMLDivElement, PreviewProps>(({
  playing = false,
  onTimeUpdate
}, ref) => {
  return (
    <div ref={ref}>
      <p>Preview {playing ? 'Playing' : 'Paused'}</p>
    </div>
  );
});

Preview.displayName = 'Preview';

export default Preview;
