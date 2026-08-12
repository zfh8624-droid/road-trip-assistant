# ============================================================
# Zeabur 部署 —— 行野 · 自驾出行（纯静态前端）
# 基础镜像：nginx:stable-alpine（轻量、安全）
# ============================================================
FROM nginx:stable-alpine

# ---------- 元数据标签（Zeabur 控制台可读） ----------
LABEL maintainer="Xingye Road Trip"
LABEL description="行野自驾出行 —— 全国自驾路线规划 Web 应用"
LABEL io.zeabur.app.name="road-trip-assistant"

# ---------- 自定义 nginx 配置 ----------
# 开启 gzip 压缩，设置合理缓存策略，监听 Zeabur 推荐端口 8080
RUN rm -f /etc/nginx/conf.d/default.conf
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen       8080;
    server_name  _;
    root         /usr/share/nginx/html;
    index        index.html;

    # gzip 压缩（HTML / CSS / JS / 字体）
    gzip on;
    gzip_types text/html text/css application/javascript image/svg+xml font/woff2;
    gzip_min_length 1024;
    gzip_vary on;

    # 静态资源缓存（图片、字体等带 hash 的资源可长期缓存）
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 主页面 —— 不缓存确保内容即时更新
    location / {
        expires -1;
        add_header Cache-Control "no-cache";
        try_files $uri /index.html;
    }
}
EOF

# ---------- 复制静态文件 ----------
COPY index.html /usr/share/nginx/html/index.html
COPY assets/    /usr/share/nginx/html/assets/

# ---------- 安全：非 root 运行 ----------
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html
USER nginx

# ---------- Zeabur 端口（Web 服务默认 8080） ----------
EXPOSE 8080

# ---------- 健康检查 ----------
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1