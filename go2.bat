@echo off
git add -A
git commit -m "fix: Deno types config, admin projects RLS, delete-user 401, req types, catch types"
git push origin main
echo DONE
del %0
