"use strict"

const Web3 = require('web3')
const express = require('express')
const app = express()

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded b

const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));

var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('./build/contracts/BatteryInsurancePolicy.json', 'utf8'));
var abiArray = obj.abi;
// Insurance policy contract address
var contractAddress = '0x3da52a228c20f62320b5b1b9b7dcc2d1ba777c2c';
var policyContract = web3.eth.contract(abiArray).at(contractAddress);
var adminAccount = '0x2033d81c062de642976300c6eabcba149e4372be';
var adminPass = 'adminPassword1234Temp';

app.get('/balance/:address', function (req, res) {
  var balance = web3.eth.getBalance(req.params.address).toNumber()
  var balanceInEth = balance / 1000000000000000000;
  res.send('' + balanceInEth);
})

app.post('/sendTestnetEthers/:address', function (req, res) {
  var account = req.params.address;

  web3.personal.unlockAccount(account, req.body.password, 4, function(err, accResult) {
    if(accResult) {    
    // unlocking admin account for ethers sending
      web3.personal.unlockAccount(adminAccount, adminPass, 4, function(err, adminAccResult) {
        web3.eth.sendTransaction({value: 30000000000000000, 
          gas: 2000000, from: adminAccount, to: account}, function(err, result) {
          if(err) {
            console.log(err);
            res.send(false);
          } else {
            var txId = result;
            res.send('' + txId);
          }
        });
      });
    } else {
      console.log(err);
      res.send(false);
    }  
  });
})

app.post('/register', function (req, res) {
  // password hash
  if(req.body.password) {
      // Password should be used the one provided by user and secured
    web3.personal.newAccount(req.body.password, function(err, acc) {
      if(!err) {
        web3.personal.unlockAccount(acc, req.body.password, 2, function(err, result) {
          if(result) {
            res.send(acc);
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

app.post('/insurancePrice/:address', function (req, res) {
  var account = req.params.address;
  var deviceBrand = req.body.deviceBrand;
  var deviceYear = req.body.deviceYear;
  var wearLevel = req.body.wearLevel;
  var region = req.body.region;

  var result = policyContract.policyPrice(deviceBrand, deviceYear, wearLevel, region);
  res.send('' + result);
})

app.get('/maxPayout', function (req, res) {
  var account = req.params.address;
  var result = policyContract.maxPayout.call();
  res.send('' + result);
})

app.post('/insure/:address/', function (req, res) {
  var account = req.params.address;
  var itemId = req.body.itemId;
  var deviceBrand = req.body.deviceBrand;
  var deviceYear = req.body.deviceYear;
  var wearLevel = req.body.wearLevel;
  var region = req.body.region;
  var policyMonthlyPayment = policyContract.policyPrice(deviceBrand, deviceYear, wearLevel, region) / 12;

  web3.personal.unlockAccount(account, req.body.password, 2, function(err, result) {
    if(result) {
      policyContract.insure(itemId, deviceBrand, deviceYear, wearLevel, region, 
        {value: policyMonthlyPayment, gas: 2000000, from: account}, 
       function(err, result) {
        if(err) {
          console.log(err);
          res.send('' + false);
        } else {
          var txId = result;

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
    } else {
      res.send('' + false);
    }  
  });
})

app.get('/policyEndDate/:address', function (req, res) {
  var account = req.params.address;

  var result = policyContract.getPolicyEndDateTimestamp({from: account});
  res.send('' + result);
})

app.get('/nextPayment/:address', function (req, res) {
  var account = req.params.address;

  var result = policyContract.getPolicyNextPayment({from: account});
  res.send('' + result);
})

app.get('/claimed/:address', function (req, res) {
  var account = req.params.address;

  var result = policyContract.claimed({from: account});
  res.send('' + result);
})

// Not secure, it should come trusted authority, probably as an Oracle directly to smart contract
app.post('/claim/:address', function (req, res) {
  var account = req.params.address;
  var wearLevel = req.body.wearLevel;

  web3.personal.unlockAccount(account, req.body.password, 2, function(err, result) {
    if(result) {    
      policyContract.claim(wearLevel, {gas: 200000, from: account}, function(err, result) {
        if(err) {
          console.log(err);
          res.send('' + false);
        } else {
          var txId = result;
          res.send(txId);
        }
        
      });
    } else {
      res.send('' + false);
    }  
  });
})

app.get('/', function (req, res) {
  res.send('source');
})
app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})