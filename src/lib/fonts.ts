export interface FontGroup {
  label: string;
  fonts: string[];
}

// A curated list of ~50 popular Google Fonts, grouped by typography style.
export const GOOGLE_FONTS: FontGroup[] = [
  {
    label: 'Sans-Serif (Modern & Clean)',
    fonts: [
      'Inter',
      'Roboto',
      'Open Sans',
      'Lato',
      'Montserrat',
      'Poppins',
      'Oswald',
      'Raleway',
      'Nunito',
      'Ubuntu',
      'Google Sans Flex',
      'Work Sans',
      'Fira Sans',
      'Noto Sans',
      'Quicksand',
    ],
  },
  {
    label: 'Serif (Classic & Elegant)',
    fonts: [
      'Playfair Display',
      'Merriweather',
      'Lora',
      'PT Serif',
      'Noto Serif',
      'Crimson Text',
      'EB Garamond',
      'Libre Baskerville',
      'Bitter',
      'Cormorant Garamond',
    ],
  },
  {
    label: 'Display (Gaming & Bold)',
    fonts: [
      'Bebas Neue',
      'Anton',
      'Righteous',
      'Lobster',
      'Alfa Slab One',
      'Fredoka One',
      'Rubik Mono One',
      'Bangers',
      'Permanent Marker',
      'Press Start 2P',
    ],
  },
  {
    label: 'Monospace (Code & Tech)',
    fonts: [
      'Roboto Mono',
      'Inconsolata',
      'Source Code Pro',
      'Space Mono',
      'Fira Code',
      'IBM Plex Mono',
      'PT Mono',
      'Courier Prime',
      'JetBrains Mono',
      'Overpass Mono',
    ],
  },
  {
    label: 'Handwriting (Casual & Script)',
    fonts: [
      'Dancing Script',
      'Pacifico',
      'Caveat',
      'Satisfy',
      'Great Vibes',
      'Sacramento',
      'Kalam',
      'Indie Flower',
      'Amatic SC',
      'Shadows Into Light',
    ],
  },
];

// Keep track of fonts we have already injected into the <head>
const loadedFonts = new Set<string>();

/**
 * Dynamically injects a Google Font stylesheet into the document head
 * and waits for the browser to finish downloading and parsing the font.
 */
export async function loadGoogleFont(fontFamily: string): Promise<void> {
  // Ignore system fonts or fonts we've already loaded
  if (['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Impact'].includes(fontFamily)) {
    return;
  }
  
  if (loadedFonts.has(fontFamily)) {
    return;
  }

  // Inject the stylesheet
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
  loadedFonts.add(fontFamily);

  // Wait for the font to be fully loaded by the browser (crucial for Canvas/Konva rendering)
  try {
    await document.fonts.load(`16px "${fontFamily}"`);
  } catch (err) {
    console.warn(`[Oneverlay] Failed to load font: ${fontFamily}`, err);
  }
}
