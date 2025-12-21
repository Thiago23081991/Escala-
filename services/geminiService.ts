
import { GoogleGenAI } from "@google/genai";
import { ImageSize, AspectRatio } from "../types";

export class GeminiService {
  private static getAI() {
    // Creating a new instance right before the call ensures the latest API key is used.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async generateImage(prompt: string, size: ImageSize) {
    const ai = this.getAI();
    // Use gemini-2.5-flash-image by default; upgrade to gemini-3-pro-image-preview for 2K/4K.
    const model = size === '1K' ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview';
    
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            // imageSize is only supported by gemini-3-pro-image-preview.
            ...(model === 'gemini-3-pro-image-preview' ? { imageSize: size } : {})
          }
        }
      });

      // Iterating through parts to find the image part, as parts might contain text too.
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new Error("Não foi possível gerar a imagem.");
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        throw new Error("API_KEY_REQUIRED");
      }
      throw error;
    }
  }

  static async animateImage(prompt: string, imageBase64: string, aspectRatio: AspectRatio) {
    const ai = this.getAI();
    try {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
          imageBytes: imageBase64.split(',')[1],
          mimeType: 'image/png'
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          // Veo supports 16:9 or 9:16. 1:1 input is mapped to 16:9 as a fallback.
          aspectRatio: aspectRatio === '1:1' ? '16:9' : (aspectRatio as '16:9' | '9:16')
        }
      });

      while (!operation.done) {
        // Wait 10 seconds between checks as recommended for video operations.
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Falha ao obter link do vídeo.");

      // Appending API key to the download link as required.
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        throw new Error("API_KEY_REQUIRED");
      }
      throw error;
    }
  }
}
