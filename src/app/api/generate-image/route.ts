import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

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
    const { data: { user } } = await supabase.auth.getUser();

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

    // Call Fal.ai API using flux-pro for high quality
    const response = await fetch("https://queue.fal.run/fal-ai/flux-pro/v1.1", {
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Fal.ai error:", errorData);
      return NextResponse.json(
        { error: errorData.detail || "Failed to generate image" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Handle queue response - poll for result
    if (data.request_id) {
      // Poll for result
      const result = await pollForResult(data.request_id);
      return NextResponse.json(result);
    }

    // Direct response
    return NextResponse.json({
      images: data.images?.map((img: { url: string }) => img.url) || [],
      prompt: enhancedPrompt,
    });
  } catch (error) {
    console.error("Generate image error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}

async function pollForResult(requestId: string, maxAttempts = 60): Promise<{ images: string[]; prompt: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    const statusResponse = await fetch(
      `https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/${requestId}/status`,
      {
        headers: {
          Authorization: `Key ${FAL_API_KEY}`,
        },
      }
    );

    const statusData = await statusResponse.json();

    if (statusData.status === "COMPLETED") {
      // Get the result
      const resultResponse = await fetch(
        `https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/${requestId}`,
        {
          headers: {
            Authorization: `Key ${FAL_API_KEY}`,
          },
        }
      );
      const resultData = await resultResponse.json();
      return {
        images: resultData.images?.map((img: { url: string }) => img.url) || [],
        prompt: resultData.prompt || "",
      };
    }

    if (statusData.status === "FAILED") {
      throw new Error("Image generation failed");
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Image generation timed out");
}
