import type { DrawingType } from '@/lib/drawingTypes';

export type { DrawingType };

export type Side = 'A' | 'B' | 'C' | 'D';

export interface Plot {
  width: number;   // feet
  height: number;  // feet
  origin: Side;
}

export type ItemCategory =
  | 'structure'
  | 'rooms'
  | 'doors'
  | 'windows'
  | 'bathroom'
  | 'kitchen'
  | 'bedroom'
  | 'living'
  | 'dining'
  | 'storage'
  | 'outdoor'
  | 'stairs'
  | 'study'
  | 'pathway'
  | 'electrical'
  | 'plumbing'
  | 'structural-eng'
  | 'foundation-eng'
  | 'site'
  | 'elevation-view';

export interface ItemDefinition {
  type: string;
  name: string;
  category: ItemCategory;
  defaultWidth: number;  // feet
  defaultHeight: number; // feet
  color: string;
  icon: string;
  resizable: boolean;
  description: string;
  drawingType?: DrawingType;
}

export interface PlacedItem {
  id: string;
  type: string;
  name: string;
  label: string;
  x: number;        // feet from origin
  y: number;        // feet from origin
  width: number;    // feet
  height: number;   // feet
  rotation: number; // degrees
  color: string;
  locked: boolean;
  zIndex: number;
}

export interface Plan {
  id: string;
  userId: string;
  name: string;
  description: string;
  plot: Plot;
  items: PlacedItem[];
  createdAt: string;
  updatedAt: string;
  drawingType?: DrawingType;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
}

export interface RoomSummary {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  coordinates: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  };
}
