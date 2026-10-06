// =====================================================
// CRYPTO WALLET - WALLET HEADER
// =====================================================

const SETTINGS_STORAGE_KEY =
    "walletcrypto_settings_v1";


// =====================================================
// DOM ELEMENTS
// =====================================================

const testnetBanner =
    document.getElementById("testnetBanner");

const walletAddress =
    document.getElementById("walletAddress");

const walletCount =
    document.getElementById("walletCount");

const walletBalance =
    document.getElementById("walletBalance");

const ethBalance =
    document.getElementById("ethBalance");

const walletStatus =
    document.getElementById("walletStatus");

const disconnectButton =
    document.getElementById("disconnectButton");

const sendButton =
    document.getElementById("sendButton");

const receiveButton =
    document.getElementById("receiveButton");

const portfolioButton =
    document.getElementById("portfolioButton");


// =====================================================
// SETTINGS
// =====================================================

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
            "GAGAL MEMBACA SETTINGS:",
            error?.message || error
        );

        return defaultSettings;
    }
}


// =====================================================
// PROVIDER
// =====================================================

function getProvider() {

    if (
        window.ethereum &&
        typeof window.ethereum.request === "function"
    ) {
        return window.ethereum;
    }

    return null;
}


// =====================================================
// FORMAT ADDRESS
// =====================================================

function formatAddress(address) {

    if (
        typeof address !== "string" ||
        !address.startsWith("0x") ||
        address.length < 12
    ) {
        return "Wallet belum terhubung";
    }

    return (
        address.slice(0, 6) +
        "..." +
        address.slice(-4)
    );
}


// =====================================================
// FORMAT ETH
// =====================================================

function formatEthBalance(wei) {

    try {

        const weiBigInt =
            BigInt(wei);

        const base =
            1000000000000000000n;

        const whole =
            weiBigInt / base;

        const fraction =
            weiBigInt % base;

        const fractionText =
            fraction
                .toString()
                .padStart(18, "0")
                .replace(/0+$/, "");

        if (!fractionText) {

            return (
                whole.toString() +
                " ETH"
            );
        }

        return (
            whole.toString() +
            "." +
            fractionText.slice(0, 6) +
            " ETH"
        );

    } catch (error) {

        console.warn(
            "GAGAL MEMFORMAT SALDO ETH:",
            error?.message || error
        );

        return "ETH — tidak tersedia";
    }
}


// =====================================================
// UPDATE TESTNET UI
// =====================================================

function renderTestnetState() {

    const settings =
        bacaSettings();

    const testnetMode =
        settings.testnetMode === true;

    if (!testnetBanner) {
        return;
    }

    testnetBanner.classList.toggle(
        "is-hidden",
        !testnetMode
    );
}


// =====================================================
// RESET WALLET UI
// =====================================================

function renderDisconnectedState() {

    if (walletAddress) {

        walletAddress.textContent =
            "Wallet belum terhubung";
    }

    if (walletCount) {

        walletCount.textContent =
            "";
    }

    if (walletBalance) {

        walletBalance.textContent =
            "Rp 0";
    }

    if (ethBalance) {

        ethBalance.textContent =
            "ETH — belum terhubung";
    }

    if (walletStatus) {

        walletStatus.textContent =
            "Wallet belum terhubung.";
    }
}


// =====================================================
// LOAD ACTIVE ACCOUNT
// =====================================================

async function loadActiveAccount(
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

        renderDisconnectedState();

        return null;
    }


    const account =
        accounts[0];


    if (walletAddress) {

        walletAddress.textContent =
            formatAddress(account);
    }


    if (walletCount) {

        walletCount.textContent =

            accounts.length > 1

                ? "+" +
                  (accounts.length - 1) +
                  " lagi"

                : "";
    }


    return account;
}


// =====================================================
// LOAD ETH BALANCE
// =====================================================

async function loadEthBalance(
    provider,
    account
) {

    if (!account) {
        return;
    }


    const balanceWei =
        await provider.request({

            method:
                "eth_getBalance",

            params: [
                account,
                "latest"
            ]

        });


    const formatted =
        formatEthBalance(
            balanceWei
        );


    if (ethBalance) {

        ethBalance.textContent =
            formatted;
    }


    /*
     * Nilai fiat belum dihitung pada tahap ini.
     *
     * "Rp 0" tetap mengikuti desain UI
     * tanpa membuat harga ETH palsu.
     */
}


// =====================================================
// LOAD WALLET
// =====================================================

async function loadWallet() {

    renderTestnetState();


    const provider =
        getProvider();


    if (!provider) {

        renderDisconnectedState();

        if (walletStatus) {

            walletStatus.textContent =
                "Provider wallet tidak terdeteksi.";
        }

        return;
    }


    try {

        const account =
            await loadActiveAccount(
                provider
            );


        if (!account) {
            return;
        }


        await loadEthBalance(
            provider,
            account
        );


        if (walletStatus) {

            walletStatus.textContent =
                "Wallet aktif.";
        }

    } catch (error) {

        console.error(
            "GAGAL MEMUAT WALLET HEADER:",
            error
        );


        if (walletStatus) {

            walletStatus.textContent =
                "Gagal membaca data wallet.";

            walletStatus.classList.add(
                "error"
            );
        }
    }
}


// =====================================================
// PROVIDER EVENTS
// =====================================================

function setupProviderEvents(
    provider
) {

    if (
        !provider ||
        typeof provider.on !== "function"
    ) {
        return;
    }


    provider.on(
        "accountsChanged",
        function () {

            loadWallet();

        }
    );


    provider.on(
        "chainChanged",
        function () {

            loadWallet();

        }
    );
}


// =====================================================
// UI ACTIONS
// =====================================================

if (disconnectButton) {

    disconnectButton.addEventListener(
        "click",
        function () {

            if (walletStatus) {

                walletStatus.textContent =
                    "Aksi disconnect belum diaktifkan.";
            }

        }
    );
}


if (sendButton) {

    sendButton.addEventListener(
        "click",
        function () {

            if (walletStatus) {

                walletStatus.textContent =
                    "Fitur Kirim akan dihubungkan ke alur transaksi yang sudah ada.";
            }

        }
    );
}


if (receiveButton) {

    receiveButton.addEventListener(
        "click",
        function () {

            if (walletStatus) {

                walletStatus.textContent =
                    "Fitur Terima belum diaktifkan.";
            }

        }
    );
}


if (portfolioButton) {

    portfolioButton.addEventListener(
        "click",
        function () {

            if (walletStatus) {

                walletStatus.textContent =
                    "Portofolio belum diaktifkan pada tahap ini.";
            }

        }
    );
}


// =====================================================
// INIT
// =====================================================

async function initWalletHeader() {

    renderTestnetState();


    const provider =
        getProvider();


    if (provider) {

        setupProviderEvents(
            provider
        );
    }


    await loadWallet();


    console.log(
        "WALLET-HEADER.JS BERHASIL DIMUAT"
    );
}


initWalletHeader();
