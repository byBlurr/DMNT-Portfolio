@echo off
setlocal enabledelayedexpansion

echo ==============================================
echo STARTING SMART IMAGE MERGE PIPELINE
echo ==============================================

:: Loop through every subfolder in the current directory
for /d %%D in (*) do (
    echo.
    echo [Processing Folder: %%D]
    
    :: Step 1: Find the highest existing clean number in this folder
    set /a max_clean=0
    for /f "delims=" %%f in ('dir /b /a-d "%%D\*.jpg" 2^>nul') do (
        set "filename=%%~nf"
        
        :: Test if the filename is purely numeric
        var_test=
        for /f "delims=0123456789" %%t in ("!filename!") do set "var_test=%%t"
        
        if not defined var_test (
            if !filename! GTR !max_clean! (
                set /a max_clean=!filename!
            )
        )
    )
    
    echo - Found !max_clean! existing cleanly numbered assets.
    set /a count=!max_clean! + 1
    set /a raw_renamed=0

    :: Step 2: Isolating and safely staging only NEW unnumbered files
    for /f "delims=" %%f in ('dir /b /a-d "%%D\*.jpg" "%%D\*.jpeg" "%%D\*.png" 2^>nul') do (
        set "filename=%%~nf"
        set "var_test="
        for /f "delims=0123456789" %%t in ("!filename!") do set "var_test=%%t"
        
        :: If it is NOT a clean number, stage it with a temp tag
        if defined var_test (
            ren "%%D\%%f" "temp_merge_!count!%%~xf"
            set /a count+=1
            set /a raw_renamed+=1
        )
    )

    :: Step 3: Final pass converting temporary tags to standard sequential .jpg rows
    set /a final_count=!max_clean! + 1
    for /f "delims=" %%f in ('dir /b /a-d "%%D\temp_merge_*" 2^>nul') do (
        ren "%%D\%%f" "!final_count!.jpg"
        set /a final_count+=1
    )

    if !raw_renamed! GTR 0 (
        echo - Successfully merged !raw_renamed! new assets into the sequence.
    ) else (
        echo - No new raw files detected. Sequence preserved untouched.
    )
)

echo.
echo ==============================================
echo PIPELINE PROCESSING COMPLETE SUCCESSFULLY.
echo ==============================================
pause
