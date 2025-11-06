@echo off
cd /d "%~dp0"
echo Starting Streaming Finder...
start http://localhost:3000
npm run dev
