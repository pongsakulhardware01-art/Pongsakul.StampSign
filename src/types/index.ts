export type LayerType = 'stamp' | 'signature' | 'image';

export type BlendMode = 'normal' | 'multiply' | 'darken';

export interface Layer {
  id: string;
  assetId?: string; // ID of the cloud-saved asset this layer was spawned from
  type: LayerType;
  name: string;
  x: number; // in base image coordinates
  y: number; // in base image coordinates
  width: number; // in base image coordinates
  height: number; // in base image coordinates
  rotation: number; // in degrees (-180 to 180)
  opacity: number; // 0 to 1
  blendMode: BlendMode;
  flipX: boolean;
  flipY: boolean;
  locked: boolean;
  visible: boolean;
  imageUrl: string; // rendered dataUrl representing this layer
  aspectRatio: number; // width / height
}

export interface SavedAsset {
  id: string;
  name: string;
  type: 'signature' | 'stamp' | 'image';
  imageUrl: string;
  department?: string; // e.g. "ฝ่ายบริหาร", "ฝ่ายบัญชี", "ฝ่ายจัดซื้อ", "ส่วนกลาง"
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  blendMode: BlendMode;
  relativeX: number; // Proportional horizontal position (0..1)
  relativeY: number; // Proportional vertical position (0..1)
  relativeWidth: number; // Proportional width (0..1 of doc width)
  createdAt: string;
  updatedAt: string;
}

export interface StampConfig {
  shape: 'circle' | 'rounded-rect' | 'rect' | 'date-badge';
  title: string;
  subtitle?: string;
  centerText?: string;
  dateText?: string;
  color: string;
  hasGrunge: boolean;
  grungeIntensity: number;
  borderWidth: number;
  doubleBorder: boolean;
  starOrnaments: boolean;
  fontFamily: string;
}
