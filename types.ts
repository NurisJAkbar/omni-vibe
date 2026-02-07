export interface ColorPalette {
  hex: string;
  name: string;
  usage: string;
}

export interface BrandIdentity {
  thinkingLog: string;
  vibeDescription: string;
  brandVoice: string;
  typographyHeading: string;
  typographyBody: string;
  colors: ColorPalette[];
  designDirectives: string[];
}

export interface GeneratedAsset {
  id: string;
  type: 'logo' | 'social' | 'mockup';
  imageUrl: string;
  promptUsed: string;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  REVIEW = 'REVIEW',
  GENERATING_ASSET = 'GENERATING_ASSET'
}

export interface AnalysisInput {
  file: File | null;
  textPrompt: string;
}