import type { NextRequest } from 'next/server';
import { getChatsByUserId } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;


  const limit = Number.parseInt(searchParams.get('limit') || '10');
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      'bad_request:api',
      'Only one of starting_after or ending_before can be provided.',
    ).toResponse();
  }

  const apiKey = request.headers.get('chat-api-key');

  const session = await auth.api.getSession({
    headers: request.headers,
  })
  
  if(!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }
  if (!apiKey) {
    return new ChatSDKError('unauthorized:chat', 'Missing API key').toResponse();
  }

  const result = await auth.api.verifyApiKey({
    body: { key: apiKey },
  });

  console.log(result)
  if (!result.valid) {
    return new ChatSDKError('forbidden:auth', 'Invalid or rate-limited API key').toResponse();
  }

  const chats = await getChatsByUserId({
    id: session.user.id,
    limit,
    startingAfter,
    endingBefore,
  });

  return Response.json(chats);
}
