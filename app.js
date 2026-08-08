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

    if (!akun || !web3) {

        console.log("❌ updateUI gagal: wallet belum terhubung");

        return;
    }

    try {

        statusEl.innerText = "Mengambil saldo...";

        // Ambil Chain ID
        const chainId = await web3.eth.getChainId();

        console.log("Chain ID:", chainId);
        console.log("Alamat:", akun);

        // Ambil saldo dalam Wei
        const balance = await web3.eth.getBalance(akun);

        console.log("Balance Wei:", balance);

        // Ubah Wei -> ETH
        const saldoETH = web3.utils.fromWei(
            balance,
            "ether"
        );

        console.log("Saldo ETH:", saldoETH);

        // Tampilkan alamat + saldo
        alamat.innerHTML = `
            <b>Alamat:</b><br>
            ${akun.slice(0, 6)}...${akun.slice(-4)}

            <br><br>

            <b>Saldo ETH:</b><br>
            ${parseFloat(saldoETH).toFixed(4)} ETH
        `;

        statusEl.innerText = "";

    } catch (error) {

        console.error("❌ Error mengambil saldo:", error);

        alamat.innerHTML = `
            <b>Alamat:</b><br>
            ${akun.slice(0, 6)}...${akun.slice(-4)}

            <br><br>

            <span style="color:red;">
                Gagal mengambil saldo
            </span>
        `;

        statusEl.innerText =
            "Gagal mengambil saldo: " + error.message;
    }
}

// ==========================================
// KIRIM ETH
// ==========================================

sendBtn.addEventListener("click", async () => {

    console.log("🟢 Tombol Kirim ditekan");

    const to = toAddress.value.trim();
    const amount = amountInput.value.trim();

    // Wallet belum connect
    if (!akun || !web3) {

        statusEl.innerText =
            "Connect wallet dulu";

        return;
    }

    // Input kosong
    if (!to || !amount) {

        statusEl.innerText =
            "Alamat dan jumlah wajib diisi";

        return;
    }

    // Validasi alamat
    if (!web3.utils.isAddress(to)) {

        statusEl.innerText =
            "Alamat tujuan tidak valid.";

        return;
    }

    // Validasi jumlah
    const jumlah = Number(amount);

    if (!Number.isFinite(jumlah) || jumlah <= 0) {

        statusEl.innerText =
            "Jumlah ETH harus lebih dari 0.";

        return;
    }

    try {

        // ======================================
        // CEK SALDO
        // ======================================

        const balanceWei =
            await web3.eth.getBalance(akun);

        const saldoETH =
            Number(
                web3.utils.fromWei(
                    balanceWei,
                    "ether"
                )
            );

        console.log("Saldo:", saldoETH);
        console.log("Jumlah kirim:", jumlah);

        if (jumlah >= saldoETH) {

            statusEl.innerText =
                "Saldo ETH tidak cukup. Sisakan sedikit ETH untuk biaya gas.";

            return;
        }

        // ======================================
        // UBAH ETH -> WEI
        // ======================================

        const valueWei =
            web3.utils.toWei(
                amount.toString(),
                "ether"
            );

        console.log("Value Wei:", valueWei);

        // ======================================
        // KIRIM TRANSAKSI
        // ======================================

        statusEl.innerText =
            "Menunggu konfirmasi di Wallet...";

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

        console.log("Transaction Hash:", tx);

        // ======================================
        // BERHASIL
        // ======================================

        statusEl.innerHTML = `
            <div style="
                background:#1e293b;
                padding:10px;
                border-radius:8px;
                margin-top:10px;
            ">

                ✅ Transaksi berhasil dikirim!

                <br><br>

                <small>
                    Hash:
                    ${tx.slice(0, 10)}...
                    ${tx.slice(-8)}
                </small>

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
        setTimeout(async () => {

            await updateUI();

        }, 3000);

    } catch (error) {

        console.error("❌ Transaksi gagal:", error);

        // User menolak transaksi
        if (
            error.code === 4001 ||
            error.message.toLowerCase().includes("reject")
        ) {

            statusEl.innerText =
                "Transaksi dibatalkan oleh pengguna.";

        } else {

            statusEl.innerText =
                "Transaksi gagal: " +
                error.message;
        }
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
