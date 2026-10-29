@echo off
rem Runs the AI company once: processes every pending request in workspace\00-requests.
cd /d "%~dp0"
claude -p "Follow CLAUDE.md. Process every pending request in workspace/00-requests, then give the final report in Japanese."
pause
