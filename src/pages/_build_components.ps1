param(
    [string]$PagesDir = "landingpage/src/pages"
)

$allLines = [System.IO.File]::ReadAllLines((Resolve-Path "$PagesDir/Profile.js"))

# ── Helper to wrap extracted JSX into a proper component file ──────────────────
function Wrap-Component {
    param(
        [string]$Name,
        [string[]]$Lines,
        [string]$Condition,     # the if() guard line (comment only)
        [string]$Imports        # additional imports block
    )
    $header = @"
/**
 * $Name.js
 * Auto-split from Profile.js — all state and handlers remain in Profile.js
 * and are passed as props. Do NOT add useState/useEffect here.
 */
import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import ImageCropperModal from '../components/profile/ImageCropperModal';
import { getLinkIcon } from '../components/LinkIcons';
import { GENERAL_THEMES, AVAILABLE_FONTS, resolveFontFamily } from '../constants/generalThemes';
import PhoneINInput from '../components/PhoneINInput';
import { getINDisplayDigits, toINFullPhone, getINDisplayDigitsFromWhatsAppStored, toWhatsAppUrlFromINPhone } from '../utils/indianPhone';
import { fixImageUrl } from '../utils/imageHelper';
import PlatformIconSelect from '../components/PlatformIconSelect';
import {
  ALL_PLATFORMS, PremiumToggle, LivePreviewSyncOverlay, RestaurantPublicPreviewIframe,
  buildLinkUrl, SMART_PLATFORMS, MAX_PLATFORM_LINKS, titleForRestaurantLinkPlatform
} from './ProfileHelpers';
$Imports

export default function $Name(props) {
  // Destructure all props passed from Profile.js
  const {
    // auth / user
    user, displayName, displayEmail, avatarLetter, handleLogout,
    // shared state
    cropper, setCropper, isMobileViewport, error, loading,
    // artist
    artist, myArtists, setMyArtists, editingArtist, setEditingArtist,
    activeTab, setActiveTab, dashTheme, dashFont,
    formData, setFormData, saving, setSaving,
    photoFile, setPhotoFile, bgFile, setBgFile,
    previewKey, setPreviewKey, frontendBase,
    onboardingStep, handleOnboardingBack, handleOnboardingNext, handleOnboardingComplete,
    isOnboardingSelectorOpen, setIsOnboardingSelectorOpen,
    onboardingPlatforms, setOnboardingPlatforms,
    onboardingGalleryFiles, setOnboardingGalleryFiles,
    newGalleryName, setNewGalleryName, newGalleryFile, setNewGalleryFile,
    galleryUploading, setGalleryUploading,
    isSelectorOpen, setIsSelectorOpen, tempPlatforms, setTempPlatforms,
    savingLink, setSavingLink, pendingLinks, setPendingLinks,
    editingHeroField, setEditingHeroField, heroUpdates, setHeroUpdates,
    isAddingTag, setIsAddingTag, newTagText, setNewTagText,
    inlineEditing, setInlineEditing, inlineEditValue, setInlineEditValue,
    openSubPanel, setOpenSubPanel, layoutActiveTab, setLayoutActiveTab,
    designSubTab, setDesignSubTab, syncFonts, setSyncFonts,
    linkCopiedArtist, setLinkCopiedArtist,
    mobileHeroEditField, setMobileHeroEditField,
    mobileLinkEditPlatform, setMobileLinkEditPlatform,
    mobileLinkEditLabel, setMobileLinkEditLabel,
    mobileLinkEditValue, setMobileLinkEditValue,
    mobileLinkEditMode, setMobileLinkEditMode,
    mobileHeroDraft, setMobileHeroDraft,
    isUploading, setIsUploading,
    artQrModal, setArtQrModal,
    showArtGallery, setShowArtGallery,
    artGallerySelectedItem, setArtGallerySelectedItem,
    newArtTheme, setNewArtTheme, artSaving, setArtSaving,
    artImagePreview, setArtImagePreview,
    artistsLoading, artistListReady,
    // handlers
    handleSave, handleInputChange, handleUpdateLink, handleUpdateHeroField,
    handleAddTag, handleDeleteTag, handleUpdateLinkLabel, handleUpdateLinkImage,
    handleRemoveLinkImage, handleUpdateLinkLayout, handleUpdateLinkPrioritize,
    handleUploadField, handleAddGalleryItem, handleAddMultipleGalleryItems,
    handleRemoveGalleryItem, togglePlatformInSelector, handlePlatformDone,
    handlePickAndCrop, handlePickAndCropBatch,
    saveMobileHeroField, saveMobileLinkField, saveRestaurantHeroEdit,
    fetchLinkMetadata,
    // refs
    artistGalleryInputRef, artistProfilePhotoInputRef, artistBannerPhotoInputRef,
    artistGalleryAddInputRef, restaurantBannerInputRef, restaurantGalleryInputRef,
    restaurantMenuInputRef, genPhotoInputRef, genGalleryInputRef, genDashBannerInputRef,
    genDashPhotoInputRef, genDashChangePhotoInputRef,
    // artist art
    removeGalleryItem, addGalleryItem, setGalleryItemName, closeEdit,
    // general
    generalProfile, generalProfileLoading, generalStep, setGeneralStep,
    generalOnboardingStep, updateGeneralOnboardingStep, isGeneralPlatformSelectorOpen,
    setIsGeneralPlatformSelectorOpen, generalForm, setGeneralForm,
    generalPhotoPreviewUrl, generalBannerPreviewUrl,
    generalSaving, generalSuccess, setGeneralSuccess,
    generalActiveTab, setGeneralActiveTab,
    suggestionsChanged, setSuggestionsChanged,
    profileChanged, setProfileChanged, linksChanged, setLinksChanged,
    usernameCheck, availabilitySuggestions,
    updateLink, updateSuggestion, handleSuggestionImageUpload,
    handleGeneralFieldSave, handleGeneralPhotoSave, handleGeneralBannerSave,
    handleGeneralSaveAll, handleGeneralCreate, handleGeneralThemeSelect,
    generalDesignSubTab, setGeneralDesignSubTab, generalProfileRef,
    linkCopiedGeneral, setLinkCopiedGeneral,
    // restaurant
    restaurantProfile, setRestaurantProfile, restaurantOnboardingStep,
    updateRestaurantOnboardingStep, restaurantActiveTab, setRestaurantActiveTab,
    restaurantSaving, setRestaurantSaving, restaurantChanged, setRestaurantChanged,
    restaurantGalleryUploading, setRestaurantGalleryUploading,
    restaurantBannerUploading, setRestaurantBannerUploading,
    rBioEditing, setRBioEditing, rBioDraft, setRBioDraft,
    rHeroEditingField, setRHeroEditingField,
    rHeroDraftName, setRHeroDraftName, rHeroDraftTagline, setRHeroDraftTagline,
    rLinkSelectorOpen, setRLinkSelectorOpen, rTempPlatforms, setRTempPlatforms,
    rSyncFonts, setRSyncFonts,
    saveRestaurantProfile, handleRestaurantPublish,
    handlePdfUpload, handleRestaurantBannerUpload, handleRestaurantBannerChangeDashboard,
    pdfNumPages, onPdfLoadSuccess, restaurantForm, setRestaurantForm,
    startRestaurantHeroEdit, persistRestaurant, linkCopiedRest, setLinkCopiedRest,
    handleUpdateHeroFieldRest, rLinkEditOpen, setRLinkEditOpen,
    restaurantBannerFile, restaurantGalleryFile,
    setupLoader, getProfileLink,
    artistChanged, setArtistChanged,
    // misc
    GENERAL_THEMES: _gt, visiblePlatforms, setVisiblePlatforms,
  } = props;

  return (
"@
    $footer = @"
  );
}
"@
    $body = $Lines -join "`n"
    return $header + $body + "`n" + $footer
}

# ── Restaurant Dashboard ───────────────────────────────────────────────────────
$restDashLines = $allLines[2844..4321]
# Strip the opening 'if' guard and its return( — we wrap ourselves
$restBody = $restDashLines | Where-Object { $_ -notmatch '^\s*// Restaurant profile: home' }
$restContent = (Wrap-Component -Name "ProfileRestaurantDashboard" -Lines $restBody -Condition "" -Imports "")
[System.IO.File]::WriteAllText((Resolve-Path $PagesDir).Path + "\ProfileRestaurantDashboard.js", $restContent)
Write-Host "Created ProfileRestaurantDashboard.js"

# ── General Onboarding ────────────────────────────────────────────────────────
$genOnboardLines = $allLines[4322..4758]
$genOnboardContent = (Wrap-Component -Name "ProfileGeneralOnboarding" -Lines $genOnboardLines -Condition "" -Imports "")
[System.IO.File]::WriteAllText((Resolve-Path $PagesDir).Path + "\ProfileGeneralOnboarding.js", $genOnboardContent)
Write-Host "Created ProfileGeneralOnboarding.js"

# ── General Dashboard ─────────────────────────────────────────────────────────
$genDashLines = $allLines[4760..5716]
$genDashContent = (Wrap-Component -Name "ProfileGeneralDashboard" -Lines $genDashLines -Condition "" -Imports "")
[System.IO.File]::WriteAllText((Resolve-Path $PagesDir).Path + "\ProfileGeneralDashboard.js", $genDashContent)
Write-Host "Created ProfileGeneralDashboard.js"

# ── General Create Form ───────────────────────────────────────────────────────
$genCreateLines = $allLines[5718..5999]
$genCreateContent = (Wrap-Component -Name "ProfileGeneralCreate" -Lines $genCreateLines -Condition "" -Imports "")
[System.IO.File]::WriteAllText((Resolve-Path $PagesDir).Path + "\ProfileGeneralCreate.js", $genCreateContent)
Write-Host "Created ProfileGeneralCreate.js"

# ── Artist Dashboard ──────────────────────────────────────────────────────────
$artistDashLines = $allLines[6001..9024]
$artistDashContent = (Wrap-Component -Name "ProfileArtistDashboard" -Lines $artistDashLines -Condition "" -Imports "")
[System.IO.File]::WriteAllText((Resolve-Path $PagesDir).Path + "\ProfileArtistDashboard.js", $artistDashContent)
Write-Host "Created ProfileArtistDashboard.js"

Write-Host "`nAll component files created!"
