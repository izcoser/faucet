var giveButton;

document.addEventListener("DOMContentLoaded", function (event) {
    giveButton = document.getElementsByName('give')[0];
});

function disableButton(){
    giveButton.disabled = true;
    giveButton.value = 'Sending...'
}

function enableButton(){
    giveButton.disabled = false;
    giveButton.value = 'Give me Ether!'
}

function sendEth(){

    disableButton();

    const to_address = document.getElementById('to_address').value;
    const network = document.getElementById('network').value;
    if(!to_address){
        console.log('You must provide a valid Ethereum address!');
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            const response = JSON.parse(this.responseText);
            const value = response['value'];
            const networkText = response['network'];
            const Txhash = response['tx_hash'];
            displayHash(value, networkText, Txhash);
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
    const displayDiv = document.createElement('div');
    displayDiv.setAttribute('class', 'response');
    const anchor = document.createElement('a');
    const link = 'https://' + network + '.etherscan.io/tx/' + Txhash;
    anchor.setAttribute('href', link);
    anchor.setAttribute('target', '_blank');
    anchor.innerText = 'View Transaction';
    displayDiv.innerText = 'Sent ' + value + ' ETH! ';
    displayDiv.appendChild(anchor); 
    giveButton.after(displayDiv);
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