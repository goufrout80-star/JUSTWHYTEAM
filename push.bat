@echo off
git add -A
git commit -m "fix: health check - dead files removed, banned col, RLS fixed, emails cleaned"
git push origin main
echo PUSH COMPLETE
