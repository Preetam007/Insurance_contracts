"use strict"

const Web3 = require('web3')
const express = require('express')
const https = require('https');
const fs = require('fs');
const app = express()

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded b
app.use(require('helmet')()); // security for https

// Set up express server here
const options = {
    cert: fs.readFileSync('../../../../etc/letsencrypt/live/api.aigang.network/fullchain.pem'),
    key: fs.readFileSync('../../../../etc/letsencrypt/live/api.aigang.network/privkey.pem')
};

const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));

var obj = JSON.parse(fs.readFileSync('./build/contracts/BatteryInsurancePolicy.json', 'utf8'));
var abiArray = obj.abi;
// Insurance policy contract address Ropsten testnet
var contractAddress = '0xd7f42fa4b90aa0f4d51bc7ea075a842a62b23ce5';
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
        web3.eth.sendTransaction({value: 10000000000000000, 
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
            res.status(400);
            res.send('' + false);
          }  
        });
      }
      else {
        res.status(400);
        res.send('' + false);
      }    
    });
  }
  else {
    res.status(400);
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
  var priceInEth = result / 1000000000000000000;
  res.send('' + priceInEth);
})

app.get('/maxPayout', function (req, res) {
  var account = req.params.address;
  var result = policyContract.maxPayout.call();
  var payoutInEth = result / 1000000000000000000;
  res.send('' + payoutInEth);
})

app.post('/insure/:address/', function (req, res) {
  var account = req.params.address;
  var itemId = req.body.itemId;
  var deviceBrand = req.body.deviceBrand;
  var deviceYear = req.body.deviceYear;
  var wearLevel = req.body.wearLevel;
  var region = req.body.region;
  var policyMonthlyPayment = Math.round(policyContract.policyPrice(deviceBrand, deviceYear, wearLevel, region) / 12);
  console.log(itemId + '' + deviceBrand+ '' + deviceYear+ '' +region + '' + policyMonthlyPayment);
  web3.personal.unlockAccount(account, req.body.password, 2, function(err, result) {
    if(result) {
      policyContract.insure(itemId, deviceBrand, deviceYear, wearLevel, region, 
        {value: policyMonthlyPayment, gas: 200000, from: account}, 
       function(err, result) {
        if(err) {
          console.log(err);
          res.status(400);
          res.send('1' + err);
        } else {
          var txIdinsure = result;

          let filter = web3.eth.filter('latest')
          filter.watch(function(error, result) {
            console.log(error);
            if (!error) {
              let confirmedBlock = web3.eth.getBlock(web3.eth.blockNumber - 1)
              if (confirmedBlock.transactions.length > 0) {
                  let transaction = web3.eth.getTransaction(txIdinsure);
                  if (transaction.from == account) {

                    //---- confirmation transaction is needed from OWNER , TODO: refactor it and move to other file

                    web3.personal.unlockAccount(adminAccount, adminPass, 2, function(err, result) {
                      if(result) {    
                        policyContract.confirmPolicy(account, {gas: 200000, from: adminAccount}, function(err, result) {
                          if(err) {
                            console.log(err);
                            res.status(400);
                            res.send('2' + err);
                          } else {
                            res.send(txIdinsure);
                          }
                          
                        });
                      } else {
                        res.status(400);
                        res.send('3' + err);
                      }  
                    });

                    //-------
                  } else{
                    res.status(400);
                    res.send('4' + error);
                  }
                  filter.stopWatching();
              }
            }
          });
        }
        
      });
    } else {
      res.status(400);
      res.send('5' + err);
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
          res.status(400);
          res.send('' + false);
        } else {
          var txId = result;
          res.send(txId);
        }
        
      });
    } else {
      res.status(400);
      res.send('' + false);
    }  
  });
})

app.get('/', function (req, res) {
  res.send('Welcome to API. Specs can be found: ');
})

var server = https.createServer(options, app);

server.listen(3000, function () {
  console.log('Example app listening on port 3000 and https!')
})

