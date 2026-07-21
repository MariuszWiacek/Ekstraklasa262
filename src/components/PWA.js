import React, { useEffect, useState } from "react";

// 1. CATCH THE EVENT GLOBALLY (outside the component)
// If the browser fires the event before React loads, we save it here.
let globalDeferredPrompt = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
  });
}

const InstallPWAButton = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false); // Tracks if prompt is ready
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // 2. Check if already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
    }

    // 3. Detect iOS
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // 4. Check if the global prompt was already caught
    if (globalDeferredPrompt) {
      setHasPrompt(true);
    }

    // 5. Also listen normally in case it fires late
    const handler = (e) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setHasPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleClick = async () => {
    if (globalDeferredPrompt) {
      globalDeferredPrompt.prompt();
      const { outcome } = await globalDeferredPrompt.userChoice;
      if (outcome === "accepted") {
        globalDeferredPrompt = null;
        setHasPrompt(false);
      }
    } else if (isIOS) {
      setShowInstructions(true);
    }
  };

  // Button shows up if not installed AND (we have the prompt OR it's iOS)
  const isAvailable = !isInstalled && (hasPrompt || isIOS);

  if (!isAvailable) return null;

  return (
    <>
      <button onClick={handleClick} style={buttonStyle}>
        📲 Zainstaluj aplikację
      </button>

      {/* iOS Modal */}
      {showInstructions && (
        <div style={modalOverlayStyle} onClick={() => setShowInstructions(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3>Instalacja na iPhone</h3>
            <p>Aby dodać aplikację do ekranu głównego:</p>
            <ol style={{ textAlign: "left" }}>
              <li>Kliknij ikonę <strong>Udostępnij</strong> w Safari.</li>
              <li>Wybierz <strong>"Do ekranu początkowego"</strong>.</li>
            </ol>
            <button onClick={() => setShowInstructions(false)} style={closeButtonStyle}>
              Rozumiem
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// --- Style ---
const buttonStyle = {
  background: "#00ff0d",
  color: "#000",
  padding: "12px 25px",
  border: "none",
  borderRadius: "30px",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer",
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0,0,0,0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "20px"
};

const modalStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "20px",
  maxWidth: "300px",
  textAlign: "center",
  color: "#333",
};

const closeButtonStyle = {
  marginTop: "15px",
  padding: "10px 20px",
  backgroundColor: "#007AFF",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontWeight: "bold"
};

export default InstallPWAButton;