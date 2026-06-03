@echo off
setlocal enabledelayedexpansion

echo Starting automated subfolder renaming loop...
echo ==============================================

:: Loop through every subfolder in the current directory
for /d %%D in (*) do (
    echo Processing folder: %%D
    set /a count=1
    
    :: Step 1: Rename files to temporary names to prevent overwrite conflicts
    for /f "delims=" %%f in ('dir /b /a-d "%%D\*.jpg" "%%D\*.jpeg" "%%D\*.png" 2^>nul') do (
        ren "%%D\%%f" "temp_file_!count!%%~xf"
        set /a count+=1
    )
    
    :: Reset counter for final sequential clean name pass
    set /a count=1
    
    :: Step 2: Convert temporary files to final clean sequential numbers (1.jpg, 2.jpg...)
    for /f "delims=" %%f in ('dir /b /a-d "%%D\temp_file_*" 2^>nul') do (
        ren "%%D\%%f" "!count!.jpg"
        set /a count+=1
    )
    
    echo Folder %%D complete. Cleaned !count! files.
    echo ----------------------------------------------
)

echo All image subfolders processed successfully.
pause
