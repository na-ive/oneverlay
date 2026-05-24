import { v4 as uuidv4 } from 'uuid';
import type {
  OverlayElement,
  TextElement,
  ImageElement,
  BrowserElement,
  SceneData,
  ElementType,
} from '../types/elements';
import { DEFAULT_CANVAS } from './constants';

// ── Element Factories ──

const baseDefaults = (type: ElementType, name: string): Omit<OverlayElement, 'type' | keyof TextElement | keyof ImageElement | keyof BrowserElement> & { id: string; type: ElementType; name: string; x: number; y: number; width: number; height: number; rotation: number; opacity: number; zIndex: number; hidden: boolean; locked: boolean } => ({
  id: uuidv4(),
  type,
  name,
  x: 100,
  y: 100,
  width: 300,
  height: 200,
  rotation: 0,
  opacity: 1,
  zIndex: 0,
  hidden: false,
  locked: false,
});

export function createTextElement(overrides?: Partial<TextElement>): TextElement {
  return {
    ...baseDefaults('text', 'Text'),
    type: 'text',
    text: 'Sample Text',
    fontSize: 48,
    fontWeight: 400,
    color: '#ffffff',
    fontFamily: 'Inter',
    width: 400,
    height: 60,
    ...overrides,
  };
}

export function createImageElement(overrides?: Partial<ImageElement>): ImageElement {
  return {
    ...baseDefaults('image', 'Image'),
    type: 'image',
    imageUrl: '',
    width: 400,
    height: 300,
    ...overrides,
  };
}

export function createBrowserElement(overrides?: Partial<BrowserElement>): BrowserElement {
  return {
    ...baseDefaults('browser', 'Browser'),
    type: 'browser',
    url: 'https://example.com',
    width: 600,
    height: 400,
    ...overrides,
  };
}

export function createElement(type: ElementType): OverlayElement {
  switch (type) {
    case 'text':
      return createTextElement();
    case 'image':
      return createImageElement();
    case 'browser':
      return createBrowserElement();
  }
}

// ── Default Scene ──

export function createDefaultScene(): SceneData {
  return {
    id: uuidv4(),
    name: 'Untitled Overlay',
    canvas: { ...DEFAULT_CANVAS },
    elements: [],
    updatedAt: Date.now(),
  };
}
