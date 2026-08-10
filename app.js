// ======================================================
// CRYPTO WALLET - SEPOLIA
// ======================================================

let web3 = null;
let readWeb3 = null;
let akun = null;

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_RPC =
    "https://ethereum-sepolia-rpc.publicnode.com";

// Cadangan untuk biaya gas.
// Ini BUKAN biaya pasti, hanya batas aman agar
// user tidak mencoba mengirim seluruh saldo.
const GAS_RESERVE_ETH = "0.001";

// ======================================================
// ELEMENT HTML
// ======================================================

const btnConnect = document.getElementById("btnConnect");
const alamat = document.getElementById("alamat");
const btnCekSaldo = document.getElementById("btnCekSaldo");
const btnCekHash = document.getElementById("btnCekHash");
const inputHash = document.getElementById("inputHash");
const statusEl = document.getElementById("txStatus");

const sendBtn = document.getElementById("sendBtn");
const toAddress = document.getElementById("toAddress");
const amountInput = document.getElementById("amount");

// ======================================================
// CEK ELEMENT
// ======================================================

console.log("================================");
console.log("Crypto Wallet app.js dimuat");
console.log("btnConnect:", !!btnConnect);
console.log("alamat:", !!alamat);
console.log("sendBtn:", !!sendBtn);
console.log("btnCekSaldo:", !!btnCekSaldo);
console.log("btnCekHash:", !!btnCekHash);
console.log("txStatus:", !!statusEl);
console.log("================================");

// ======================================================
// CEK WEB3
// ======================================================

if (typeof Web3 === "undefined") {

    console.error("Web3 tidak ditemukan.");

    if (statusEl) {
        statusEl.innerText =
            "Web3.js tidak ditemukan.";
    }
}

// ======================================================
// WALLET TERSEDIA?
// ======================================================

function walletTersedia() {

    return typeof window.ethereum !== "undefined";
}

// ======================================================
// READ PROVIDER
// ======================================================

function buatReadProvider() {

    if (!readWeb3) {

        readWeb3 =
            new Web3(SEPOLIA_RPC);
    }

    return readWeb3;
}

// ======================================================
// STATUS
// ======================================================

function setStatus(message) {

    if (statusEl) {
        statusEl.innerText = message;
    }

    console.log(message);
}

// ======================================================
// CONNECT WALLET
// ======================================================

if (btnConnect) {

    btnConnect.addEventListener(
        "click",
        async () => {

            console.log("Connect Wallet ditekan");

            if (!walletTersedia()) {

                setStatus(
                    "Wallet tidak ditemukan. Buka melalui DApp browser wallet."
                );

                alert(
                    "Wallet tidak ditemukan.\n\n" +
                    "Buka website menggunakan browser/DApp browser " +
                    "MetaMask atau wallet yang mendukung window.ethereum."
                );

                return;
            }

            try {

                setStatus(
                    "Menghubungkan wallet..."
                );

                // Buat Web3 dari wallet
                web3 =
                    new Web3(window.ethereum);

                console.log(
                    "Web3 berhasil dibuat"
                );

                // Minta akun
                const accounts =
                    await window.ethereum.request({
                        method: "eth_requestAccounts"
                    });

                if (
                    !accounts ||
                    accounts.length === 0
                ) {

                    throw new Error(
                        "Tidak ada akun wallet."
                    );
                }

                akun =
                    accounts[0];

                console.log(
                    "Akun:",
                    akun
                );

                // Cek network
                const chainId =
                    await window.ethereum.request({
                        method: "eth_chainId"
                    });

                const chainNumber =
                    parseInt(chainId, 16);

                console.log(
                    "Chain ID:",
                    chainNumber
                );

                if (
                    chainNumber !==
                    SEPOLIA_CHAIN_ID
                ) {

                    setStatus(
                        "Wallet terhubung, tetapi network bukan Sepolia."
                    );

                    alert(
                        "Silakan ganti network wallet ke Ethereum Sepolia."
                    );

                    return;
                }

                // Tombol
                btnConnect.textContent =
                    "Terhubung ✅";

                btnConnect.disabled =
                    true;

                // Update UI
                await updateUI();

                setStatus(
                    "Wallet berhasil terhubung."
                );

                console.log(
                    "CONNECT BERHASIL"
                );

            } catch (error) {

                console.error(
                    "CONNECT ERROR:",
                    error
                );

                setStatus(
                    "Gagal connect: " +
                    (error.message ||
                        "Kesalahan tidak diketahui.")
                );
            }
        }
    );
}

// ======================================================
// UPDATE ALAMAT + SALDO
// ======================================================

async function updateUI() {

    if (!akun) {
        return;
    }

    try {

        const reader =
            buatReadProvider();

        // Cek RPC Sepolia
        const rpcChainId =
            await reader.eth.getChainId();

        if (
            Number(rpcChainId) !==
            SEPOLIA_CHAIN_ID
        ) {

            throw new Error(
                "RPC bukan Sepolia."
            );
        }

        // Ambil saldo
        const balanceWei =
            await reader.eth.getBalance(
                akun
            );

        const saldoETH =
            reader.utils.fromWei(
                balanceWei,
                "ether"
            );

        alamat.innerHTML = `
            <b>Alamat:</b><br>
            ${akun.slice(0, 6)}
            ...
            ${akun.slice(-4)}

            <br><br>

            <b>Saldo ETH:</b><br>
            ${parseFloat(saldoETH).toFixed(6)}
            ETH
        `;

        console.log(
            "Saldo:",
            saldoETH,
            "ETH"
        );

    } catch (error) {

        console.error(
            "UPDATE UI ERROR:",
            error
        );

        alamat.innerHTML = `
            <b>Alamat:</b><br>
            ${akun.slice(0, 6)}
            ...
            ${akun.slice(-4)}

            <br><br>

            <span>
                Gagal mengambil saldo
            </span>
        `;

        setStatus(
            "Gagal mengambil saldo."
        );
    }
}

// ======================================================
// KIRIM ETH
// ======================================================

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        async () => {

            console.log(
                "Tombol Kirim ditekan"
            );

            // ------------------------------------------------
            // CEK CONNECT
            // ------------------------------------------------

            if (!akun || !web3) {

                setStatus(
                    "Connect wallet terlebih dahulu."
                );

                return;
            }

            // ------------------------------------------------
            // AMBIL INPUT
            // ------------------------------------------------

            const to =
                toAddress.value.trim();

            const amount =
                amountInput.value.trim();

            // ------------------------------------------------
            // CEK KOSONG
            // ------------------------------------------------

            if (!to || !amount) {

                setStatus(
                    "Alamat tujuan dan jumlah ETH wajib diisi."
                );

                return;
            }

            // ------------------------------------------------
            // CEK ALAMAT
            // ------------------------------------------------

            if (
                !web3.utils.isAddress(to)
            ) {

                setStatus(
                    "Alamat Ethereum tidak valid."
                );

                return;
            }

            // ------------------------------------------------
            // CEK ALAMAT SENDIRI
            // ------------------------------------------------

            if (
                to.toLowerCase() ===
                akun.toLowerCase()
            ) {

                setStatus(
                    "Alamat tujuan sama dengan alamat wallet kamu."
                );

                return;
            }

            // ------------------------------------------------
            // CEK FORMAT JUMLAH
            // ------------------------------------------------

            if (
                !/^(0|[1-9]\d*)(\.\d+)?$/.test(
                    amount
                )
            ) {

                setStatus(
                    "Jumlah ETH tidak valid."
                );

                return;
            }

            // ------------------------------------------------
            // UBAH ETH -> WEI
            // ------------------------------------------------

            let valueWei;

            try {

                valueWei =
                    web3.utils.toWei(
                        amount,
                        "ether"
                    );

            } catch (error) {

                setStatus(
                    "Jumlah ETH tidak valid."
                );

                return;
            }

            // ------------------------------------------------
            // TIDAK BOLEH 0
            // ------------------------------------------------

            if (
                BigInt(valueWei) <= 0n
            ) {

                setStatus(
                    "Jumlah ETH harus lebih dari 0."
                );

                return;
            }

            // ------------------------------------------------
            // CEK NETWORK
            // ------------------------------------------------

            try {

                const chainId =
                    await window.ethereum.request({
                        method: "eth_chainId"
                    });

                const chainNumber =
                    parseInt(chainId, 16);

                if (
                    chainNumber !==
                    SEPOLIA_CHAIN_ID
                ) {

                    setStatus(
                        "Ganti network wallet ke Sepolia."
                    );

                    return;
                }

            } catch (error) {

                console.error(
                    error
                );

                setStatus(
                    "Tidak dapat membaca network wallet."
                );

                return;
            }

            // ------------------------------------------------
            // CEK SALDO
            // ------------------------------------------------

            try {

                const balanceWei =
                    await web3.eth.getBalance(
                        akun
                    );

                const reserveWei =
                    BigInt(
                        web3.utils.toWei(
                            GAS_RESERVE_ETH,
                            "ether"
                        )
                    );

                const requiredWei =
                    BigInt(valueWei) +
                    reserveWei;

                console.log(
                    "Saldo:",
                    balanceWei
                );

                console.log(
                    "Jumlah:",
                    valueWei
                );

                console.log(
                    "Cadangan gas:",
                    reserveWei.toString()
                );

                if (
                    BigInt(balanceWei) <
                    requiredWei
                ) {

                    setStatus(
                        "Saldo tidak cukup. Sisakan ETH untuk gas."
                    );

                    return;
                }

            } catch (error) {

                console.error(
                    "SALDO ERROR:",
                    error
                );

                setStatus(
                    "Gagal mengecek saldo."
                );

                return;
            }

            // ------------------------------------------------
            // KIRIM TRANSAKSI
            // ------------------------------------------------

            try {

                setStatus(
                    "Membuka konfirmasi wallet..."
                );

                console.log(
                    "Meminta konfirmasi wallet..."
                );

                const tx =
                    await window.ethereum.request({

                        method:
                            "eth_sendTransaction",

                        params: [
                            {
                                from:
                                    akun,

                                to:
                                    to,

                                value:
                                    web3.utils.toHex(
                                        valueWei
                                    )
                            }
                        ]
                    });

                // ------------------------------------------------
                // BERHASIL
                // ------------------------------------------------

                console.log(
                    "TX HASH:",
                    tx
                );

                statusEl.innerHTML = `
                    <div>

                        <b>
                            ✅ Transaksi berhasil dikirim!
                        </b>

                        <br><br>

                        Hash:

                        ${tx.slice(0, 10)}
                        ...
                        ${tx.slice(-8)}

                        <br><br>

                        <a
                            href="https://sepolia.etherscan.io/tx/${tx}"
                            target="_blank"
                            style="color:#22c55e;"
                        >
                            Lihat di Etherscan
                        </a>

                    </div>
                `;

                // Kosongkan input
                toAddress.value = "";
                amountInput.value = "";

                // Update saldo setelah beberapa detik
                setTimeout(
                    async () => {

                        await updateUI();

                    },
                    5000
                );

            } catch (error) {

                console.error(
                    "TRANSAKSI ERROR:",
                    error
                );

                // User menolak
                if (
                    error.code === 4001
                ) {

                    setStatus(
                        "Transaksi dibatalkan oleh pengguna."
                    );

                    return;
                }

                setStatus(
                    "Transaksi gagal: " +
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
        async () => {

            if (!akun || !web3) {

                setStatus(
                    "Connect wallet dulu."
                );

                return;
            }

            setStatus(
                "Mengecek saldo..."
            );

            await updateUI();

            setStatus(
                "Saldo berhasil diperbarui."
            );
        }
    );
}

// ======================================================
// LIHAT HASH TRANSAKSI
// ======================================================

if (btnCekHash) {

    btnCekHash.addEventListener(
        "click",
        async () => {

            const hash =
                inputHash.value.trim();

            if (!hash) {

                setStatus(
                    "Masukkan hash transaksi."
                );

                return;
            }

            try {

                setStatus(
                    "Mencari transaksi..."
                );

                const reader =
                    buatReadProvider();

                const tx =
                    await reader.eth.getTransaction(
                        hash
                    );

                if (!tx) {

                    setStatus(
                        "Transaksi tidak ditemukan."
                    );

                    return;
                }

                const jumlahETH =
                    reader.utils.fromWei(
                        tx.value,
                        "ether"
                    );

                statusEl.innerHTML = `
                    <div>

                        <b>
                            Transaksi ditemukan ✅
                        </b>

                        <br><br>

                        Dari:
                        ${tx.from.slice(0, 6)}
                        ...
                        ${tx.from.slice(-4)}

                        <br>

                        Ke:
                        ${
                            tx.to
                                ? tx.to.slice(0, 6) +
                                  "..." +
                                  tx.to.slice(-4)
                                : "Contract"
                        }

                        <br>

                        Jumlah:
                        ${jumlahETH} ETH

                        <br><br>

                        <a
                            href="https://sepolia.etherscan.io/tx/${hash}"
                            target="_blank"
                            style="color:#22c55e;"
                        >
                            Lihat di Etherscan
                        </a>

                    </div>
                `;

            } catch (error) {

                console.error(
                    "HASH ERROR:",
                    error
                );

                setStatus(
                    "Gagal mencari transaksi."
                );
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
        async (accounts) => {

            console.log(
                "Account berubah"
            );

            if (
                !accounts ||
                accounts.length === 0
            ) {

           
