document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector(".notepad-container");
    const textarea = document.getElementById("note-content");
    const statusText = document.querySelector(".status-text");
    const statusDot = document.querySelector(".status-dot");
    const newBtn = document.getElementById("new-btn");
    const shareBtn = document.getElementById("share-btn");
    const qrBtn = document.getElementById("qr-btn");
    const copyBtn = document.getElementById("copy-btn");
    const clearBtn = document.getElementById("clear-btn");
    const deleteBtn = document.getElementById("delete-btn");
    
    const refreshBtn = document.getElementById("refresh-btn");
    const brandLogo = document.getElementById("brand-logo");
    const noteCodeDisplay = document.getElementById("note-code-display");
    const noteCodeInput = document.getElementById("note-code-input");
    
    const shareBtnText = shareBtn ? shareBtn.querySelector(".btn-text") : null;
    const copyBtnText = copyBtn ? copyBtn.querySelector(".btn-text") : null;
    const qrModal = document.getElementById("qr-modal");
    const qrCloseBtn = document.getElementById("qr-close-btn");
    const qrcodeContainer = document.getElementById("qrcode");
    const qrUrlDisplay = document.getElementById("qr-url-display");

    if (!container || !textarea) return;

    const noteCode = container.getAttribute("data-code");
    
    let isInitialLoad = true;
    let debounceTimer = null;
    let isSaving = false;
    let pendingSave = false;
    let lastSavedContent = null;
    let copyResetTimer = null;
    let shareResetTimer = null;
    let qrGenerated = false;

    function setStatus(state) {
        if (!statusText || !statusDot) return;
        
        switch (state) {
            case "loading":
                statusText.textContent = "Loading...";
                statusDot.style.backgroundColor = "#6366f1";
                statusDot.style.boxShadow = "0 0 8px #6366f1";
                break;
            case "saved":
                statusText.textContent = "Saved";
                statusDot.style.backgroundColor = "#10b981";
                statusDot.style.boxShadow = "0 0 8px #10b981";
                break;
            case "saving":
                statusText.textContent = "Saving...";
                statusDot.style.backgroundColor = "#f59e0b";
                statusDot.style.boxShadow = "0 0 8px #f59e0b";
                break;
            case "unsaved":
                statusText.textContent = "Unsaved changes";
                statusDot.style.backgroundColor = "#94a3b8";
                statusDot.style.boxShadow = "none";
                break;
            case "error":
                statusText.textContent = "Error saving";
                statusDot.style.backgroundColor = "#ef4444";
                statusDot.style.boxShadow = "0 0 8px #ef4444";
                break;
        }
    }

    async function loadNote() {
        if (!noteCode) return;
        setStatus("loading");

        try {
            const response = await fetch(`/api/note/${encodeURIComponent(noteCode)}`);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            const data = await response.json();
            textarea.value = data.content || "";
            lastSavedContent = textarea.value;
            setStatus("saved");
        } catch (error) {
            console.error("Failed to load note:", error);
            setStatus("error");
        } finally {
            isInitialLoad = false;
        }
    }

    async function performSave() {
        if (isSaving) {
            pendingSave = true;
            return;
        }

        const contentToSave = textarea.value;
        
        if (contentToSave === lastSavedContent && !pendingSave) {
            setStatus("saved");
            return;
        }

        isSaving = true;
        pendingSave = false;
        setStatus("saving");

        try {
            const response = await fetch(`/api/note/${encodeURIComponent(noteCode)}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ content: contentToSave })
            });

            if (!response.ok) {
                throw new Error(`Save failed with status ${response.status}`);
            }

            lastSavedContent = contentToSave;
            setStatus("saved");
        } catch (error) {
            console.error("Failed to save note:", error);
            setStatus("error");
        } finally {
            isSaving = false;
            if (pendingSave || textarea.value !== lastSavedContent) {
                performSave();
            }
        }
    }

    function handleInput() {
        if (isInitialLoad) return;

        setStatus("unsaved");
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
            performSave();
        }, 800);
    }

    textarea.addEventListener("input", handleInput);

    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            loadNote();
        });
    }

    if (brandLogo) {
        brandLogo.addEventListener("click", () => {
            loadNote();
        });
    }

    if (noteCodeDisplay && noteCodeInput) {
        let isNavigating = false;

        function showCodeInput() {
            noteCodeDisplay.classList.add("hidden");
            noteCodeInput.classList.remove("hidden");
            noteCodeInput.value = noteCode;
            noteCodeInput.focus();
            noteCodeInput.select();
        }

        function hideCodeInput() {
            noteCodeInput.classList.add("hidden");
            noteCodeDisplay.classList.remove("hidden");
        }

        noteCodeDisplay.addEventListener("click", () => {
            showCodeInput();
        });

        noteCodeInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const newCode = noteCodeInput.value.trim();
                if (newCode && newCode !== noteCode) {
                    isNavigating = true;
                    window.location.href = "/" + encodeURIComponent(newCode);
                } else {
                    hideCodeInput();
                }
            } else if (e.key === "Escape") {
                isNavigating = true;
                hideCodeInput();
                setTimeout(() => { isNavigating = false; }, 100);
            }
        });

        noteCodeInput.addEventListener("blur", () => {
            setTimeout(() => {
                if (!isNavigating) {
                    hideCodeInput();
                }
                isNavigating = false;
            }, 150);
        });
    }

    if (newBtn) {
        newBtn.addEventListener("click", () => {
            window.open("/", "_blank");
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener("click", async () => {
            const urlToShare = window.location.href;
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(urlToShare);
                } else {
                    const dummy = document.createElement("input");
                    document.body.appendChild(dummy);
                    dummy.value = urlToShare;
                    dummy.select();
                    document.execCommand("copy");
                    document.body.removeChild(dummy);
                }

                if (shareBtnText) shareBtnText.textContent = "Copied!";
                shareBtn.classList.add("copied");

                if (shareResetTimer) clearTimeout(shareResetTimer);
                shareResetTimer = setTimeout(() => {
                    if (shareBtnText) shareBtnText.textContent = "Share Link";
                    shareBtn.classList.remove("copied");
                }, 1500);
            } catch (err) {
                console.error("Failed to copy link:", err);
            }
        });
    }

    function renderQRCode() {
        if (qrGenerated || !qrcodeContainer) return;

        const currentUrl = window.location.href;
        if (qrUrlDisplay) {
            qrUrlDisplay.textContent = currentUrl;
        }

        if (typeof QRCode !== "undefined") {
            new QRCode(qrcodeContainer, {
                text: currentUrl,
                width: 140,
                height: 140,
                colorDark: "#0f172a",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
            qrGenerated = true;
        } else {
            console.error("QRCode library failed to load");
        }
    }

    if (qrBtn && qrModal) {
        qrBtn.addEventListener("click", () => {
            const isHidden = qrModal.classList.contains("hidden");
            if (isHidden) {
                renderQRCode();
                qrModal.classList.remove("hidden");
            } else {
                qrModal.classList.add("hidden");
            }
        });
    }

    if (qrCloseBtn && qrModal) {
        qrCloseBtn.addEventListener("click", () => {
            qrModal.classList.add("hidden");
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener("click", async () => {
            const textToCopy = textarea.value;
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(textToCopy);
                } else {
                    textarea.select();
                    document.execCommand("copy");
                }
                
                if (copyBtnText) copyBtnText.textContent = "Copied!";
                copyBtn.classList.add("copied");

                if (copyResetTimer) clearTimeout(copyResetTimer);
                copyResetTimer = setTimeout(() => {
                    if (copyBtnText) copyBtnText.textContent = "Copy";
                    copyBtn.classList.remove("copied");
                }, 1500);
            } catch (err) {
                console.error("Failed to copy:", err);
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (textarea.value.length === 0) return;
            
            const confirmed = confirm("Clear this note? This cannot be undone.");
            if (confirmed) {
                textarea.value = "";
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                    debounceTimer = null;
                }
                performSave();
            }
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
            const confirmed = confirm("Permanently delete this note? This action cannot be undone and will remove this note link entirely.");
            if (confirmed) {
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                    debounceTimer = null;
                }
                setStatus("loading");
                try {
                    const response = await fetch(`/api/note/${encodeURIComponent(noteCode)}`, {
                        method: "DELETE"
                    });
                    if (!response.ok) {
                        throw new Error(`Delete failed with status ${response.status}`);
                    }
                    window.location.href = "/";
                } catch (err) {
                    console.error("Failed to delete note:", err);
                    setStatus("error");
                    alert("Failed to delete note. Please try again.");
                }
            }
        });
    }

    loadNote();
});
