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
// CRYPTO WALLET - CONNECT TEST
// SEPOLIA
// ======================================================

let web3 = null;
let akun = null;
let walletProviderAktif = null;

let readProviders = [];

// ======================================================
// AUTO-CONNECT / PROVIDER DISCOVERY
// ======================================================

let walletProvidersTerdeteksi = [];

let autoConnectSedangBerjalan = false;

const providerListeners =
    new WeakSet();

const SEPOLIA_CHAIN_ID = 11155111;

const SEPOLIA_RPCS = [
    {
        name: "PublicNode",
        url: "https://ethereum-sepolia-rpc.publicnode.com"
    },

    {
        name: "Sepolia.org",
        url: "https://rpc.sepolia.org"
    },

    {
        name: "Sepolia Online",
        url: "https://rpc.sepolia.online"
    }
];

// ======================================================
// ELEMENT HTML
// ======================================================

const btnConnect =
    document.getElementById("btnConnect");

    console.log(
    "HASIL BTN CONNECT:",
    btnConnect
);

const alamat =
    document.getElementById("alamat");

const statusEl =
    document.getElementById("txStatus");

const btnCekSaldo =
    document.getElementById("btnCekSaldo");

const sendBtn =
    document.getElementById("sendBtn");

const toAddress =
    document.getElementById("toAddress");

const amountInput =
    document.getElementById("amount");

// ======================================================
// CEK AWAL
// ======================================================

console.log("================================");
console.log("Crypto Wallet JS dimulai");
console.log("btnConnect:", !!btnConnect);
console.log("alamat:", !!alamat);
console.log("status:", !!statusEl);
console.log("Web3:", typeof Web3);
console.log("ethereum:", typeof window.ethereum);
console.log("sendBtn:", !!sendBtn);
console.log("toAddress:", !!toAddress);
console.log("amountInput:", !!amountInput);
console.log("================================");


// ======================================================
// STATUS
// ======================================================

function setStatus(message) {

    console.log("STATUS:", message);

    if (statusEl) {
        statusEl.innerText = message;
    }
}

function buatReadProviders() {

    if (readProviders.length === 0) {

        readProviders =
            SEPOLIA_RPCS.map(function (rpc) {

                console.log(
                    "MEMBUAT READ PROVIDER:",
                    rpc.name
                );

                return {
                    name: rpc.name,
                    web3: new Web3(rpc.url)
                };

            });

        console.log(
            "TOTAL READ PROVIDER:",
            readProviders.length
        );
    }

    return readProviders;
}

// ======================================================
// PENYIMPANAN TRANSAKSI NYATA
// ======================================================

const TRANSACTION_STORAGE_KEY =
    "walletcrypto_transactions_v1";


// ======================================================
// BACA TRANSAKSI TERSIMPAN
// ======================================================

function bacaTransaksiTersimpan() {

    try {

        const raw =
            localStorage.getItem(
                TRANSACTION_STORAGE_KEY
            );

        if (!raw) {
            return [];
        }

        const data =
            JSON.parse(raw);

        if (!Array.isArray(data)) {
            return [];
        }

        return data;

    } catch (error) {

        console.log(
            "GAGAL MEMBACA DATA TRANSAKSI:",
            error?.message || error
        );

        return [];
    }
}


// ======================================================
// SIMPAN TRANSAKSI NYATA
// ======================================================

async function simpanTransaksiNyata(
    reader,
    txHash,
    fallbackFrom,
    fallbackTo,
    fallbackValueWei
) {

    // ------------------------------------------
    // AMBIL DATA TRANSAKSI
    // ------------------------------------------

    const transaksi =
        await reader.eth.getTransaction(
            txHash
        );


    // ------------------------------------------
    // AMBIL RECEIPT LENGKAP
    // ------------------------------------------

    const receipt =
        await reader.eth.getTransactionReceipt(
            txHash
        );


    if (
        !receipt ||
        receipt.blockNumber === null ||
        receipt.blockNumber === undefined
    ) {

        throw new Error(
            "Receipt transaksi belum lengkap."
        );
    }


    // ------------------------------------------
    // AMBIL BLOCK UNTUK TIMESTAMP
    // ------------------------------------------

    const block =
        await reader.eth.getBlock(
            receipt.blockNumber
        );


    // ------------------------------------------
    // HITUNG GAS FEE SEBENARNYA
    // ------------------------------------------

    const gasUsed =
        BigInt(
            receipt.gasUsed
        );


    const gasPriceRaw =
        receipt.effectiveGasPrice ??
        receipt.gasPrice ??
        transaksi?.gasPrice;


    if (
        gasPriceRaw === null ||
        gasPriceRaw === undefined
    ) {

        throw new Error(
            "Harga gas efektif tidak tersedia."
        );
    }


    const gasFeeWei =
        gasUsed *
        BigInt(gasPriceRaw);


    // ------------------------------------------
    // NILAI ETH TRANSAKSI
    // ------------------------------------------

    const valueWei =
        transaksi?.value ??
        fallbackValueWei;


    // ------------------------------------------
    // TIMESTAMP BLOCKCHAIN
    // ------------------------------------------

    const timestamp =
        Number(
            block.timestamp
        );


    // ------------------------------------------
    // BENTUK DATA UNTUK RIWAYAT
    // ------------------------------------------

    const record = {

        txHash: txHash,

        from:
            transaksi?.from ??
            fallbackFrom,

        to:
            transaksi?.to ??
            fallbackTo,

        network:
            "Ethereum Sepolia",

        amount:
            reader.utils.fromWei(
                String(valueWei),
                "ether"
            ),

        gasFee:
            reader.utils.fromWei(
                gasFeeWei.toString(),
                "ether"
            ),

        gasUsed:
            gasUsed.toString(),

        block:
            String(
                receipt.blockNumber
            ),

        timestamp:
            new Date(
                timestamp * 1000
            ).toISOString()
    };


    // ------------------------------------------
    // SIMPAN KE LOCAL STORAGE
    // ------------------------------------------

    const existing =
        bacaTransaksiTersimpan();


    // Hindari TX duplikat

    const filtered =
        existing.filter(
            function(item) {

                return (
                    item.txHash !==
                    txHash
                );

            }
        );


    // Transaksi terbaru di paling atas

    filtered.unshift(
        record
    );


    localStorage.setItem(
        TRANSACTION_STORAGE_KEY,
        JSON.stringify(filtered)
    );


    console.log(
        "TRANSAKSI NYATA BERHASIL DISIMPAN:",
        record
    );


    return record;
}

// ======================================================
// MENUNGGU RECEIPT
// PROVIDER WALLET + FALLBACK RPC
// ======================================================

async function tungguReceipt(
    walletProvider,
    readers,
    txHash,
    intervalMs = 2000,
    maxAttempts = 60
) {
    
    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ) {

        console.log(
            "CEK RECEIPT - PERCOBAAN:",
            attempt,
            "/",
            maxAttempts
        );

        // ==========================================
        // CEK PROVIDER WALLET
        // ==========================================

        try {

            const receipt =
                await walletProvider.request({
                    method:
                        "eth_getTransactionReceipt",
                    params: [txHash]
                });

            if (receipt) {

                console.log(
                    "RECEIPT DITEMUKAN DARI PROVIDER WALLET"
                );

                return {
                    status:
                        receipt.status === "0x1"
                            ? 1n
                            : 0n,

                    blockNumber:
                        receipt.blockNumber
                            ? parseInt(
                                receipt.blockNumber,
                                16
                            )
                            : undefined,

                    transactionHash:
                        receipt.transactionHash
                };
            }

            console.log(
                "PROVIDER WALLET: RECEIPT BELUM ADA"
            );

        } catch (error) {

            console.log(
                "PROVIDER WALLET ERROR:",
                error?.message || error
            );
                    }

// ==========================================
// FALLBACK MULTI-RPC
// ==========================================

for (
    let rpcIndex = 0;
    rpcIndex < readers.length;
    rpcIndex++
) {

    const rpc =
        readers[rpcIndex];

    try {

        console.log(
            "CEK RPC:",
            rpc.name
        );

        const receipt =
            await rpc.web3.eth.getTransactionReceipt(
                txHash
            );

        if (receipt) {

            console.log(
                "RECEIPT DITEMUKAN DARI RPC:",
                rpc.name
            );

            return receipt;
        }

        console.log(
            rpc.name +
            ": RECEIPT BELUM ADA"
        );

    } catch (error) {

        console.log(
            rpc.name +
            " ERROR:",
            error?.message ||
            error
        );
    }
}
        
// ==========================================
        // TUNGGU
        // ==========================================

        if (
            attempt < maxAttempts
        ) {

            await new Promise(
                function(resolve) {

                    setTimeout(
                        resolve,
                        intervalMs
                    );

                }
            );
        }
    }
        
const timeoutError = new Error(
    "Transaksi sudah dikirim, tetapi konfirmasi belum dapat diverifikasi."
);

timeoutError.code = "TX_CONFIRMATION_TIMEOUT";
timeoutError.txHash = txHash;

throw timeoutError;
}

// ======================================================
// CEK WALLET
// ======================================================

function walletTersedia() {

    return (
        typeof window.ethereum !== "undefined"
    );

}

// ======================================================
// TAMBAHKAN PROVIDER WALLET
// ======================================================

function tambahProviderWallet(detail) {

    const provider =
        detail?.provider ??
        detail;


    if (
        !provider ||
        typeof provider.request !== "function"
    ) {

        return;
    }


    const sudahAda =
        walletProvidersTerdeteksi.some(
            function(item) {

                return (
                    item.provider ===
                    provider
                );

            }
        );


    if (sudahAda) {
        return;
    }


    walletProvidersTerdeteksi.push({

        provider:

            provider,

        info:

            detail?.info ??
            null

    });


    console.log(
        "PROVIDER WALLET TERDETEKSI:",
        detail?.info?.name ||
        "Injected Wallet"
    );
}


// ======================================================
// EIP-6963 WALLET DISCOVERY
// ======================================================

function mulaiDiscoveryWallet() {

    // ------------------------------------------
    // Provider dari EIP-6963
    // ------------------------------------------

    window.addEventListener(
        "eip6963:announceProvider",
        function(event) {

            tambahProviderWallet(
                event.detail
            );

        }
    );


    // ------------------------------------------
    // Minta semua provider mengumumkan diri
    // ------------------------------------------

    window.dispatchEvent(
        new Event(
            "eip6963:requestProvider"
        )
    );


    // ------------------------------------------
    // FALLBACK WALLET LAMA
    // ------------------------------------------

    tambahProviderWallet(
        window.bitkeep?.ethereum
    );


    tambahProviderWallet(
        window.ethereum
    );

}

// ======================================================
// CARI PROVIDER YANG SUDAH DIBERI IZIN
// ======================================================

async function cariWalletSudahTerhubung() {

    mulaiDiscoveryWallet();


    // Beri waktu provider EIP-6963
    // mengumumkan dirinya.

    await new Promise(
        function(resolve) {

            setTimeout(
                resolve,
                200
            );

        }
    );


    for (
        let index = 0;
        index <
        walletProvidersTerdeteksi.length;
        index++
    ) {

        const item =
            walletProvidersTerdeteksi[index];


        try {

            const accounts =
                await item.provider.request({

                    method:
                        "eth_accounts"

                });


            if (
                Array.isArray(accounts) &&
                accounts.length > 0
            ) {

                console.log(
                    "AUTO-CONNECT WALLET DITEMUKAN:",
                    item.info?.name ||
                    "Injected Wallet"
                );


                console.log(
                    "AUTO-CONNECT ACCOUNT:",
                    accounts[0]
                );


                return {

                    provider:
                        item.provider,

                    info:
                        item.info,

                    accounts:
                        accounts

                };

            }

        } catch (error) {

            console.log(
                "AUTO-CONNECT PROVIDER ERROR:",
                error?.message ||
                error
            );

        }

    }


    return null;
                }

// ======================================================
// AUTO-CONNECT WALLET
// ======================================================

async function autoConnectWallet() {

    if (
        autoConnectSedangBerjalan
    ) {

        return;
    }


    autoConnectSedangBerjalan =
        true;


    try {

        console.log(
            "AUTO-CONNECT DIMULAI"
        );


        const hasil =
            await cariWalletSudahTerhubung();


        // ------------------------------------------
        // TIDAK ADA WALLET YANG SUDAH DIBERI IZIN
        // ------------------------------------------

        if (!hasil) {

            console.log(
                "AUTO-CONNECT: TIDAK ADA WALLET TERHUBUNG"
            );

            return;
        }


        // ------------------------------------------
        // AKTIFKAN PROVIDER
        // ------------------------------------------

        walletProviderAktif =
            hasil.provider;


        akun =
            hasil.accounts[0];


        console.log(
            "AUTO-CONNECT PROVIDER:",
            hasil.info?.name ||
            "Injected Wallet"
        );


        console.log(
            "AUTO-CONNECT ACCOUNT:",
            akun
        );


        // ------------------------------------------
        // CEK NETWORK
        // ------------------------------------------

        const chainIdHex =
            await walletProviderAktif.request({

                method:
                    "eth_chainId"

            });


        const chainId =
            parseInt(
                chainIdHex,
                16
            );


        console.log(
            "AUTO-CONNECT CHAIN ID:",
            chainId
        );


        if (
            chainId !==
            SEPOLIA_CHAIN_ID
        ) {

            if (alamat) {

                alamat.innerHTML = `

                    <b>Alamat:</b><br>

                    ${akun.slice(0, 6)}
                    ...
                    ${akun.slice(-4)}

                    <br><br>

                    <b>Network:</b><br>

                    Bukan Ethereum Sepolia

                `;

            }


            setStatus(
                "Wallet terhubung, tetapi network bukan Sepolia."
            );


            console.log(
                "AUTO-CONNECT NETWORK BUKAN SEPOLIA"
            );


            return;
        }


        console.log(
            "AUTO-CONNECT SEPOLIA TERDETEKSI"
        );


        // ------------------------------------------
        // BUAT WEB3
        // ------------------------------------------

        if (
            typeof Web3 ===
            "undefined"
        ) {

            throw new Error(
                "Web3.js tidak ditemukan."
            );
        }


        web3 =
            new Web3(
                walletProviderAktif
            );


        console.log(
            "AUTO-CONNECT WEB3 BERHASIL"
        );


        // ------------------------------------------
        // SEMBUNYIKAN CONNECT WALLET
        // ------------------------------------------

        if (btnConnect) {

            btnConnect.hidden =
                true;

        }


        // ------------------------------------------
        // TAMPILKAN ALAMAT
        // ------------------------------------------

        if (alamat) {

            alamat.innerHTML = `

                <b>Alamat:</b><br>

                ${akun.slice(0, 6)}
                ...
                ${akun.slice(-4)}

                <br><br>

                <b>Saldo ETH:</b><br>
                Mengambil saldo...

            `;

        }


        // ------------------------------------------
        // AMBIL SALDO
        // ------------------------------------------

        setStatus(
            "Auto-connect: mengambil saldo..."
        );


        const readers =
            buatReadProviders();


        const reader =
            readers[0].web3;


        console.log(
            "AUTO-CONNECT MEMAKAI READ RPC:",
            readers[0].name
        );


        const balanceWei =
            await reader.eth.getBalance(
                akun
            );


        const balanceETH =
            reader.utils.fromWei(
                balanceWei,
                "ether"
            );


        console.log(
            "AUTO-CONNECT BALANCE WEI:",
            balanceWei
        );


        console.log(
            "AUTO-CONNECT BALANCE ETH:",
            balanceETH
        );


        if (alamat) {

            alamat.innerHTML = `

                <b>Alamat:</b><br>

                ${akun.slice(0, 6)}
                ...
                ${akun.slice(-4)}

                <br><br>

                <b>Saldo ETH:</b><br>

                ${parseFloat(
                    balanceETH
                ).toFixed(6)}

                ETH

            `;

        }


        setStatus(
            "Wallet otomatis terhubung ✅"
        );


        console.log(
            "================================"
        );


        console.log(
            "AUTO-CONNECT BERHASIL ✅"
        );


        console.log(
            "Akun:",
            akun
        );


        console.log(
            "Wallet:",
            hasil.info?.name ||
            "Injected Wallet"
        );


        console.log(
            "Saldo:",
            balanceETH
        );


        console.log(
            "================================"
        );


        // ------------------------------------------
        // PASANG EVENT PROVIDER
        // ------------------------------------------

        pasangEventProvider(
            walletProviderAktif
        );

    } catch (error) {

        console.error(
            "AUTO-CONNECT ERROR:",
            error
        );


        setStatus(
            "Auto-connect gagal."
        );

    } finally {

        autoConnectSedangBerjalan =
            false;

    }

            }
    
// ======================================================
// CONNECT WALLET
// ======================================================

if (btnConnect) {

    console.log("EVENT CONNECT BERHASIL DIPASANG");

    btnConnect.addEventListener(
        "click",
        async function () {

            console.log(
                "CONNECT BUTTON DIKLIK"
            );

            // ------------------------------------------
            // CEK WALLET
            // ------------------------------------------

            if (!walletTersedia()) {

                setStatus(
                    "Wallet tidak ditemukan."
                );

                alert(
                    "window.ethereum tidak ditemukan.\n\n" +
                    "Buka website menggunakan DApp Browser " +
                    "wallet yang mendukung Ethereum."
                );

                return;
            }


            // ------------------------------------------
            // MULAI CONNECT
            // ------------------------------------------

            try {

                setStatus(
                    "Meminta koneksi wallet..."
                );


                // --------------------------------------
                // MINTA AKUN
                // --------------------------------------

                const walletProvider =
    window.bitkeep?.ethereum ||
    window.ethereum;

    walletProviderAktif = walletProvider;
                
    console.log(
      "PROVIDER CONNECT:",
      walletProvider
);

console.log(
    "PROVIDER AKTIF:",
    walletProviderAktif
);                

if (!walletProvider) {
    throw new Error(
        "Provider wallet tidak ditemukan."
    );
}

if (window.bitkeep?.ethereum) {

    await window.bitkeep.ethereum.enable();

    console.log(
        "BITGET PROVIDER AKTIF"
    );
}

const accounts =
    await walletProvider.request({
        method:
            "eth_requestAccounts"
    });


                console.log(
                    "Accounts:",
                    accounts
                );


                if (
                    !accounts ||
                    accounts.length === 0
                ) {

                    throw new Error(
                        "Wallet tidak memberikan akun."
                    );
                }


                akun =
                    accounts[0];


                console.log(
                    "AKUN:",
                    akun
                );

                // ==========================================
// INISIALISASI PROVIDER BITGET
// ==========================================

if (window.bitkeep?.ethereum) {

    await window.bitkeep.ethereum.enable();

    console.log(
        "BITGET SELECTED ADDRESS SETELAH ENABLE:",
        window.bitkeep.ethereum.selectedAddress
    );

}

                // --------------------------------------
                // CEK NETWORK
                // --------------------------------------

                setStatus(
                    "Mengecek network..."
                );


                const chainIdHex =
                    await walletProvider.request({
                        method:
                            "eth_chainId"
                    });


                console.log(
                    "Chain ID HEX:",
                    chainIdHex
                );


                const chainId =
                    parseInt(
                        chainIdHex,
                        16
                    );


                console.log(
                    "Chain ID:",
                    chainId
                );


                if (
                    chainId !==
                    SEPOLIA_CHAIN_ID
                ) {

                    setStatus(
                        "Wallet terhubung, tetapi bukan Sepolia."
                    );

                    alert(
                        "Silakan ubah network wallet ke Ethereum Sepolia."
                    );

                    return;
                }


                console.log(
                    "SEPOLIA TERDETEKSI"
                );


                // --------------------------------------
                // CEK WEB3
                // --------------------------------------

                if (
                    typeof Web3 ===
                    "undefined"
                ) {

                    throw new Error(
                        "Web3.js tidak ditemukan."
                    );
                }


                // --------------------------------------
                // BUAT WEB3
                // --------------------------------------

                web3 =
                    new Web3(
                        walletProvider
                    );


                console.log(
                    "Web3 berhasil dibuat"
                );


                // --------------------------------------
                // UBAH TOMBOL
                // --------------------------------------

                btnConnect.innerText =
                    "Terhubung ✅";

                btnConnect.disabled =
                    true;


                // --------------------------------------
                // TAMPILKAN ALAMAT
                // --------------------------------------

                if (alamat) {

                    alamat.innerHTML = `
                        <b>Alamat:</b><br>
                        ${akun.slice(0, 6)}
                        ...
                        ${akun.slice(-4)}

                        <br><br>

                        <b>Saldo ETH:</b><br>
                        Mengambil saldo...
                    `;

                }


                // --------------------------------------
                // AMBIL SALDO
                // --------------------------------------

                setStatus(
                    "Mengambil saldo..."
                );

                const readers =
    buatReadProviders();

const reader =
    readers[0].web3;

console.log(
    "MEMAKAI READ RPC:",
    readers[0].name
);

console.log(
    "Meminta saldo ke RPC Sepolia..."
);

console.log(
    "Alamat:",
    akun
);

const balanceWei =
    await reader.eth.getBalance(
        akun
    );
                
                console.log(
                    "Balance Wei:",
                    balanceWei
                );

                const balanceETH =
                    reader.utils.fromWei(
                    balanceWei,
                    "ether"
                );

                console.log(
                    "Balance ETH:",
                    balanceETH
                );
                
                if (alamat) {

                    alamat.innerHTML = `
                        <b>Alamat:</b><br>
                        ${akun.slice(0, 6)}
                        ...
                        ${akun.slice(-4)}

                        <br><br>

                        <b>Saldo ETH:</b><br>
                        ${parseFloat(
                            balanceETH
                        ).toFixed(6)}
                        ETH
                    `;

                }


                setStatus(
                    "Wallet berhasil terhubung."
                );

console.log(
    "================================"
);

console.log(
    "CONNECT BERHASIL"
);

console.log(
    "Akun:",
    akun
);

console.log(
    "Saldo:",
    balanceETH
);

console.log(
    "================================"
);

} catch (error) {
                
                console.error(
                    "SALDO ERROR:",
                    error
                );

                setStatus(
                    "Gagal mengambil saldo: " +
                    (
                    error.message ||
                    "Kesalahan tidak diketahui."
                    )
                );
            }

        }
    );

}

// ======================================================
// CEK SALDO
// ======================================================

if (btnCekSaldo) {

    btnCekSaldo.addEventListener(
        "click",
        async function () {

            if (
                !akun ||
                !web3
            ) {

                setStatus(
                    "Connect wallet dulu."
                );

                return;
            }


            try {

                setStatus(
                    "Mengecek saldo..."
                );


                const balanceWei =
                    await web3.eth.getBalance(
                        akun
                    );


                const balanceETH =
                    web3.utils.fromWei(
                        balanceWei,
                        "ether"
                    );


                if (alamat) {

                    alamat.innerHTML = `
                        <b>Alamat:</b><br>
                        ${akun.slice(0, 6)}
                        ...
                        ${akun.slice(-4)}

                        <br><br>

                        <b>Saldo ETH:</b><br>
                        ${parseFloat(
                            balanceETH
                        ).toFixed(6)}
                        ETH
                    `;

                }


                setStatus(
                    "Saldo berhasil diperbarui."
                );

            } catch (error) {

                console.error(
                    "SALDO ERROR:",
                    error
                );

                setStatus(
                    "Gagal mengambil saldo."
                );

            }

        }
    );

}

// ======================================================
// KIRIM ETH
// ======================================================

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        async function () {

            // 1. Pastikan wallet sudah terhubung
            if (!akun || !web3) {

                setStatus(
                    "Connect wallet dulu."
                );

                return;
            }


            // 2. Ambil input
            const tujuan =
                toAddress.value.trim();

            const jumlah =
                amountInput.value.trim();

            const nilaiJumlah =
                Number(jumlah);


            // 3. Validasi jumlah
            if (
                !Number.isFinite(nilaiJumlah) ||
                nilaiJumlah <= 0
            ) {

                setStatus(
                    "Jumlah ETH tidak valid."
                );

                return;
            }


            // 4. Validasi alamat
            if (
                !web3.utils.isAddress(tujuan)
            ) {

                setStatus(
                    "Alamat Ethereum tidak valid."
                );

                return;
            }


            // 5. Konversi ETH → Wei
            const valueWei =
                web3.utils.toWei(
                    jumlah,
                    "ether"
                );


            console.log(
                "Tujuan:",
                tujuan
            );

            console.log(
                "Jumlah ETH:",
                jumlah
            );

            console.log(
                "Jumlah Wei:",
                valueWei
            );


            // 6. Ambil saldo akun pengirim
            try {

                setStatus(
                    "Mengecek saldo..."
                );


                const balanceWei =
                    await web3.eth.getBalance(
                        akun
                    );


                console.log(
                    "Saldo Wei:",
                    balanceWei
                );


                // 7. Bandingkan saldo dengan jumlah ETH
                const saldo =
                    BigInt(balanceWei);

                const nilaiKirim =
                    BigInt(valueWei);


                if (
                    saldo <= nilaiKirim
                ) {

                    setStatus(
                        "Saldo tidak cukup untuk mengirim ETH."
                    );

                    return;
                }


                // 8. Saldo cukup
                const balanceETH =
                    web3.utils.fromWei(
                        balanceWei,
                        "ether"
                    );


                setStatus(
                    "Saldo cukup. Siap ke tahap estimasi gas."
                );


                console.log(
                    "Saldo ETH:",
                    balanceETH
                );

                console.log(
                    "Saldo cukup untuk jumlah ETH."
                );

                
// ==================================================
// TAHAP BERIKUTNYA: ESTIMASI GAS
// ==================================================

try {

    setStatus(
        "Menghitung estimasi gas..."
    );

// ==========================================
// ESTIMASI GAS DARI PUBLICNODE RPC
// ==========================================

const readers =
    buatReadProviders();

const reader =
    readers[0].web3;

console.log(
    "PROVIDER UNTUK ESTIMASI: PUBLICNODE RPC"
);

const gasEstimate =
    await reader.eth.estimateGas({
        from: akun,
        to: tujuan,
        value: valueWei
    });

console.log(
    "ESTIMASI GAS DARI RPC SEPOLIA:",
    gasEstimate
);

console.log(
    "ESTIMASI GAS DECIMAL:",
    gasEstimate.toString()
);

const gasPrice =
    await reader.eth.getGasPrice();

console.log(
    "GAS PRICE DARI PUBLICNODE RPC:",
    gasPrice
);

console.log(
    "GAS PRICE ETH:",
    reader.utils.fromWei(
        gasPrice,
        "ether"
    )
);    
    
// ==========================================
// HITUNG BIAYA GAS
// ==========================================

const gasFeeWei =
    BigInt(gasEstimate) *
    BigInt(gasPrice);

console.log(
    "Gas Fee Wei:",
    gasFeeWei.toString()
);


const gasFeeETH =
    reader.utils.fromWei(
        gasFeeWei.toString(),
        "ether"
    );

console.log(
    "Gas Fee ETH:",
    gasFeeETH
);


setStatus(
    "Gas Fee: " +
    gasFeeETH +
    " ETH"
);

// ==========================================
// HITUNG TOTAL KEBUTUHAN
// ==========================================

const totalNeededWei =
    BigInt(valueWei) +
    gasFeeWei;

const totalNeededETH =
    reader.utils.fromWei(
        totalNeededWei.toString(),
        "ether"
    );

console.log(
    "Total kebutuhan Wei:",
    totalNeededWei.toString()
);

console.log(
    "Total kebutuhan ETH:",
    totalNeededETH
);

setStatus(
    "Total diperlukan: " +
    totalNeededETH +
    " ETH"
);    

// ==========================================
// CEK SALDO TOTAL
// ==========================================

if (BigInt(balanceWei) < totalNeededWei) {

    setStatus(
        "Saldo tidak cukup untuk jumlah ETH + biaya gas."
    );

    return;
}

setStatus(
    "Saldo cukup untuk ETH + biaya gas."
);

// ==========================================
// TAHAP BERIKUTNYA: KIRIM TRANSAKSI
// ==========================================

const walletBalanceWei =
    await window.ethereum.request({
        method: "eth_getBalance",
        params: [akun, "latest"]
    });

const walletBalanceETH =
    web3.utils.fromWei(
        walletBalanceWei,
        "ether"
    );

const walletChainId =
    await window.ethereum.request({
        method: "eth_chainId"
    });

console.log(
    "CHAIN ID WALLET:",
    walletChainId
);

console.log(
    "AKUN YANG DIGUNAKAN:",
    akun
);

console.log(
    "SALDO WALLET:",
    walletBalanceETH,
    "ETH"
);    

setStatus(
    "Saldo wallet sebenarnya: " +
    walletBalanceETH +
    " ETH"
);    

console.log(
    "SALDO LANGSUNG DARI WALLET:",
    walletBalanceWei
);

console.log(
    "SALDO WALLET ETH:",
    web3.utils.fromWei(
        walletBalanceWei,
        "ether"
    )
);

console.log(
    "JUMLAH YANG AKAN DIKIRIM:",
    jumlah,
    "ETH"
);
    
setStatus("Membuka konfirmasi wallet...");

console.log("MENGIRIM REQUEST TRANSAKSI");    

console.log("========== DEBUG PROVIDER ==========");

console.log(
    "window.bitkeep:",
    window.bitkeep
);

console.log(
    "window.bitkeep.ethereum:",
    window.bitkeep?.ethereum
);

console.log(
    "window.ethereum:",
    window.ethereum
);

console.log(
    "BITKEEP SELECTED ADDRESS:",
    window.bitkeep?.ethereum?.selectedAddress
);

console.log(
    "ETHEREUM SELECTED ADDRESS:",
    window.ethereum?.selectedAddress
);

const provider =
    walletProviderAktif;

console.log(
    "PROVIDER YANG DIPAKAI:",
    provider
);

if (!provider) {

    throw new Error(
        "Provider wallet belum tersedia."
    );  
}

// ------------------------------------------
// CEK AKUN LANGSUNG DARI PROVIDER
// ------------------------------------------

const providerAccounts =
    await provider.request({
        method: "eth_accounts"
    });

console.log(
    "AKUN DARI PROVIDER:",
    providerAccounts
);

console.log(
    "AKUN DARI APLIKASI:",
    akun
);

// ------------------------------------------
// CEK CHAIN DARI PROVIDER
// ------------------------------------------

const providerChainId =
    await provider.request({
        method: "eth_chainId"
    });

console.log(
    "CHAIN ID DARI PROVIDER:",
    providerChainId
);

// ------------------------------------------
// BANDINKAN AKUN
// ------------------------------------------

if (
    !providerAccounts ||
    providerAccounts.length === 0
) {
    throw new Error(
        "Provider tidak mengembalikan akun aktif."
    );
}

const providerAccount =
    providerAccounts[0];

console.log(
    "AKUN PROVIDER:",
    providerAccount
);

console.log(
    "AKUN SAMA:",
    providerAccount.toLowerCase() ===
    akun.toLowerCase()
);

setStatus(
    "Membuka konfirmasi wallet..."
);

console.log(
    "MENGIRIM TRANSAKSI DENGAN AKUN PROVIDER:"
);

console.log(
    providerAccount
);

const txGasPrice =
    await provider.request({
        method: "eth_gasPrice"
    });

console.log(
    "GAS PRICE DARI PROVIDER TRANSAKSI:",
    txGasPrice
);

console.log(
    "MENGIRIM TRANSAKSI DENGAN AKUN PROVIDER:",
    providerAccount
);    

const tx =
    await provider.request({
        method: "eth_sendTransaction",    
    
        params: [{
            from: providerAccount,
            to: tujuan,
            value: valueWei                        
        }]
    });
console.log(
    "TX HASH:",
    tx
);

setStatus(
    "Transaksi dikirim. Menunggu konfirmasi..."
);

// ==========================================
// TUNGGU KONFIRMASI TRANSAKSI
// ==========================================

setStatus(
    "Transaksi dikirim. Menunggu konfirmasi..."
);

const receipt =
await tungguReceipt(
    provider,
    readers,
    tx,
    2000,
    60
);

// ==========================================
// HASIL TRANSAKSI
// ==========================================

if (receipt?.status === 1n) {

    console.log(
        "STATUS = 1n ✅"
    );
    
    console.log(
        "TRANSAKSI SUDAH DIKONFIRMASI"
    );

    console.log(
        "BLOCK NUMBER:",
        receipt.blockNumber
    );

    console.log(
    "TRANSACTION HASH:",
    tx
);


// ==================================================
// SIMPAN TRANSAKSI NYATA
// ==================================================

try {

    await simpanTransaksiNyata(
        reader,
        tx,
        akun,
        tujuan,
        valueWei
    );

    console.log(
        "DATA TRANSAKSI BERHASIL DISIMPAN"
    );

} catch (saveError) {

    console.log(
        "PERINGATAN: TRANSAKSI BERHASIL, " +
        "TETAPI DATA RIWAYAT GAGAL DISIMPAN:",
        saveError?.message ||
        saveError
    );

}


// ==================================================
// STATUS AKHIR
// ==================================================

setStatus(
    "Transaksi berhasil dikonfirmasi ✅"
);

} else {

    console.log(
        "STATUS BUKAN 1n:",
        receipt?.status
    );

    console.log(
        "STATUS TYPE:",
        typeof receipt?.status
    );
    
    console.error(
        "TRANSAKSI MASUK BLOK TETAPI GAGAL"
    );

    setStatus(
        "Transaksi gagal saat diproses blockchain."
    );
                }
    
} catch (error) {

    console.error(
        "TRANSAKSI ERROR OBJECT:",
        error
    );

    console.log(
    "DETAIL ERROR JSON:",
        JSON.stringify(error, null, 2)
    );

    console.log(
        "TRANSAKSI ERROR MESSAGE:",
        error?.message
    );

    console.log(
        "TRANSAKSI ERROR CODE:",
        error?.code
    );

    console.log(
        "TRANSAKSI ERROR DATA:",
        error?.data
    );

    if (
    error?.code === "TX_CONFIRMATION_TIMEOUT"
) {

    console.warn(
        "TX SUDAH DIKIRIM, TETAPI BELUM TERKONFIRMASI:",
        error.txHash
    );

    setStatus(
        "Transaksi sudah dikirim. Konfirmasi masih menunggu..."
    );

    return;
    }

    setStatus(
        "Transaksi gagal: " +
        (
            error?.message ||
            "Error tidak diketahui."
        )
    );

    return;
        }
                
            } catch (error) {

                console.error(
                    "CEK SALDO KIRIM ERROR:",
                    error
                );

                setStatus(
                    "Gagal mengecek saldo."
                );

            }

        }
    );

}

// ======================================================
// EVENT PROVIDER
// ======================================================

function pasangEventProvider(
    provider
) {

    if (
        !provider ||
        typeof provider.on !== "function"
    ) {

        return;
    }


    if (
        providerListeners.has(
            provider
        )
    ) {

        return;
    }


    providerListeners.add(
        provider
    );


    // ==========================================
    // ACCOUNT BERUBAH
    // ==========================================

    provider.on(
        "accountsChanged",
        async function(accounts) {

            console.log(
                "ACCOUNT BERUBAH:",
                accounts
            );


            if (
                !accounts ||
                accounts.length === 0
            ) {

                akun = null;

                web3 = null;


                if (btnConnect) {

                    btnConnect.hidden =
                        false;

                    btnConnect.innerText =
                        "Connect Wallet";

                    btnConnect.disabled =
                        false;

                }


                if (alamat) {

                    alamat.innerText =
                        "Belum terhubung";

                }


                setStatus(
                    "Wallet terputus."
                );


                return;
            }


            akun =
                accounts[0];


            console.log(
                "AKUN BARU:",
                akun
            );


            walletProviderAktif =
                provider;


            web3 =
                new Web3(
                    provider
                );


            if (btnConnect) {

                btnConnect.hidden =
                    true;

            }


            await updateSaldo();

        }
    );


    // ==========================================
    // NETWORK BERUBAH
    // ==========================================

    provider.on(
        "chainChanged",
        function(chainId) {

            console.log(
                "NETWORK BERUBAH:",
                chainId
            );


            const number =
                parseInt(
                    chainId,
                    16
                );


            if (
                number !==
                SEPOLIA_CHAIN_ID
            ) {

                setStatus(
                    "Wallet terhubung, tetapi network bukan Sepolia."
                );


                return;
            }


            setStatus(
                "Network Sepolia ✅"
            );


            if (
                akun &&
                web3
            ) {

                updateSaldo();

            }

        }
    );

}

// ======================================================
// ACCOUNT BERUBAH
// ======================================================

if (walletTersedia()) {

    window.ethereum.on(
        "accountsChanged",
        async function (accounts) {

            console.log(
                "ACCOUNT BERUBAH:",
                accounts
            );


            if (
                !accounts ||
                accounts.length === 0
            ) {

                akun = null;
                web3 = null;


                if (btnConnect) {

                    btnConnect.innerText =
                        "Connect Wallet";

                    btnConnect.disabled =
                        false;

                }


                if (alamat) {

                    alamat.innerText =
                        "Belum terhubung";

                }


                setStatus(
                    "Wallet terputus."
                );

                return;
            }


            akun =
                accounts[0];


            console.log(
                "Akun baru:",
                akun
            );


            if (
                typeof Web3 !==
                "undefined"
            ) {

                web3 =
                    new Web3(
                        window.ethereum
                    );

                await updateSaldo();
            }

        }
    );


    // ==================================================
    // NETWORK BERUBAH
    // ==================================================

    window.ethereum.on(
        "chainChanged",
        function (chainId) {

            console.log(
                "NETWORK BERUBAH:",
                chainId
            );


            const number =
                parseInt(
                    chainId,
                    16
                );


            if (
                number !==
                SEPOLIA_CHAIN_ID
            ) {

                setStatus(
                    "Network bukan Sepolia."
                );

                return;
            }


            setStatus(
                "Network Sepolia."
            );

        }
    );

}


// ======================================================
// UPDATE SALDO
// ======================================================

async function updateSaldo() {

    if (
        !akun ||
        !web3
    ) {

        return;
    }


    try {

        const balanceWei =
            await web3.eth.getBalance(
                akun
            );


        const balanceETH =
            web3.utils.fromWei(
                balanceWei,
                "ether"
            );


        if (alamat) {

            alamat.innerHTML = `
                <b>Alamat:</b><br>
                ${akun.slice(0, 6)}
                ...
                ${akun.slice(-4)}

                <br><br>

                <b>Saldo ETH:</b><br>
                ${parseFloat(
                    balanceETH
                ).toFixed(6)}
                ETH
            `;

        }

    } catch (error) {

        console.error(
            "UPDATE SALDO ERROR:",
            error
        );

    }

}


// ======================================================
// SELESAI
// ======================================================

console.log(
    "Crypto Wallet JS selesai dimuat."
);

// ======================================================
// AUTO-CONNECT SAAT APP DIBUKA
// ======================================================

autoConnectWallet();
