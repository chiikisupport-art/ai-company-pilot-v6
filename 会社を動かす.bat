@echo off
rem Runs the AI company once: processes every pending request in workspace\00-requests,
rem saves the report to reports\last-run.txt and opens it in Notepad.
cd /d "%~dp0"
if not exist reports mkdir reports
echo NEXUS company: working... > reports\last-run.txt
claude -p "Follow CLAUDE.md. Process every pending request in workspace/00-requests, then give the final report in Japanese. If there is no pending request, say so in one line." > reports\last-run.txt 2>&1
start "" notepad "%~dp0reports\last-run.txt"
