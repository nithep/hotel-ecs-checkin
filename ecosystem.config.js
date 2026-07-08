module.exports = {
  apps: [
    {
      name: "hotel-backend",
      script: "./backend/server.js", 
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M', // ปรับขึ้นสำหรับ Pi 4 ให้ทำงานได้เต็มประสิทธิภาพ
      env: {
        NODE_ENV: "production",
        PBX_MODE: "tcp",
        PBX_HOST: "127.0.0.1",
        PBX_PORT: 10001
      }
    },
    {
      name: "hotel-pbx-connector",
      script: "./pbx-connector/index.js", 
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "hotel-frontend",
      script: "npm", 
      args: "run preview --prefix frontend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: "production",
        PORT: 5173
      }
    }
  ]
};
