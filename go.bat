@echo off
git add -A
git commit -m "fix: vite8 manualChunks, safe realtime migration, 401 auth header, realtime hooks"
git push origin main
echo DONE
del %0
