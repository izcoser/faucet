var giveButton;
document.addEventListener("DOMContentLoaded", function (event) {
    giveButton = document.getElementsByName('give')[0];
    const networkSelect = document.getElementById('network');
    networkSelect.addEventListener('change', (event) => {
        giveButton.value = 'Give me ' + (event.target.value.startsWith('Poly') ? 'MATIC' : 'Ether') + '!'
      });
});


function disableButton(){
    giveButton.disabled = true;
    giveButton.value = 'Sending...'
}

function enableButton(){
    giveButton.disabled = false;
    const network = document.getElementById('network').value;
    giveButton.value = 'Give me ' + (network.startsWith('Poly') ? 'MATIC' : 'Ether') + '!'
}

function sendEth(){

    disableButton();

    const to_address = document.getElementById('to_address').value;
    const network = document.getElementById('network').value;
    if(!to_address){
        displayError('You must provide a valid Ethereum address!', -1);
        enableButton();
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            const response = JSON.parse(this.responseText);
            const value = response['value'];
            const networkText = response['network'];
            const Txhash = response['tx_hash'];
            const success = response['success'];
            const message = response['message'];
            const code = response['code'];
            if(success){
                displayHash(value, networkText, Txhash);
            }
            else{
                displayError(message, code);
            }
            enableButton();
        }
    }
    xhr.open("POST", "send_eth/", true);
    xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken')); 
    xhr.setRequestHeader('Content-Type', 'application/json');
    const data = JSON.stringify({
        'to_address': to_address,
        'network': network,
    })
    xhr.send(data);
    console.log(data);
}

function displayHash(value, network, Txhash){
    const polygon = network.startsWith('polygon');
    const displayDiv = document.createElement('div');
    displayDiv.setAttribute('class', 'response');
    const anchor = document.createElement('a');
    const link = polygon ? ('https://mumbai.polygonscan.com/tx/' + Txhash) : ('https://' + network + '.etherscan.io/tx/' + Txhash);
    anchor.setAttribute('href', link);
    anchor.setAttribute('target', '_blank');
    anchor.innerText = 'View Transaction';
    displayDiv.innerText = 'Sent ' + value + (polygon ? ' MATIC' : ' ETH') + '! ';
    displayDiv.appendChild(anchor); 
    giveButton.after(displayDiv);
}

function displayError(message, code){
    const displayDiv = document.createElement('div');
    displayDiv.setAttribute('class', 'response');
    if (message.startsWith('already known')){
        displayDiv.innerText = 'Sorry! A transaction is under way. Please try again later.';
    }
    else if(message.startsWith('insufficient')){
        displayDiv.innerText = 'Sorry! We\'re out of funds.';
    }
    else{
        displayDiv.innerText = message;
    }

    const timeBar = document.createElement('div');
    timeBar.setAttribute('class', 'responseBar');
    timeBar.style.width = "100%";
    setInterval(() => {
        let w = Number(timeBar.style.width.replace('%', ''));
        w -= 0.5;
        timeBar.style.width = w + '%';
    }, 50);
    displayDiv.appendChild(timeBar);

    giveButton.after(displayDiv);
    setTimeout(() => displayDiv.remove(), 10100);
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}