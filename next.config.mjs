/** @type {import('next').NextConfig} */
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseHost = 'fenfgjqlsqzvxloeavdc.supabase.co';

const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: Next.js requires unsafe-eval in dev; unsafe-inline needed for inline handlers
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      // Styles: Tailwind/shadcn inject inline styles
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' data: https://fonts.gstatic.com",
      // Images: allow data URIs, blobs (PDF previews) and any HTTPS (logos, avatars)
      "img-src 'self' data: blob: https:",
      // Connections: Supabase REST + Realtime (wss), OpenAI via edge functions only
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.openai.com https://www.googleapis.com`,
      // Media/files from Supabase Storage
      `media-src 'self' https://${supabaseHost}`,
      // Workers: Next.js service worker
      "worker-src 'self' blob:",
      // Frames: deny all
      "frame-src 'none'",
      "frame-ancestors 'none'",
      // Other
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // Remove X-Powered-By: Next.js header
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
