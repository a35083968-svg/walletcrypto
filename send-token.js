"use strict";

const SEPOLIA_CHAIN_ID = 11155111;

const ERC20_ABI = [
    {
        constant: true,
        inputs: [],
        name: "symbol",
        outputs: [{ name: "", type: "string" }],
        type: "function"
    },
    {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        type: "function"
    },
    {
        constant: true,
        inputs: [{ name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        type: "function"
    },
    {
        constant: false,
        inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" }
        ],
        name: "transfer",
        outputs: [{ name: "", type: "bool" }],
        type: "function"
    }
];

const elements = {
    connect: document.getElementById("connectSendWallet"),
    load: document.getElementById("loadTokenButton"),
    send: document.getElementById("sendTokenButton"),
    tokenAddress: document.getElementById("tokenAddress"),
    recipient: document.getElementById("recipientAddress"),
    amount: document.getElementById("tokenAmount"),
    sender: document.getElementById("senderAddress"),
    symbol: document.getElementById("tokenSymbol"),
    balance: document.getElementById("tokenBalance"),
    status: document.getElementById("sendStatus")
};

let provider = null;
let web3 = null;
let account = null;
let tokenContract = null;
let tokenDecimals = null;
let tokenSymbol = "";
let tokenBalanceRaw = 0n;

function setStatus(message) {
    elements.status.textContent = message;
}

function formatUnits(rawValue, decimals) {
    const value = BigInt(rawValue);
    const divisor = 10n ** BigInt(decimals);
    const whole = value / divisor;

    if (decimals === 0) {
        return whole.toString();
    }

    const fraction = (value % divisor)
        .toString()
        .padStart(decimals, "0")
        .replace(/0+$/, "");

    return fraction
        ? `${whole}.${fraction}`
        : whole.toString();
}

function parseUnits(amount, decimals) {
    const value = amount.trim();

    if (!/^\d+(\.\d+)?$/.test(value)) {
        throw new Error("Masukkan jumlah token yang valid.");
    }

    const parts = value.split(".");
    const whole = parts[0];
    const fraction = parts[1] || "";

    if (fraction.length > decimals) {
        throw new Error(
            `Token ini hanya mendukung ${decimals} angka desimal.`
        );
    }

    const combined =
        whole + fraction.padEnd(decimals, "0");

    const normalized = combined.replace(/^0+/, "") || "0";
    const units = BigInt(normalized);

    if (units <= 0n) {
        throw new Error("Jumlah token harus lebih dari nol.");
    }

    return units;
}

async function assertSepolia() {
    const chainIdHex = await provider.request({
        method: "eth_chainId"
    });

    const chainId = Number.parseInt(chainIdHex, 16);

    if (chainId !== SEPOLIA_CHAIN_ID) {
        throw new Error(
            `Jaringan salah. Pilih Sepolia (Chain ID ${SEPOLIA_CHAIN_ID}).`
        );
    }
}

async function connectWallet() {
    if (!window.ethereum) {
        throw new Error(
            "Wallet tidak terdeteksi. Buka halaman melalui browser DApp wallet."
        );
    }

    provider = window.ethereum;
    web3 = new Web3(provider);

    await assertSepolia();

    const accounts = await provider.request({
        method: "eth_requestAccounts"
    });

    if (!accounts.length) {
        throw new Error("Tidak ada akun wallet yang dipilih.");
    }

    account = accounts[0];
    elements.sender.textContent = account;

    setStatus("Wallet terhubung. Baca token sebelum mengirim.");
}

async function loadToken() {
    if (!web3 || !account) {
        throw new Error("Hubungkan wallet terlebih dahulu.");
    }

    await assertSepolia();

    const address = elements.tokenAddress.value.trim();

    if (!Web3.utils.isAddress(address)) {
        throw new Error("Alamat kontrak token tidak valid.");
    }

    const checksumAddress =
        Web3.utils.toChecksumAddress(address);

    const code = await provider.request({
        method: "eth_getCode",
        params: [checksumAddress, "latest"]
    });

    if (!code || /^0x0*$/i.test(code)) {
        throw new Error(
            "Tidak ditemukan kontrak pada alamat tersebut di Sepolia."
        );
    }

    const contract = new web3.eth.Contract(
        ERC20_ABI,
        checksumAddress
    );

    const [symbol, decimalsResult, balanceResult] =
        await Promise.all([
            contract.methods.symbol().call(),
            contract.methods.decimals().call(),
            contract.methods.balanceOf(account).call()
        ]);

    const decimals = Number(decimalsResult);

    if (
        !Number.isInteger(decimals) ||
        decimals < 0 ||
        decimals > 255
    ) {
        throw new Error("Desimal token tidak valid.");
    }

    tokenContract = contract;
    tokenDecimals = decimals;
    tokenSymbol = symbol;
    tokenBalanceRaw = BigInt(balanceResult);

    elements.symbol.textContent = tokenSymbol;
    elements.balance.textContent =
        `${formatUnits(tokenBalanceRaw, tokenDecimals)} ${tokenSymbol}`;

    elements.send.disabled = false;

    setStatus("Token berhasil dibaca. Periksa alamat dan jumlah sebelum mengirim.");
}

async function sendERC20Token() {
    if (!tokenContract || tokenDecimals === null || !account) {
        throw new Error("Hubungkan wallet dan baca token terlebih dahulu.");
    }

    await assertSepolia();

    // Pastikan akun yang aktif masih sama dengan akun pengirim.
    const accounts = await provider.request({
        method: "eth_accounts"
    });

    if (
        !accounts.length ||
        accounts[0].toLowerCase() !== account.toLowerCase()
    ) {
        throw new Error(
            "Akun wallet berubah. Hubungkan kembali dan baca token."
        );
    }

    const recipientInput = elements.recipient.value.trim();

    if (!Web3.utils.isAddress(recipientInput)) {
        throw new Error("Alamat penerima tidak valid.");
    }

    const recipient =
        Web3.utils.toChecksumAddress(recipientInput);

    if (recipient.toLowerCase() === account.toLowerCase()) {
        throw new Error("Alamat penerima sama dengan wallet pengirim.");
    }

    const amount = parseUnits(
        elements.amount.value,
        tokenDecimals
    );

    if (amount > tokenBalanceRaw) {
        throw new Error("Saldo token tidak mencukupi.");
    }

    const confirmed = window.confirm(
        `Kirim ${elements.amount.value} ${tokenSymbol} ke ${recipient}?\n\n` +
        "Pastikan alamat benar. Transaksi blockchain tidak dapat dibatalkan."
    );

    if (!confirmed) {
        setStatus("Transaksi dibatalkan oleh pengguna.");
        return;
    }

    elements.send.disabled = true;
    setStatus("Menunggu konfirmasi transaksi di wallet...");

    try {
        const receipt = await tokenContract.methods
            .transfer(recipient, amount.toString())
            .send({ from: account });

        setStatus(
            `Transaksi berhasil. Hash: ${receipt.transactionHash}`
        );

        await loadToken();

    } catch (error) {
        console.error("ERC-20 TRANSFER ERROR:", error);

        throw new Error(
            error?.message || "Transaksi gagal atau ditolak."
        );

    } finally {
        elements.send.disabled = false;
    }
}

elements.connect.addEventListener("click", async () => {
    elements.connect.disabled = true;

    try {
        await connectWallet();
    } catch (error) {
        setStatus(error.message);
    } finally {
        elements.connect.disabled = false;
    }
});

elements.load.addEventListener("click", async () => {
    elements.load.disabled = true;

    try {
        await loadToken();
    } catch (error) {
        console.error("TOKEN LOAD ERROR:", error);
        setStatus(error.message);
    } finally {
        elements.load.disabled = false;
    }
});

elements.send.addEventListener("click", async () => {
    try {
        await sendERC20Token();
    } catch (error) {
        console.error("ERC-20 TRANSFER ERROR:", error);
        setStatus(error.message);
    }
});

if (window.ethereum?.on) {
    window.ethereum.on("accountsChanged", () => {
        account = null;
        tokenContract = null;
        tokenDecimals = null;
        tokenBalanceRaw = 0n;

        elements.sender.textContent = "Wallet belum terhubung";
        elements.symbol.textContent = "—";
        elements.balance.textContent = "—";
        elements.send.disabled = true;

        setStatus("Akun berubah. Hubungkan kembali wallet dan baca token.");
    });

    window.ethereum.on("chainChanged", () => {
        tokenContract = null;
        tokenDecimals = null;
        tokenBalanceRaw = 0n;

        elements.send.disabled = true;
        setStatus("Jaringan berubah. Pilih Sepolia dan baca token kembali.");
    });
}

console.log("SEND-TOKEN.JS BERHASIL DIMUAT");
