Specification for API.

Steps:

<b>1. Registration.</b><br/>
Method type: POST<br/>
URL: /register<br/>
Request body example:
```
{
	"password": "0a2i84a..." // password hash
}
```
Response example:
```
0xfd95028685f3cd56d038a5aa19d0030cc116bbe0 // Ethereum wallet id
```
<br/>
<br/>
<b>2. Check account balance.</b><br/>
Method type: GET<br/>
URL: balance/:address <br/>
Request body example: 
-

Response example:
```
0.09287612
```
<br/>
<br/>
<b>3. Send testnet Ethers.</b><br/>
Method type: GET <br/>
URL: sendTestnetEthers/:address <br/>
Request body example:
-
Response example:
```
0x0cd67e71c298fde80c27a349ca5909e6091983b0a9dbae22ba8c96e2ef60a0fd // transaction id
```
<br/>
<br/>
<b>4. Policy yearly price.</b><br/>
Method type: POST<br/>
URL: /insurancePrice/:address<br/>
Request body example:
```
{
  "deviceBrand": "apple",
  "deviceYear": "2015",
  "wearLevel": "70",
  "region": "africa"
}
```
Response example:
```
400000000 // amount in WEI
```
<br/>
<br/>
<b>5. Insure.</b><br/>
Method type: POST<br/>
URL: /insure/:address<br/>
Request body example:
```
{
  "itemId": "112312132",
  "deviceBrand": "apple",
  "deviceYear": "2015",
  "wearLevel": "70",
  "region": "africa"
}
```
Response example:
```
0x9ba9f6fb21cb17d6dabebcb7ad6e66a919fddfcb1353cd2ea73fc7c0b9dc185a // transaction id
```
<br/>
<br/>
<b>2. Check account balance.</b><br/>
Method type: <br/>
URL: <br/>
Request example:
```json

```
Response example:
```json

```
<br/>
<br/>
<b>2. Check account balance.</b><br/>
Method type: <br/>
URL: <br/>
Request example:
```json

```
Response example:
```json

```
<br/>
<br/>
<b>2. Check account balance.</b><br/>
Method type: <br/>
URL: <br/>
Request example:
```json

```
Response example:
```json

```
<br/>
<br/>
<b>2. Check account balance.</b><br/>
Method type: <br/>
URL: <br/>
Request example:
```json

```
Response example:
```json

```
