// ======================================================
// DEBUG PANEL UNTUK HP
// ======================================================

const debugPanel = document.createElement("div");

debugPanel.id = "debugPanel";

debugPanel.style.cssText = `
    position:fixed;
    left:10px;
    right:10px;
    bottom:10px;
    max-height:220px;
    overflow-y:auto;
    background:#020617;
    color:#00ff88;
    border:1px solid #00ff88;
    border-radius:10px;
    padding:10px;
    font-family:monospace;
    font-size:12px;
    z-index:99999;
`;

debugPanel.innerHTML = `
    <b>🛠 DEBUG PANEL</b>
    <hr>
`;

document.body.appendChild(debugPanel);


// ======================================================
// TANGKAP console.log()
// ======================================================

const consoleLogAsli = console.log;

console.log = function (...args) {

    consoleLogAsli(...args);

    const baris = document.createElement("div");

    baris.textContent =
        args.map(function (item) {

            if (
                typeof item === "object" &&
                item !== null
            ) {
                try {
                    return JSON.stringify(item);
                } catch {
                    return String(item);
                }
            }

            return String(item);

        }).join(" ");

    debugPanel.appendChild(baris);

    debugPanel.scrollTop =
        debugPanel.scrollHeight;
};

// ======================================================
// TANGKAP console.error()
// ======================================================

const consoleErrorAsli = console.error;

console.error = function (...args) {

    consoleErrorAsli(...args);

    const baris = document.createElement("div");

    baris.style.color = "#ff5555";

    baris.textContent =
        "ERROR: " +
        args.map(function (item) {
            return String(item);
        }).join(" ");

    debugPanel.appendChild(baris);

    debugPanel.scrollTop =
        debugPanel.scrollHeight;
};

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

/* =========================================
   ERC-20: ABI READ-ONLY
========================================= */

const ERC20_ABI_READ = [
    {
        constant: true,
        inputs: [],
        name: "name",
        outputs: [{ name: "", type: "string" }],
        type: "function"
    },
    {
        constant: true,
        inputs: [],
        name: "symbol",
        outputs: [{ name: "", type: "string" }],
        type: "function"
    },
    {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        type: "function"
    },
    {
        constant: true,
        inputs: [],
        name: "totalSupply",
        outputs: [{ name: "", type: "uint256" }],
        type: "function"
    },
    {
        constant: true,
        inputs: [{ name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        type: "function"
    }
];

const connectWalletButton =
    document.getElementById("connectWalletButton");

const erc20ContractInput =
    document.getElementById("erc20ContractAddress");

const erc20LoadButton =
    document.getElementById("erc20LoadButton");

const erc20Status =
    document.getElementById("erc20Status");


/* =========================================
   DEBUG HELPERS
========================================= */

function setERC20Status(message) {
    if (erc20Status) {
        erc20Status.textContent = message;
    }
}

function setERC20Value(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = String(value);
    }
}

function formatERC20Units(rawValue, decimals) {
    const places = Number(decimals);

    if (
        !Number.isInteger(places) ||
        places < 0 ||
        places > 255
    ) {
        throw new Error("Desimal token tidak valid.");
    }

    const value = BigInt(rawValue);
    const divisor = 10n ** BigInt(places);
    const whole = value / divisor;

    if (places === 0) {
        return whole.toString();
    }

    const fraction = (value % divisor)
        .toString()
        .padStart(places, "0")
        .replace(/0+$/, "");

    return fraction
        ? `${whole}.${fraction}`
        : whole.toString();
}


/* =========================================
   CONNECT WALLET
========================================= */

async function connectWallet() {
    const provider = getProvider();

    if (!provider) {
        if (walletStatus) {
            walletStatus.textContent =
                "Provider wallet tidak terdeteksi. Buka halaman melalui browser DApp wallet.";
        }
        return;
    }

    try {
        if (walletStatus) {
            walletStatus.textContent =
                "Meminta izin akses wallet...";
        }

        // Permintaan akun hanya dilakukan setelah pengguna menekan tombol.
        await provider.request({
            method: "eth_requestAccounts"
        });

        await loadWallet();

    } catch (error) {
        console.error("WALLET CONNECT ERROR:", error);

        if (walletStatus) {
            walletStatus.textContent =
                "Koneksi wallet gagal atau izin ditolak.";
        }
    }
}

if (connectWalletButton) {
    connectWalletButton.addEventListener(
        "click",
        connectWallet
    );
}


/* =========================================
   ERC-20: READ TOKEN
========================================= */

async function loadERC20Token() {
    if (typeof Web3 === "undefined") {
        setERC20Status(
            "Web3.js tidak tersedia. Periksa pemuatan CDN."
        );
        console.error("ERC-20 ERROR: Web3.js tidak tersedia.");
        return;
    }

    const provider = getProvider();

    if (!provider) {
        setERC20Status(
            "Wallet provider tidak terdeteksi."
        );
        return;
    }

    const inputAddress =
        erc20ContractInput?.value.trim() || "";

    if (!Web3.utils.isAddress(inputAddress)) {
        setERC20Status(
            "Alamat kontrak token tidak valid."
        );
        return;
    }

    if (erc20LoadButton) {
        erc20LoadButton.disabled = true;
    }

    try {
        setERC20Status(
            "Memeriksa jaringan dan membaca token..."
        );

        const accounts = await provider.request({
            method: "eth_accounts"
        });

        if (!Array.isArray(accounts) || !accounts[0]) {
            throw new Error(
                "Hubungkan wallet terlebih dahulu."
            );
        }

        const chainIdHex = await provider.request({
            method: "eth_chainId"
        });

        const chainId = Number.parseInt(
            chainIdHex,
            16
        );

        const contractAddress =
            Web3.utils.toChecksumAddress(inputAddress);

        const contractCode = await provider.request({
            method: "eth_getCode",
            params: [contractAddress, "latest"]
        });

        if (
            typeof contractCode !== "string" ||
            contractCode === "0x" ||
            /^0x0+$/i.test(contractCode)
        ) {
            throw new Error(
                `Tidak ditemukan kontrak pada alamat ini di jaringan aktif (Chain ID ${chainId}). Periksa jaringan dan alamat token.`
            );
        }

        const web3Instance = new Web3(provider);

        const contract = new web3Instance.eth.Contract(
            ERC20_ABI_READ,
            contractAddress
        );

        const [
            name,
            symbol,
            decimalsResult,
            supplyResult,
            balanceResult
        ] = await Promise.all([
            contract.methods.name().call(),
            contract.methods.symbol().call(),
            contract.methods.decimals().call(),
            contract.methods.totalSupply().call(),
            contract.methods.balanceOf(accounts[0]).call()
        ]);

        const decimals = Number(decimalsResult);

        setERC20Value("erc20Name", name);
        setERC20Value("erc20Symbol", symbol);
        setERC20Value("erc20Decimals", decimals);

        setERC20Value(
            "erc20TotalSupply",
            `${formatERC20Units(supplyResult, decimals)} ${symbol}`
        );

        setERC20Value(
            "erc20Balance",
            `${formatERC20Units(balanceResult, decimals)} ${symbol}`
        );

        setERC20Status(
            `Token berhasil dibaca. Chain ID: ${chainId}.`
        );

        console.log(
            "ERC-20 READ SUCCESS:",
            { name, symbol, decimals, chainId }
        );

    } catch (error) {
        console.error("ERC-20 READ ERROR:", error);

        setERC20Status(
            `Gagal membaca token: ${
                error?.message || "Kesalahan tidak diketahui."
            }`
        );

    } finally {
        if (erc20LoadButton) {
            erc20LoadButton.disabled = false;
        }
    }
}

// Listener dipasang satu kali saat file JS dijalankan,
// bukan dari dalam loadERC20Token().
if (erc20LoadButton) {
    erc20LoadButton.addEventListener(
        "click",
        loadERC20Token
    );
}


/* =========================================
   GLOBAL ERROR REPORTING
========================================= */

window.addEventListener("error", function (event) {
    console.error(
        "JAVASCRIPT ERROR:",
        event.message || "Kesalahan JavaScript tidak diketahui."
    );
});

window.addEventListener(
    "unhandledrejection",
    function (event) {
        console.error(
            "ASYNC ERROR:",
            event.reason?.message || event.reason || "Promise gagal."
        );
    }
);


/* =========================================
   INITIALIZATION
========================================= */

async function initWalletHeader() {
    console.log("WALLET-HEADER.JS BERHASIL DIMUAT");

    renderTestnetState();

    const provider = getProvider();

    if (provider) {
        setupProviderEvents(provider);
    }

    await loadWallet();
}

initWalletHeader();
