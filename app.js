const Web3 = require('web3')
const express = require('express')
const app = express()

const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8546"));

var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('./build/contracts/InsurancePolicy.json', 'utf8'));
var abiArray = obj.abi;
// Insurance policy contract address
var contractAddress = '0xe15aa91e2b093762fefbea44e65f0c0ac04724e8';
var policyContract = web3.eth.contract(abiArray).at(contractAddress);
var account = '';

app.get('/balance/:address', function (req, res) {
  var balance = web3.eth.getBalance(req.params.address).toNumber()
  var balanceInEth = balance / 1000000000000000000;
  res.send('' + balanceInEth);
})

app.get('/register', function (req, res) {
  // Password should be used the one provided by user and secured
  web3.personal.newAccount("tempPass", function(err, acc) {
    if(!err) {
      web3.personal.unlockAccount(acc, "tempPass", function(err, result) {
        if(result) {
          res.send('Unlocked: ' + acc);
        } else {
          res.send('' + false);
        }  
      });
    }
    else {
      res.send('' + false);
    }    
  });
});

app.get('/insurancePrice/:address/:batteryCapacity', function (req, res) {
  account = req.params.address;
  var result = policyContract.policyPrice(req.params.batteryCapacity);
  res.send('' + result);
})

app.get('/maxPayout/:address/:deviceYear', function (req, res) {
  account = req.params.address;
  var result = policyContract.calculateMaxPayout(req.params.deviceYear);
  res.send('' + result);
})

app.get('/insure/:address/', function (req, res) {
  account = req.params.address;
  var itemId = req.query.itemId;
  var deviceYear = req.query.deviceYear;
  var currentBatteryCapacity = req.query.currentBatteryCapacity;
  var deviceName = req.query.deviceName;

  console.log(itemId + ' ' + deviceYear + ' ' + currentBatteryCapacity + ' ' + deviceName + ' ');
  console.log(policyContract.policyPrice(currentBatteryCapacity));

  policyContract.insure(itemId, deviceYear, currentBatteryCapacity, deviceName, {value: policyContract.policyPrice(currentBatteryCapacity), gas: 2000000, from: account}, function(err, result) {
    if(err) {
      console.log(err);
      res.send('' + false);
    } else {
      txId = result;

      let filter = web3.eth.filter('latest')
      filter.watch(function(error, result) {
        console.log(error);
        if (!error) {
          let confirmedBlock = web3.eth.getBlock(web3.eth.blockNumber - 1)
          if (confirmedBlock.transactions.length > 0) {
              let transaction = web3.eth.getTransaction(txId);
              if (transaction.from == account) {
                res.send('' + true);
              } else{
                res.send('' + false);
              }
              filter.stopWatching();
          }
        }
      });
    }
    
  });

})

app.get('/insurancePolicies/:address', function (req, res) {
  account = req.params.address;

  var result = policyContract.getPolicies({from: account}) + '';
  res.send('' + result);
})

// Not secure, it should come trusted authority, probably as an Oracle directly to smart contract
app.get('/claim/:address', function (req, res) {
  account = req.params.address;
  policyContract.claim({gas: 200000, from: account}, function(err, result) {
    if(err) {
      console.log(err);
      res.send('' + false);
    } else {
      res.send('' + true);
    }
    
  });
})

app.get('/', function (req, res) {
  res.send('source');
})
app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})