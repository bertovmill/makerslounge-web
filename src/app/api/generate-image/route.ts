import { NextRequest, NextResponse } from "next/server";
import { getServerAppUser } from "@/lib/clerk-server";
import { createClient } from "@/lib/supabase-server";

export const maxDuration = 120; // Allow up to 2 minutes for image generation

const FAL_API_KEY = process.env.FAL_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { prompt, aspectRatio, style } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const supabase = await createClient();
    const user = await getServerAppUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    if (!FAL_API_KEY) {
      return NextResponse.json(
        { error: "FAL_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Map aspect ratio to image size
    const sizeMap: Record<string, { width: number; height: number }> = {
      "1:1": { width: 1024, height: 1024 },
      "16:9": { width: 1280, height: 720 },
      "9:16": { width: 720, height: 1280 },
      "4:3": { width: 1024, height: 768 },
      "3:4": { width: 768, height: 1024 },
    };

    const size = sizeMap[aspectRatio] || sizeMap["1:1"];

    // Style prefixes to enhance the prompt
    const stylePrompts: Record<string, string> = {
      realistic: "photorealistic, high quality, detailed, 8k, ",
      artistic: "artistic, creative, expressive, painterly style, ",
      minimal: "minimalist, clean, simple, modern design, ",
      vibrant: "vibrant colors, bold, energetic, eye-catching, ",
      professional: "professional, corporate, clean, polished, ",
      none: "",
    };

    const stylePrefix = stylePrompts[style] || "";
    const enhancedPrompt = `${stylePrefix}${prompt}`;

    // Submit to fal.ai queue
    const submitResponse = await fetch("https://queue.fal.run/fal-ai/flux-pro/v1.1", {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        image_size: {
          width: size.width,
          height: size.height,
        },
        num_images: 1,
        enable_safety_checker: true,
        safety_tolerance: "2",
      }),
    });

    if (!submitResponse.ok) {
      const errorData = await submitResponse.json().catch(() => ({}));
      console.error("Fal.ai submit error:", submitResponse.status, errorData);
      return NextResponse.json(
        { error: errorData.detail || errorData.message || `Fal.ai error: ${submitResponse.status}` },
        { status: submitResponse.status }
      );
    }

    const submitData = await submitResponse.json();
    console.log("Fal.ai submit response:", JSON.stringify(submitData).slice(0, 500));

    // If we got images directly (no queue), return them
    if (submitData.images) {
      return NextResponse.json({
        images: submitData.images.map((img: { url: string }) => img.url),
        prompt: enhancedPrompt,
      });
    }

    // Otherwise poll the queue using the URLs fal.ai gave us
    const statusUrl = submitData.status_url;
    const responseUrl = submitData.response_url;
    if (!statusUrl || !responseUrl) {
      console.error("Fal.ai: no status_url/response_url in response:", submitData);
      return NextResponse.json(
        { error: "Unexpected response from image generator" },
        { status: 500 }
      );
    }

    const result = await pollForResult(statusUrl, responseUrl);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate image error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}

async function pollForResult(statusUrl: string, responseUrl: string, maxAttempts = 120): Promise<{ images: string[]; prompt: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const statusResponse = await fetch(statusUrl, {
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
      },
    });

    if (!statusResponse.ok) {
      console.error("Fal.ai status check failed:", statusResponse.status);
      continue;
    }

    const statusData = await statusResponse.json();
    console.log(`Fal.ai poll ${i + 1}: status=${statusData.status}`);

    if (statusData.status === "COMPLETED") {
      const resultResponse = await fetch(responseUrl, {
        headers: {
          Authorization: `Key ${FAL_API_KEY}`,
        },
      });

      if (!resultResponse.ok) {
        throw new Error(`Failed to fetch result: ${resultResponse.status}`);
      }

      const resultData = await resultResponse.json();
      return {
        images: resultData.images?.map((img: { url: string }) => img.url) || [],
        prompt: resultData.prompt || "",
      };
    }

    if (statusData.status === "FAILED") {
      console.error("Fal.ai generation failed:", statusData);
      throw new Error("Image generation failed on fal.ai");
    }

    // IN_QUEUE or IN_PROGRESS — keep polling
  }

  throw new Error("Image generation timed out after 120 seconds");
}
