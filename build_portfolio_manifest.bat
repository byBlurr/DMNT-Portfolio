@echo off
setlocal enabledelayedexpansion

:: ==============================================================================
:: PART 1: Rename All Folders (Originally rename_all_folders.bat)
:: ==============================================================================
echo Starting automated subfolder renaming loop...
echo ==============================================

:: Change directory to the images folder safely
pushd "%~dp0images"

:: Loop through every subfolder in the images directory
for /d %%D in (*) do (
    echo Processing folder: %%D
    set /a count=1
    
    :: Step 1: Rename files to temporary names to prevent overwrite conflicts
    for /f "delims=" %%f in ('dir /b /a-d "%%d\*.jpg" "%%d\*.jpeg" 2^>nul') do (
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

:: Return back to the root folder safely
popd


:: ==============================================================================
:: PART 2: Generate Manifest (Originally generate_manifest.bat)
:: ==============================================================================
set "categories=sport automotive wildlife other"
set "manifestFile=images\manifest.js"

echo.
echo ✨ Scanning portfolio folders and generating script manifest...

:: Start the executable javascript wrapper syntax
echo const portfolioManifest = {> "%manifestFile%"

set "firstCategory=1"

for %%c in (%categories%) do (
    if "!firstCategory!"=="0" (
        echo ,>> "%manifestFile%"
    )
    set "firstCategory=0"
    
    <nul set /p ="  "%%c": [">> "%manifestFile%"
    
    set "firstImage=1"
    for /f "tokens=*" %%f in ('dir /b /a-d "images\%%c\*.jpg" 2^>nul') do (
        if "!firstImage!"=="0" (
            <nul set /p =", ">> "%manifestFile%"
        )
        set "firstImage=0"
        <nul set /p =""%%f"" >> "%manifestFile%"
    )
    
    <nul set /p =" ]">> "%manifestFile%"
)

echo.>> "%manifestFile%"
echo };>> "%manifestFile%"

echo.
echo ✅ Script manifest saved cleanly to "%manifestFile%"
echo.

endlocal
pause
