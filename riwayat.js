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
// RIWAYAT TRANSAKSI
// DATA DARI APP.JS
// ======================================================

const TRANSACTION_STORAGE_KEY =
    "walletcrypto_transactions_v1";


// ======================================================
// ELEMENT HTML
// ======================================================

const historyPage =
    document.getElementById(
        "historyPage"
    );

const detailPage =
    document.getElementById(
        "detailPage"
    );

const transactionList =
    document.getElementById(
        "transactionList"
    );

const backToHistory =
    document.getElementById(
        "backToHistory"
    );

const detailStatus =
    document.getElementById(
        "detailStatus"
    );

const detailFrom =
    document.getElementById(
        "detailFrom"
    );

const detailTo =
    document.getElementById(
        "detailTo"
    );

const detailNetwork =
    document.getElementById(
        "detailNetwork"
    );

const detailAmount =
    document.getElementById(
        "detailAmount"
    );

const detailGas =
    document.getElementById(
        "detailGas"
    );

const detailBlock =
    document.getElementById(
        "detailBlock"
    );

const detailTime =
    document.getElementById(
        "detailTime"
    );

const detailHash =
    document.getElementById(
        "detailHash"
    );

const copyHashButton =
    document.getElementById(
        "copyHashButton"
    );

const explorerButton =
    document.getElementById(
        "explorerButton"
    );


// ======================================================
// BACA DATA TRANSAKSI
// ======================================================

function bacaTransaksi() {

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

        return Array.isArray(data)
            ? data
            : [];

    } catch (error) {

        console.error(
            "GAGAL MEMBACA RIWAYAT:",
            error
        );

        return [];
    }
}

// ======================================================
// BLOCKCHAIN HISTORY - SEPOLIA
// ======================================================

const BLOCKSCOUT_API_BASE =
    "https://eth-sepolia.blockscout.com/api/v2";

const MAX_HISTORY_PAGES = 20;


// ======================================================
// AMBIL ADDRESS DARI OBJECT BLOCKSCOUT
// ======================================================

function ambilAddress(value) {

    if (!value) {
        return null;
    }

    if (typeof value === "string") {
        return value;
    }

    return value.hash || null;
}


// ======================================================
// KONVERSI WEI → ETH
// Tanpa membutuhkan Web3.js
// ======================================================

function formatWeiToEth(wei) {

    if (
        wei === null ||
        wei === undefined ||
        wei === ""
    ) {
        return "0";
    }

    const raw =
        String(wei).trim();

    if (!/^\d+$/.test(raw)) {
        return "0";
    }

    const padded =
        raw.padStart(19, "0");

    const whole =
        padded.slice(0, -18);

    const fraction =
        padded
            .slice(-18)
            .slice(0, 8)
            .replace(/0+$/, "");

    return (
        whole +
        "." +
        (
            fraction ||
            "0"
        )
    );
}


// ======================================================
// HITUNG GAS FEE
// ======================================================

function ambilGasFeeWei(transaction) {

    const feeValue =
        transaction?.fee?.value ??
        transaction?.fee;

    if (
        feeValue !== null &&
        feeValue !== undefined &&
        feeValue !== ""
    ) {

        return String(
            feeValue
        );
    }


    try {

        if (
            transaction?.gas_used !== undefined &&
            transaction?.gas_price !== undefined
        ) {

            return (
                BigInt(
                    transaction.gas_used
                ) *
                BigInt(
                    transaction.gas_price
                )
            ).toString();

        }

    } catch (error) {

        console.warn(
            "GAGAL MENGHITUNG GAS FEE:",
            error?.message ||
            error
        );

    }


    return "0";
}


// ======================================================
// TENTUKAN STATUS TRANSAKSI
// ======================================================

function tentukanStatus(transaction) {

    if (
        transaction?.status === "ok" ||
        transaction?.result === "success" ||
        transaction?.result === "ok"
    ) {

        return "Berhasil ✅";
    }


    if (
        transaction?.status === "error" ||
        transaction?.result === "error"
    ) {

        return "Gagal ❌";
    }


    return "Berhasil ✅";
}


// ======================================================
// NORMALISASI DATA BLOCKCHAIN
// ======================================================

function normalisasiTransaksiBlockchain(
    transaction
) {

    const valueWei =
        String(
            transaction?.value ??
            "0"
        );


    // ------------------------------------------
    // HANYA TRANSAKSI ETH
    // ------------------------------------------

    if (
        BigInt(valueWei) === 0n
    ) {

        return null;
    }


    const txHash =
        transaction?.hash;

    const from =
        ambilAddress(
            transaction?.from
        );

    const to =
        ambilAddress(
            transaction?.to
        );


    if (
        !txHash ||
        !from
    ) {

        return null;
    }


    const gasFeeWei =
        ambilGasFeeWei(
            transaction
        );


    return {

        txHash:

            txHash,

        from:

            from,

        to:

            to,

        network:

            "Ethereum Sepolia",

        amount:

            formatWeiToEth(
                valueWei
            ),

        gasFee:

            formatWeiToEth(
                gasFeeWei
            ),

        gasUsed:

            String(
                transaction?.gas_used ??
                "0"
            ),

        block:

            String(
                transaction?.block_number ??
                "-"
            ),

        timestamp:

            transaction?.timestamp ??
            null,

        status:

            tentukanStatus(
                transaction
            )
    };
}


// ======================================================
// GABUNGKAN DATA BLOCKCHAIN + LOCAL STORAGE
// ======================================================

function gabungkanTransaksiBlockchain(
    records
) {

    const existing =
        bacaTransaksi();


    const byHash =
        new Map();


    // ------------------------------------------
    // MASUKKAN DATA LAMA
    // ------------------------------------------

    existing.forEach(
        function(transaction) {

            if (
                transaction?.txHash
            ) {

                byHash.set(
                    transaction.txHash,
                    transaction
                );

            }

        }
    );


    // ------------------------------------------
    // MASUKKAN DATA BLOCKCHAIN
    // ------------------------------------------

    records.forEach(
        function(record) {

            if (
                !record?.txHash
            ) {
                return;
            }


            const previous =
                byHash.get(
                    record.txHash
                ) || {};


            byHash.set(
                record.txHash,
                {
                    ...previous,
                    ...record
                }
            );

        }
    );


    // ------------------------------------------
    // URUTKAN TERBARU → TERLAMA
    // ------------------------------------------

    const merged =
        Array.from(
            byHash.values()
        ).sort(
            function(a, b) {

                const timeA =
                    new Date(
                        a.timestamp || 0
                    ).getTime();

                const timeB =
                    new Date(
                        b.timestamp || 0
                    ).getTime();

                return (
                    timeB -
                    timeA
                );
            }
        );


    localStorage.setItem(
        TRANSACTION_STORAGE_KEY,
        JSON.stringify(
            merged
        )
    );


    return merged;
}


// ======================================================
// DETEKSI WALLET AKTIF
// ======================================================

async function ambilAkunWallet() {

    // ------------------------------------------
    // PRIORITAS 1: PROVIDER WALLET
    // ------------------------------------------

    if (
        window.ethereum?.request
    ) {

        try {

            const accounts =
                await window.ethereum.request({
                    method:
                        "eth_accounts"
                });


            if (
                Array.isArray(accounts) &&
                accounts[0]
            ) {

                console.log(
                    "AKUN WALLET DITEMUKAN:",
                    accounts[0]
                );

                return accounts[0];
            }

        } catch (error) {

            console.warn(
                "ETH_ACCOUNTS ERROR:",
                error?.message ||
                error
            );

        }

    }


    // ------------------------------------------
    // PRIORITAS 2: DATA LOCAL STORAGE
    // ------------------------------------------

    const existing =
        bacaTransaksi();


    if (
        existing.length > 0 &&
        existing[0]?.from
    ) {

        console.log(
            "AKUN DARI DATA LOCAL:",
            existing[0].from
        );

        return existing[0].from;
    }


    return null;
}


// ======================================================
// AMBIL RIWAYAT DARI BLOCKCHAIN
// ======================================================

async function ambilRiwayatDariBlockchain(
    address
) {

    if (!address) {

        throw new Error(
            "Alamat wallet belum terdeteksi."
        );
    }


    const transactions =
        [];

    let nextPageParams =
        null;


    // ------------------------------------------
    // PAGINATION
    // ------------------------------------------

    for (
        let page = 1;
        page <= MAX_HISTORY_PAGES;
        page++
    ) {

        const url =
            new URL(

                BLOCKSCOUT_API_BASE +
                "/addresses/" +
                encodeURIComponent(
                    address
                ) +
                "/transactions"

            );


        // --------------------------------------
        // PARAMETER HALAMAN BERIKUTNYA
        // --------------------------------------

        if (
            nextPageParams
        ) {

            Object.entries(
                nextPageParams
            ).forEach(
                function([key, value]) {

                    if (
                        value !== null &&
                        value !== undefined
                    ) {

                        url.searchParams.set(
                            key,
                            String(value)
                        );

                    }

                }
            );

        }


        console.log(
            "AMBIL RIWAYAT BLOCKCHAIN - HALAMAN:",
            page
        );


        const response =
            await fetch(
                url.toString(),
                {
                    method: "GET",
                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                "Blockscout HTTP " +
                response.status
            );
        }


        const data =
            await response.json();


        const items =
            Array.isArray(
                data.items
            )
                ? data.items
                : [];


        // --------------------------------------
        // NORMALISASI DATA
        // --------------------------------------

        items.forEach(
            function(item) {

                try {

                    const record =
                        normalisasiTransaksiBlockchain(
                            item
                        );


                    if (
                        record
                    ) {

                        transactions.push(
                            record
                        );

                    }

                } catch (error) {

                    console.warn(
                        "TRANSAKSI BLOCKCHAIN DIABAIKAN:",
                        error?.message ||
                        error
                    );

                }

            }
        );


        // --------------------------------------
        // NEXT PAGE
        // --------------------------------------

        nextPageParams =
            data.next_page_params ||
            null;


        if (
            !nextPageParams ||
            items.length === 0
        ) {

            break;
        }

    }


    return transactions;
}


// ======================================================
// SINKRONKAN RIWAYAT BLOCKCHAIN
// ======================================================

async function sinkronkanRiwayatBlockchain() {

    const address =
        await ambilAkunWallet();


    if (!address) {

        console.log(
            "RIWAYAT BLOCKCHAIN DILEWATI: " +
            "WALLET BELUM TERDETEKSI"
        );

        return;
    }


    console.log(
        "WALLET UNTUK RIWAYAT:",
        address
    );


    const records =
        await ambilRiwayatDariBlockchain(
            address
        );


    console.log(
        "TRANSAKSI BLOCKCHAIN DITEMUKAN:",
        records.length
    );


    const merged =
        gabungkanTransaksiBlockchain(
            records
        );


    console.log(
        "TOTAL RIWAYAT TERSIMPAN:",
        merged.length
    );
            }

// ======================================================
// FORMAT ALAMAT
// ======================================================

function formatAddress(address) {

    if (!address) {
        return "-";
    }

    return (
        address.slice(0, 6) +
        "..." +
        address.slice(-6)
    );
}


// ======================================================
// FORMAT ETH
// ======================================================

function formatEth(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    const parts =
        String(value).split(".");

    const whole =
        parts[0];

    const fraction =
        parts[1] || "";


    const shown =
        fraction
            .slice(0, 8)
            .replace(/0+$/, "");


    return (
        whole +
        "." +
        shown.padEnd(4, "0") +
        " ETH"
    );
}


// ======================================================
// FORMAT JAM
// ======================================================

function formatTime(timestamp) {

    if (!timestamp) {
        return "-";
    }

    const date =
        new Date(timestamp);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }

    const jam =
        String(
            date.getHours()
        ).padStart(2, "0");

    const menit =
        String(
            date.getMinutes()
        ).padStart(2, "0");

    return (
        jam +
        "." +
        menit
    );
}


// ======================================================
// FORMAT TANGGAL LENGKAP
// ======================================================

function formatDateTime(timestamp) {

    if (!timestamp) {
        return "-";
    }

    const date =
        new Date(timestamp);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }

    const jam =
        String(
            date.getHours()
        ).padStart(2, "0");

    const menit =
        String(
            date.getMinutes()
        ).padStart(2, "0");

    const tanggal =
        String(
            date.getDate()
        ).padStart(2, "0");

    const bulan =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const tahun =
        date.getFullYear();

    return (
        jam +
        "." +
        menit +
        " | " +
        tanggal +
        "." +
        bulan +
        "." +
        tahun
    );
}


// ======================================================
// TAMPILKAN DAFTAR TRANSAKSI
// ======================================================

function tampilkanDaftar() {

    const transactions =
        bacaTransaksi();


    transactionList.innerHTML =
        "";


    // ------------------------------------------
    // BELUM ADA DATA
    // ------------------------------------------

    if (
        transactions.length === 0
    ) {

        const empty =
            document.createElement(
                "p"
            );

        empty.textContent =
            "Belum ada transaksi.";

        transactionList.appendChild(
            empty
        );

        return;
    }


    // ------------------------------------------
    // BUAT KARTU TRANSAKSI
    // ------------------------------------------

    transactions.forEach(
        function(transaction) {

            const item =
                document.createElement(
                    "button"
                );

            item.type =
                "button";

            item.className =
                "transaction-item";


            const info =
                document.createElement(
                    "div"
                );

            info.className =
                "transaction-info";


            const title =
                document.createElement(
                    "strong"
                );

            title.textContent =
                "Transfer";


            const address =
                document.createElement(
                    "span"
                );

            address.textContent =
                formatAddress(
                    transaction.to
                );


            const time =
                document.createElement(
                    "time"
                );

            time.textContent =
                formatTime(
                    transaction.timestamp
                );


            info.appendChild(
                title
            );

            info.appendChild(
                address
            );

            item.appendChild(
                info
            );

            item.appendChild(
                time
            );


            // --------------------------------------
            // KLIK KARTU
            // --------------------------------------

            item.addEventListener(
                "click",
                function() {

                    tampilkanDetail(
                        transaction.txHash
                    );

                }
            );


            transactionList.appendChild(
                item
            );

        }
    );
}


// ======================================================
// CARI TRANSAKSI
// ======================================================

function cariTransaksi(txHash) {

    const transactions =
        bacaTransaksi();

    return transactions.find(
        function(transaction) {

            return (
                transaction.txHash ===
                txHash
            );

        }
    );
}


// ======================================================
// TAMPILKAN DETAIL
// ======================================================

function tampilkanDetail(
    txHash,
    updateUrl = true
) {

    const transaction =
        cariTransaksi(
            txHash
        );


    if (!transaction) {

        console.error(
            "TRANSAKSI TIDAK DITEMUKAN:",
            txHash
        );

        return;
    }


    detailStatus.textContent =
    transaction.status ||
    "Berhasil ✅";


    detailFrom.textContent =
        formatAddress(
            transaction.from
        );


    detailTo.textContent =
        formatAddress(
            transaction.to
        );


    detailNetwork.textContent =
        transaction.network;


    detailAmount.textContent =
        formatEth(
            transaction.amount
        );


    detailGas.textContent =
        formatEth(
            transaction.gasFee
        );


    detailBlock.textContent =
        transaction.block;


    detailTime.textContent =
        formatDateTime(
            transaction.timestamp
        );


    detailHash.textContent =
        transaction.txHash;


    explorerButton.href =
        "https://sepolia.etherscan.io/tx/" +
        transaction.txHash;


    historyPage.hidden =
        true;

    detailPage.hidden =
        false;


    if (updateUrl) {

        window.history.pushState(
            {
                transactionHash:
                    transaction.txHash
            },
            "",
            "?tx=" +
            encodeURIComponent(
                transaction.txHash
            )
        );

    }


    console.log(
        "DETAIL TRANSAKSI DIBUKA:",
        transaction.txHash
    );
}


// ======================================================
// KEMBALI
// ======================================================

backToHistory.addEventListener(
    "click",
    function() {

        detailPage.hidden =
            true;

        historyPage.hidden =
            false;


        tampilkanDaftar();


        window.history.pushState(
            {},
            "",
            "riwayat.html"
        );

    }
);


// ======================================================
// SALIN HASH
// ======================================================

copyHashButton.addEventListener(
    "click",
    async function() {

        const hash =
            detailHash.textContent.trim();


        if (
            !hash ||
            hash === "-"
        ) {
            return;
        }


        try {

            await navigator.clipboard.writeText(
                hash
            );


            copyHashButton.textContent =
                "Hash Tersalin ✅";


            setTimeout(
                function() {

                    copyHashButton.textContent =
                        "Salin Hash";

                },
                2000
            );


            console.log(
                "HASH BERHASIL DISALIN:",
                hash
            );

        } catch (error) {

            console.error(
                "GAGAL MENYALIN HASH:",
                error
            );

        }

    }
);


// ======================================================
// BUKA TRANSAKSI DARI URL
// ======================================================

function bukaDariURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const txHash =
        params.get(
            "tx"
        );


    if (txHash) {

        tampilkanDetail(
            txHash,
            false
        );

    }
}


// ======================================================
// BROWSER BACK
// ======================================================

window.addEventListener(
    "popstate",
    function() {

        const params =
            new URLSearchParams(
                window.location.search
            );


        const txHash =
            params.get(
                "tx"
            );


        if (txHash) {

            tampilkanDetail(
                txHash,
                false
            );

        } else {

            detailPage.hidden =
                true;

            historyPage.hidden =
                false;

            tampilkanDaftar();

        }

    }
);


// ======================================================
// MULAI RIWAYAT
// ======================================================

async function mulaiRiwayat() {

    // ------------------------------------------
    // Tampilkan data lokal terlebih dahulu
    // ------------------------------------------

    tampilkanDaftar();


    // ------------------------------------------
    // Sinkronkan dengan blockchain
    // ------------------------------------------

    try {

        await sinkronkanRiwayatBlockchain();

        // Setelah blockchain selesai,
        // render ulang data terbaru.

        tampilkanDaftar();

    } catch (error) {

        console.error(
            "GAGAL MENGAMBIL RIWAYAT BLOCKCHAIN:",
            error
        );

    }


    // ------------------------------------------
    // Buka detail dari URL
    // ------------------------------------------

    bukaDariURL();


    console.log(
        "RIWAYAT.JS BERHASIL DIMUAT"
    );
}


mulaiRiwayat();
