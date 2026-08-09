let web3 = null;
let akun = null;

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
// DEBUG PANEL
// Dibuat otomatis, jadi tidak perlu menambah HTML
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
    box-shadow:0 0 15px rgba(0,255,136,.3);
`;

debugPanel.innerHTML = `
    <b>🛠 DEBUG PANEL</b>
    <hr style="border-color:#334155">
`;

document.body.appendChild(debugPanel);


// ======================================================
// FUNGSI DEBUG
// ======================================================

function debug(message) {

    console.log(message);

    const line = document.createElement("div");

    const waktu = new Date().toLocaleTimeString();

    line.textContent = `[${waktu}] ${message}`;

    debugPanel.appendChild(line);

    debugPanel.scrollTop = debugPanel.scrollHeight;
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


// ======================================================
// UPDATE ALAMAT + SALDO
// ======================================================

async function updateUI() {

    debug("========== UPDATE UI ==========");

    if (!akun) {

        debug("❌ akun kosong");

        return;
    }

    if (!web3) {

        debug("❌ web3 kosong");

        return;
    }

    try {

        // Tampilkan alamat terlebih dahulu
        alamat.innerHTML = `
            <b>Alamat:</b><br>
            ${akun.slice(0, 6)}...
            ${akun.slice(-4)}

            <br><br>

            <b>Saldo ETH:</b><br>
            Mengambil saldo...
        `;

        // Chain ID
        const chainId =
            await web3.eth.getChainId();

        debug("🌐 Chain ID: " + chainId);

        // Saldo Wei
        const balanceWei =
            await web3.eth.getBalance(akun);

        debug(
            "💰 Balance Wei: " +
            balanceWei
        );

        // Saldo ETH
        const saldoETH =
            web3.utils.fromWei(
                balanceWei,
                "ether"
            );

        debug(
            "💰 Saldo ETH: " +
            saldoETH
        );

        // Tampilkan
        alamat.innerHTML = `
            <b>Alamat:</b><br>
            ${akun.slice(0, 6)}...
            ${akun.slice(-4)}

            <br><br>

            <b>Saldo ETH:</b><br>
            ${parseFloat(saldoETH).toFixed(6)} ETH
        `;

        debug(
            "✅ ALAMAT + SALDO DITAMPILKAN"
        );

    } catch (error) {

        debug(
            "❌ SALDO ERROR: " +
            error.message
        );

        alamat.innerHTML = `
            <b>Alamat:</b><br>
            ${akun.slice(0, 6)}...
            ${akun.slice(-4)}

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


    // ==================================================
    // VALIDASI JUMLAH
    // ==================================================

    let valueWei;

    try {

        valueWei =
            web3.utils.toWei(
                amount,
                "ether"
            );

    } catch (error) {

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


    // ==================================================
    // CEK SALDO
    // ==================================================

    try {

        const balanceWei =
            await web3.eth.getBalance(akun);

        debug(
            "💰 Saldo Wei: " +
            balanceWei
        );

        if (
            BigInt(valueWei) >=
            BigInt(balanceWei)
        ) {

            debug(
                "❌ Saldo tidak cukup"
            );

            statusEl.innerText =
                "Saldo ETH tidak cukup. " +
                "Sisakan ETH untuk gas.";

            return;
        }

    } catch (error) {

        debug(
            "❌ Gagal mengecek saldo: " +
            error.message
        );

        statusEl.innerText =
            "Gagal mengecek saldo";

        return;
    }


    // ==================================================
    // CEK NETWORK
    // ==================================================

    try {

        const chainId =
            await web3.eth.getChainId();

        debug(
            "🌐 Network Chain ID: " +
            chainId
        );

        if (chainId == 11155111) {

            debug(
                "✅ Network = Sepolia"
            );

        } else if (chainId == 1) {

            debug(
                "⚠️ Network = Ethereum Mainnet"
            );

        } else {

            debug(
                "⚠️ Network bukan Sepolia"
            );
        }

    } catch (error) {

        debug(
            "❌ Gagal membaca network: " +
            error.message
        );
    }


    // ==================================================
    // KIRIM TRANSAKSI
    // ==================================================

    try {

        statusEl.innerText =
            "Menunggu konfirmasi di Wallet...";

        debug(
            "⏳ Mengirim permintaan transaksi..."
        );

        console.log("📨 Meminta wallet membuka konfirmasi...");
statusEl.innerText = "Membuka konfirmasi wallet...";

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

            const tx =
                await web3.eth.getTransaction(
                    hash
                );

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
                web3.utils.fromWei(
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
