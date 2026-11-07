@echo off
echo ========================================================
echo   Starting SwitchWarRoom: Multi-Agent SRE Swarm
echo   Powered by Switch AI for the Flip the Switch Hackathon
echo ========================================================
echo.
echo Installing dependencies if needed...
call npm install
echo.
echo Starting backend and frontend simultaneously...
call npm run dev

