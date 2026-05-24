import { forwardRef, useEffect, useState } from 'react';
import { Image, Rect, Text, Group } from 'react-konva';
import type Konva from 'konva';
import type { ImageElement } from '../../types/elements';

interface ImageElementNodeProps {
  element: ImageElement;
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

export const ImageElementNode = forwardRef<Konva.Group, ImageElementNodeProps>(
  ({ element, ...props }, ref) => {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
      if (!element.imageUrl) {
        setImage(null);
        setError(false);
        return;
      }

      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImage(img);
        setError(false);
      };
      img.onerror = () => {
        setImage(null);
        setError(true);
      };
      img.src = element.imageUrl;

      return () => {
        img.onload = null;
        img.onerror = null;
      };
    }, [element.imageUrl]);

    // Show placeholder if no image or error
    if (!image || error) {
      return (
        <Group ref={ref} {...props}>
          <Rect
            width={element.width}
            height={element.height}
            fill="#1e2a3a"
            stroke="#2a3a4a"
            strokeWidth={1}
            cornerRadius={4}
          />
          <Text
            text={error ? '⚠ Image failed to load' : '🖼 Image'}
            fontSize={13}
            fill="#5a6475"
            width={element.width}
            height={element.height}
            align="center"
            verticalAlign="middle"
          />
        </Group>
      );
    }

    return (
      <Group ref={ref} {...props}>
        <Image
          image={image}
          width={element.width}
          height={element.height}
        />
      </Group>
    );
  },
);

ImageElementNode.displayName = 'ImageElementNode';
