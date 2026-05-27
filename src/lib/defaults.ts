import { v4 as uuidv4 } from 'uuid';
import type {
  OverlayElement,
  TextElement,
  ImageElement,
  BrowserElement,
  SceneData,
  ElementType,
  BaseElement,
  ProjectData,
} from '../types/elements';
import { DEFAULT_CANVAS } from './constants';

// ── Element Factories ──

const baseDefaults = (type: ElementType, name: string): BaseElement => ({
  id: uuidv4(),
  type,
  name,
  x: 100,
  y: 100,
  width: 300,
  height: 200,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  opacity: 1,
  zIndex: 0,
  hidden: false,
  locked: false,
  cropLeft: 0,
  cropTop: 0,
  cropRight: 0,
  cropBottom: 0,
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
    url: `${window.location.origin}/placeholder`,
    browserWidth: 800,
    browserHeight: 600,
    width: 800,
    height: 600,
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

export function createDefaultScene(name = 'Scene 1'): SceneData {
  return {
    id: uuidv4(),
    name,
    canvas: { ...DEFAULT_CANVAS },
    elements: [],
    updatedAt: Date.now(),
  };
}

export function createDefaultProject(): ProjectData {
  const defaultScene = createDefaultScene('Scene 1');
  return {
    scenes: [defaultScene],
    activeSceneId: defaultScene.id,
    updatedAt: Date.now(),
  };
}
