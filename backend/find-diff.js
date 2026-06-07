const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findDifferences() {
  console.log('🔍 查找低库存与预警记录的差异:\n');

  const stocks = await prisma.stock.findMany({
    include: {
      sku: { select: { skuCode: true, name: true, safetyStock: true } },
      store: { select: { name: true } },
    },
  });

  const alerts = await prisma.stockAlert.findMany({
    where: { status: 'pending' },
  });

  const alertMap = new Map();
  alerts.forEach((a) => {
    alertMap.set(`${a.storeId}-${a.skuId}`, a);
  });

  console.log('📋 所有低库存记录:');
  console.log('-'.repeat(90));
  console.log(
    '门店'.padEnd(10) +
      'SKU'.padEnd(10) +
      '商品'.padEnd(12) +
      '库存'.padEnd(8) +
      '阈值'.padEnd(8) +
      '缺货'.padEnd(8) +
      '预警状态'
  );
  console.log('-'.repeat(90));

  const lowStockItems = stocks.filter((s) => s.quantity < s.sku.safetyStock);
  lowStockItems.sort((a, b) => {
    const shortageA = a.sku.safetyStock - a.quantity;
    const shortageB = b.sku.safetyStock - b.quantity;
    return shortageB - shortageA;
  });

  let expectedAlertInserts = [];

  lowStockItems.forEach((s) => {
    const key = `${s.storeId}-${s.skuId}`;
    const hasAlert = alertMap.has(key);
    const shortage = s.sku.safetyStock - s.quantity;
    const status = hasAlert ? '✅ 已有预警' : '❌ 缺失预警';
    console.log(
      `${s.store.name.padEnd(10)}${s.sku.skuCode.padEnd(10)}${s.sku.name.padEnd(
        12
      )}${String(s.quantity).padEnd(8)}${String(s.sku.safetyStock).padEnd(
        8
      )}${String(shortage).padEnd(8)}${status}`
    );

    if (!hasAlert) {
      expectedAlertInserts.push({
        stock_id: s.id,
        store_id: s.storeId,
        sku_id: s.skuId,
        current_qty: s.quantity,
        threshold: s.sku.safetyStock,
      });
    }
  });

  console.log('\n');
  console.log('📊 统计:');
  console.log(`   低库存总数: ${lowStockItems.length}`);
  console.log(`   已有预警数: ${alerts.length}`);
  console.log(`   缺失预警数: ${expectedAlertInserts.length}`);

  if (expectedAlertInserts.length > 0) {
    console.log('\n🔧 需要补充的预警 INSERT 语句:');
    expectedAlertInserts.forEach((a, idx) => {
      console.log(
        `(${a.stock_id}, ${a.store_id}, ${a.sku_id}, ${a.current_qty}, ${a.threshold}, 'pending', NOW())${
          idx < expectedAlertInserts.length - 1 ? ',' : ';'
        }`
      );
    });
  }

  console.log('\n📋 现有预警记录中不属于低库存的:');
  const stockMap = new Map();
  stocks.forEach((s) => {
    stockMap.set(`${s.storeId}-${s.skuId}`, s);
  });

  alerts.forEach((a) => {
    const key = `${a.storeId}-${a.skuId}`;
    const stock = stockMap.get(key);
    if (!stock || stock.quantity >= stock.sku.safetyStock) {
      console.log(
        `   预警ID: ${a.id}, 门店${a.storeId}-SKU${a.skuId}, 当前库存: ${
          stock ? stock.quantity : 'N/A'
        }, 阈值: ${a.threshold} - ${
          stock ? (stock.quantity >= stock.sku.safetyStock ? '⚠️  库存已恢复但预警未关闭' : '⚠️  库存不存在') : '⚠️  库存不存在'
        }`
      );
    }
  });

  await prisma.$disconnect();
}

findDifferences();
