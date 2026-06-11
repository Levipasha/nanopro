param(
    [string]$PagesDir = "landingpage/src/pages"
)

$pagesFullPath = (Resolve-Path $PagesDir).Path

# ── Split ProfileArtistDashboard.js ─────────────────────────────────────────
# Current structure:
#   Lines 1-139: Imports + component header + props destructure + return(
#   Lines 140-287: Sidebar + header
#   Lines 288-599: design tab
#   Lines 600-993: link-art / what-i-do tab
#   Lines 994-1555: profiles tab
#   Lines 1556-3030: platforms tab (biggest!)
#   Lines 3031-3143: modals (editingArtist, showArtGallery, isSelectorOpen, mobile bottom nav, cropper)

$artLines = [System.IO.File]::ReadAllLines("$pagesFullPath\ProfileArtistDashboard.js")
Write-Host "ProfileArtistDashboard.js: $($artLines.Length) lines"

# Keep ProfileArtistDashboard.js as sidebar + routing (trimmed), ~500 lines
# Extract platforms tab → ProfileArtistPlatforms.js
# Extract profiles tab → ProfileArtistProfiles.js
# Extract link-art/what-i-do tab → ProfileArtistLinkArt.js

# Find exact split points
$platformsStart = 1556 - 1  # 0-indexed
$profilesStart = 994 - 1
$linksStart = 600 - 1
$designStart = 288 - 1

# --- ProfileArtistPlatforms.js (lines 1556-3030, approx) ---
# Find the start of platforms tab content (line index 1555)
$platformsContent = $artLines[$platformsStart..($artLines.Length - 115)]  # exclude last modals block ~115 lines
$platformsHeader = @"
/**
 * ProfileArtistPlatforms.js
 * The "Digital Platforms" tab content for the artist dashboard.
 * Receives all state/handlers from ProfileArtistDashboard via props.
 */
import React from 'react';
import { getLinkIcon } from '../components/LinkIcons';
import PhoneINInput from '../components/PhoneINInput';
import { getINDisplayDigits, toINFullPhone, getINDisplayDigitsFromWhatsAppStored, toWhatsAppUrlFromINPhone } from '../utils/indianPhone';
import PlatformIconSelect from '../components/PlatformIconSelect';
import { ALL_PLATFORMS, PremiumToggle, SMART_PLATFORMS, buildLinkUrl } from './ProfileHelpers';

export default function ProfileArtistPlatforms(props) {
  const {
    artist, myArtists, frontendBase, isMobileViewport,
    pendingLinks, setPendingLinks, savingLink, visiblePlatforms, setVisiblePlatforms,
    openSubPanel, setOpenSubPanel, layoutActiveTab, setLayoutActiveTab,
    handleUpdateLink, handleUpdateLinkLabel, handleUpdateLinkImage, handleRemoveLinkImage,
    handleUpdateLinkLayout, handleUpdateLinkPrioritize, fetchLinkMetadata,
    setTempPlatforms, setIsSelectorOpen, previewKey,
    mobileLinkEditPlatform, setMobileLinkEditPlatform,
    mobileLinkEditLabel, mobileLinkEditValue, setMobileLinkEditValue,
    mobileLinkEditMode, setMobileLinkEditMode,
    handlePickAndCrop, handlePickAndCropBatch,
  } = props;

  return (
"@
$platformsFooter = @"
  );
}
"@
$platformsFile = $platformsHeader + ($platformsContent -join "`n") + "`n" + $platformsFooter
[System.IO.File]::WriteAllText("$pagesFullPath\ProfileArtistPlatforms.js", $platformsFile)
Write-Host "Created ProfileArtistPlatforms.js: $($platformsContent.Length) lines"

# --- ProfileArtistProfiles.js (lines 994-1555) ---
$profilesContent = $artLines[$profilesStart..($platformsStart - 1)]
$profilesHeader = @"
/**
 * ProfileArtistProfiles.js
 * The "Artist Profiles" tab content for the artist dashboard.
 * Receives all state/handlers from ProfileArtistDashboard via props.
 */
import React from 'react';
import { getLinkIcon } from '../components/LinkIcons';
import { GENERAL_THEMES, AVAILABLE_FONTS, resolveFontFamily } from '../constants/generalThemes';
import { LivePreviewSyncOverlay } from './ProfileHelpers';

export default function ProfileArtistProfiles(props) {
  const {
    artist, myArtists, setMyArtists, frontendBase, isMobileViewport, error,
    previewKey, isUploading, editingHeroField, setEditingHeroField,
    heroUpdates, setHeroUpdates, isAddingTag, setIsAddingTag,
    newTagText, setNewTagText, mobileHeroEditField, setMobileHeroEditField,
    mobileHeroDraft, setMobileHeroDraft, savingLink, saving, setSaving,
    handleUpdateHeroField, handleAddTag, handleDeleteTag, handleRemoveGalleryItem,
    handleAddMultipleGalleryItems, handleUploadField, handlePickAndCrop,
    artistsLoading, setError, loadMyProfiles, setPreviewKey,
    artistGalleryInputRef, galleryUploading,
  } = props;

  return (
"@
$profilesFooter = @"
  );
}
"@
$profilesFile = $profilesHeader + ($profilesContent -join "`n") + "`n" + $profilesFooter
[System.IO.File]::WriteAllText("$pagesFullPath\ProfileArtistProfiles.js", $profilesFile)
Write-Host "Created ProfileArtistProfiles.js: $($profilesContent.Length) lines"

Write-Host "`nArtist dashboard splits done!"

# ── Split ProfileRestaurantDashboard.js ────────────────────────────────────
$restLines = [System.IO.File]::ReadAllLines("$pagesFullPath\ProfileRestaurantDashboard.js")
Write-Host "ProfileRestaurantDashboard.js: $($restLines.Length) lines"

# Find the menu tab boundary in the restaurant dashboard
$restDesignStart = 0
for ($i = 0; $i -lt $restLines.Length; $i++) {
    if ($restLines[$i] -match "restaurantActiveTab === 'design'") {
        $restDesignStart = $i
        Write-Host "Restaurant design tab at line $i"
        break
    }
}
Write-Host "Restaurant dashboard split analysis done"

# ── Split ProfileGeneralDashboard.js ──────────────────────────────────────
$genDashLines = [System.IO.File]::ReadAllLines("$pagesFullPath\ProfileGeneralDashboard.js")
Write-Host "ProfileGeneralDashboard.js: $($genDashLines.Length) lines"

# Find tab boundaries
for ($i = 0; $i -lt $genDashLines.Length; $i++) {
    if ($genDashLines[$i] -match "generalActiveTab === 'links'") {
        Write-Host "General links tab found at line $i"
        break
    }
}

Write-Host "`nAnalysis done."
