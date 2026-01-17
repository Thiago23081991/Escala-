
import { GoogleGenAI } from "@google/genai";
import { ImageSize, AspectRatio } from "../types.ts";

export class GeminiService {
  // Obtain the API key exclusively from process.env.API_KEY and use it directly.
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async generateImage(prompt: string, size: ImageSize) {
    const ai = this.getAI();
    // Use gemini-2.5-flash-image for standard tasks and gemini-3-pro-image-preview for high-quality.
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
            ...(model === 'gemini-3-pro-image-preview' ? { imageSize: size } : {})
          }
        }
      });

      // Iterate through candidates to find the image part.
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
          aspectRatio: aspectRatio === '1:1' ? '16:9' : (aspectRatio as '16:9' | '9:16')
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Falha ao obter link do vídeo.");

      // Append the API key directly from the environment when fetching video bytes.
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
