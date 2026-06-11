$src = "landingpage/src/pages/Profile.js"
$allLines = [System.IO.File]::ReadAllLines((Resolve-Path $src))

# Restaurant dashboard: lines 2845-4322 (0-indexed: 2844-4321)
$restDash = $allLines[2844..4321]
[System.IO.File]::WriteAllLines("landingpage/src/pages/_extract_rest_dash.txt", $restDash)
Write-Host "RestDash: $($restDash.Length) lines"

# General onboarding: lines 4323-4759 (0-indexed: 4322-4758)
$genOnboard = $allLines[4322..4758]
[System.IO.File]::WriteAllLines("landingpage/src/pages/_extract_gen_onboard.txt", $genOnboard)
Write-Host "GenOnboard: $($genOnboard.Length) lines"

# General dashboard: lines 4761-5717 (0-indexed: 4760-5716)
$genDash = $allLines[4760..5716]
[System.IO.File]::WriteAllLines("landingpage/src/pages/_extract_gen_dash.txt", $genDash)
Write-Host "GenDash: $($genDash.Length) lines"

# General create form: lines 5719-6000 (0-indexed: 5718-5999)
$genCreate = $allLines[5718..5999]
[System.IO.File]::WriteAllLines("landingpage/src/pages/_extract_gen_create.txt", $genCreate)
Write-Host "GenCreate: $($genCreate.Length) lines"

# Artist dashboard: lines 6002-9026 (0-indexed: 6001-9025)
$artistDash = $allLines[6001..9025]
[System.IO.File]::WriteAllLines("landingpage/src/pages/_extract_artist_dash.txt", $artistDash)
Write-Host "ArtistDash: $($artistDash.Length) lines"

Write-Host "All extractions done!"
