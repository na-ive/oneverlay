import { Group, Rect, Text } from 'react-konva';
import type { BrowserElement } from '../../types/elements';

interface BrowserElementNodeProps {
  element: BrowserElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const BrowserElementNode = ({ element, x, y, width, height }: BrowserElementNodeProps) => {
  const hasUrl = !!element.url && element.url !== 'about:blank';

  if (hasUrl) {
    return (
      <Group x={x} y={y}>
        <Rect
          width={width}
          height={height}
          fill="rgba(0,0,0,0.01)" // Clickable area
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth={1}
          dash={[4, 4]}
          cornerRadius={4}
        />
      </Group>
    );
  }

  // Truncate URL for display
  const displayUrl =
    element.url && element.url.length > 40 ? element.url.substring(0, 40) + '…' : 'about:blank';

  return (
    <Group x={x} y={y}>
      {/* Background */}
      <Rect
        width={width}
        height={height}
        fill="#16213e"
        stroke="#2a3a4a"
        strokeWidth={1}
        cornerRadius={4}
      />

      {/* Browser chrome bar */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={28}
        fill="#1a1a2e"
        cornerRadius={[4, 4, 0, 0]}
      />

      {/* URL bar indicator */}
      <Rect
        x={8}
        y={6}
        width={width - 16}
        height={16}
        fill="#0d1117"
        cornerRadius={3}
      />

      {/* URL text */}
      <Text
        x={14}
        y={9}
        text={displayUrl}
        fontSize={9}
        fill="#5a6475"
        width={width - 28}
        ellipsis={true}
        wrap="none"
      />

      {/* Globe icon text */}
      <Text
        text="🌐 Empty Browser Source"
        fontSize={14}
        fill="#5a6475"
        width={width}
        height={height - 28}
        y={28}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
};
