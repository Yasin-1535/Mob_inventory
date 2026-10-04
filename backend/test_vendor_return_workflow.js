// Comprehensive End-to-End Verification Test Script
// Task 28 Scenario Testing: Vendor Sales Return Workflow

const http = require('http');

const API_BASE = 'http://localhost:5000/api';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING VENDOR SALES RETURN END-TO-END VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Health check & Admin Login
  console.log('--- Step 1: Admin Authentication ---');
  let token = null;
  const passwordsToTry = ['password123', 'Admin@123', 'adminpassword123'];
  for (const pwd of passwordsToTry) {
    const loginRes = await request('POST', '/auth/login', {
      email: 'admin@smartinventory.com',
      password: pwd,
      role: 'ADMIN',
    });
    if (loginRes.status === 200 && loginRes.body?.token) {
      token = loginRes.body.token;
      break;
    }
  }

  assert(Boolean(token), 'Admin login successful, JWT token acquired');
  if (!token) {
    console.error('Could not authenticate as Admin. Aborting further tests.');
    return;
  }

  // 2. Fetch or Create Vendor: ABC Electronics
  console.log('\n--- Step 2: Vendor ABC Electronics ---');
  const vendorRes = await request('GET', '/vendors', null, token);
  const vendorList = Array.isArray(vendorRes.body)
    ? vendorRes.body
    : (vendorRes.body.vendors || []);

  let abcVendor = vendorList.find((v) => v.name?.includes('ABC Electronics'));

  if (!abcVendor) {
    const createVen = await request('POST', '/vendors', {
      businessName: 'ABC Electronics',
      contactPerson: 'Arun Kumar',
      email: 'arun@abcelectronics.com',
      loginEmail: 'vendor-test@smartinventory.com',
      password: 'password123',
      phone: '+91 98450 12345',
      address: '450 Supplier Row, Dallas, TX',
      vendorType: 'Authorized Distributor',
      status: 'ACTIVE',
    }, token);

    abcVendor = createVen.body.vendor || createVen.body;
    assert(createVen.status === 200 || createVen.status === 201, 'Created Vendor: ABC Electronics');
  } else {
    assert(true, `Found existing Vendor: ABC Electronics (ID: ${abcVendor._id || abcVendor.id})`);
  }

  // 3. Setup Products: iPhone, Spare Part, Accessory
  console.log('\n--- Step 3: Verify Products (iPhone, Spare Part, Accessory) ---');
  const prodRes = await request('GET', '/products', null, token);
  const products = Array.isArray(prodRes.body) ? prodRes.body : (prodRes.body.products || []);

  let iphone = products.find((p) => p.name?.toLowerCase().includes('iphone'));
  let sparePart = products.find((p) => p.name?.toLowerCase().includes('display') || p.category === 'Spare Parts' || p.category === 'Repairs');
  let accessory = products.find((p) => p.name?.toLowerCase().includes('cable') || p.category === 'Accessories' || p.name?.toLowerCase().includes('card'));

  if (!iphone && products.length > 0) iphone = products[0];
  if (!sparePart && products.length > 1) sparePart = products[1];
  if (!accessory && products.length > 2) accessory = products[2];

  assert(Boolean(iphone), `Product 1: ${iphone?.name || 'iPhone 16'}`);
  assert(Boolean(sparePart), `Product 2: ${sparePart?.name || 'Spare Part'}`);
  assert(Boolean(accessory), `Product 3: ${accessory?.name || 'Accessory'}`);

  const initialIphoneStock = iphone.stock;
  const initialSpareStock = sparePart.stock;
  const initialAccessoryStock = accessory.stock;
  console.log(`Initial Available Stocks: iPhone=${initialIphoneStock}, Spare=${initialSpareStock}, Accessory=${initialAccessoryStock}`);

  // 4. Create Multi-Product Sale to Vendor: ABC Electronics
  console.log('\n--- Step 4: Create Multi-Product Sale to Vendor ABC Electronics ---');
  const tStamp = Date.now().toString().slice(-6);
  const iphoneImeis = [];
  for (let i = 1; i <= 10; i++) {
    iphoneImeis.push(`356984${tStamp}${i.toString().padStart(3, '0')}`);
  }

  const salePayload = {
    buyerType: 'VENDOR',
    vendorId: abcVendor._id || abcVendor.id || 'ven-abc',
    vendorName: 'ABC Electronics',
    customerName: 'ABC Electronics',
    items: [
      {
        productId: iphone._id || iphone.id,
        productName: iphone.name,
        sku: iphone.sku,
        quantity: 10,
        unitPrice: 70000,
        imeis: iphoneImeis,
      },
      {
        productId: sparePart._id || sparePart.id,
        productName: sparePart.name,
        sku: sparePart.sku,
        quantity: 5,
        unitPrice: sparePart.price || 1500,
      },
      {
        productId: accessory._id || accessory.id,
        productName: accessory.name,
        sku: accessory.sku,
        quantity: 10,
        unitPrice: accessory.price || 499,
      },
    ],
    paymentMethod: 'Other',
    paymentStatus: 'PAID',
    saleStatus: 'COMPLETED',
    notes: 'Multi-item outbound sale to ABC Electronics',
  };

  const saleRes = await request('POST', '/sales', salePayload, token);
  assert(saleRes.status === 200 || saleRes.status === 201, 'Created Outbound Multi-Product Sale to ABC Electronics');
  const createdSale = saleRes.body.data?.sale || saleRes.body.sale || saleRes.body;
  const saleId = createdSale.saleId || (saleRes.body.data && saleRes.body.data.saleId) || createdSale._id;
  console.log(`Generated Sale ID: ${saleId}`);

  // 5. Verify Inventory Decreased
  console.log('\n--- Step 5: Verify Inventory Decreased after Sale ---');
  const postSaleProd = await request('GET', `/products/${iphone._id || iphone.id}`, null, token);
  const iphoneAfterSale = postSaleProd.body.product || postSaleProd.body;
  console.log(`iPhone Stock after sale: ${iphoneAfterSale.stock} (Expected: ${initialIphoneStock - 10})`);
  assert(iphoneAfterSale.stock === initialIphoneStock - 10, 'Warehouse stock successfully decremented by sold quantity (10 units)');

  // 6. Create Vendor Sales Return (2 iPhones with IMEIs, 1 Spare Part, 3 Accessories)
  console.log('\n--- Step 6: Create Multi-Product Vendor Sales Return ---');
  const returnedImeis = [iphoneImeis[0], iphoneImeis[1]]; // first 2 iPhones
  const returnPayload = {
    returnType: 'VENDOR_SALES_RETURN',
    partyType: 'VENDOR',
    partyId: abcVendor._id || abcVendor.id,
    partyName: 'ABC Electronics',
    sourceSaleId: saleId,
    sourceReferenceNumber: saleId,
    items: [
      {
        productId: iphone._id || iphone.id,
        productName: iphone.name,
        sku: iphone.sku,
        quantity: 2,
        unitPrice: 70000,
        reasonCategory: 'BROKEN_ITEM',
        itemCondition: 'GOOD',
        imeis: returnedImeis,
        notes: 'Broken screen reported on arrival',
      },
      {
        productId: sparePart._id || sparePart.id,
        productName: sparePart.name,
        sku: sparePart.sku,
        quantity: 1,
        unitPrice: sparePart.price || 1500,
        reasonCategory: 'DAMAGED_ITEM',
        itemCondition: 'DAMAGED',
        notes: 'Damaged packaging and ribbon cable tear',
      },
      {
        productId: accessory._id || accessory.id,
        productName: accessory.name,
        sku: accessory.sku,
        quantity: 3,
        unitPrice: accessory.price || 499,
        reasonCategory: 'WRONG_PRODUCT',
        itemCondition: 'MISMATCHED',
        notes: 'Wrong color model delivered',
      },
    ],
    notes: 'Vendor return for defective, damaged and wrong units',
  };

  const returnRes = await request('POST', '/returns', returnPayload, token);
  assert(returnRes.status === 200 || returnRes.status === 201, 'Vendor Sales Return created successfully');
  const createdReturn = returnRes.body.return || returnRes.body;
  const returnId = createdReturn._id || createdReturn.id;
  console.log(`Created Return ID: ${returnId}, Return Number: ${createdReturn.returnNumber}`);

  // 7. Verify Return Status: RETURN_REQUESTED
  console.log('\n--- Step 7: Verify Return Status ---');
  assert(createdReturn.status === 'RETURN_REQUESTED', 'Initial Return Status is RETURN_REQUESTED');

  // 8. Mark Received (Enters Quarantine Stock)
  console.log('\n--- Step 8: Mark Return as Received ---');
  const receiveRes = await request('PATCH', `/returns/${returnId}/receive`, {}, token);
  assert(receiveRes.status === 200, 'Return successfully marked as RECEIVED');
  const receivedReturn = receiveRes.body.return || receiveRes.body;
  assert(receivedReturn.status === 'RECEIVED', 'Return lifecycle transitioned to RECEIVED');

  // 9. Verify Stock is in Quarantine / Inspection Stock (NOT Live Stock)
  console.log('\n--- Step 9: Verify Quarantine Stock Segregation ---');
  const postReceiveIphoneRes = await request('GET', `/products/${iphone._id || iphone.id}`, null, token);
  const postReceiveIphone = postReceiveIphoneRes.body.product || postReceiveIphoneRes.body;
  console.log(`Live Available Stock: ${postReceiveIphone.stock}, Inspection Stock: ${postReceiveIphone.inspectionStock}`);
  assert(postReceiveIphone.stock === initialIphoneStock - 10, 'Live Available Stock remained UNTOUCHED (Items quarantined in inspection)');
  assert(postReceiveIphone.inspectionStock >= 2, 'Inspection Stock successfully received +2 returned iPhones');

  // 10. Inspect Return (iPhone -> GOOD, Spare -> DAMAGED, Accessory -> MISMATCHED)
  console.log('\n--- Step 10: Perform Physical Return Inspection ---');
  const inspectRes = await request('PATCH', `/returns/${returnId}/inspect`, {
    itemCondition: 'GOOD',
    inspectionNotes: 'Technician verified serial numbers and physical status: 2 iPhones intact, spare part damaged, accessories mismatched',
  }, token);
  assert(inspectRes.status === 200, 'Inspection completed successfully');
  const inspectedReturn = inspectRes.body.return || inspectRes.body;
  assert(inspectedReturn.status === 'INSPECTED', 'Lifecycle state updated to INSPECTED');

  // 11. Restock Good Units into Available Stock
  console.log('\n--- Step 11: Restock Inspected Good Units ---');
  const restockRes = await request('POST', `/returns/${returnId}/restock`, {}, token);
  assert(restockRes.status === 200, 'Restock executed successfully');
  const restockedReturn = restockRes.body.return || restockRes.body;
  assert(restockedReturn.status === 'RESTOCKED', 'Return lifecycle updated to RESTOCKED');

  const postRestockIphoneRes = await request('GET', `/products/${iphone._id || iphone.id}`, null, token);
  const postRestockIphone = postRestockIphoneRes.body.product || postRestockIphoneRes.body;
  console.log(`Post-Restock iPhone Available Stock: ${postRestockIphone.stock}`);
  assert(postRestockIphone.stock === initialIphoneStock - 10 + 2, 'Available Stock incremented exactly by inspected good units (+2)');

  // 12. Settle Return (Credit Note issued to Vendor)
  console.log('\n--- Step 12: Record Financial Settlement ---');
  const settleRes = await request('POST', `/returns/${returnId}/settle`, {
    settlementType: 'CREDIT_NOTE',
    settlementAmount: createdReturn.totalAmount,
    settlementStatus: 'SETTLED',
    settlementNotes: 'Credit note CN-2026-0042 issued to ABC Electronics ledger',
  }, token);
  assert(settleRes.status === 200, 'Settlement record completed');
  const settledReturn = settleRes.body.return || settleRes.body;
  assert(settledReturn.status === 'SETTLED', 'Return status finalized as SETTLED');
  assert(settledReturn.settlementType === 'CREDIT_NOTE', 'Settlement type confirmed as CREDIT_NOTE');

  // 13. Test Partial Return & Over-Return Protection
  console.log('\n--- Step 13: Test Partial Return & Over-Return Protection ---');
  // Total sold = 10 iPhones. Already returned = 2. Remaining = 8.
  // Attempt to return 9 iPhones (should FAIL)
  const overReturnPayload = {
    returnType: 'VENDOR_SALES_RETURN',
    partyType: 'VENDOR',
    partyId: abcVendor._id || abcVendor.id,
    partyName: 'ABC Electronics',
    sourceSaleId: saleId,
    items: [
      {
        productId: iphone._id || iphone.id,
        productName: iphone.name,
        sku: iphone.sku,
        quantity: 9, // Exceeds remaining 8!
        unitPrice: 70000,
        reasonCategory: 'DEFECTIVE_ITEM',
        itemCondition: 'GOOD',
      },
    ],
  };
  const overReturnRes = await request('POST', '/returns', overReturnPayload, token);
  assert(overReturnRes.status === 400, `Over-return correctly rejected with HTTP 400 (${overReturnRes.body?.message || 'Quantity exceeds returnable'})`);

  // 14. Test Duplicate IMEI Protection
  console.log('\n--- Step 14: Test Duplicate IMEI Protection ---');
  // Attempt to return iphoneImeis[0] again (already returned in first return)
  const duplicateImeiPayload = {
    returnType: 'VENDOR_SALES_RETURN',
    partyType: 'VENDOR',
    partyId: abcVendor._id || abcVendor.id,
    partyName: 'ABC Electronics',
    sourceSaleId: saleId,
    items: [
      {
        productId: iphone._id || iphone.id,
        productName: iphone.name,
        sku: iphone.sku,
        quantity: 1,
        unitPrice: 70000,
        reasonCategory: 'DEFECTIVE_ITEM',
        itemCondition: 'GOOD',
        imeis: [returnedImeis[0]], // Already returned!
      },
    ],
  };
  const dupImeiRes = await request('POST', '/returns', duplicateImeiPayload, token);
  assert(dupImeiRes.status === 400, `Duplicate IMEI return correctly rejected with HTTP 400 (${dupImeiRes.body?.message || 'IMEI already returned'})`);

  // 15. Verify Inventory Log Records Created
  console.log('\n--- Step 15: Verify Inventory Ledger Audit Records ---');
  const logsRes = await request('GET', '/inventory/logs', null, token);
  const logs = Array.isArray(logsRes.body) ? logsRes.body : (logsRes.body.logs || []);
  const returnReceivedLog = logs.find((l) => l.type === 'VENDOR_RETURN_RECEIVED' || l.reason?.includes('Vendor Return Received') || l.movementType === 'VENDOR_RETURN_RECEIVED');
  const restockGoodLog = logs.find((l) => l.type === 'RETURN_INSPECTED_GOOD' || l.reason?.includes('Restocked Good Units') || l.movementType === 'RETURN_INSPECTED_GOOD');

  assert(Boolean(returnReceivedLog), 'Audit Log for VENDOR_RETURN_RECEIVED verified in Inventory Ledger');
  assert(Boolean(restockGoodLog), 'Audit Log for RETURN_INSPECTED_GOOD verified in Inventory Ledger');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed === 0) {
    console.log('🎉 ALL VENDOR SALES RETURN WORKFLOW TESTS COMPLETED WITH 100% SUCCESS!');
  }
}

runTests().catch((err) => {
  console.error('Test Execution Error:', err);
  process.exit(1);
});
