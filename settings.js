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

        const response =
            await fetch(CHAINS_JSON_URL, {
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
                        Periksa file chains.json
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
// NORMALIZE CHAIN ID
// ======================================================

function chainIdToHex(chainId) {

    if (
        chainId === null ||
        chainId === undefined
    ) {

        return null;
    }


    if (
        typeof chainId === "string" &&
        chainId.startsWith("0x")
    ) {

        return chainId.toLowerCase();
    }


    return (
        "0x" +
        Number(chainId).toString(16)
    ).toLowerCase();
}


// ======================================================
// NETWORK TYPE LABEL
// ======================================================

function networkTypeLabel(network) {

    if (
        network.type ===
        "public-mainnet"
    ) {

        return "Public Mainnet";
    }


    if (
        network.type ===
        "private-mainnet"
    ) {

        return "Private Mainnet";
    }


    if (
        network.type ===
        "testnet"
    ) {

        return "Testnet";
    }


    return "Network";
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


    networkList.innerHTML = "";


    const searchInput =
        document.getElementById(
            "networkSearch"
        );


    const searchQuery =
        (
            searchInput?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const filteredBlockchains =
        chainCatalog.blockchains
            .map(function(blockchain) {

                const modeNetworks =
    blockchain.networks.filter(
        function (network) {

            if (
                settings.testnetMode
            ) {

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

                const networks =
                    blockchain.networks.filter(
                        function(network) {

                            const searchableText = (

                                blockchain.name +
                                " " +
                                network.name +
                                " " +
                                networkTypeLabel(network) +
                                " " +
                                networkStatusLabel(network)

                            ).toLowerCase();


                            return searchableText.includes(
                                searchQuery
                            );

                        }
                    );


                return {
                    ...blockchain,
                    networks
                };

            })
            .filter(function(blockchain) {

                return (
                    blockchain.networks.length > 0
                );

            });


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


    const activeChainId =
        await ambilChainIdWallet();


    filteredBlockchains.forEach(
        function(blockchain) {

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
                function(network) {

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

                    }


                    if (
                        network.selectable !== false &&
                        !isActive
                    ) {

                        button.addEventListener(
                            "click",
                            function() {

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
// NETWORK
// ======================================================

async function pilihNetwork(
    profile
) {

    if (!providerAktif) {

        setSettingsStatus(
            "Pilih wallet terlebih dahulu."
        );

        return;
    }


    const network =
        networkUntukDipilih(
            profile
        );


    if (!network) {

        return;
    }


    try {

        setSettingsStatus(
            "Mengganti network ke " +
            network.name +
            "..."
        );


        await providerAktif.provider.request({

            method:
                "wallet_switchEthereumChain",

            params: [
                {
                    chainId:
                        network.chainId
                }
            ]

        });


        settings.preferredNetwork =
            network.chainId;


        simpanSettings();


        renderNetworkList();


        setSettingsStatus(

            network.name +
            " berhasil dipilih ✅"

        );

    } catch (error) {

        console.error(
            "GAGAL SWITCH NETWORK:",
            error
        );


        if (
            error?.code === 4001
        ) {

            setSettingsStatus(
                "Pergantian network dibatalkan."
            );

            return;
        }


        if (
            error?.code === 4902
        ) {

            setSettingsStatus(

                network.name +
                " belum ditambahkan di wallet."

            );

            return;
        }


        if (
            error?.code === 4200
        ) {

            setSettingsStatus(

                "Wallet tidak mendukung pergantian network dari website."

            );

            return;
        }


        setSettingsStatus(

            "Gagal mengganti network: " +
            (
                error?.message ||
                "error tidak diketahui"
            )

        );

    }
}

// ======================================================
// NETWORK BUTTON
// ======================================================

document
    .querySelectorAll(
        ".network-item.active"
    )
    .forEach(
        function(button) {

            button.addEventListener(
                "click",
                pilihSepolia
            );

        }
    );

async function renderNetworkList() {

    if (!networkList) {

        return;
    }


    networkList.innerHTML =
        "";


    const currentChain =
        await ambilChainIdWallet();


    NETWORK_PROFILES.forEach(
        function(profile) {

            const network =
                networkUntukDipilih(
                    profile
                );


            const item =
                document.createElement(
                    "button"
                );


            item.type =
                "button";


            item.className =
                "network-item";


            if (
                currentChain ===
                network.chainId
            ) {

                item.classList.add(
                    "selected"
                );

            }


            const main =
                document.createElement(
                    "div"
                );


            main.className =
                "network-main";


            const title =
                document.createElement(
                    "strong"
                );


            title.textContent =
                network.name;


            const family =
                document.createElement(
                    "span"
                );


            family.textContent =
                settings.testnetMode

                    ? profile.name +
                      " • Testnet"

                    : profile.name +
                      " • Mainnet";


            main.appendChild(
                title
            );


            main.appendChild(
                family
            );


            const badge =
                document.createElement(
                    "span"
                );


            badge.className =
                "network-badge";


            if (
                currentChain ===
                network.chainId
            ) {

                badge.classList.add(
                    "active"
                );

                badge.textContent =
                    "Aktif";

            } else {

                badge.textContent =
                    "Pilih";

            }


            item.appendChild(
                main
            );


            item.appendChild(
                badge
            );


            item.addEventListener(
                "click",
                function() {

                    pilihNetwork(
                        profile
                    );

                }
            );


            networkList.appendChild(
                item
            );

        }
    );
}


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
