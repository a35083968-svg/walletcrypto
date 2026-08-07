let web3;
let akun;

// Ambil element dari HTML
const btnConnect = document.getElementById("btnConnect");
const alamat = document.getElementById("alamat");
const btnCekSaldo = document.getElementById("btnCekSaldo");
const btnCekHash = document.getElementById("btnCekHash");
const inputHash = document.getElementById("inputHash");
const statusEl = document.getElementById("txStatus");

console.log(btnConnect);

if (!btnConnect) {
    console.error("btnConnect tidak ditemukan");
}

const cAWEUSD_ADDRESS = "";
const cAWEUSD_DECIMALS = 18;

btnConnect.addEventListener("click", async () => {

    console.log("Connect ditekan");

    if (typeof window.ethereum !== "undefined") {
        console.log("Ethereum ditemukan");
    } else {
        console.log("Ethereum TIDAK ditemukan");
    }

    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            akun = accounts[0];

            alamat.textContent = `Alamat: ${akun.slice(0,6)}...${akun.slice(-4)}`;
            btnConnect.textContent = "Terhubung ✅";
            btnConnect.disabled = true;

            await updateUI();

        } catch (error) {
            alert("Gagal connect: " + error.message);
        }

    } else {
        alert("Install Bitget Wallet / MetaMask dan buka di Browser DApp");
    }

});

async function updateUI() {

    if (!akun || !web3) {
        console.log("updateUI gagal");
        return;
    }

    try {

        statusEl.innerText = "Mengambil saldo...";

        // Debug jaringan
        const chainId = await web3.eth.getChainId();
        console.log("Chain ID:", chainId);
        console.log("Alamat:", akun);
        console.log("Chain:", chainId);

        alert("Chain ID : " + chainId);
        
        // Ambil saldo
        const balance = await web3.eth.getBalance(akun);
        console.log("Balance (Wei):", balance);
        console.log("Wei:", balance);
        
        const saldoETH = web3.utils.fromWei(balance, "ether");
        console.log("Saldo ETH:", saldoETH);

        // Update tampilan
        alamat.innerHTML = `
            <b>Alamat:</b><br>
            ${akun.slice(0,6)}...${akun.slice(-4)}
            <br><br>
            <b>Saldo:</b> ${parseFloat(saldoETH).toFixed(4)} ETH
        `;

        statusEl.innerText = "";

    } catch (err) {

        console.error("Error getBalance:", err);

        statusEl.innerText = err.message;

        alamat.innerHTML = `
            <b>Alamat:</b><br>
            ${akun.slice(0,6)}...${akun.slice(-4)}
            <br><br>
            <span style="color:red">
                Gagal mengambil saldo
            </span>
        `;

    }

}

// KIRIM ETH
document.getElementById('sendBtn').addEventListener('click', async () => {
  const to = document.getElementById('toAddress').value;
  const amount = document.getElementById('amount').value;

  if (!akun) { statusEl.innerText = "Connect wallet dulu"; return; }
  if (!to ||!amount) { statusEl.innerText = "Alamat dan jumlah wajib diisi"; return; }
  
  // VALIDASI BARU
  if (!web3.utils.isAddress(to)) { 
      statusEl.innerText = "Alamat tujuan tidak valid! Harus 0x... 42 karakter"; 
      return; 
  }
  if (parseFloat(amount) <= 0) { 
      statusEl.innerText = "Jumlah ETH harus lebih dari 0"; 
      return; 
  }
const balance = await web3.eth.getBalance(akun);
if (parseFloat(amount) > parseFloat(web3.utils.fromWei(balance, 'ether'))) {
    statusEl.innerText = "Saldo ETH tidak cukup";
    return;
}  // <-- INI KURUNG TUTUPNYA KEBURU
try {
    statusEl.innerText = "Menunggu konfirmasi di Wallet...";
    const tx = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{from: akun,to: to,value: web3.utils.toHex(
        web3.utils.toWei(amount.toString(), "ether")
    )
}]
    
    statusEl.innerHTML = `
      <div style="background:#1e293b; padding:10px; border-radius:8px; margin-top:10px;">
        ✅ Transaksi terkirim! <br>
        <small>Hash: ${tx.slice(0,10)}...${tx.slice(-8)}</small> <br>
        <a href="https://sepolia.etherscan.io/tx/${tx}" target="_blank" style="color:#22c55e;">Lihat di Etherscan</a>
      </div>
    `;
    
    // Kosongkan form
    document.getElementById('toAddress').value = "";
    document.getElementById('amount').value = "";
    setTimeout(async () => { await updateUI(); }, 3000); // CUKUP 1 INI
  } catch (error) {
    statusEl.innerText = "Gagal: " + error.message;
  }
});

// FITUR 1: CEK SALDO
btnCekSaldo.addEventListener('click', async () => { // BENAR
  if (!akun) { statusEl.innerText = "Connect wallet dulu"; return; }
  statusEl.innerText = "Mengecek saldo...";
  await updateUI(); // CUKUP 1 INI
  statusEl.innerText = "Saldo sudah diupdate di atas";
});

// FITUR 2: LIHAT HASH TRANSAKSI
btnCekHash.addEventListener('click', async () => {
  const hash = inputHash.value;
  if (!hash) { statusEl.innerText = "Masukkan Hash Transaksi dulu"; return; }
  
  if (!web3) web3 = new Web3(window.ethereum);

  try {
    statusEl.innerText = "Mencari transaksi...";
    const tx = await web3.eth.getTransaction(hash);
    if (tx) {
      statusEl.innerHTML = `
        Ditemukan! <br>
        Dari: ${tx.from.slice(0,6)}...${tx.from.slice(-4)} <br>
        Ke: ${tx.to.slice(0,6)}...${tx.to.slice(-4)} <br>
        Jumlah: ${web3.utils.fromWei(tx.value, 'ether')} ETH <br>
        <a href="https://sepolia.etherscan.io/tx/${hash}" target="_blank" style="color:#22c55e;">Lihat di Etherscan</a>
      `;
    } else {
      statusEl.innerText = "Transaksi tidak ditemukan. Mungkin masih pending";
    }
  } catch (error) {
    statusEl.innerText = "Gagal: " + error.message;
  }
});
