import Tesseract from 'tesseract.js';

export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    const result = await Tesseract.recognize(
      imageUrl,
      'eng',
      {
        logger: m => console.log(m),
        // Optional: Can configure specific Tesseract parameters here to improve medical handwriting recognition
      }
    );
    
    return result.data.text;
  } catch (error) {
    console.error("Tesseract OCR Error:", error);
    throw new Error("Failed to extract text from image");
  }
}
