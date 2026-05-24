import { forwardRef } from 'react';
import { Text } from 'react-konva';
import type Konva from 'konva';
import type { TextElement } from '../../types/elements';

interface TextElementNodeProps {
  element: TextElement;
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

export const TextElementNode = forwardRef<Konva.Text, TextElementNodeProps>(
  ({ element, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        text={element.text}
        fontSize={element.fontSize}
        fontStyle={element.fontWeight >= 700 ? 'bold' : element.fontWeight >= 500 ? '500' : 'normal'}
        fontFamily={element.fontFamily}
        fill={element.color}
        {...props}
      />
    );
  },
);

TextElementNode.displayName = 'TextElementNode';
