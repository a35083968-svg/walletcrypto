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
// MULAI
// ======================================================

tampilkanDaftar();

bukaDariURL();

console.log(
    "RIWAYAT.JS BERHASIL DIMUAT"
);
