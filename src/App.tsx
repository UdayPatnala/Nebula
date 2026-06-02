/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { LandingScreen } from "./components/Landing/LandingScreen";
import { StyleScreen } from "./components/Landing/StyleScreen";
import { ProcessingScreen } from "./components/Processing/ProcessingScreen";
import { PresentationScreen } from "./components/Gallery/PresentationScreen";
import { SharedGallery } from "./components/Gallery/SharedGallery";
import { useNebulaPipeline } from "./hooks/useNebulaPipeline";

export default function App() {
  const pipeline = useNebulaPipeline();

  // Detect and extract shared gallery persistent ID if route matches
  const pathParts = window.location.pathname.split("/");
  const isSharedGalleryRoute = pathParts[1] === "gallery" && !!pathParts[2];
  const sharedId = isSharedGalleryRoute ? pathParts[2] : null;

  // Hover & mouse coordinates for interactive cosmic effects
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const landingRef = useRef<HTMLDivElement>(null);

  // Parallax stars background movement on landing page
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!landingRef.current) return;
    const rect = landingRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x: x * 30, y: y * 30 });
  };

  const numAssets = pipeline.isDemoPreloading
    ? pipeline.images.length
    : pipeline.selectedFiles.length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500/20 selection:text-indigo-900 dark:selection:text-indigo-100 relative antialiased overflow-x-hidden">
      {/* Background Animated Stardust Constellation Panel */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <div
          className="absolute inset-[-100px] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03)_0%,rgba(139,92,246,0.04)_50%,transparent_100%)] opacity-80"
          style={{
            transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`,
            transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px]" />
      </div>

      {isSharedGalleryRoute ? (
        <SharedGallery sharedId={sharedId} />
      ) : (
        <>
          {pipeline.stage === "landing" && (
            <LandingScreen
              currentUser={pipeline.currentUser}
              triggerFolderPicker={pipeline.handleFolderIngestion}
              handleFileInputChange={(e) => {
                if (e.target.files) {
                  pipeline.handleFileSelectionChange(Array.from(e.target.files));
                }
              }}
              launchDemoConstellation={pipeline.handleLaunchDemoConstellation}
              loginWithGoogle={pipeline.handleGoogleLogin}
              logoutUser={pipeline.handleLogout}
              landingRef={landingRef}
              handleMouseMove={handleMouseMove}
            />
          )}

          {pipeline.stage === "style" && (
            <StyleScreen
              numAssets={numAssets}
              isDemoPreloading={pipeline.isDemoPreloading}
              mergeDuplicates={pipeline.mergeDuplicates}
              setMergeDuplicates={pipeline.setMergeDuplicates}
              onBack={() => pipeline.setStage("landing")}
              onStyleSelect={(style) => {
                if (pipeline.isDemoPreloading) {
                  pipeline.setStage("presentation");
                } else {
                  pipeline.handleRunProcessingChain(style);
                }
              }}
            />
          )}

          {pipeline.stage === "processing" && (
            <ProcessingScreen
              progress={pipeline.progress}
              sourceType={pipeline.sourceType}
            />
          )}

          {pipeline.stage === "presentation" && (
            <PresentationScreen
              currentUser={pipeline.currentUser}
              images={pipeline.images}
              selectedStyle={pipeline.selectedStyle}
              selectedImage={pipeline.selectedImage}
              activeFilterCategory={pipeline.activeFilterCategory}
              activeFilterLocation={pipeline.activeFilterLocation}
              activeFilterDate={pipeline.activeFilterDate}
              showDuplicates={pipeline.showDuplicates}
              serverOnline={pipeline.serverOnline}
              syncStatus={pipeline.syncStatus}
              isDownloadingZip={pipeline.isDownloadingZip}
              mergeDuplicates={pipeline.mergeDuplicates}
              setStage={pipeline.setStage}
              setSelectedStyle={pipeline.setSelectedStyle}
              setSelectedImage={pipeline.setSelectedImage}
              setFilterCategory={pipeline.setFilterCategory}
              setFilterLocation={pipeline.setFilterLocation}
              setFilterDate={pipeline.setFilterDate}
              setShowDuplicates={pipeline.setShowDuplicates}
              handleLogout={pipeline.handleLogout}
              handleGoogleLogin={pipeline.handleGoogleLogin}
              handleDownloadTimelineZip={pipeline.handleDownloadTimelineZip}
              handleManualSync={pipeline.handleManualSync}
              selectedFiles={pipeline.selectedFiles}
            />
          )}
        </>
      )}
    </div>
  );
}
