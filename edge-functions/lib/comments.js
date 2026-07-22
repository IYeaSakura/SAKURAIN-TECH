/**
 * Comment business logic for EdgeOne Pages Edge Functions.
 * Backed by COMMENTS_KV; GET is public, POST requires HMAC auth.
 */

import {
  verifyAuthHeaders,
  createAuthErrorResponse,
  handleCorsPreflight,
  addCorsHeaders,
} from './auth.js';
import { checkRateLimit, createRateLimitResponse } from './rate-limit.js';
import { getKV } from './kv.js';

const MAX_COMMENTS_PER_POST = 50;

function getClientIP(request) {
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIP = request.headers.get('X-Real-IP');
  if (xRealIP) {
    return xRealIP;
  }

  return 'unknown';
}

function parseUserAgent(userAgent) {
  if (!userAgent) {
    return { browser: 'Unknown', os: 'Unknown' };
  }

  const ua = userAgent.toLowerCase();
  let browser = 'Unknown';
  let os = 'Unknown';

  if (ua.includes('edg/') || ua.includes('edge')) {
    const match = ua.match(/edg(?:e|a|ios)?\/(\d+(?:\.\d+)?)/);
    browser = match ? `Edge ${match[1]}` : 'Edge';
  } else if (ua.includes('opr/') || ua.includes('opera')) {
    const match = ua.match(/(?:opr|opera)\/(\d+(?:\.\d+)?)/);
    browser = match ? `Opera ${match[1]}` : 'Opera';
  } else if (ua.includes('firefox')) {
    const match = ua.match(/firefox\/(\d+(?:\.\d+)?)/);
    browser = match ? `Firefox ${match[1]}` : 'Firefox';
  } else if (ua.includes('chrome') && !ua.includes('chromium')) {
    const match = ua.match(/chrome\/(\d+(?:\.\d+)?)/);
    browser = match ? `Chrome ${match[1]}` : 'Chrome';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    const match = ua.match(/version\/(\d+(?:\.\d+)?)/);
    browser = match ? `Safari ${match[1]}` : 'Safari';
  } else if (ua.includes('msie') || ua.includes('trident')) {
    const match = ua.match(/(?:msie |rv:)(\d+(?:\.\d+)?)/);
    browser = match ? `IE ${match[1]}` : 'IE';
  }

  if (ua.includes('windows nt 10')) {
    os = 'Windows 10/11';
  } else if (ua.includes('windows nt 6.3')) {
    os = 'Windows 8.1';
  } else if (ua.includes('windows nt 6.2')) {
    os = 'Windows 8';
  } else if (ua.includes('windows nt 6.1')) {
    os = 'Windows 7';
  } else if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('mac os x')) {
    const match = ua.match(/mac os x (\d+[._]\d+)/);
    if (match) {
      os = `macOS ${match[1].replace('_', '.')}`;
    } else {
      os = 'macOS';
    }
  } else if (ua.includes('android')) {
    const match = ua.match(/android (\d+(?:\.\d+)?)/);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    const match = ua.match(/os (\d+(?:_\d+)?)/);
    os = match ? `iOS ${match[1].replace('_', '.')}` : 'iOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }

  return { browser, os };
}

function generateCommentId() {
  return `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function hashEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < normalizedEmail.length; i++) {
    const char = normalizedEmail.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function generateAvatarColor(email) {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  ];
  const hashValue = hashEmail(email);
  const index = parseInt(hashValue.substring(0, 2), 16) % colors.length;
  return colors[index];
}

function sanitizeContent(content, isMarkdown) {
  if (isMarkdown) {
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br />')
    .trim();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateNickname(nickname) {
  if (!nickname || nickname.length < 2 || nickname.length > 20) {
    return false;
  }
  return /^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/.test(nickname);
}

async function getComments(postId, env) {
  const kv = getKV('COMMENTS_KV', env);
  if (!kv) {
    return [];
  }
  const data = await kv.get(`comments:${postId}`);
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveComments(postId, comments, env) {
  const kv = getKV('COMMENTS_KV', env);
  if (!kv) {
    throw new Error('KV not bound');
  }
  await kv.put(`comments:${postId}`, JSON.stringify(comments));
}

function buildCommentTree(comments) {
  const commentMap = new Map();
  const rootComments = [];

  const sortedComments = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sortedComments.forEach((comment) => {
    comment.replies = [];
    commentMap.set(comment.id, comment);
  });

  sortedComments.forEach((comment) => {
    if (comment.parentId && commentMap.has(comment.parentId)) {
      commentMap.get(comment.parentId).replies.push(comment);
    } else {
      rootComments.push(comment);
    }
  });

  return rootComments;
}

function filterSensitiveInfo(comments) {
  return comments.map((comment) => ({
    id: comment.id,
    nickname: comment.nickname,
    avatarColor: comment.avatarColor,
    content: comment.content,
    isMarkdown: comment.isMarkdown,
    createdAt: comment.createdAt,
    parentId: comment.parentId,
    replyTo: comment.replyTo,
    browser: comment.browser,
    os: comment.os,
    replies: comment.replies ? filterSensitiveInfo(comment.replies) : [],
  }));
}

async function handleGetComments(postId, env) {
  try {
    const comments = await getComments(postId, env);
    const commentTree = buildCommentTree(comments);
    const filteredComments = filterSensitiveInfo(commentTree);

    return new Response(
      JSON.stringify({
        success: true,
        comments: filteredComments,
        total: comments.length,
        maxComments: MAX_COMMENTS_PER_POST,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch comments' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function handleCreateComment(request, postId, env) {
  try {
    const body = await request.json();
    const {
      nickname,
      email,
      content,
      parentId,
      replyTo,
      isMarkdown,
      verificationToken,
    } = body;

    if (!verificationToken) {
      return new Response(
        JSON.stringify({ error: 'Verification required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!validateNickname(nickname)) {
      return new Response(
        JSON.stringify({
          error:
            'Invalid nickname (2-20 characters, letters, numbers, Chinese, underscore, hyphen allowed)',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!validateEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!content || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Comment content cannot be empty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (content.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Comment too long (max 2000 characters)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const currentComments = await getComments(postId, env);
    if (currentComments.length >= MAX_COMMENTS_PER_POST) {
      return new Response(
        JSON.stringify({ error: 'Maximum comments limit reached for this post' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (parentId) {
      const parentExists = currentComments.some((c) => c.id === parentId);
      if (!parentExists) {
        return new Response(
          JSON.stringify({ error: 'Parent comment not found' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const parentComment = currentComments.find((c) => c.id === parentId);
      if (parentComment && parentComment.parentId) {
        return new Response(
          JSON.stringify({
            error: 'Cannot reply to a nested comment. Please reply to the root comment.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('User-Agent');
    const { browser, os } = parseUserAgent(userAgent);
    const sanitizedContent = sanitizeContent(content, isMarkdown ?? false);

    const newComment = {
      id: generateCommentId(),
      postId,
      nickname: nickname.trim(),
      email: email.toLowerCase().trim(),
      emailHash: hashEmail(email),
      avatarColor: generateAvatarColor(email),
      content: sanitizedContent,
      isMarkdown: isMarkdown || false,
      parentId: parentId || null,
      replyTo: replyTo || null,
      clientIP,
      browser,
      os,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    currentComments.push(newComment);
    await saveComments(postId, currentComments, env);

    const responseData = {
      id: newComment.id,
      nickname: newComment.nickname,
      avatarColor: newComment.avatarColor,
      content: newComment.content,
      isMarkdown: newComment.isMarkdown,
      createdAt: newComment.createdAt,
      parentId: newComment.parentId,
      replyTo: newComment.replyTo,
      browser: newComment.browser,
      os: newComment.os,
    };

    return new Response(
      JSON.stringify({
        success: true,
        comment: responseData,
        total: currentComments.length,
        maxComments: MAX_COMMENTS_PER_POST,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating comment:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create comment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Route incoming comments requests.
 * @param {Request} request
 * @param {Record<string, any>} env
 * @returns {Promise<Response>}
 */
export async function handleComments(request, env) {
  if (request.method === 'OPTIONS') {
    return handleCorsPreflight('GET, POST, OPTIONS');
  }

  const rateLimitResult = await checkRateLimit(request, env);
  if (!rateLimitResult.ok) {
    return addCorsHeaders(createRateLimitResponse(rateLimitResult));
  }

  const url = new URL(request.url);
  const postId = url.searchParams.get('postId');

  if (!postId) {
    return addCorsHeaders(
      new Response(
        JSON.stringify({ error: 'Missing postId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }

  if (request.method === 'GET') {
    return addCorsHeaders(await handleGetComments(postId, env));
  }

  if (request.method === 'POST') {
    const authResult = await verifyAuthHeaders(request, env);
    if (!authResult.ok) {
      return addCorsHeaders(createAuthErrorResponse(authResult));
    }
    return addCorsHeaders(await handleCreateComment(request, postId, env));
  }

  return addCorsHeaders(
    new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    )
  );
}
