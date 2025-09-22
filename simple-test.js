const http = require('http');

const postData = JSON.stringify({
  firstName: "فاطمة",
  lastName: "السعد",
  mobileNumber: "+966501234569",
  email: "fatima.alsad@example.com",
  nationality: "سعودية",
  age: 32,
  monthlyIncome: 15000,
  gender: "female",
  typeOfProperty: "فيلا",
  typeOfContract: "buy",
  numberOfRooms: 4,
  numberOfBathrooms: 3,
  numberOfLivingRooms: 2,
  houseDirection: "south",
  budgetSize: 800000,
  hasMaidRoom: true,
  hasDriverRoom: true,
  kitchenInstalled: true,
  hasElevator: false,
  parkingAvailable: true,
  city: "الدمام",
  district: "الخبر",
  region: "الشرقية",
  sqm: 250,
  notes: "أبحث عن فيلا عائلية"
});

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/requests',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();

