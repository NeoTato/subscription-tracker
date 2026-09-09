Set WshShell = CreateObject("WScript.Shell")
Dim scriptDir
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Run uvicorn completely hidden (0 = hidden window)
WshShell.CurrentDirectory = scriptDir
WshShell.Run """" & scriptDir & "\.venv\Scripts\python.exe"" -m uvicorn main:app --host 127.0.0.1 --port 8000", 0, False

' Wait 2 seconds and open browser
WScript.Sleep 2000
WshShell.Run "http://127.0.0.1:8000"

