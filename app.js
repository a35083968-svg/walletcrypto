let web3 = null;
let akun = null;

// ==========================================
// AMBIL ELEMENT HTML
// ==========================================

const btnConnect = document.getElementById("btnConnect");
const alamat = document.getElementById("alamat");
const btnCekSaldo = document.getElementById("btnCekSaldo");
const btnCekHash = document.getElementById("btnCekHash");
const inputHash = document.getElementById("inputHash");
const statusEl = document.getElementById("txStatus");

const sendBtn = document.getElementById("sendBtn");
const toAddress = document.getElementById("toAddress");
const amountInput = document.getElementById("amount");

// ==========================================
// CEK ELEMENT
// ==========================================

console.log("btnConnect:", btnConnect);
console.log("alamat:", alamat);
console.log("sendBtn:", sendBtn);
console.log("btnCekSaldo:", btnCekSaldo);
console.log("btnCekHash:", btnCekHash);

if (!btnConnect) {
    console.error("❌ btnConnect tidak ditemukan");
}

if (!alamat) {
    console.error("❌ alamat tidak ditemukan");
}

if (!sendBtn) {
    console.error("❌ sendBtn tidak ditemukan");
}

// ==========================================
// DATA TOKEN
// ==========================================

const cAWEUSD_ADDRESS = "";
const cAWEUSD_DECIMALS = 18;

// ==========================================
// CEK WALLET
// ==========================================

function walletTersedia() {
    return typeof window.ethereum !== "undefined";
}

// ==========================================
// CONNECT WALLET
// ==========================================

btnConnect.addEventListener("click", async () => {

    console.log("🔵 Connect Wallet ditekan");

    if (!walletTersedia()) {

        console.error("❌ window.ethereum tidak ditemukan");

        alert(
            "Wallet tidak ditemukan.\n\n" +
            "Buka website ini melalui browser/DApp browser " +
            "MetaMask atau Bitget Wallet."
        );

        return;
    }

    try {

        statusEl.innerText = "Menghubungkan wallet...";

        // Buat Web3
        web3 = new Web3(window.ethereum);

        console.log("✅ Web3 berhasil dibuat");

        // Minta akses akun
        const accounts = await window.ethereum.request({
            method: "eth_requestAccounts"
        });

        if (!accounts || accounts.length === 0) {
            throw new Error("Tidak ada akun wallet yang ditemukan.");
        }

        akun = accounts[0];

        console.log("✅ Akun:", akun);

        // Ubah tombol
        btnConnect.textContent = "Terhubung ✅";
        btnConnect.disabled = true;

        // Ambil saldo
        await updateUI();

        statusEl.innerText = "Wallet berhasil terhubung";

    } catch (error) {

        console.error("❌ Gagal connect:", error);

        statusEl.innerText =
            "Gagal connect: " + error.message;

    }

});

// ==========================================
// UPDATE ALAMAT + SALDO
// ==========================================

async function updateUI() {

    console.log("========== UPDATE UI ==========");
    console.log("akun:", akun);
    console.log("web3:", web3);
    console.log("alamat element:", alamat);

    if (!akun) {
        console.log("❌ akun kosong");
        return;
    }

    if (!web3) {
        console.log("❌ web3 kosong");
        return;
    }

    try {

        // Tampilkan alamat dahulu
        alamat.innerHTML = `
            <b>Alamat:</b><br>
            ${akun.slice(0, 6)}...${akun.slice(-4)}

            <br><br>

            <b>Saldo ETH:</b><br>
            Mengambil saldo...
        `;

        console.log("✅ Alamat berhasil ditampilkan");

        // Ambil saldo
        const balance = await web3.eth.getBalance(akun);

        console.log("Balance Wei:", balance);

        const saldoETH = web3.utils.fromWei(
            balance,
            "ether"
        );

        console.log("Saldo ETH:", saldoETH);

        // Tampilkan saldo
        alamat.innerHTML = `
            <b>Alamat:</b><br>
            ${akun.slice(0, 6)}...${akun.slice(-4)}

            <br><br>

            <b>Saldo ETH:</b><br>
            ${parseFloat(saldoETH).toFixed(4)} ETH
        `;

        console.log("✅ ALAMAT + SALDO BERHASIL DITAMPILKAN");

    } catch (error) {

        console.error("❌ ERROR UPDATE UI:", error);

        alamat.innerHTML = `
            <b>Alamat:</b><br>
            ${akun.slice(0, 6)}...${akun.slice(-4)}

            <br><br>

            <span style="color:red;">
                Gagal mengambil saldo
            </span>
        `;

        statusEl.innerText =
            "Error: " + error.message;
    }
}

// ==========================================
// KIRIM ETH
// ==========================================

sendBtn.addEventListener("click", async () => {

    console.log("🟢 Tombol Kirim ditekan");

    if (!akun || !web3) {
        statusEl.innerText = "Connect wallet dulu.";
        return;
    }

    const to = toAddress.value.trim();
    const amount = amountInput.value.trim();

    // ======================================
    // VALIDASI INPUT
    // ======================================

    if (!to) {
        statusEl.innerText = "Masukkan alamat tujuan.";
        return;
    }

    if (!amount) {
        statusEl.innerText = "Masukkan jumlah ETH.";
        return;
    }

    // Validasi alamat Ethereum
    if (!web3.utils.isAddress(to)) {
        statusEl.innerText =
            "Alamat tujuan tidak valid. Harus alamat 0x...";
        return;
    }

    // Validasi jumlah
    let valueWei;

    try {

        valueWei = web3.utils.toWei(
            amount,
            "ether"
        );

    } catch (error) {

        statusEl.innerText =
            "Jumlah ETH tidak valid.";

        return;
    }

    if (valueWei === "0") {
        statusEl.innerText =
            "Jumlah ETH harus lebih dari 0.";
        return;
    }

    console.log("Alamat tujuan:", to);
    console.log("Jumlah ETH:", amount);
    console.log("Jumlah Wei:", valueWei);

    try {

        // ======================================
        // CEK NETWORK
        // ======================================

        const chainId = await web3.eth.getChainId();

        console.log("Chain ID:", chainId);

        // Mainnet = 1
if (Number(chainId) !== 1) {
    statusEl.innerText = "Wallet harus berada di jaringan Ethereum Mainnet.";
    return;
}

        // ======================================
        // CEK SALDO
        // ======================================

        const balanceWei =
            await web3.eth.getBalance(akun);

        console.log("Saldo Wei:", balanceWei);

        if (
            web3.utils.toBN(valueWei)
                .gte(web3.utils.toBN(balanceWei))
        ) {

            statusEl.innerText =
                "Saldo tidak cukup. Sisakan ETH untuk biaya gas.";

            return;
        }

        // ======================================
        // TAMPILKAN INFORMASI
        // ======================================

        statusEl.innerText =
            "Menunggu konfirmasi di wallet...";

        // ======================================
        // KIRIM TRANSAKSI
        // ======================================

        const txHash =
            await window.ethereum.request({

                method: "eth_sendTransaction",

                params: [
                    {
                        from: akun,
                        to: to,
                        value: web3.utils.toHex(valueWei)
                    }
                ]

            });

        console.log(
            "✅ Transaction Hash:",
            txHash
        );

        // ======================================
        // BERHASIL
        // ======================================

        statusEl.innerHTML = `
            <div style="
                background:#1e293b;
                padding:12px;
                border-radius:10px;
                margin-top:10px;
            ">

                <b>✅ Transaksi berhasil dikirim!</b>

                <br><br>

                Jumlah:
                ${amount} ETH

                <br><br>

                Hash:
                ${txHash.slice(0,10)}...
                ${txHash.slice(-8)}

                <br><br>

                <a
                    href="https://sepolia.etherscan.io/tx/${txHash}"
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
        setTimeout(() => {
            updateUI();
        }, 3000);

    } catch (error) {

        console.error(
            "❌ ERROR TRANSAKSI:",
            error
        );

        // User menolak transaksi
        if (error.code === 4001) {

            statusEl.innerText =
                "Transaksi dibatalkan di wallet.";

            return;
        }

        statusEl.innerText =
            "Transaksi gagal: " +
            (error.message || "Error tidak diketahui.");

    }

});
                    
// ==========================================
// CEK SALDO
// ==========================================

btnCekSaldo.addEventListener("click", async () => {

    console.log("🔵 Cek Saldo ditekan");

    if (!akun || !web3) {

        statusEl.innerText =
            "Connect wallet dulu";

        return;
    }

    statusEl.innerText =
        "Mengecek saldo...";

    await updateUI();

    statusEl.innerText =
        "Saldo berhasil diperbarui.";

});

// ==========================================
// LIHAT HASH TRANSAKSI
// ==========================================

btnCekHash.addEventListener("click", async () => {

    const hash = inputHash.value.trim();

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

        web3 = new Web3(window.ethereum);
    }

    try {

        statusEl.innerText =
            "Mencari transaksi...";

        const tx =
            await web3.eth.getTransaction(hash);

        if (!tx) {

            statusEl.innerText =
                "Transaksi tidak ditemukan. Mungkin masih pending.";

            return;
        }

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

                <b>Transaksi ditemukan ✅</b>

                <br><br>

                Dari:
                ${tx.from.slice(0, 6)}...
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
            "❌ Error mencari transaksi:",
            error
        );

        statusEl.innerText =
            "Gagal: " + error.message;
    }

});

// ==========================================
// JIKA AKUN WALLET BERGANTI
// ==========================================

if (walletTersedia()) {

    window.ethereum.on(
        "accountsChanged",
        async (accounts) => {

            console.log(
                "Account berubah:",
                accounts
            );

            if (accounts.length === 0) {

                akun = null;
                web3 = null;

                btnConnect.textContent =
                    "Connect Wallet";

                btnConnect.disabled = false;

                alamat.innerText =
                    "Belum terhubung";

                statusEl.innerText =
                    "Wallet terputus";

                return;
            }

            akun = accounts[0];

            console.log(
                "Akun baru:",
                akun
            );

            await updateUI();
        }
    );

    // ======================================
    // JIKA NETWORK BERGANTI
    // ======================================

    window.ethereum.on(
        "chainChanged",
        async (chainId) => {

            console.log(
                "Network berubah:",
                chainId
            );

            if (web3 && akun) {

                await updateUI();
            }
        }
    );
}
