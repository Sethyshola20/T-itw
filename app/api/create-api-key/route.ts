

import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = await auth.api.createApiKey({
      body: {
        name: 'chat-api-key',
        userId: session.user.id,
        rateLimitEnabled: true,
        rateLimitTimeWindow: 1000 * 60 * 60, // 1 hour
        rateLimitMax: 100, // 100 requests per hour
      },
    });

    return NextResponse.json({ success: true, keyId: apiKey.id, key: apiKey.key });
  } catch (error) {
    console.log({error})
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}