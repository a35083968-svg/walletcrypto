let web3 = null;
let readWeb3 = null;
let akun = null;

function buatReadProvider() {
    if (!readWeb3) {
        readWeb3 = new Web3(SEPOLIA_RPC);
        debug("📡 Read RPC Sepolia berhasil dibuat");
    }

    return readWeb3;
}

// RPC khusus untuk membaca blockchain Sepolia
const SEPOLIA_RPC =
    "https://ethereum-sepolia-rpc.publicnode.com";
// ======================================================
// AMBIL ELEMENT HTML
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
// FUNGSI DEBUG
// ======================================================

function debug(message) {
    console.log(message);
}

// ======================================================
// CEK ELEMENT
// ======================================================

debug("app.js berhasil dimuat");

debug("btnConnect: " + !!btnConnect);
debug("alamat: " + !!alamat);
debug("sendBtn: " + !!sendBtn);
debug("btnCekSaldo: " + !!btnCekSaldo);
debug("btnCekHash: " + !!btnCekHash);
debug("txStatus: " + !!statusEl);


// ======================================================
// CEK WALLET
// ======================================================

function walletTersedia() {

    return typeof window.ethereum !== "undefined";

}


// ======================================================
// CONNECT WALLET
// ======================================================

btnConnect.addEventListener("click", async () => {

    debug("🔵 Connect Wallet ditekan");

    if (!walletTersedia()) {

        debug("❌ window.ethereum TIDAK ditemukan");

        alert(
            "Wallet tidak ditemukan.\n\n" +
            "Buka website melalui browser/DApp browser " +
            "MetaMask atau Bitget Wallet."
        );

        return;
    }

    debug("✅ window.ethereum ditemukan");

    try {

        statusEl.innerText =
            "Menghubungkan wallet...";

        // Buat Web3
        web3 = new Web3(window.ethereum);

        debug("✅ Web3 berhasil dibuat");

        // Ambil Chain ID
        const chainId =
            await web3.eth.getChainId();

        debug("🌐 Chain ID: " + chainId);

        // Minta akun
        const accounts =
            await window.ethereum.request({
                method: "eth_requestAccounts"
            });

        if (!accounts || accounts.length === 0) {

            throw new Error(
                "Tidak ada akun wallet."
            );
        }

        akun = accounts[0];

        debug("👛 Akun: " + akun);

        // Tombol
        btnConnect.textContent =
            "Terhubung ✅";

        btnConnect.disabled = true;

        // Update alamat + saldo
        await updateUI();

        statusEl.innerText =
            "Wallet berhasil terhubung";

        debug("✅ CONNECT BERHASIL");

    } catch (error) {

        debug(
            "❌ CONNECT ERROR: " +
            error.message
        );

        statusEl.innerText =
            "Gagal connect: " +
            error.message;
    }

});

async function updateUI() {

    debug("========== UPDATE UI ==========");

    if (!akun) {
        debug("❌ akun kosong");
        return;
    }

    try {

        // Tampilkan alamat terlebih dahulu
        alamat.innerHTML = `
            <b>Alamat:</b><br>
            ${akun.slice(0, 6)}...${akun.slice(-4)}

            <br><br>

            <b>Saldo ETH:</b><br>
            Mengambil saldo...
        `;

        // Gunakan RPC khusus membaca blockchain
        const reader = buatReadProvider();

        debug("📡 Mengambil Chain ID dari RPC...");

        const chainId =
            await reader.eth.getChainId();

        debug("🌐 RPC Chain ID: " + chainId);

        if (Number(chainId) !== 11155111) {

            debug(
                "⚠️ RPC bukan Sepolia!"
            );

            alamat.innerHTML = `
                <b>Alamat:</b><br>
                ${akun.slice(0, 6)}...${akun.slice(-4)}

                <br><br>

                <span style="color:red;">
                    RPC bukan Sepolia
                </span>
            `;

            return;
        }

        debug("✅ RPC = Sepolia");

        // Ambil saldo
        debug("📡 Meminta saldo dari RPC...");

        const balanceWei =
            await reader.eth.getBalance(akun);

        debug(
            "💰 Balance Wei: " +
            balanceWei
        );

        const saldoETH =
            reader.utils.fromWei(
                balanceWei,
                "ether"
            );

        debug(
            "💰 Saldo ETH: " +
            saldoETH
        );

        // Tampilkan saldo
        alamat.innerHTML = `
            <b>Alamat:</b><br>
            ${akun.slice(0, 6)}...${akun.slice(-4)}

            <br><br>

            <b>Saldo ETH:</b><br>
            ${parseFloat(saldoETH).toFixed(6)} ETH
        `;

        debug(
            "✅ ALAMAT + SALDO BERHASIL DITAMPILKAN"
        );

    } catch (error) {

        debug(
            "❌ SALDO ERROR: " +
            error.message
        );

        alamat.innerHTML = `
            <b>Alamat:</b><br>
            ${akun.slice(0, 6)}...${akun.slice(-4)}

            <br><br>

            <span style="color:red;">
                Gagal mengambil saldo
            </span>
        `;

        statusEl.innerText =
            "Gagal mengambil saldo: " +
            error.message;
    }
    }

// ======================================================
// KIRIM ETH
// ======================================================

sendBtn.addEventListener("click", async () => {

    debug("🟢 Tombol KIRIM ditekan");

    if (!akun || !web3) {

        debug(
            "❌ Wallet belum terhubung"
        );

        statusEl.innerText =
            "Connect wallet dulu";

        return;
    }

    const to =
        toAddress.value.trim();

    const amount =
        amountInput.value.trim();

    debug("📤 Tujuan: " + to);
    debug("📤 Jumlah: " + amount);


    // ==================================================
    // VALIDASI INPUT
    // ==================================================

    if (!to || !amount) {

        debug(
            "❌ Alamat atau jumlah kosong"
        );

        statusEl.innerText =
            "Alamat dan jumlah wajib diisi";

        return;
    }


    // ==================================================
    // VALIDASI ALAMAT
    // ==================================================

    if (!web3.utils.isAddress(to)) {

        debug(
            "❌ Alamat tujuan tidak valid"
        );

        statusEl.innerText =
            "Alamat tujuan tidak valid";

        return;
    }

    debug("✅ Alamat tujuan valid");

// ======================================================
// VALIDASI JUMLAH ETH
// ======================================================

if (!/^\d+(\.\d+)?$/.test(amount)) {

    statusEl.innerText =
        "Jumlah ETH tidak valid.";

    return;
}

let valueWei;

try {

    valueWei =
        web3.utils.toWei(
            amount,
            "ether"
        );

} catch (error) {

    statusEl.innerText =
        "Jumlah ETH tidak valid.";

    return;
}

if (BigInt(valueWei) <= 0n) {

    statusEl.innerText =
        "Jumlah ETH harus lebih dari 0.";

    return;
            }

        debug(
            "❌ Jumlah ETH tidak valid"
        );

        statusEl.innerText =
            "Jumlah ETH tidak valid";

        return;
    }

    if (BigInt(valueWei) <= 0n) {

        debug(
            "❌ Jumlah harus lebih dari 0"
        );

        statusEl.innerText =
            "Jumlah ETH harus lebih dari 0";

        return;
    }

    debug(
        "💎 Value Wei: " +
        valueWei
    );

// ======================================================
// CEK NETWORK WALLET
// ======================================================

try {

    const walletChainId =
        await web3.eth.getChainId();

    debug(
        "🌐 Wallet Chain ID: " +
        walletChainId
    );

    if (Number(walletChainId) !== 11155111) {

        debug(
            "❌ Wallet bukan Sepolia"
        );

        statusEl.innerText =
            "Ganti network wallet ke Sepolia.";

        return;
    }

    debug("✅ Wallet = Sepolia");

} catch (error) {

    debug(
        "❌ Gagal membaca network wallet: " +
        error.message
    );

    statusEl.innerText =
        "Gagal membaca network wallet.";

    return;
}

// ======================================================
// CEK SALDO
// ======================================================

try {

    debug("💰 Mengecek saldo wallet...");

    const balanceWei =
        await web3.eth.getBalance(akun);

    debug(
        "💰 Saldo Wei: " +
        balanceWei
    );

    const saldoETH =
        web3.utils.fromWei(
            balanceWei,
            "ether"
        );

    debug(
        "💰 Saldo ETH: " +
        saldoETH
    );

    // Cadangan untuk gas
    const GAS_BUFFER_WEI =
        BigInt(web3.utils.toWei("0.0001", "ether"));

    const totalMinimum =
        BigInt(valueWei) +
        GAS_BUFFER_WEI;

    if (BigInt(balanceWei) < totalMinimum) {

        statusEl.innerText =
            "Saldo tidak cukup. Sisakan ETH untuk gas.";

        debug(
            "❌ Saldo tidak cukup untuk ETH + gas"
        );

        return;
    }

    debug(
        "✅ Saldo cukup untuk transaksi + cadangan gas"
    );

} catch (error) {

    debug(
        "❌ Gagal mengecek saldo: " +
        error.message
    );

    statusEl.innerText =
        "Gagal mengecek saldo.";

    return;
        }    

// ======================================================
// KIRIM TRANSAKSI
// ======================================================

try {

    statusEl.innerText =
        "Membuka konfirmasi wallet...";

    debug(
        "📨 Meminta wallet mengonfirmasi transaksi..."
    );

    const tx = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
            {
                from: akun,
                to: to,
                value: web3.utils.toHex(valueWei)
            }
        ]
    });

    debug(
        "✅ TX HASH: " + tx
    );

    statusEl.innerHTML = `
        <div>
            <b>✅ Transaksi berhasil dikirim!</b>
            <br><br>

            Hash:
            ${tx.slice(0, 10)}...
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

    toAddress.value = "";
    amountInput.value = "";

    setTimeout(async () => {
        await updateUI();
    }, 5000);

} catch (error) {

    console.error(error);

    debug(
        "❌ TRANSAKSI ERROR: " +
        error.message
    );

    // User menolak transaksi
    if (
        error.code === 4001 ||
        error.code === -32603 &&
        error.message?.toLowerCase().includes("reject")
    ) {

        statusEl.innerText =
            "Transaksi dibatalkan.";

        return;
    }

    statusEl.innerText =
        "Transaksi gagal: " +
        (error.message || "Kesalahan tidak diketahui.");
        }    

console.log("✅ Wallet mengembalikan TX Hash:", tx);

statusEl.innerText = "Transaksi berhasil dikirim!";

        // ==================================================
        // TRANSAKSI BERHASIL
        // ==================================================

        debug(
            "✅ TRANSAKSI DITERIMA WALLET"
        );

        debug(
            "🔑 TX HASH: " +
            tx
        );


        statusEl.innerHTML = `
            <div style="
                background:#1e293b;
                padding:10px;
                border-radius:8px;
                margin-top:10px;
            ">

                <b>✅ Transaksi berhasil dikirim!</b>

                <br><br>

                Hash:
                ${tx.slice(0,10)}...
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


        // Update saldo
        setTimeout(
            async () => {

                debug(
                    "🔄 Memperbarui saldo..."
                );

                await updateUI();

            },
            5000
        );


    } catch (error) {

        console.error(error);

        debug(
            "❌ TRANSAKSI ERROR"
        );

        debug(
            "Kode error: " +
            (error.code || "tidak ada")
        );

        debug(
            "Pesan: " +
            error.message
        );



        // User menolak
        if (
            error.code === 4001
        ) {

            statusEl.innerText =
                "Transaksi dibatalkan oleh pengguna.";

            debug(
                "🚫 User membatalkan transaksi"
            );

        } else {

            statusEl.innerText =
                "Transaksi gagal: " +
                error.message;
        }

    }

});

// ======================================================
// CEK SALDO
// ======================================================

btnCekSaldo.addEventListener(
    "click",
    async () => {

        debug(
            "🔵 Tombol CEK SALDO ditekan"
        );

        if (!akun || !web3) {

            statusEl.innerText =
                "Connect wallet dulu";

            debug(
                "❌ Wallet belum connect"
            );

            return;
        }

        statusEl.innerText =
            "Mengecek saldo...";

        await updateUI();

        statusEl.innerText =
            "Saldo berhasil diperbarui.";

    }
);


// ======================================================
// LIHAT HASH TRANSAKSI
// ======================================================

btnCekHash.addEventListener(
    "click",
    async () => {

        const hash =
            inputHash.value.trim();

        debug(
            "🔎 Mencari TX: " +
            hash
        );

        if (!hash) {

            statusEl.innerText =
                "Masukkan Hash Transaksi dulu.";

            return;
        }

        if (!web3) {

            if (!walletTersedia()) {

                statusEl.innerText =
                    "Wallet belum tersedia.";

                return;
            }

            web3 =
                new Web3(window.ethereum);
        }

        try {

            statusEl.innerText =
                "Mencari transaksi...";

            const reader = buatReadProvider();

const tx =
    await reader.eth.getTransaction(hash);

            if (!tx) {

                debug(
                    "❌ Transaksi tidak ditemukan"
                );

                statusEl.innerText =
                    "Transaksi tidak ditemukan.";

                return;
            }

            debug(
                "✅ Transaksi ditemukan"
            );

            const jumlahETH =
               reader.utils.fromWei(
                   tx.value,
                   "ether"
            );

            statusEl.innerHTML = `

                <div style="
                    background:#1e293b;
                    padding:10px;
                    border-radius:8px;
                ">

                    <b>
                        Transaksi ditemukan ✅
                    </b>

                    <br><br>

                    Dari:
                    ${tx.from.slice(0,6)}...
                    ${tx.from.slice(-4)}

                    <br>

                    Ke:
                    ${
                        tx.to
                        ?
                        tx.to.slice(0,6) +
                        "..." +
                        tx.to.slice(-4)
                        :
                        "Contract"
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

            debug(
                "❌ HASH ERROR: " +
                error.message
            );

            statusEl.innerText =
                "Gagal: " +
                error.message;
        }

    }
);


// ======================================================
// ACCOUNT BERUBAH
// ======================================================

if (walletTersedia()) {

    window.ethereum.on(
        "accountsChanged",
        async (accounts) => {

            debug(
                "👛 accountsChanged"
            );

            if (accounts.length === 0) {

                akun = null;
                web3 = null;

                btnConnect.textContent =
                    "Connect Wallet";

                btnConnect.disabled =
                    false;

                alamat.innerText =
                    "Belum terhubung";

                statusEl.innerText =
                    "Wallet terputus";

                debug(
                    "❌ Wallet terputus"
                );

                return;
            }

            akun =
                accounts[0];

            debug(
                "👛 Akun baru: " +
                akun
            );

            await updateUI();

        }
    );


    // ==================================================
    // NETWORK BERUBAH
    // ==================================================

    window.ethereum.on(
        "chainChanged",
        async (chainId) => {

            debug(
                "🌐 Network berubah: " +
                chainId
            );

            if (web3 && akun) {

                await updateUI();
            }

        }
    );

}


// ======================================================
// SELESAI
// ======================================================

debug(
    "🚀 Sistem Crypto Wallet siap"
);
