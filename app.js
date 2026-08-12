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

                catch (error) {

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

            console.log("TOMBOL KIRIM DITEKAN");

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
