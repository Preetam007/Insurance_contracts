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

app.get('/balance/:address', function (req, res) {
  var balance = web3.eth.getBalance(req.params.address).toNumber()
  var balanceInEth = balance / 1000000000000000000;
  res.send('' + balanceInEth);
})

app.get('/register', function (req, res) {
  if(req.body.password) {
      // Password should be used the one provided by user and secured
    web3.personal.newAccount(req.body.password, function(err, acc) {
      if(!err) {
        web3.personal.unlockAccount(acc, req.body.password, function(err, result) {
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
  }
  else {
    res.send('' + false);
  }
});

app.get('/insurancePrice/:address', function (req, res) {
  var account = req.params.address;
  var deviceBrand = req.query.deviceBrand;
  var deviceYear = req.query.deviceYear;
  var wearLevel = req.query.wearLevel;
  var region = req.query.region;
  var result = policyContract.policyPrice(deviceBrand, deviceYear, wearLevel, region);
  res.send('' + result);
})

app.get('/maxPayout', function (req, res) {
  var account = req.params.address;
  var result = policyContract.maxPayout();
  res.send('' + result);
})

app.get('/insure/:address/', function (req, res) {
  var account = req.params.address;
  var itemId = req.query.itemId;
  var deviceBrand = req.query.deviceBrand;
  var deviceYear = req.query.deviceYear;
  var wearLevel = req.query.wearLevel;
  var region = req.query.region;
  var policyMonthlyPayment = policyContract.policyPrice(deviceBrand, deviceYear, wearLevel, region) / 12;

  console.log(itemId + ' ' + deviceYear + ' ' + currentBatteryCapacity + ' ' + deviceName + ' ');

  policyContract.insure(itemId, deviceBrand, deviceYear, wearLevel, region, 
    {value: policyMonthlyPayment, gas: 2000000, from: account}, 
   function(err, result) {
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

                // confirmation transaction is needed from OWNER

                res.send(txId);
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

app.get('/policyEndDate/:address', function (req, res) {
  var account = req.params.address;

  var result = policyContract.insurancePolicies(account).endDateTimestamp;
  res.send('' + result);
})

app.get('/claimed/:address', function (req, res) {
  var account = req.params.address;

  var result = policyContract.insurancePolicies(account).claimed;
  res.send('' + result);
})

app.get('/nextPayment/:address', function (req, res) {
  var account = req.params.address;

  var result = policyContract.insurancePolicies(account).nextPaymentTimestamp;
  res.send('' + result);
})

// Not secure, it should come trusted authority, probably as an Oracle directly to smart contract
app.get('/claim/:address', function (req, res) {
  var account = req.params.address;
  var wearLevel = req.query.wearLevel;

  var txHash = policyContract.claim(wearLevel, {gas: 200000, from: account}, function(err, result) {
    if(err) {
      console.log(err);
      res.send('' + false);
    } else {
      res.send(txHash);
    }
    
  });
})

app.get('/', function (req, res) {
  res.send('source');
})
app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})