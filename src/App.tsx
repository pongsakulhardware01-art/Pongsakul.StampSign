import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from './lib/firebase';
import {
  subscribeToSavedAssets,
  createSavedAsset,
  updateAssetPlacementPreferences,
  deleteSavedAsset,
  migrateLocalAssetsToCloud,
} from './services/stampService';
import { Navbar } from './components/Navbar';
import { CanvasArea } from './components/CanvasArea';
import { LayerPanel } from './components/LayerPanel';
import { SavedAssetsSidebar } from './components/SavedAssetsSidebar';
import { StampMakerModal } from './components/StampMakerModal';
import { SignaturePadModal } from './components/SignaturePadModal';
import { UploadModal } from './components/UploadModal';
import { TextSignatureModal } from './components/TextSignatureModal';
import { ExportModal } from './components/ExportModal';
import { AuthModal } from './components/AuthModal';
import { Layer, SavedAsset } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [savedAssets, setSavedAssets] = useState<SavedAsset[]>([]);

  // Base Document State (Only user-uploaded images, no pre-made templates)
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null);
  const [baseImageName, setBaseImageName] = useState<string>('เอกสารของฉัน');
  const [baseImageDimensions, setBaseImageDimensions] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 800,
  });

  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0.75);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sidebars
  const [isLibraryPanelOpen, setIsLibraryPanelOpen] = useState<boolean>(true);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState<boolean>(true);

  // History Undo / Redo
  const [history, setHistory] = useState<Layer[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isHistoryUpdate = useRef<boolean>(false);

  // Modals state
  const [isStampMakerOpen, setIsStampMakerOpen] = useState<boolean>(false);
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isTextSignatureOpen, setIsTextSignatureOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Listen to Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await migrateLocalAssetsToCloud(currentUser.uid);
      }
    });
    return () => unsub();
  }, []);

  // Listen to Cloud / Local Saved Assets
  useEffect(() => {
    const unsub = subscribeToSavedAssets(user ? user.uid : null, (assets) => {
      setSavedAssets(assets);
    });
    return () => unsub();
  }, [user]);

  // Record history
  const pushToHistory = useCallback(
    (newLayers: Layer[]) => {
      if (isHistoryUpdate.current) {
        isHistoryUpdate.current = false;
        return;
      }
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, newLayers];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isHistoryUpdate.current = true;
      const prevLayers = history[historyIndex - 1];
      setLayers(prevLayers);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isHistoryUpdate.current = true;
      const nextLayers = history[historyIndex + 1];
      setLayers(nextLayers);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [history, historyIndex]);

  // Global keyboard shortcuts (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleUndo, handleRedo]);

  // Base Image Upload handler
  const handleUploadBaseImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        setBaseImageUrl(url);
        setBaseImageName(file.name);
        setBaseImageDimensions({ width: w, height: h });
        const defaultZoom = Math.min(900 / w, 650 / h, 1);
        setZoom(defaultZoom);
        setPan({ x: 0, y: 0 });
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  // Helper to add a layer on canvas
  const addLayerToCanvas = (
    dataUrl: string,
    name: string,
    naturalW: number,
    naturalH: number,
    type: Layer['type'] = 'stamp',
    defaultBlendMode: Layer['blendMode'] = 'multiply',
    rememberedPrefs?: {
      relativeX?: number;
      relativeY?: number;
      relativeWidth?: number;
      rotation?: number;
      opacity?: number;
      assetId?: string;
    }
  ): Layer => {
    const aspect = naturalW / naturalH;
    const docW = baseImageDimensions.width;
    const docH = baseImageDimensions.height;

    let targetW = rememberedPrefs?.relativeWidth
      ? rememberedPrefs.relativeWidth * docW
      : Math.min(Math.max(160, docW * 0.25), 450);
    let targetH = targetW / aspect;

    let posX =
      rememberedPrefs?.relativeX !== undefined
        ? rememberedPrefs.relativeX * docW
        : Math.max(20, (docW - targetW) / 2);

    let posY =
      rememberedPrefs?.relativeY !== undefined
        ? rememberedPrefs.relativeY * docH
        : Math.max(20, (docH - targetH) / 2);

    // Keep within bounds
    posX = Math.max(0, Math.min(docW - targetW, posX));
    posY = Math.max(0, Math.min(docH - targetH, posY));

    const newLayer: Layer = {
      id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      assetId: rememberedPrefs?.assetId,
      type,
      name,
      x: Math.round(posX),
      y: Math.round(posY),
      width: Math.round(targetW),
      height: Math.round(targetH),
      rotation: rememberedPrefs?.rotation !== undefined ? rememberedPrefs.rotation : 0,
      opacity: rememberedPrefs?.opacity !== undefined ? rememberedPrefs.opacity : 0.95,
      blendMode: defaultBlendMode,
      flipX: false,
      flipY: false,
      locked: false,
      visible: true,
      imageUrl: dataUrl,
      aspectRatio: aspect,
    };

    const nextLayers = [...layers, newLayer];
    setLayers(nextLayers);
    setSelectedLayerId(newLayer.id);
    pushToHistory(nextLayers);

    return newLayer;
  };

  // Apply a Saved Asset using its remembered placement and size!
  const handleApplySavedAsset = (asset: SavedAsset) => {
    // If no document uploaded yet, prompt to upload document first
    if (!baseImageUrl) {
      fileInputRef.current?.click();
      return;
    }

    addLayerToCanvas(
      asset.imageUrl,
      asset.name,
      asset.width,
      asset.height,
      asset.type,
      asset.blendMode,
      {
        relativeX: asset.relativeX,
        relativeY: asset.relativeY,
        relativeWidth: asset.relativeWidth,
        rotation: asset.rotation,
        opacity: asset.opacity,
        assetId: asset.id,
      }
    );
  };

  // Remember Position & Size handler
  const handleSaveLayerPlacement = async (layer: Layer) => {
    const docW = baseImageDimensions.width;
    const docH = baseImageDimensions.height;

    const relativeX = Math.max(0, Math.min(1, layer.x / docW));
    const relativeY = Math.max(0, Math.min(1, layer.y / docH));
    const relativeWidth = Math.max(0.05, Math.min(1, layer.width / docW));

    if (layer.assetId) {
      // Update existing asset preferences
      await updateAssetPlacementPreferences(layer.assetId, {
        relativeX,
        relativeY,
        relativeWidth,
        width: layer.width,
        height: layer.height,
        rotation: layer.rotation,
        opacity: layer.opacity,
        blendMode: layer.blendMode,
      });
    } else {
      // Save as new asset to Cloud/Local library
      const created = await createSavedAsset({
        name: layer.name,
        type: layer.type,
        imageUrl: layer.imageUrl,
        width: layer.width,
        height: layer.height,
        rotation: layer.rotation,
        opacity: layer.opacity,
        blendMode: layer.blendMode,
        relativeX,
        relativeY,
        relativeWidth,
      });
      // Link layer to the newly created asset
      handleUpdateLayer(layer.id, { assetId: created.id });
    }
  };

  // Layer manipulation handlers
  const handleUpdateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  };

  const handleDeleteLayer = (id: string) => {
    const nextLayers = layers.filter((l) => l.id !== id);
    setLayers(nextLayers);
    if (selectedLayerId === id) {
      setSelectedLayerId(nextLayers.length > 0 ? nextLayers[nextLayers.length - 1].id : null);
    }
    pushToHistory(nextLayers);
  };

  const handleDuplicateLayer = (id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;

    const dup: Layer = {
      ...layer,
      id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: `${layer.name} (สำเนา)`,
      x: layer.x + 24,
      y: layer.y + 24,
    };

    const nextLayers = [...layers, dup];
    setLayers(nextLayers);
    setSelectedLayerId(dup.id);
    pushToHistory(nextLayers);
  };

  const handleToggleVisibility = (id: string) => {
    const nextLayers = layers.map((l) =>
      l.id === id ? { ...l, visible: !l.visible } : l
    );
    setLayers(nextLayers);
    pushToHistory(nextLayers);
  };

  const handleToggleLock = (id: string) => {
    const nextLayers = layers.map((l) =>
      l.id === id ? { ...l, locked: !l.locked } : l
    );
    setLayers(nextLayers);
  };

  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    const index = layers.findIndex((l) => l.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index + 1 : index - 1;
    if (newIndex < 0 || newIndex >= layers.length) return;

    const newLayers = [...layers];
    const [moved] = newLayers.splice(index, 1);
    newLayers.splice(newIndex, 0, moved);

    setLayers(newLayers);
    pushToHistory(newLayers);
  };

  // Drag & drop file onto the whole page
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleUploadBaseImage(file);
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-100 font-sans"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadBaseImage(file);
        }}
        accept="image/*"
        className="hidden"
      />

      {/* Top Navbar */}
      <Navbar
        onOpenStampMaker={() => setIsStampMakerOpen(true)}
        onOpenSignaturePad={() => setIsSignaturePadOpen(true)}
        onOpenUploadSignature={() => setIsUploadOpen(true)}
        onOpenTextSignature={() => setIsTextSignatureOpen(true)}
        onUploadBaseImage={handleUploadBaseImage}
        onOpenExport={() => setIsExportOpen(true)}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        toggleLayerPanel={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
        isLayerPanelOpen={isLayerPanelOpen}
        layerCount={layers.length}
        toggleLibraryPanel={() => setIsLibraryPanelOpen(!isLibraryPanelOpen)}
        isLibraryPanelOpen={isLibraryPanelOpen}
        savedAssetsCount={savedAssets.length}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Saved Assets & Cloud Library Sidebar */}
        {isLibraryPanelOpen && (
          <aside className="w-72 h-full shrink-0 z-20">
            <SavedAssetsSidebar
              assets={savedAssets}
              user={user}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onApplyAsset={handleApplySavedAsset}
              onDeleteAsset={deleteSavedAsset}
              onOpenCreateStamp={() => setIsStampMakerOpen(true)}
              onOpenDrawSignature={() => setIsSignaturePadOpen(true)}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          </aside>
        )}

        {/* Central Canvas Area */}
        <main className="flex-1 h-full relative overflow-hidden">
          <CanvasArea
            baseImageUrl={baseImageUrl}
            baseImageDimensions={baseImageDimensions}
            layers={layers}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
            onUpdateLayer={handleUpdateLayer}
            onDeleteLayer={handleDeleteLayer}
            onDuplicateLayer={handleDuplicateLayer}
            onSaveLayerPlacement={handleSaveLayerPlacement}
            onUploadDocument={() => fileInputRef.current?.click()}
            zoom={zoom}
            setZoom={setZoom}
            pan={pan}
            setPan={setPan}
          />
        </main>

        {/* Right Collapsible Layer Management Panel */}
        {isLayerPanelOpen && (
          <aside className="w-72 h-full p-3 border-l border-zinc-200 bg-white shrink-0 flex flex-col z-20 shadow-xs">
            <LayerPanel
              layers={layers}
              selectedLayerId={selectedLayerId}
              onSelectLayer={setSelectedLayerId}
              onToggleVisibility={handleToggleVisibility}
              onToggleLock={handleToggleLock}
              onDeleteLayer={handleDeleteLayer}
              onDuplicateLayer={handleDuplicateLayer}
              onMoveLayer={handleMoveLayer}
            />
          </aside>
        )}
      </div>

      {/* Modals */}
      <StampMakerModal
        isOpen={isStampMakerOpen}
        onClose={() => setIsStampMakerOpen(false)}
        onAddStamp={async (url, name, saveToLibrary) => {
          const l = addLayerToCanvas(url, name, 500, 500, 'stamp', 'multiply');
          if (saveToLibrary) {
            await handleSaveLayerPlacement(l);
          }
        }}
      />

      <SignaturePadModal
        isOpen={isSignaturePadOpen}
        onClose={() => setIsSignaturePadOpen(false)}
        onAddSignature={async (url, w, h, name, saveToLibrary) => {
          const l = addLayerToCanvas(url, name, w, h, 'signature', 'multiply');
          if (saveToLibrary) {
            await handleSaveLayerPlacement(l);
          }
        }}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddLayer={async (url, name, w, h, saveToLibrary) => {
          const l = addLayerToCanvas(url, name, w, h, 'image', 'multiply');
          if (saveToLibrary) {
            await handleSaveLayerPlacement(l);
          }
        }}
      />

      <TextSignatureModal
        isOpen={isTextSignatureOpen}
        onClose={() => setIsTextSignatureOpen(false)}
        onAddTextSignature={async (url, name, w, h, saveToLibrary) => {
          const l = addLayerToCanvas(url, `ลายเซ็น: ${name}`, w, h, 'signature', 'multiply');
          if (saveToLibrary) {
            await handleSaveLayerPlacement(l);
          }
        }}
      />

      {baseImageUrl && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          baseImageUrl={baseImageUrl}
          layers={layers}
          baseImageName={baseImageName}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        savedAssetsCount={savedAssets.length}
      />
    </div>
  );
}
