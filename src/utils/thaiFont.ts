// THSarabunNew font base64 (partial - you need to add full font)
// Download from: https://github.com/Phonbopit/sarabun-webfont
export const THSarabunNewFont = '';

// Alternative: Use this function to load font from public folder
export async function loadThaiFont() {
  try {
    const response = await fetch('/fonts/THSarabunNew.ttf');
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return base64;
  } catch (error) {
    console.error('Failed to load Thai font:', error);
    return null;
  }
}
