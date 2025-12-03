import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import type { Plugin } from 'vite'

// 自定义插件：拦截 /uploads 请求并转发到后端
const uploadsProxyPlugin = (): Plugin => ({
  name: 'uploads-proxy',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url?.startsWith('/uploads/')) {
        console.log('[自定义代理] 图片请求:', req.url);
        
        // 转发到后端
        const backendUrl = `http://localhost:3000${req.url}`;
        
        try {
          const response = await fetch(backendUrl);
          const contentType = response.headers.get('content-type');
          const buffer = await response.arrayBuffer();
          
          console.log('[自定义代理] 后端响应:', response.status, contentType, buffer.byteLength, 'bytes');
          
          // 设置响应头
          res.statusCode = response.status;
          if (contentType) {
            res.setHeader('Content-Type', contentType);
          }
          res.setHeader('Content-Length', buffer.byteLength);
          res.setHeader('Cache-Control', 'public, max-age=31536000');
          
          // 返回图片数据
          res.end(Buffer.from(buffer));
        } catch (error) {
          console.error('[自定义代理] 错误:', error);
          res.statusCode = 500;
          res.end('Proxy error');
        }
        return;
      }
      next();
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    uploadsProxyPlugin(), // 使用自定义代理插件
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 保留原始的 Content-Type 头，特别是 multipart/form-data 的 boundary
            if (req.headers['content-type']) {
              proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
          });
        }
      }
    }
  }
})
