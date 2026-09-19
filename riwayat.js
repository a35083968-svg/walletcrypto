// ======================================================
// DATA TRANSAKSI CONTOH
// TAHAP PERTAMA: UI DETAIL TRANSAKSI
// ======================================================

const transaksiData = {

    1: {

        status: "Berhasil ✅",

        from:
            "0x85489A2B16d5195F3c5ca6Fb2Fdf74958c259A7E",

        to:
            "0xEE91B1Bbef00Cb1348FE1F31f214A7dFB6E829A6",

        network:
            "Ethereum Sepolia",

        amount:
            "0.0100 ETH",

        gas:
            "0.00002 ETH",

        block:
            "11666841",

        timestamp:
            "2026-09-10T07:15:00",

        hash:
            "0x809901da844d32b3f81b9a8c8c061223dc32229c331b68fe538ce4a015030305"

    },


    2: {

        status: "Berhasil ✅",

        from:
            "0x85ABCDEF12345678901234567890ABCDEF123456",

        to:
            "0xE829123456789012345678901234567890123456",

        network:
            "Ethereum Sepolia",

        amount:
            "0.0050 ETH",

        gas:
            "0.00002 ETH",

        block:
            "11713072",

        timestamp:
            "2026-09-10T08:21:00",

        hash:
            "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

    },


    3: {

        status: "Berhasil ✅",

        from:
            "0x123456789012345678901234567890123456ABCD",

        to:
            "0x12ABCDEF12345678901234567890123456789012",

        network:
            "Ethereum Sepolia",

        amount:
            "0.0020 ETH",

        gas:
            "0.00002 ETH",

        block:
            "11717702",

        timestamp:
            "2026-09-10T09:42:00",

        hash:
            "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"

    }

};


// ======================================================
// ELEMENT HTML
// ======================================================

const historyPage =
    document.getElementById("historyPage");

const detailPage =
    document.getElementById("detailPage");

const transactionItems =
    document.querySelectorAll(".transaction-item");

const backToHistory =
    document.getElementById("backToHistory");

const detailStatus =
    document.getElementById("detailStatus");

const detailFrom =
    document.getElementById("detailFrom");

const detailTo =
    document.getElementById("detailTo");

const detailNetwork =
    document.getElementById("detailNetwork");

const detailAmount =
    document.getElementById("detailAmount");

const detailGas =
    document.getElementById("detailGas");

const detailBlock =
    document.getElementById("detailBlock");

const detailTime =
    document.getElementById("detailTime");

const detailHash =
    document.getElementById("detailHash");

const copyHashButton =
    document.getElementById("copyHashButton");

const explorerButton =
    document.getElementById("explorerButton");


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
// FORMAT WAKTU
// ======================================================

function formatTimestamp(timestamp) {

    if (!timestamp) {
        return "-";
    }

    const date =
        new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
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
// TAMPILKAN DETAIL
// ======================================================

function tampilkanDetail(id) {

    const transaksi =
        transaksiData[id];

    if (!transaksi) {

        console.error(
            "TRANSAKSI TIDAK DITEMUKAN:",
            id
        );

        return;
    }


    detailStatus.textContent =
        transaksi.status;

    detailFrom.textContent =
        formatAddress(
            transaksi.from
        );

    detailTo.textContent =
        formatAddress(
            transaksi.to
        );

    detailNetwork.textContent =
        transaksi.network;

    detailAmount.textContent =
        transaksi.amount;

    detailGas.textContent =
        transaksi.gas;

    detailBlock.textContent =
        transaksi.block;

    detailTime.textContent =
        formatTimestamp(
            transaksi.timestamp
        );

    detailHash.textContent =
        transaksi.hash;


    explorerButton.href =
        "https://sepolia.etherscan.io/tx/" +
        transaksi.hash;


    historyPage.hidden =
        true;

    detailPage.hidden =
        false;


    window.history.pushState(
        {
            transactionId: id
        },
        "",
        "?tx=" + encodeURIComponent(id)
    );


    console.log(
        "DETAIL TRANSAKSI DIBUKA:",
        id
    );
}


// ======================================================
// KLIK TRANSAKSI
// ======================================================

transactionItems.forEach(
    function(item) {

        item.addEventListener(
            "click",
            function() {

                const id =
                    item.dataset.txId;

                tampilkanDetail(id);

            }
        );

    }
);


// ======================================================
// KEMBALI KE DAFTAR
// ======================================================

backToHistory.addEventListener(
    "click",
    function() {

        detailPage.hidden =
            true;

        historyPage.hidden =
            false;

        window.history.pushState(
            {},
            "",
            "riwayat.html"
        );

        console.log(
            "KEMBALI KE DAFTAR RIWAYAT"
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

        if (!hash || hash === "-") {

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
// DETEKSI ?tx= DI URL
// ======================================================

function bukaTransaksiDariURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const id =
        params.get("tx");

    if (id) {

        tampilkanDetail(id);

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

        const id =
            params.get("tx");

        if (id) {

            tampilkanDetail(id);

        } else {

            detailPage.hidden =
                true;

            historyPage.hidden =
                false;

        }

    }
);


// ======================================================
// MULAI
// ======================================================

bukaTransaksiDariURL();

console.log(
    "RIWAYAT.JS BERHASIL DIMUAT"
);
