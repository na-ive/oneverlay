import { useEffect, useState } from 'react';
import { Image, Rect, Text, Group } from 'react-konva';
import type { ImageElement } from '../../types/elements';
import { useSceneStore } from '../../store/sceneStore';

interface ImageElementNodeProps {
  element: ImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ImageElementNode = ({ element, x, y, width, height }: ImageElementNodeProps) => {
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
      // Auto-update intrinsic dimensions to original image size
      if (element.width !== img.width || element.height !== img.height) {
        useSceneStore.getState().updateElement(element.id, {
          width: img.width,
          height: img.height,
        });
      }
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

  if (!image || error) {
    return (
      <Group x={x} y={y}>
        <Rect
          width={width}
          height={height}
          fill="#1e2a3a"
          stroke="#2a3a4a"
          strokeWidth={1}
          cornerRadius={4}
        />
        <Text
          text={error ? '⚠ Image failed to load' : '🖼 Image'}
          fontSize={13}
          fill="#5a6475"
          width={width}
          height={height}
          align="center"
          verticalAlign="middle"
        />
      </Group>
    );
  }

  return (
    <Image
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
    />
  );
};
