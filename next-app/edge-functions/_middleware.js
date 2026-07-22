// EdgeOne Pages Middleware - SPA 路由支持
// 将所有非静态资源请求重定向到 index.html

export default async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 静态资源直接放行（按优先级排序）
  const isStaticAsset =
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/image/') ||
    pathname.startsWith('/data/') ||
    pathname.startsWith('/config/') ||
    pathname.startsWith('/docs/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/Assets/') ||
    pathname.startsWith('/ThirdParty/') ||
    pathname.startsWith('/Widgets/') ||
    pathname.startsWith('/Workers/') ||
    pathname.startsWith('/map-data/') ||
    pathname.startsWith('/cesium/') ||
    pathname.startsWith('/ Workers/') ||
    /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|json|woff|woff2|ttf|eot|otf|mp4|webm|pdf|txt|xml)$/i.test(pathname);

  if (isStaticAsset) {
    return context.next();
  }

  // 首页直接放行
  if (pathname === '/' || pathname === '/index.html') {
    return context.next();
  }

  // SPA 路由：重写为 index.html（保持 URL 不变）
  // 使用 200 状态码返回 index.html 内容
  const indexRequest = new Request(new URL('/index.html', url.origin), request);
  const response = await fetch(indexRequest);

  // 创建新响应，保持 200 状态码
  return new Response(response.body, {
    status: 200,
    statusText: 'OK',
    headers: response.headers,
  });
}
