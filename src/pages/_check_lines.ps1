Get-ChildItem "landingpage/src/pages/Profile*.js" | ForEach-Object {
    $count = (Get-Content $_.FullName).Count
    Write-Host ($_.Name + ": " + $count + " lines")
}
