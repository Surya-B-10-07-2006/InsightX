// vite.config.ts
import { defineConfig } from "file:///C:/Users/mrsur/Downloads/ML/InsightX/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/mrsur/Downloads/ML/InsightX/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, res) => {
            console.error("[Vite Proxy] /api \u2192 FastAPI connection error:", err.message);
            if (!res.headersSent) {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ detail: "Backend unavailable \u2014 ensure FastAPI is running on port 8000." }));
            }
          });
        }
      }
    },
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://127.0.0.1:8000 http://localhost:8000 ws://localhost:5173 ws://127.0.0.1:5173 ws://localhost:5174 ws://127.0.0.1:5174; img-src 'self' data: blob:; font-src 'self' data:; worker-src blob:;"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxtcnN1clxcXFxEb3dubG9hZHNcXFxcTUxcXFxcSW5zaWdodFhcXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXG1yc3VyXFxcXERvd25sb2Fkc1xcXFxNTFxcXFxJbnNpZ2h0WFxcXFxmcm9udGVuZFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvbXJzdXIvRG93bmxvYWRzL01ML0luc2lnaHRYL2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDUxNzMsXG4gICAgaG9zdDogdHJ1ZSxcbiAgICBwcm94eToge1xuICAgICAgJy9hcGknOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly8xMjcuMC4wLjE6ODAwMCcsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgd3M6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyZTogKHByb3h5LCBfb3B0aW9ucykgPT4ge1xuICAgICAgICAgIHByb3h5Lm9uKCdlcnJvcicsIChlcnIsIF9yZXEsIHJlcykgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1ZpdGUgUHJveHldIC9hcGkgXHUyMTkyIEZhc3RBUEkgY29ubmVjdGlvbiBlcnJvcjonLCBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICBpZiAoIXJlcy5oZWFkZXJzU2VudCkge1xuICAgICAgICAgICAgICAocmVzIGFzIGFueSkud3JpdGVIZWFkKDUwMiwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICAgICAgICAgICAgICAocmVzIGFzIGFueSkuZW5kKEpTT04uc3RyaW5naWZ5KHsgZGV0YWlsOiAnQmFja2VuZCB1bmF2YWlsYWJsZSBcdTIwMTQgZW5zdXJlIEZhc3RBUEkgaXMgcnVubmluZyBvbiBwb3J0IDgwMDAuJyB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgaGVhZGVyczoge1xuICAgICAgJ1gtQ29udGVudC1UeXBlLU9wdGlvbnMnOiAnbm9zbmlmZicsXG4gICAgICAnWC1GcmFtZS1PcHRpb25zJzogJ0RFTlknLFxuICAgICAgJ1gtWFNTLVByb3RlY3Rpb24nOiAnMTsgbW9kZT1ibG9jaycsXG4gICAgICAnUmVmZXJyZXItUG9saWN5JzogJ3N0cmljdC1vcmlnaW4td2hlbi1jcm9zcy1vcmlnaW4nLFxuICAgICAgJ1Blcm1pc3Npb25zLVBvbGljeSc6ICdjYW1lcmE9KCksIG1pY3JvcGhvbmU9KCksIGdlb2xvY2F0aW9uPSgpJyxcbiAgICAgICdDb250ZW50LVNlY3VyaXR5LVBvbGljeSc6XG4gICAgICAgIFwiZGVmYXVsdC1zcmMgJ3NlbGYnOyBzY3JpcHQtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZSc7IHN0eWxlLXNyYyAnc2VsZicgJ3Vuc2FmZS1pbmxpbmUnOyBjb25uZWN0LXNyYyAnc2VsZicgaHR0cDovLzEyNy4wLjAuMTo4MDAwIGh0dHA6Ly9sb2NhbGhvc3Q6ODAwMCB3czovL2xvY2FsaG9zdDo1MTczIHdzOi8vMTI3LjAuMC4xOjUxNzMgd3M6Ly9sb2NhbGhvc3Q6NTE3NCB3czovLzEyNy4wLjAuMTo1MTc0OyBpbWctc3JjICdzZWxmJyBkYXRhOiBibG9iOjsgZm9udC1zcmMgJ3NlbGYnIGRhdGE6OyB3b3JrZXItc3JjIGJsb2I6O1wiLFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBdVUsU0FBUyxvQkFBb0I7QUFDcFcsT0FBTyxXQUFXO0FBRWxCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixJQUFJO0FBQUEsUUFDSixXQUFXLENBQUMsT0FBTyxhQUFhO0FBQzlCLGdCQUFNLEdBQUcsU0FBUyxDQUFDLEtBQUssTUFBTSxRQUFRO0FBQ3BDLG9CQUFRLE1BQU0sc0RBQWlELElBQUksT0FBTztBQUMxRSxnQkFBSSxDQUFDLElBQUksYUFBYTtBQUNwQixjQUFDLElBQVksVUFBVSxLQUFLLEVBQUUsZ0JBQWdCLG1CQUFtQixDQUFDO0FBQ2xFLGNBQUMsSUFBWSxJQUFJLEtBQUssVUFBVSxFQUFFLFFBQVEscUVBQWdFLENBQUMsQ0FBQztBQUFBLFlBQzlHO0FBQUEsVUFDRixDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCwwQkFBMEI7QUFBQSxNQUMxQixtQkFBbUI7QUFBQSxNQUNuQixvQkFBb0I7QUFBQSxNQUNwQixtQkFBbUI7QUFBQSxNQUNuQixzQkFBc0I7QUFBQSxNQUN0QiwyQkFDRTtBQUFBLElBQ0o7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
