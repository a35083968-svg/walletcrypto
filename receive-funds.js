const SETTINGS_STORAGE_KEY =
    "walletcrypto_settings_v1";


/* =====================================================
   DOM ELEMENTS
===================================================== */

const testnetBadge =
    document.getElementById("testnetBadge");

const qrCode =
    document.getElementById("qrCode");

const walletAddress =
    document.getElementById("walletAddress");

const copyIconButton =
    document.getElementById("copyIconButton");

const copyAddressButton =
    document.getElementById("copyAddressButton");

const shareButton =
    document.getElementById("shareButton");

const receiveStatus =
    document.getElementById("receiveStatus");


/* =====================================================
   PROVIDER
===================================================== */

function getProvider() {

    if (
        window.ethereum &&
        typeof window.ethereum.request === "function"
    ) {

        return window.ethereum;
    }

    return null;
}


/* =====================================================
   ADDRESS
===================================================== */

function formatAddress(address) {

    if (
        typeof address !== "string" ||
        !/^0x[a-fA-F0-9]{40}$/.test(address)
    ) {

        return "Wallet belum terhubung";
    }

    return (
        address.slice(0, 6) +
        "..." +
        address.slice(-4)
    );
}


/* =====================================================
   SETTINGS
===================================================== */

function bacaSettings() {

    const defaultSettings = {
        testnetMode: true
    };

    try {

        const raw =
            localStorage.getItem(
                SETTINGS_STORAGE_KEY
            );

        if (!raw) {
            return defaultSettings;
        }

        const savedSettings =
            JSON.parse(raw);

        return {
            ...defaultSettings,
            ...savedSettings
        };

    } catch (error) {

        console.warn(
            "GAGAL MEMBACA SETTINGS RECEIVE:",
            error?.message || error
        );

        return defaultSettings;
    }
}


function getTestnetState() {

    return bacaSettings().testnetMode === true;
}


/* =====================================================
   TESTNET UI
===================================================== */

function renderTestnetState(isTestnet) {

    if (!testnetBadge) {
        return;
    }

    testnetBadge.hidden =
        !isTestnet;
}


/* =====================================================
   STATUS
===================================================== */

function setStatus(
    message,
    isError = false
) {

    if (!receiveStatus) {
        return;
    }

    receiveStatus.textContent =
        message;

    receiveStatus.classList.toggle(
        "error",
        isError
    );
}


/* =====================================================
   DISCONNECTED STATE
===================================================== */

function renderDisconnectedState() {

    if (walletAddress) {

        walletAddress.textContent =
            "Wallet belum terhubung";
    }

    if (qrCode) {

        qrCode.replaceChildren();
    }

    enableWalletActions(false);

    setStatus(
        "Wallet belum terhubung.",
        true
    );
}


/* =====================================================
   ENABLE / DISABLE ACTIONS
===================================================== */

function enableWalletActions(
    enabled
) {

    if (copyIconButton) {

        copyIconButton.disabled =
            !enabled;
    }

    if (copyAddressButton) {

        copyAddressButton.disabled =
            !enabled;
    }

    if (shareButton) {

        shareButton.disabled =
            !enabled;
    }
}


/* =====================================================
   QR CODE
===================================================== */

function generateQr(address) {
    if (!qrCode) {
        return;
    }

    qrCode.replaceChildren();

    if (
        typeof window.QRCode === "undefined" ||
        typeof window.QRCode.toCanvas !== "function"
    ) {
        console.error("QRCode library tidak tersedia.");

        setStatus(
            "Library QR Code gagal dimuat. Periksa koneksi internet.",
            true
        );

        return;
    }

    // Gunakan alamat wallet LENGKAP, bukan alamat truncated.
    window.QRCode.toCanvas(
        address,
        {
            errorCorrectionLevel: "H",
            margin: 2,
            width: 300,
            color: {
                dark: "#000000",
                light: "#ffffff"
            }
        },
        function (error, canvas) {
            if (error) {
                console.error("GAGAL MEMBUAT QR:", error);

                setStatus("QR Code gagal dibuat.", true);
                return;
            }

            qrCode.replaceChildren(canvas);

            canvas.style.display = "block";
            canvas.style.width = "100%";
            canvas.style.maxWidth = "300px";
            canvas.style.height = "auto";

            setStatus("QR Code wallet berhasil dibuat.");
        }
    );
        }

/* =====================================================
   COPY
===================================================== */

async function copyAddress(
    address
) {

    if (
        typeof address !== "string" ||
        !/^0x[a-fA-F0-9]{40}$/.test(address)
    ) {

        return;
    }


    if (
        !navigator.clipboard ||
        typeof navigator.clipboard.writeText !== "function"
    ) {

        setStatus(
            "Clipboard tidak tersedia di browser ini.",
            true
        );

        return;
    }


    try {

        await navigator.clipboard.writeText(
            address
        );

        setStatus(
            "Alamat wallet berhasil disalin."
        );

    } catch (error) {

        console.error(
            "GAGAL MENYALIN ALAMAT:",
            error
        );

        setStatus(
            "Alamat gagal disalin.",
            true
        );
    }
}


/* =====================================================
   SHARE
===================================================== */

async function shareAddress(
    address
) {

    if (
        typeof address !== "string" ||
        !/^0x[a-fA-F0-9]{40}$/.test(address)
    ) {

        return;
    }


    if (
        typeof navigator.share !== "function"
    ) {

        setStatus(
            "Fitur Bagikan tidak didukung browser ini.",
            true
        );

        return;
    }


    try {

        await navigator.share({

            title:
                "Alamat Wallet",

            text:
                "Alamat wallet untuk menerima ETH & token ERC-20: " +
                address
        });


        setStatus(
            "Alamat wallet siap dibagikan."
        );

    } catch (error) {

        if (
            error?.name === "AbortError"
        ) {

            setStatus(
                "Bagikan dibatalkan."
            );

            return;
        }


        console.error(
            "GAGAL MEMBAGIKAN ALAMAT:",
            error
        );

        setStatus(
            "Alamat gagal dibagikan.",
            true
        );
    }
}


/* =====================================================
   RECEIVE PAGE
===================================================== */

function createReceivePage({
    address,
    isTestnet
}) {

    renderTestnetState(
        isTestnet
    );


    if (
        typeof address !== "string" ||
        !/^0x[a-fA-F0-9]{40}$/.test(address)
    ) {

        renderDisconnectedState();

        return;
    }


    const truncatedAddress =
        formatAddress(address);


    if (walletAddress) {

        walletAddress.textContent =
            truncatedAddress;
    }


    enableWalletActions(
        true
    );


    generateQr(
        address
    );


    setStatus(
        "Wallet aktif."
    );
}


/* =====================================================
   ACTIVE ACCOUNT
===================================================== */

async function getActiveAccount(
    provider
) {

    const accounts =
        await provider.request({

            method:
                "eth_accounts"
        });


    if (
        !Array.isArray(accounts) ||
        accounts.length === 0
    ) {

        return null;
    }


    return accounts[0];
}


/* =====================================================
   INIT
===================================================== */

async function initReceiveFunds() {

    const provider =
        getProvider();

    const isTestnet =
        getTestnetState();


    renderTestnetState(
        isTestnet
    );


    if (!provider) {

        renderDisconnectedState();

        return;
    }


    try {

        const account =
            await getActiveAccount(
                provider
            );


        createReceivePage({

            address:
                account,

            isTestnet:
                isTestnet
        });

    } catch (error) {

        console.error(
            "GAGAL MEMUAT RECEIVE FUNDS:",
            error
        );

        renderDisconnectedState();

        setStatus(
            "Gagal membaca wallet aktif.",
            true
        );
    }
}


/* =====================================================
   COPY ICON
===================================================== */

if (copyIconButton) {

    copyIconButton.addEventListener(
        "click",
        async function () {

            const provider =
                getProvider();


            if (!provider) {

                setStatus(
                    "Provider wallet tidak terdeteksi.",
                    true
                );

                return;
            }


            try {

                const account =
                    await getActiveAccount(
                        provider
                    );

                await copyAddress(
                    account
                );

            } catch (error) {

                console.error(
                    "GAGAL COPY ICON:",
                    error
                );

                setStatus(
                    "Alamat gagal disalin.",
                    true
                );
            }
        }
    );
}


/* =====================================================
   COPY ADDRESS
===================================================== */

if (copyAddressButton) {

    copyAddressButton.addEventListener(
        "click",
        async function () {

            const provider =
                getProvider();


            if (!provider) {

                setStatus(
                    "Provider wallet tidak terdeteksi.",
                    true
                );

                return;
            }


            try {

                const account =
                    await getActiveAccount(
                        provider
                    );

                await copyAddress(
                    account
                );

            } catch (error) {

                console.error(
                    "GAGAL COPY ALAMAT:",
                    error
                );

                setStatus(
                    "Alamat gagal disalin.",
                    true
                );
            }
        }
    );
}


/* =====================================================
   SHARE
===================================================== */

if (shareButton) {

    shareButton.addEventListener(
        "click",
        async function () {

            const provider =
                getProvider();


            if (!provider) {

                setStatus(
                    "Provider wallet tidak terdeteksi.",
                    true
                );

                return;
            }


            try {

                const account =
                    await getActiveAccount(
                        provider
                    );

                await shareAddress(
                    account
                );

            } catch (error) {

                console.error(
                    "GAGAL SHARE ALAMAT:",
                    error
                );

                setStatus(
                    "Alamat gagal dibagikan.",
                    true
                );
            }
        }
    );
}


/* =====================================================
   START
===================================================== */

initReceiveFunds();
