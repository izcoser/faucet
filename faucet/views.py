from django.http import HttpResponse
from django.shortcuts import render
from django.http import JsonResponse
from web3 import Web3
from django.conf import settings
from ipware import get_client_ip
from faucet.models import Transactions
from datetime import datetime, timezone, timedelta
import json

chainIds = {'ropsten': 3, 'rinkeby': 4, 'goerli': 5, 'kovan': 42, 'polygon-mumbai': 80001}

PK = getattr(settings, "PK", None)
FROM_ADDRESS = getattr(settings, "FROM_ADDRESS", None)

def get_style(request):
    try:
        return request.COOKIES['style']
    except KeyError:
        return 'light'

def index(request):
    return render(request, 'faucet/index.html', {'style': get_style(request)})

def send_eth(request):
    if request.method != 'POST':
        return HttpResponseRedirect(reverse('index'))
    
    post = json.loads(request.body.decode("utf-8"))
    to_address = post['to_address']
    network = post['network'].lower().replace('ö', 'oe').replace('polygon', 'polygon-mumbai')

    web3 = Web3(Web3.HTTPProvider(f'https://{network}.infura.io/v3/142cc53636d346d5bc09a733300d0dec'))
    web3.eth.default_account = FROM_ADDRESS

    nonce = web3.eth.get_transaction_count(FROM_ADDRESS) # this is not ideal, if many transactions
    #                                                      are made in sequence, the nonce doesn't
    #                                                      update fast enough and transactions fail.
    #                                                      Solution: store the nonce in a database,
    #                                                      increment by one after each transaction. 
    print(nonce)
    ether_value = 0.001
    value = web3.toWei(ether_value, 'ether')
    
    client_ip, _ = get_client_ip(request)
    if client_ip is None:
        client_ip = '0.0.0.0'

    query = Transactions.objects.filter(ip=client_ip, network=network).order_by('-date') | \
            Transactions.objects.filter(address=to_address, network=network).order_by('-date')

    if len(query) > 0:
        tran = query.first()
        td = datetime.now(timezone.utc) - tran.date
        if td.days == 0 and td.seconds < 3600:
            return JsonResponse({'value': '', 'network': '', 'tx_hash': '', 'success': False, \
            'message': 'You have to wait at least one hour per request per network.', 'code': -1})

    if not web3.isAddress(to_address):
        return JsonResponse({'value': '', 'network': '', 'tx_hash': '', 'success': False, \
            'message': 'Invalid address.', 'code': -2})

    tx = {
        'nonce': nonce,
        'maxFeePerGas': 3000000000,
        'maxPriorityFeePerGas': 2000000000,
        'gas': 21000,
        'to': to_address,
        'value': value,
        'chainId': chainIds[network],
    }

    signed_tx = web3.eth.account.sign_transaction(tx, PK)

    try:
        tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
    except ValueError as e:
        print(e.args[0]['code'])
        print(e.args[0]['message'])

        return JsonResponse({'value': ether_value, 'network': network, 'tx_hash': '', 'success': False, 'message': e.args[0]['message'], 'code': e.args[0]['code']})


    tran = Transactions(ip=client_ip, network=network, network_id=chainIds[network], address=to_address)
    tran.save()
    return JsonResponse({'value': ether_value, 'network': network, 'tx_hash': tx_hash.hex(), 'success': True, 'message': '', 'code': ''})