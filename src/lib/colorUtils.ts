import chroma from 'chroma-js';
import ColorThief from 'colorthief';

/**
 * Extrai paleta de cores de uma imagem
 */
export async function extractColorsFromImage(imageUrl: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(img, 5);

        // Converte RGB para HEX
        const hexColors = palette.map((rgb: number[]) =>
          chroma(rgb).hex()
        );

        resolve(hexColors);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = reject;
    img.src = imageUrl;
  });
}

/**
 * Converte HEX para HSL (formato usado no Tailwind)
 */
export function hexToHSL(hex: string): string {
  const hsl = chroma(hex).hsl();
  const h = isNaN(hsl[0]) ? 0 : Math.round(hsl[0]);
  const s = Math.round(hsl[1] * 100);
  const l = Math.round(hsl[2] * 100);
  return `${h} ${s}% ${l}%`;
}

/**
 * Gera paleta de cores complementares
 */
export function generateColorPalettes(baseColor: string) {
  const color = chroma(baseColor);

  return {
    primary: {
      hex: color.hex(),
      hsl: hexToHSL(color.hex()),
    },
    secondary: {
      hex: color.set('hsl.h', '+120').hex(),
      hsl: hexToHSL(color.set('hsl.h', '+120').hex()),
    },
    accent: {
      hex: color.set('hsl.h', '+30').hex(),
      hsl: hexToHSL(color.set('hsl.h', '+30').hex()),
    },
  };
}

/**
 * Paletas pré-definidas inspiradoras
 */
export const predefinedPalettes = {
  'corporate-blue': {
    name: 'Corporate Blue',
    primary: { hex: '#0F66E8', hsl: '209 89% 40%' },
    secondary: { hex: '#10B981', hsl: '134 61% 41%' },
    accent: { hex: '#EAB308', hsl: '43 100% 44%' },
    preview: '#0F66E8',
  },
  'tech-purple': {
    name: 'Tech Purple',
    primary: { hex: '#7C3AED', hsl: '258 90% 66%' },
    secondary: { hex: '#EC4899', hsl: '330 81% 60%' },
    accent: { hex: '#F59E0B', hsl: '38 92% 50%' },
    preview: '#7C3AED',
  },
  'finance-green': {
    name: 'Finance Green',
    primary: { hex: '#059669', hsl: '160 84% 39%' },
    secondary: { hex: '#0891B2', hsl: '188 94% 42%' },
    accent: { hex: '#F59E0B', hsl: '38 92% 50%' },
    preview: '#059669',
  },
  'legal-navy': {
    name: 'Legal Navy',
    primary: { hex: '#1E40AF', hsl: '224 76% 48%' },
    secondary: { hex: '#0284C7', hsl: '199 89% 48%' },
    accent: { hex: '#D97706', hsl: '32 95% 44%' },
    preview: '#1E40AF',
  },
  'modern-gray': {
    name: 'Modern Gray',
    primary: { hex: '#475569', hsl: '215 16% 47%' },
    secondary: { hex: '#0EA5E9', hsl: '199 89% 48%' },
    accent: { hex: '#F97316', hsl: '22 93% 54%' },
    preview: '#475569',
  },
  'elegant-burgundy': {
    name: 'Elegant Burgundy',
    primary: { hex: '#9F1239', hsl: '345 89% 48%' },
    secondary: { hex: '#7E22CE', hsl: '276 75% 53%' },
    accent: { hex: '#CA8A04', hsl: '43 96% 56%' },
    preview: '#9F1239',
  },
};

/**
 * Valida se uma cor é adequada para UI (não muito clara ou escura)
 */
export function isColorSuitable(hex: string): boolean {
  const luminance = chroma(hex).luminance();
  // Deve estar entre 0.15 e 0.85 para ser legível
  return luminance > 0.15 && luminance < 0.85;
}

/**
 * Ajusta luminosidade de uma cor
 */
export function adjustLuminance(hex: string, targetLuminance: number): string {
  return chroma(hex).luminance(targetLuminance).hex();
}

/**
 * Gera variações de uma cor (mais clara e mais escura)
 */
export function generateColorVariations(hex: string) {
  const base = chroma(hex);
  return {
    lighter: base.brighten(1).hex(),
    base: hex,
    darker: base.darken(1).hex(),
  };
}
