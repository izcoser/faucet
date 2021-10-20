from django.http import HttpResponse
from django.shortcuts import render
from django.http import JsonResponse
from web3 import Web3
import json
import os

def index(request):
    return render(request, 'faucet/index.html')

def send_eth(request):
    if request.method != 'POST':
        return HttpResponseRedirect(reverse('index'))
    
    pk = os.environ.get('faucet_pk')
    from_address = os.environ.get('faucet_from')
    
    post = json.loads(request.body.decode("utf-8"))
    to_address = post['to_address']
    network = post['network'].lower().replace('ö', 'oe')

    web3 = Web3(Web3.HTTPProvider(f'https://{network}.infura.io/v3/142cc53636d346d5bc09a733300d0dec'))

    nonce = web3.eth.get_transaction_count(from_address) # this is not ideal, if many transactions
    #                                                      are made in sequence, the nonce doesn't
    #                                                      update fast enough and transactions fail.
    #                                                      Solution: store the nonce in a database,
    #                                                      increment by one after each transaction. 
    gasPrice = web3.toWei('50', 'gwei')
    ether_value = 0.001
    value = web3.toWei(ether_value, 'ether')

    tx = {
        'nonce': nonce,
        'to': to_address,
        'value': value,
        'gas': 2000000,
        'gasPrice': gasPrice,
    }

    signed_tx = web3.eth.account.sign_transaction(tx, pk)

    tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)

    return JsonResponse({'value': ether_value, 'network': network, 'tx_hash': tx_hash.hex()})