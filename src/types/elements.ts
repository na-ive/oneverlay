// ── Element Types ──

export type ElementType = 'text' | 'image' | 'browser';

export interface BaseElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  hidden: boolean;
  locked: boolean;
  cropLeft: number;
  cropTop: number;
  cropRight: number;
  cropBottom: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  fontFamily: string;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  imageUrl: string;
}

export interface BrowserElement extends BaseElement {
  type: 'browser';
  url: string;
  browserWidth: number;
  browserHeight: number;
}

export type OverlayElement = TextElement | ImageElement | BrowserElement;

// ── Canvas & Scene ──

export interface CanvasSettings {
  width: number;
  height: number;
}

export interface SceneData {
  id: string;
  name: string;
  canvas: CanvasSettings;
  elements: OverlayElement[];
  updatedAt: number;
}

export interface ProjectData {
  scenes: SceneData[];
  activeSceneId: string;
  updatedAt: number;
}
