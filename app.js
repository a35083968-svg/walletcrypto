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
let readWeb3 = null;
let akun = null;

const SEPOLIA_CHAIN_ID = 11155111;

const SEPOLIA_RPC =
    "https://ethereum-sepolia-rpc.publicnode.com";

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

function buatReadProvider() {

    if (!readWeb3) {
        readWeb3 = new Web3(SEPOLIA_RPC);

        console.log(
            "READ PROVIDER BERHASIL DIBUAT"
        );
    }

    return readWeb3;
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

                const accounts =
                    await window.ethereum.request({
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


                // --------------------------------------
                // CEK NETWORK
                // --------------------------------------

                setStatus(
                    "Mengecek network..."
                );


                const chainIdHex =
                    await window.ethereum.request({
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
                        window.ethereum
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

                const reader = buatReadProvider();

                console.log("Meminta saldo ke RPC Sepolia...");
                console.log("Alamat:", akun);

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

    const reader =
        buatReadProvider();

    const gasEstimate =
        await web3.eth.estimateGas({
            from: akun,
            to: tujuan,
            value: valueWei
        });

    console.log(
    "Estimasi gas dari wallet:",
    gasEstimate
);

    const gasPrice =
    await window.ethereum.request({
    method: "eth_gasPrice"
    });

console.log(
    "Gas Price dari Bitget:",
    gasPrice
);

console.log(
    "Gas Price ETH:",
    web3.utils.fromWei(
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

const tx = await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [{
        from: akun,
        to: tujuan,
        value: web3.utils.toHex(valueWei),
        gas: web3.utils.toHex(gasEstimate)
    }]
});

console.log("TX HASH:", tx);

setStatus("Transaksi dikirim!");    
    
} catch (error) {

    console.error(
        "ESTIMASI GAS ERROR:",
        error
    );

    setStatus(
        "Gagal menghitung estimasi gas: " +
        (
            error.message ||
            "Kesalahan tidak diketahui."
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
