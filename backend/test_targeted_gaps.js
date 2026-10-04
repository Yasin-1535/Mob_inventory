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

async function runTargetedTests() {
  console.log('============================================================');
  console.log('TARGETED VERIFICATION: TASKS 12, 13, 14, 15 (MULTI-ITEM GAPS)');
  console.log('============================================================\n');

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

  // 1. Admin Authentication
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
    console.error('Authentication failed. Aborting tests.');
    process.exit(1);
  }

  // 2. Setup Vendor: ABC Electronics
  console.log('\n--- Step 2: Ensure Vendor ABC Electronics exists ---');
  const vendorRes = await request('GET', '/vendors', null, token);
  const vendorList = Array.isArray(vendorRes.body) ? vendorRes.body : (vendorRes.body.vendors || []);
  let abcVendor = vendorList.find((v) => (v.name || v.businessName)?.toLowerCase().includes('abc electronics'));

  if (!abcVendor) {
    const createVen = await request('POST', '/vendors', {
      businessName: 'ABC Electronics',
      contactPerson: 'Arun Kumar',
      email: `abc-${Date.now()}@abcelectronics.com`,
      loginEmail: `abc-${Date.now()}@smartinventory.com`,
      password: 'password123',
      phone: '+91 98450 12345',
      address: '450 Supplier Row, Dallas, TX',
      vendorType: 'Authorized Distributor',
      status: 'ACTIVE',
    }, token);
    abcVendor = createVen.body.vendor || createVen.body;
  }
  const vendorId = abcVendor._id || abcVendor.id;
  assert(Boolean(vendorId), `Vendor ABC Electronics ready (ID: ${vendorId})`);

  // 3. Setup 3 Products: iPhone 15, Spare Battery, USB-C Cable
  console.log('\n--- Step 3: Ensure Products for Task 12 Scenario ---');
  const prodRes = await request('GET', '/products', null, token);
  const allProds = Array.isArray(prodRes.body) ? prodRes.body : (prodRes.body.products || []);

  async function getOrCreateProduct(name, sku, category, price, minStock) {
    let p = allProds.find((x) => x.sku === sku || x.name.toLowerCase() === name.toLowerCase());
    if (!p) {
      const createRes = await request('POST', '/products', {
        name,
        sku,
        category,
        price,
        stock: minStock + 50,
        minStock: 5,
        unit: 'Pcs',
        brand: 'Generic',
        isSerialTracked: sku.includes('IPHONE'),
      }, token);
      p = createRes.body.product || createRes.body;
    } else if (p.stock < minStock) {
      // Top up stock
      await request('PUT', `/products/${p._id || p.id}`, {
        stock: p.stock + minStock + 50,
      }, token);
      p.stock += minStock + 50;
    }
    return p;
  }

  const pIphone = await getOrCreateProduct('iPhone 15 128GB', 'APL-IP15-128', 'Smartphones', 70000, 30);
  const pBattery = await getOrCreateProduct('Spare Battery 3500mAh', 'BAT-IP15-SP', 'Spare Parts', 1500, 20);
  const pCable = await getOrCreateProduct('USB-C Fast Cable', 'CAB-USBC-2M', 'Accessories', 500, 50);

  assert(Boolean(pIphone && pBattery && pCable), 'All 3 products ready (iPhone 15, Spare Battery, USB-C Cable)');

  // ============================================================
  // TASK 12: MULTI-ITEM SALE SCENARIO
  // ============================================================
  console.log('\n--- TASK 12: Executing Multi-Item Sale ---');
  console.log('Sale specification: 10 × iPhone 15, 5 × Spare Battery, 20 × USB-C Cable');

  const initialIphoneStock = pIphone.stock;
  const initialBatteryStock = pBattery.stock;
  const initialCableStock = pCable.stock;

  const timestamp = Date.now().toString().slice(-6);
  const iphoneSaleImeis = [];
  for (let i = 1; i <= 10; i++) {
    iphoneSaleImeis.push(`356892${timestamp}${i.toString().padStart(3, '0')}`);
  }

  const multiItemSalePayload = {
    buyerType: 'VENDOR',
    vendorId: vendorId,
    vendorName: 'ABC Electronics',
    items: [
      {
        productId: pIphone._id || pIphone.id,
        productName: pIphone.name,
        sku: pIphone.sku,
        quantity: 10,
        unitPrice: 70000,
        imeis: iphoneSaleImeis,
      },
      {
        productId: pBattery._id || pBattery.id,
        productName: pBattery.name,
        sku: pBattery.sku,
        quantity: 5,
        unitPrice: 1500,
      },
      {
        productId: pCable._id || pCable.id,
        productName: pCable.name,
        sku: pCable.sku,
        quantity: 20,
        unitPrice: 500,
      },
    ],
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'PAID',
    saleStatus: 'COMPLETED',
    notes: 'Task 12 Bulk Outbound Sale to ABC Electronics',
  };

  const saleRes = await request('POST', '/sales', multiItemSalePayload, token);
  console.log('Sale response status:', saleRes.status, 'body:', JSON.stringify(saleRes.body));
  assert(saleRes.status === 200 || saleRes.status === 201, 'Created Multi-Item Sale successfully with HTTP 200/201');

  const createdSale = saleRes.body.data?.sale || saleRes.body.sale || saleRes.body;
  const saleId = createdSale.saleId || (saleRes.body.data && saleRes.body.data.saleId) || createdSale._id;
  console.log(`Generated Sale Number / ID: ${saleId}`);
  assert(Boolean(createdSale.items && createdSale.items.length === 3), 'Sale document stored with 3 line items');

  // Verify stock decreased correctly for ALL THREE products (Task 1D & 12)
  console.log('\n--- Verifying Stock Decrement for All 3 Products ---');
  const postIphone = (await request('GET', `/products/${pIphone._id || pIphone.id}`, null, token)).body.product || {};
  const postBattery = (await request('GET', `/products/${pBattery._id || pBattery.id}`, null, token)).body.product || {};
  const postCable = (await request('GET', `/products/${pCable._id || pCable.id}`, null, token)).body.product || {};

  assert(postIphone.stock === initialIphoneStock - 10, `iPhone stock decremented by 10 (${initialIphoneStock} -> ${postIphone.stock})`);
  assert(postBattery.stock === initialBatteryStock - 5, `Battery stock decremented by 5 (${initialBatteryStock} -> ${postBattery.stock})`);
  assert(postCable.stock === initialCableStock - 20, `Cable stock decremented by 20 (${initialCableStock} -> ${postCable.stock})`);

  // Query Sale Returnable endpoint (Task 3A)
  console.log('\n--- Testing Central Returnable Calculation Endpoint ---');
  const retInfoRes = await request('GET', `/returns/sale-returnable/${saleId}`, null, token);
  assert(retInfoRes.status === 200, 'GET /returns/sale-returnable/:saleId returned HTTP 200');
  const retInfo = retInfoRes.body.data || retInfoRes.body;
  assert(retInfo.items && retInfo.items.length === 3, 'Calculated returnable breakdown for all 3 sale lines');

  const iphoneRetLine = retInfo.items.find((x) => x.sku === pIphone.sku);
  const batteryRetLine = retInfo.items.find((x) => x.sku === pBattery.sku);
  const cableRetLine = retInfo.items.find((x) => x.sku === pCable.sku);

  assert(iphoneRetLine.returnableQuantity === 10, 'iPhone remaining returnable = 10');
  assert(batteryRetLine.returnableQuantity === 5, 'Battery remaining returnable = 5');
  assert(cableRetLine.returnableQuantity === 20, 'Cable remaining returnable = 20');
  assert(iphoneRetLine.availableImeis.length === 10, 'All 10 sold IMEIs available for return');

  // ============================================================
  // TASK 12: ONE MULTI-ITEM RETURN
  // ============================================================
  console.log('\n--- TASK 12: Creating ONE Multi-Item Vendor Sales Return ---');
  console.log('Return items: 2 × iPhone (BROKEN_ITEM), 1 × Battery (MISMATCHED_PRODUCT), 3 × Cable (WRONG_PRODUCT)');

  const returnedImeis = [iphoneSaleImeis[0], iphoneSaleImeis[1]];
  const multiReturnPayload = {
    returnType: 'VENDOR_SALES_RETURN',
    partyType: 'VENDOR',
    partyId: vendorId,
    partyName: 'ABC Electronics',
    sourceSaleId: saleId,
    sourceReferenceNumber: saleId,
    items: [
      {
        productId: pIphone._id || pIphone.id,
        productName: pIphone.name,
        sku: pIphone.sku,
        quantity: 2,
        unitPrice: 70000,
        reasonCategory: 'BROKEN_ITEM',
        itemCondition: 'GOOD',
        imeis: returnedImeis,
      },
      {
        productId: pBattery._id || pBattery.id,
        productName: pBattery.name,
        sku: pBattery.sku,
        quantity: 1,
        unitPrice: 1500,
        reasonCategory: 'MISMATCHED_PRODUCT',
        itemCondition: 'DAMAGED',
      },
      {
        productId: pCable._id || pCable.id,
        productName: pCable.name,
        sku: pCable.sku,
        quantity: 3,
        unitPrice: 500,
        reasonCategory: 'WRONG_PRODUCT',
        itemCondition: 'UNSELLABLE',
      },
    ],
    notes: 'Task 12 Multi-Item Vendor Sales Return',
  };

  const returnRes = await request('POST', '/returns', multiReturnPayload, token);
  assert(returnRes.status === 200 || returnRes.status === 201, 'ONE Multi-Product Return created successfully');
  const returnDoc = returnRes.body.return || returnRes.body.data?.return || returnRes.body;
  const returnId = returnDoc._id || returnDoc.id;
  assert(returnDoc.items && returnDoc.items.length === 3, 'Verified return voucher contains THREE return line items');
  console.log(`Created Return ID: ${returnId}, Return Number: ${returnDoc.returnNumber}`);

  // Receive Return -> Quarantine Isolation Check (Task 4)
  console.log('\n--- Receiving Return & Verifying Quarantine Segregation ---');
  const recRes = await request('PATCH', `/returns/${returnId}/receive`, {}, token);
  assert(recRes.status === 200, 'Return status transitioned to RECEIVED');

  const checkIphoneLive = (await request('GET', `/products/${pIphone._id || pIphone.id}`, null, token)).body.product || {};
  assert(checkIphoneLive.stock === initialIphoneStock - 10, 'Live Available stock remains UNTOUCHED upon return receipt (Quarantined)');
  assert((checkIphoneLive.inspectionStock || 0) >= 2, 'Inspection quarantine stock increased by +2 iPhones');

  // Process Inspection: Item-by-item conditions (Task 12)
  console.log('\n--- Processing Item-by-Item Physical Inspection ---');
  // iPhone -> GOOD, Battery -> DAMAGED, Cable -> UNSELLABLE
  const processInspRes = await request('POST', `/returns/${returnId}/process-inspection`, {
    inspections: [
      { sku: pIphone.sku, condition: 'GOOD', notes: 'Verified screen intact and functional' },
      { sku: pBattery.sku, condition: 'DAMAGED', notes: 'Pin connector bent' },
      { sku: pCable.sku, condition: 'UNSELLABLE', notes: 'Cut wire' },
    ],
    notes: 'Item-by-item inspection confirmed',
  }, token);
  assert(processInspRes.status === 200, 'Processed item-by-item inspection result');

  // Restock Good units (iPhone) & Mark Damaged (Battery & Cable)
  console.log('\n--- Executing Stock Dispositions (Restock / Damaged / Discard) ---');
  const restockRes = await request('POST', `/returns/${returnId}/restock`, { sku: pIphone.sku }, token);
  assert(restockRes.status === 200, 'Restocked iPhone GOOD units');

  const postRestockIphone = (await request('GET', `/products/${pIphone._id || pIphone.id}`, null, token)).body.product || {};
  assert(postRestockIphone.stock === initialIphoneStock - 10 + 2, `Available stock restored by 2 units (${initialIphoneStock - 10} -> ${postRestockIphone.stock})`);

  const markDamagedRes = await request('POST', `/returns/${returnId}/mark-damaged`, { sku: pBattery.sku }, token);
  assert(markDamagedRes.status === 200, 'Marked Battery units as DAMAGED stock');

  // ============================================================
  // TASK 13: OVER-RETURN TESTS
  // ============================================================
  console.log('\n--- TASK 13: Over-Return & Overlap Protection Tests ---');
  // From our sale:
  // iPhone: sold 10, returned 2, remaining 8.
  // Battery: sold 5, returned 1, remaining 4.
  // Cable: sold 20, returned 3, remaining 17.

  // Test: Exceeding returnable quantity MUST fail with HTTP 400
  const overReturnAttempt = await request('POST', '/returns', {
    returnType: 'VENDOR_SALES_RETURN',
    partyType: 'VENDOR',
    partyId: vendorId,
    partyName: 'ABC Electronics',
    sourceSaleId: saleId,
    items: [
      {
        productId: pBattery._id || pBattery.id,
        productName: pBattery.name,
        sku: pBattery.sku,
        quantity: 5, // Only 4 remaining!
        unitPrice: 1500,
        reasonCategory: 'BROKEN_ITEM',
      },
    ],
  }, token);

  assert(overReturnAttempt.status === 400, `Over-return correctly rejected with HTTP 400 (${overReturnAttempt.body?.message})`);

  // Test exact returnable depletion:
  // Battery remaining = 4. Return A = 2, Return B = 2 -> total = 4.
  console.log('Testing sequential returns: Return A = 2, Return B = 2 (Depleting balance)...');
  const retA = await request('POST', '/returns', {
    returnType: 'VENDOR_SALES_RETURN',
    partyType: 'VENDOR',
    partyId: vendorId,
    partyName: 'ABC Electronics',
    sourceSaleId: saleId,
    items: [
      {
        productId: pBattery._id || pBattery.id,
        productName: pBattery.name,
        sku: pBattery.sku,
        quantity: 2,
        unitPrice: 1500,
        reasonCategory: 'DEFECTIVE_ITEM',
      },
    ],
  }, token);
  assert(retA.status === 200 || retA.status === 201, 'Return A (2 units) succeeded');

  const retB = await request('POST', '/returns', {
    returnType: 'VENDOR_SALES_RETURN',
    partyType: 'VENDOR',
    partyId: vendorId,
    partyName: 'ABC Electronics',
    sourceSaleId: saleId,
    items: [
      {
        productId: pBattery._id || pBattery.id,
        productName: pBattery.name,
        sku: pBattery.sku,
        quantity: 2,
        unitPrice: 1500,
        reasonCategory: 'DEFECTIVE_ITEM',
      },
    ],
  }, token);
  assert(retB.status === 200 || retB.status === 201, 'Return B (2 units) succeeded (Remaining is now 0)');

  // Return C = 1 MUST FAIL because 0 remain!
  const retC = await request('POST', '/returns', {
    returnType: 'VENDOR_SALES_RETURN',
    partyType: 'VENDOR',
    partyId: vendorId,
    partyName: 'ABC Electronics',
    sourceSaleId: saleId,
    items: [
      {
        productId: pBattery._id || pBattery.id,
        productName: pBattery.name,
        sku: pBattery.sku,
        quantity: 1,
        unitPrice: 1500,
        reasonCategory: 'DEFECTIVE_ITEM',
      },
    ],
  }, token);
  assert(retC.status === 400, `Return C (1 unit) correctly rejected with HTTP 400 after full depletion (${retC.body?.message})`);

  // ============================================================
  // TASK 14: SERIAL / IMEI TESTS
  // ============================================================
  console.log('\n--- TASK 14: Serial / IMEI Return Protection Tests ---');
  // In first return we already returned iphoneSaleImeis[0] and iphoneSaleImeis[1].
  // Attempt to return iphoneSaleImeis[0] again:
  const dupImeiAttempt = await request('POST', '/returns', {
    returnType: 'VENDOR_SALES_RETURN',
    partyType: 'VENDOR',
    partyId: vendorId,
    partyName: 'ABC Electronics',
    sourceSaleId: saleId,
    items: [
      {
        productId: pIphone._id || pIphone.id,
        productName: pIphone.name,
        sku: pIphone.sku,
        quantity: 1,
        unitPrice: 70000,
        reasonCategory: 'BROKEN_ITEM',
        imeis: [returnedImeis[0]], // Already returned!
      },
    ],
  }, token);
  assert(dupImeiAttempt.status === 400, `Duplicate IMEI return rejected with HTTP 400 (${dupImeiAttempt.body?.message})`);

  // Attempt to return unknown IMEI not part of this sale:
  const unknownImeiAttempt = await request('POST', '/returns', {
    returnType: 'VENDOR_SALES_RETURN',
    partyType: 'VENDOR',
    partyId: vendorId,
    partyName: 'ABC Electronics',
    sourceSaleId: saleId,
    items: [
      {
        productId: pIphone._id || pIphone.id,
        productName: pIphone.name,
        sku: pIphone.sku,
        quantity: 1,
        unitPrice: 70000,
        reasonCategory: 'BROKEN_ITEM',
        imeis: ['999999999999999'], // Foreign IMEI!
      },
    ],
  }, token);
  assert(unknownImeiAttempt.status === 400, `Unknown/foreign IMEI return rejected with HTTP 400 (${unknownImeiAttempt.body?.message})`);

  // Valid remaining IMEI return:
  const validImei = iphoneSaleImeis[2]; // 3rd unsold iPhone
  const validImeiAttempt = await request('POST', '/returns', {
    returnType: 'VENDOR_SALES_RETURN',
    partyType: 'VENDOR',
    partyId: vendorId,
    partyName: 'ABC Electronics',
    sourceSaleId: saleId,
    items: [
      {
        productId: pIphone._id || pIphone.id,
        productName: pIphone.name,
        sku: pIphone.sku,
        quantity: 1,
        unitPrice: 70000,
        reasonCategory: 'DEFECTIVE_ITEM',
        imeis: [validImei],
      },
    ],
  }, token);
  assert(validImeiAttempt.status === 200 || validImeiAttempt.status === 201, `Valid unsold IMEI ${validImei} return succeeded`);

  // ============================================================
  // TASK 15: INVENTORY LEDGER AUDIT
  // ============================================================
  console.log('\n--- TASK 15: Inventory Ledger Audit Records ---');
  const logRes = await request('GET', '/inventory/logs', null, token);
  const logs = Array.isArray(logRes.body) ? logRes.body : (logRes.body.logs || []);

  const multiSaleLogs = logs.filter((l) => l.reference === saleId || l.notes?.includes(saleId) || l.reason?.includes(saleId));
  console.log(`Found ${multiSaleLogs.length} audit log entries referencing sale ${saleId}`);
  assert(multiSaleLogs.length >= 3, 'Multi-item sale created separate audit entries for each line item');

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n============================================================');
  console.log(`TEST EXECUTION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTargetedTests().catch((e) => {
  console.error('Fatal Test Runner Error:', e);
  process.exit(1);
});
