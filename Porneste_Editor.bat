@echo off
cd /d "%~dp0"
title Editor Documente - Server (inchide fereastra asta cand termini)
echo Pornesc Editorul de documente...
start "" http://127.0.0.1:8791/Editor_Documente.html
python -m http.server 8791 --bind 127.0.0.1
