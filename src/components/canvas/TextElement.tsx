import { useRef, useLayoutEffect, useState } from 'react';
import { Text } from 'react-konva';
import type Konva from 'konva';
import type { TextElement } from '../../types/elements';
import { useSceneStore } from '../../store/sceneStore';
import { loadGoogleFont } from '../../lib/fonts';

interface TextElementNodeProps {
  element: TextElement;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export const TextElementNode = ({ element, x, y }: TextElementNodeProps) => {
  const textRef = useRef<Konva.Text>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  useLayoutEffect(() => {
    let mounted = true;
    setFontLoaded(false);

    loadGoogleFont(element.fontFamily).then(() => {
      if (mounted) {
        setFontLoaded(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [element.fontFamily]);

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
      fontFamily={fontLoaded ? element.fontFamily : 'Arial'}
      fill={element.color}
      x={x}
      y={y}
    />
  );
};
