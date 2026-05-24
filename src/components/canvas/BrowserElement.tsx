import { forwardRef } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { BrowserElement } from '../../types/elements';

interface BrowserElementNodeProps {
  element: BrowserElement;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  draggable: boolean;
  onClick: () => void;
  onTap: () => void;
  onDragStart: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDblClick: () => void;
  onDblTap: () => void;
}

export const BrowserElementNode = forwardRef<Konva.Group, BrowserElementNodeProps>(
  ({ element, ...props }, ref) => {
    // Truncate URL for display
    const displayUrl =
      element.url.length > 40 ? element.url.substring(0, 40) + '…' : element.url;

    return (
      <Group ref={ref} {...props}>
        {/* Background */}
        <Rect
          width={element.width}
          height={element.height}
          fill="#16213e"
          stroke="#2a3a4a"
          strokeWidth={1}
          cornerRadius={4}
        />

        {/* Browser chrome bar */}
        <Rect
          x={0}
          y={0}
          width={element.width}
          height={28}
          fill="#1a1a2e"
          cornerRadius={[4, 4, 0, 0]}
        />

        {/* URL bar indicator */}
        <Rect
          x={8}
          y={6}
          width={element.width - 16}
          height={16}
          fill="#0d1117"
          cornerRadius={3}
        />

        {/* URL text */}
        <Text
          x={14}
          y={9}
          text={displayUrl || 'about:blank'}
          fontSize={9}
          fill="#5a6475"
          width={element.width - 28}
          ellipsis={true}
          wrap="none"
        />

        {/* Globe icon text */}
        <Text
          text="🌐 Browser Source"
          fontSize={14}
          fill="#5a6475"
          width={element.width}
          height={element.height - 28}
          y={28}
          align="center"
          verticalAlign="middle"
        />
      </Group>
    );
  },
);

BrowserElementNode.displayName = 'BrowserElementNode';
