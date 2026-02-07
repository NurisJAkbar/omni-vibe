import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BrandIdentity } from "../types";

// Note: GoogleGenAI client is initialized inside functions to ensure it picks up the latest process.env.API_KEY

/**
 * Converts a File object to a Base64 string suitable for the API.
 * Automatically converts images to JPEG to ensure compatibility (handling AVIF, HEIC, etc).
 */
const fileToPart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  // Try to convert images to JPEG using Canvas
  if (file.type.startsWith('image/')) {
    try {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // Fill background with white to handle transparency in PNG/AVIF when converting to JPEG
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
              
              const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
              // Remove prefix
              const base64Data = dataUrl.split(',')[1];
              
              resolve({
                inlineData: {
                  data: base64Data,
                  mimeType: 'image/jpeg',
                },
              });
            } else {
              reject(new Error("Canvas context creation failed"));
            }
          };
          img.onerror = () => reject(new Error("Image loading failed"));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("File reading failed"));
        reader.readAsDataURL(file);
      });
    } catch (e) {
      console.warn("Image conversion failed, attempting raw upload.", e);
      // Fall through to raw upload if conversion errors (e.g. corrupted image)
    }
  }

  // Fallback for Video or if conversion failed
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix (e.g. "data:image/jpeg;base64,")
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const brandIdentitySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    thinkingLog: { type: Type.STRING, description: "The [THINKING LOG] explaining the spatial analysis and design reasoning. Must be in English." },
    vibeDescription: { type: Type.STRING, description: "A poetic, detailed description of the visual vibe. Must be in English." },
    brandVoice: { type: Type.STRING, description: "The personality and tone of the brand voice. Must be in English." },
    typographyHeading: { type: Type.STRING, description: "Recommended font family for headings. Must be in English." },
    typographyBody: { type: Type.STRING, description: "Recommended font family for body text. Must be in English." },
    colors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          hex: { type: Type.STRING, description: "Hex code e.g. #FFFFFF" },
          name: { type: Type.STRING, description: "Creative name for the color (in English)" },
          usage: { type: Type.STRING, description: "How this color should be used (Primary, Accent, Background) - in English" }
        }
      }
    },
    designDirectives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3-5 specific visual rules or concepts for this identity. Must be in English."
    }
  },
  required: ["thinkingLog", "vibeDescription", "brandVoice", "colors", "designDirectives"]
};

/**
 * Stage 1: Analyze Input (Image/Video + Text)
 * Uses Gemini 3 Pro with Thinking for deep reasoning about aesthetics.
 */
export const analyzeVibe = async (file: File, userPrompt: string): Promise<BrandIdentity> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [];
  
  if (file) {
    const mediaPart = await fileToPart(file);
    parts.push(mediaPart);
  }

  const promptText = `
    Role: OMNI-VIBE Autonomous Creative Director.

    INSTRUCTION:
    1. Conduct a full [SPATIAL ANALYSIS] of the input media (if provided).
    2. Generate the [THINKING LOG] with at least one "Self-Correction" (Rejected vs. Corrected idea).
    3. Deconstruct the aesthetic into a comprehensive Brand Identity System.
    4. Ensure the tone is professional, sophisticated, and artistic.
    
    CONTEXT:
    The user wants to transform the input into a "${userPrompt || "distinctive"}" brand identity.
    
    CONSTRAINT:
    - ALL OUTPUT MUST BE IN ENGLISH.
    
    Output a structured JSON object defining the brand.
  `;
  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: brandIdentitySchema,
      thinkingConfig: { thinkingBudget: 2048 } // Enable reasoning for deeper aesthetic analysis
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from analysis model.");
  
  return JSON.parse(text) as BrandIdentity;
};

/**
 * Stage 2: Generate Visual Assets
 * Uses Gemini 3 Pro Image Preview for high-fidelity assets.
 * Now supports image-to-image by accepting an optional reference file.
 * Falls back to gemini-2.5-flash-image if permissions are denied.
 */
export const generateAsset = async (
  type: 'logo' | 'social' | 'mockup',
  identity: BrandIdentity,
  referenceFile: File | null
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [];
  
  if (referenceFile) {
     const mediaPart = await fileToPart(referenceFile);
     parts.push(mediaPart);
  }

  let prompt = "";
  const paletteString = identity.colors.map(c => `${c.name} (${c.hex})`).join(', ');

  if (type === 'logo') {
    prompt = `
      Design a professional, high-end vector-style logo.
      Vibe: ${identity.vibeDescription}.
      Colors: ${paletteString}.
      Style: Minimalist, abstract, geometry-focused. 
      ${referenceFile ? "Use the provided image as a structural reference or sketch input." : ""}
      White background.
    `;
  } else if (type === 'social') {
    prompt = `
      Create an Instagram story background layout for a brand launch.
      Vibe: ${identity.vibeDescription}.
      Colors: ${paletteString}.
      Include abstract 3D elements and textures. 
      High fashion, editorial style.
      Aspect Ratio 9:16.
    `;
  } else if (type === 'mockup') {
    prompt = `
      Product photography mockup.
      A generic modern packaging container sitting on a textured surface.
      Lighting: Cinematic, studio lighting matching the vibe: ${identity.vibeDescription}.
      Colors applied to object: ${paletteString}.
      Photorealistic, 4k, octane render.
    `;
  }
  
  parts.push({ text: prompt });

  let response;

  try {
    // Try Gemini 3 Pro Image Preview first (High Quality)
    response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: type === 'social' ? '9:16' : '1:1',
          imageSize: '1K' 
        }
      }
    });
  } catch (error: any) {
    // Check for Permission Denied (403) or Not Found (404 - model not available)
    if (error.status === 403 || error.status === 404 || (error.message && (error.message.includes("PERMISSION_DENIED") || error.message.includes("NOT_FOUND")))) {
      console.warn("Gemini 3 Pro Image Preview unavailable. Falling back to Gemini 2.5 Flash Image.");
      
      // Fallback to Gemini 2.5 Flash Image
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: type === 'social' ? '9:16' : '1:1'
            // imageSize is not supported in Flash Image
          }
        }
      });
    } else {
      throw error; // Re-throw other errors
    }
  }

  // Extract image
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) throw new Error("No image generated.");

  const contentParts = candidates[0].content.parts;
  const imagePart = contentParts.find(p => p.inlineData);

  if (imagePart && imagePart.inlineData) {
    return `data:image/png;base64,${imagePart.inlineData.data}`;
  }

  throw new Error("Model response did not contain image data.");
};