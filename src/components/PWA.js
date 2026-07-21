import React, { useEffect, useState } from "react";

const InstallPWAButton = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // 1. Sprawdź czy już zainstalowano
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
    }

    // 2. Wykryj iOS
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // 3. Obsługa Android/Chrome (standardowy prompt)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleClick = async () => {
    if (deferredPrompt) {
      // Dla Androida/PC
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setDeferredPrompt(null);
    } else if (isIOS) {
      // Dla iPhone - pokazujemy instrukcję
      setShowInstructions(true);
    }
  };

  if (isInstalled) return null;

  // Przycisk powinien być aktywny jeśli:
  // a) Mamy prompt (Android) LUB b) To jest iOS
  const isAvailable = deferredPrompt || isIOS;

  return (
    <>
      <button
        onClick={handleClick}
        style={{
          ...buttonStyle,
          opacity: isAvailable ? 1 : 0.5,
          cursor: isAvailable ? "pointer" : "not-allowed",
        }}
      >
        📲 Zainstaluj aplikację
      </button>

      {/* Modal z instrukcją dla iOS */}
      {showInstructions && (
        <div style={modalOverlayStyle} onClick={() => setShowInstructions(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3>Instalacja na iPhone</h3>
            <p>Aby dodać aplikację do ekranu głównego:</p>
            <ol style={{ textAlign: "left" }}>
              <li>Kliknij ikonę <strong>Udostępnij</strong> (kwadrat ze strzałką) w dolnym menu Safari.</li>
              <li>Przewiń w dół i wybierz <strong>"Do ekranu początkowego"</strong>.</li>
              <li>Kliknij <strong>"Dodaj"</strong> w prawym górnym rogu.</li>
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
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
};

const closeButtonStyle = {
  marginTop: "15px",
  padding: "10px 20px",
  backgroundColor: "#007AFF", // Niebieski kolor Apple
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontWeight: "bold"
};

export default InstallPWAButton;
