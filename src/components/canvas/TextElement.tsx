import { useRef, useLayoutEffect } from 'react';
import { Text } from 'react-konva';
import type Konva from 'konva';
import type { TextElement } from '../../types/elements';
import { useSceneStore } from '../../store/sceneStore';

interface TextElementNodeProps {
  element: TextElement;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export const TextElementNode = ({ element, x, y }: TextElementNodeProps) => {
  const textRef = useRef<Konva.Text>(null);

  useLayoutEffect(() => {
    if (textRef.current) {
      const width = textRef.current.width();
      const height = textRef.current.height();
      
      if (width !== element.width || height !== element.height) {
        useSceneStore.getState().updateElement(element.id, { width, height });
      }
    }
  }, [element.id, element.text, element.fontSize, element.fontFamily, element.fontWeight, element.width, element.height]);

  return (
    <Text
      ref={textRef}
      text={element.text}
      fontSize={element.fontSize}
      fontStyle={element.fontWeight >= 700 ? 'bold' : element.fontWeight >= 500 ? '500' : 'normal'}
      fontFamily={element.fontFamily}
      fill={element.color}
      x={x}
      y={y}
    />
  );
};
