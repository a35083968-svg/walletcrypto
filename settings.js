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

// ======================================================
// CRYPTO WALLET SETTINGS
// ======================================================

const SETTINGS_STORAGE_KEY =
    "walletcrypto_settings_v1";


const DEFAULT_SETTINGS = {

    autoConnect: true,

    rememberWallet: true,

    reconnectOnLaunch: true,

    testnetMode: true,

    preferredProvider: null,

    preferredNetwork:
        "0xaa36a7"

};

// ======================================================
// DOM ELEMENTS
// ======================================================

const autoConnectToggle =
    document.getElementById("autoConnectToggle");

const reconnectToggle =
    document.getElementById("reconnectToggle");

const rememberWalletToggle =
    document.getElementById("rememberWalletToggle");

const testnetToggle =
    document.getElementById("testnetToggle");

const networkList =
    document.getElementById("networkList");

const settingsStatus =
    document.getElementById("settingsStatus");

const walletList =
    document.getElementById("walletList");

const accountList =
    document.getElementById("accountList");

const refreshAccounts =
    document.getElementById("refreshAccounts");

const requestAccountButton =
    document.getElementById("requestAccountButton");

// ======================================================
// NETWORK MANAGER
// ======================================================

const CHAINS_JSON_URL = "chains.json";

let chainCatalog = null;

let providers = [];
let providerAktif = null;

let settings = bacaSettings();

function bacaSettings() {

    try {

        const raw =
            localStorage.getItem(
                SETTINGS_STORAGE_KEY
            );

        if (!raw) {

            return {
                ...DEFAULT_SETTINGS
            };

        }

        return {
            ...DEFAULT_SETTINGS,
            ...JSON.parse(raw)
        };

    } catch (error) {

        console.error(
            "GAGAL MEMBACA SETTINGS:",
            error
        );

        return {
            ...DEFAULT_SETTINGS
        };
    }
}

function simpanSettings() {

    try {

        localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify(settings)
        );

    } catch (error) {

        console.error(
            "GAGAL MENYIMPAN SETTINGS:",
            error
        );

    }
}

function setSettingsStatus(message) {

    console.log(
        "SETTINGS STATUS:",
        message
    );

    if (settingsStatus) {

        settingsStatus.textContent =
            message;

    }
}

function renderSettingsState() {

    if (autoConnectToggle) {

        autoConnectToggle.checked =
            settings.autoConnect;

    }

    if (reconnectToggle) {

        reconnectToggle.checked =
            settings.reconnectOnLaunch;

    }

    if (rememberWalletToggle) {

        rememberWalletToggle.checked =
            settings.rememberWallet;

    }

    if (testnetToggle) {

        testnetToggle.checked =
            settings.testnetMode;

    }
}

// ======================================================
// LOAD CHAIN CATALOG
// ======================================================

async function loadChainCatalog() {
    try {
        const url =
            `${CHAINS_JSON_URL}?v=${Date.now()}`;

        const response =
            await fetch(url, {
                cache: "no-store"
            });

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        if (
            !data ||
            !Array.isArray(data.blockchains)
        ) {
            throw new Error(
                "Format chains.json tidak valid."
            );
        }

        chainCatalog = data;

        console.log(
            "CHAIN CATALOG BERHASIL DIMUAT:",
            chainCatalog
        );

        return chainCatalog;

    } catch (error) {

        console.error(
            "GAGAL MEMUAT chains.json:",
            error
        );

        chainCatalog = null;

        if (networkList) {
            networkList.innerHTML = `
                <div class="empty-state">
                    Gagal memuat daftar jaringan.
                    <br>
                    <small>
                        Periksa chains.json
                        dan koneksi halaman.
                    </small>
                </div>
            `;
        }

        setSettingsStatus(
            "Gagal memuat daftar jaringan."
        );

        return null;
    }
}             

// ======================================================
// NETWORK STATUS LABEL
// ======================================================

function networkStatusLabel(network) {

    if (
        network.status ===
        "deprecated"
    ) {

        return "Deprecated";
    }


    if (
        network.status ===
        "custom"
    ) {

        return "Custom";
    }


    return "Active";
}

// ======================================================
// MODE TESTNET 
// ======================================================

testnetToggle.addEventListener(
    "change",
    async function () {

        settings.testnetMode =
            testnetToggle.checked;

        simpanSettings();

        await renderNetworkList();

        setSettingsStatus(

            settings.testnetMode

                ? "Mode Testnet aktif 🧪"
                : "Mode Mainnet aktif 🌐"

        );

    }
);

// ======================================================
// SELECT NETWORK
// ======================================================

async function pilihNetwork(network) {

    if (
        !providerAktif ||
        !providerAktif.provider
    ) {

        setSettingsStatus(
            "Pilih wallet terlebih dahulu."
        );

        return;
    }


    if (
        network.selectable === false
    ) {

        setSettingsStatus(
            `${network.name} tidak dapat dipilih.`
        );

        return;
    }


    const chainId =
        chainIdToHex(
            network.chainId
        );


    if (!chainId) {

        setSettingsStatus(
            "Chain ID jaringan tidak tersedia."
        );

        return;
    }


    try {

        setSettingsStatus(
            `Mengganti jaringan ke ${network.name}...`
        );


        await providerAktif.provider.request({

            method:
                "wallet_switchEthereumChain",

            params: [
                {
                    chainId:
                        chainId
                }
            ]

        });


        settings.preferredNetwork =
            chainId;


        simpanSettings();


        await renderNetworkList();


        setSettingsStatus(
            `${network.name} berhasil dipilih ✅`
        );

    } catch (error) {

        console.error(
            "GAGAL SWITCH NETWORK:",
            error
        );


        setSettingsStatus(

            "Gagal mengganti jaringan: " +
            (
                error?.message ||
                "permintaan ditolak"
            )

        );

    }
}


// ======================================================
// RENDER NETWORK LIST
// ======================================================

async function renderNetworkList() {

    if (!networkList) {
        return;
    }

    if (!chainCatalog) {
        await loadChainCatalog();
    }

    if (!chainCatalog) {
        return;
    }

    const searchInput =
        document.getElementById(
            "networkSearch"
        );

    const searchQuery =
        (
            searchInput?.value || ""
        )
        .trim()
        .toLowerCase();

    const testnetMode =
        Boolean(
            settings.testnetMode
        );

    const filteredBlockchains =
        chainCatalog.blockchains
            .map(function (blockchain) {

                if (
                    !Array.isArray(
                        blockchain.networks
                    )
                ) {
                    return {
                        ...blockchain,
                        networks: []
                    };
                }

                // --------------------------------------
                // PILIH MODE
                // --------------------------------------

                const modeNetworks =
                    blockchain.networks.filter(
                        function (network) {

                            if (testnetMode) {

                                return (
                                    network.type ===
                                    "testnet"
                                );
                            }

                            return (
                                network.type ===
                                    "public-mainnet" ||

                                network.type ===
                                    "private-mainnet"
                            );
                        }
                    );

                // --------------------------------------
                // SEARCH
                // --------------------------------------

                const blockchainText = [
                    blockchain.key,
                    blockchain.name,
                    blockchain.category
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                const networks =
                    modeNetworks.filter(
                        function (network) {

                            const networkText = [
                                network.key,
                                network.name,
                                network.type,
                                network.status,
                                network.description
                            ]
                                .filter(Boolean)
                                .join(" ")
                                .toLowerCase();

                            /*
                             * Kalau user mencari "ethereum",
                             * nama blockchain juga diperiksa.
                             *
                             * Jadi:
                             *
                             * Ethereum
                             * ├─ Sepolia
                             * ├─ Hoodi
                             * └─ Holesky
                             */

                            return (
                                blockchainText.includes(
                                    searchQuery
                                ) ||

                                networkText.includes(
                                    searchQuery
                                )
                            );
                        }
                    );

                return {
                    ...blockchain,
                    networks
                };

            })
            .filter(
                function (blockchain) {

                    return (
                        blockchain.networks.length > 0
                    );
                }
            );

    // --------------------------------------
    // TIDAK ADA HASIL
    // --------------------------------------

    if (
        filteredBlockchains.length === 0
    ) {

        networkList.innerHTML = `
            <div class="empty-state">
                Jaringan tidak ditemukan.
            </div>
        `;

        return;
    }

    // --------------------------------------
    // AMBIL CHAIN ID WALLET
    // --------------------------------------

    const activeChainId =
        await ambilChainIdWallet();

    networkList.innerHTML = "";

    // --------------------------------------
    // RENDER BLOCKCHAIN
    // --------------------------------------

    filteredBlockchains.forEach(
        function (blockchain) {

            const blockchainGroup =
                document.createElement(
                    "div"
                );

            blockchainGroup.className =
                "network-group";

            const title =
                document.createElement(
                    "h4"
                );

            title.textContent =
                blockchain.name;

            blockchainGroup.appendChild(
                title
            );

            blockchain.networks.forEach(
                function (network) {

                    const item =
                        document.createElement(
                            "div"
                        );

                    item.className =
                        "network-item";

                    const content =
                        document.createElement(
                            "div"
                        );

                    content.className =
                        "network-info";

                    const name =
                        document.createElement(
                            "strong"
                        );

                    name.textContent =
                        network.name;

                    const meta =
                        document.createElement(
                            "span"
                        );

                    meta.textContent =
                        `${networkTypeLabel(network)} • ` +
                        `${networkStatusLabel(network)}`;

                    content.appendChild(
                        name
                    );

                    content.appendChild(
                        meta
                    );

                    const button =
                        document.createElement(
                            "button"
                        );

                    button.type =
                        "button";

                    button.className =
                        "network-select-button";

                    const networkChainId =
                        chainIdToHex(
                            network.chainId
                        );

                    const isActive =
                        activeChainId &&
                        networkChainId &&
                        activeChainId.toLowerCase() ===
                        networkChainId;

                    if (isActive) {

                        button.textContent =
                            "Aktif ✓";

                        button.classList.add(
                            "selected"
                        );

                    } else if (
                        network.selectable === false
                    ) {

                        button.textContent =
                            "Tidak tersedia";

                        button.disabled =
                            true;

                    } else {

                        button.textContent =
                            "Pilih";

                        button.addEventListener(
                            "click",
                            function () {

                                pilihNetwork(
                                    network
                                );

                            }
                        );
                    }

                    item.appendChild(
                        content
                    );

                    item.appendChild(
                        button
                    );

                    blockchainGroup.appendChild(
                        item
                    );

                }
            );

            networkList.appendChild(
                blockchainGroup
            );

        }
    );
}                                

// ======================================================
// NETWORK SEARCH
// ======================================================

function setupNetworkSearch() {

    const searchInput =
        document.getElementById(
            "networkSearch"
        );


    if (!searchInput) {

        return;
    }


    searchInput.addEventListener(
        "input",
        function() {

            renderNetworkList();

        }
    );
}

// ======================================================
// TOGGLE EVENTS
// ======================================================

autoConnectToggle.addEventListener(
    "change",
    function() {

        settings.autoConnect =
            autoConnectToggle.checked;


        simpanSettings();


        setSettingsStatus(
            settings.autoConnect

                ? "Auto Connect diaktifkan ✅"

                : "Auto Connect dinonaktifkan."
        );

    }
);


reconnectToggle.addEventListener(
    "change",
    function () {

        settings.reconnectOnLaunch =
            reconnectToggle.checked;

        simpanSettings();

        setSettingsStatus(
            settings.reconnectOnLaunch
                ? "Reconnect on Launch diaktifkan ✅"
                : "Reconnect on Launch dinonaktifkan."
        );

    }
);


rememberWalletToggle.addEventListener(
    "change",
    function () {

        settings.rememberWallet =
            rememberWalletToggle.checked;

        if (!settings.rememberWallet) {

            settings.preferredProvider =
                null;

        }

        simpanSettings();

        setSettingsStatus(
            settings.rememberWallet
                ? "Remember Last Wallet diaktifkan ✅"
                : "Remember Last Wallet dinonaktifkan."
        );

    }
);


// ======================================================
// TAMBAHKAN PROVIDER
// ======================================================

function tambahProvider(detail) {

    const provider =
        detail?.provider;


    const info =
        detail?.info;


    if (
        !provider ||
        !info
    ) {

        return;
    }


    const duplicate =
        providers.some(
            function(item) {

                return (
                    item.provider ===
                    provider
                );

            }
        );


    if (duplicate) {

        return;
    }


    providers.push({

        provider:
            provider,

        info:
            info

    });
}


// ======================================================
// DISCOVERY PROVIDER
// ======================================================

function discoverWallets() {

    window.addEventListener(

        "eip6963:announceProvider",

        function(event) {

            tambahProvider(
                event.detail
            );


            renderWalletList();

        }

    );


    window.dispatchEvent(

        new Event(
            "eip6963:requestProvider"
        )

    );


    // ------------------------------------------
    // FALLBACK
    // ------------------------------------------

    if (
        window.bitkeep?.ethereum
    ) {

        tambahProvider({

            provider:
                window.bitkeep.ethereum,

            info: {

                uuid:
                    "legacy-bitkeep",

                name:
                    "Bitget Wallet",

                icon:
                    "",

                rdns:
                    "com.bitget.web3"

            }

        });

    }


    if (
        window.ethereum
    ) {

        const sudahAda =
            providers.some(
                function(item) {

                    return (
                        item.provider ===
                        window.ethereum
                    );

                }
            );


        if (!sudahAda) {

            tambahProvider({

                provider:
                    window.ethereum,

                info: {

                    uuid:
                        "legacy-ethereum",

                    name:
                        "Injected Wallet",

                    icon:
                        "",

                    rdns:
                        "legacy.ethereum"

                }

            });

        }

    }


    setTimeout(

        renderWalletList,

        300

    );

}


// ======================================================
// CEK PROVIDER SUDAH TERHUBUNG
// ======================================================

async function akunProvider(
    provider
) {

    try {

        const accounts =
            await provider.request({

                method:
                    "eth_accounts"

            });


        return Array.isArray(
            accounts
        )
            ? accounts
            : [];

    } catch (error) {

        console.warn(
            "ETH_ACCOUNTS ERROR:",
            error?.message ||
            error
        );


        return [];
    }
}


// ======================================================
// PILIH WALLET
// ======================================================

async function pilihWallet(item) {

    setSettingsStatus(
        "Menghubungkan " +
        item.info.name +
        "..."
    );


    try {

        const accounts =
            await item.provider.request({

                method:
                    "eth_requestAccounts"

            });


        if (
            !Array.isArray(accounts) ||
            accounts.length === 0
        ) {

            throw new Error(
                "Wallet tidak mengembalikan akun."
            );
        }


        providerAktif =
            item;


        if (
            settings.rememberWallet
        ) {

            settings.preferredProvider = {

                uuid:
                    item.info.uuid,

                rdns:
                    item.info.rdns,

                name:
                    item.info.name

            };

        }


        simpanSettings();


        renderWalletList();


        renderAccounts(
            accounts
        );


        setSettingsStatus(

            item.info.name +
            " berhasil dipilih ✅"

        );

    } catch (error) {

        console.error(
            "GAGAL MEMILIH WALLET:",
            error
        );


        setSettingsStatus(

            "Wallet tidak dipilih: " +
            (
                error?.message ||
                "permintaan dibatalkan"
            )

        );

    }
}


// ======================================================
// RENDER WALLET
// ======================================================

async function renderWalletList() {

    if (!walletList) {

        return;
    }


    walletList.innerHTML =
        "";


    if (
        providers.length === 0
    ) {

        walletList.innerHTML = `

            <div class="empty-state">

                Tidak ada provider wallet
                yang terdeteksi.

            </div>

        `;


        return;
    }


    for (
        const item of providers
    ) {

        const accounts =
            await akunProvider(
                item.provider
            );


        const preferred =
            settings.preferredProvider;


        const selected =

            preferred &&

            (

                preferred.uuid ===
                item.info.uuid

                ||

                preferred.rdns ===
                item.info.rdns

            );


        const itemElement =
            document.createElement(
                "div"
            );


        itemElement.className =
            "wallet-item";


        const icon =
            document.createElement(
                "img"
            );


        icon.className =
            "wallet-icon";


        icon.alt =
            item.info.name;


        icon.src =
            item.info.icon ||
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%231e293b'/%3E%3Ctext x='50' y='63' text-anchor='middle' font-size='46'%3E%F0%9F%91%9B%3C/text%3E%3C/svg%3E";


        const info =
            document.createElement(
                "div"
            );


        info.className =
            "wallet-info";


        const title =
            document.createElement(
                "strong"
            );


        title.textContent =
            item.info.name;


        const description =
            document.createElement(
                "span"
            );


        description.textContent =

            accounts.length > 0

                ? "Terhubung"

                : "Belum terhubung";


        info.appendChild(
            title
        );


        info.appendChild(
            description
        );


        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "wallet-select-button";


        if (selected) {

            button.textContent =
                "Dipilih ✓";

            button.classList.add(
                "selected"
            );

        } else {

            button.textContent =
                "Pilih";

        }


        button.addEventListener(

            "click",

            function() {

                pilihWallet(
                    item
                );

            }

        );


        itemElement.appendChild(
            icon
        );


        itemElement.appendChild(
            info
        );


        itemElement.appendChild(
            button
        );


        walletList.appendChild(
            itemElement
        );

    }
}


// ======================================================
// RENDER ACCOUNT
// ======================================================

function renderAccounts(
    accounts
) {

    if (!accountList) {

        return;
    }


    accountList.innerHTML =
        "";


    if (
        !accounts ||
        accounts.length === 0
    ) {

        accountList.innerHTML = `

            <div class="empty-state">

                Belum ada akun yang
                tersedia.

            </div>

        `;


        return;
    }


    accounts.forEach(

        function(address, index) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "account-item";


            if (index === 0) {

                item.classList.add(
                    "active"
                );

            }


            item.innerHTML = `

                <strong>

                    ${
                        index === 0
                            ? "Akun aktif"
                            : "Akun tersedia"
                    }

                </strong>

                <code>
                    ${address}
                </code>

            `;


            accountList.appendChild(
                item
            );

        }

    );

}


// ======================================================
// REFRESH ACCOUNT
// ======================================================

async function periksaAkun() {

    if (!providerAktif) {

        // Cari provider yang sebelumnya dipilih

        const preferred =
            settings.preferredProvider;


        if (preferred) {

            providerAktif =
                providers.find(
                    function(item) {

                        return (

                            item.info.uuid ===
                            preferred.uuid

                            ||

                            item.info.rdns ===
                            preferred.rdns

                        );

                    }
                ) || null;

        }

    }


    if (!providerAktif) {

        accountList.innerHTML = `

            <div class="empty-state">

                Pilih wallet terlebih dahulu.

            </div>

        `;

        return;

    }


    const accounts =
        await akunProvider(
            providerAktif.provider
        );


    renderAccounts(
        accounts
    );


    setSettingsStatus(

        accounts.length > 0

            ? "Akun wallet diperbarui ✅"

            : "Tidak ada akun yang diberikan wallet."

    );

}


refreshAccounts.addEventListener(
    "click",
    periksaAkun
);        

// ======================================================
// INIT
// ======================================================

async function initSettings() {

    setupNetworkSearch();
    loadChainCatalog();

    setSettingsStatus(
        "Mendeteksi wallet..."
    );


    await new Promise(
        function(resolve) {

            setTimeout(
                resolve,
                500
            );

        }
    );


    await renderWalletList();

    await periksaAkun();

    await renderNetworkList();

    console.log(
        "SETTINGS.JS BERHASIL DIMUAT"
    );

}


initSettings();
