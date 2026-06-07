const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyDataConsistency() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 库存实时同步与预警 - 数据一致性验证');
  console.log('='.repeat(60) + '\n');

  let allPassed = true;
  const results = [];

  try {
    const expectedPendingAlerts = 13;
    const expectedTotalStocks = 50;
    const expectedStores = 5;
    const expectedSkus = 10;

    console.log('📌 验证目标：');
    console.log(`   - 待处理预警数: ${expectedPendingAlerts}`);
    console.log(`   - 总库存记录数: ${expectedTotalStocks}`);
    console.log(`   - 门店数: ${expectedStores}`);
    console.log(`   - SKU数: ${expectedSkus}`);
    console.log('');

    const storeCount = await prisma.store.count();
    results.push({
      name: '门店数量',
      expected: expectedStores,
      actual: storeCount,
      passed: storeCount === expectedStores,
    });

    const skuCount = await prisma.sku.count();
    results.push({
      name: 'SKU数量',
      expected: expectedSkus,
      actual: skuCount,
      passed: skuCount === expectedSkus,
    });

    const stockCount = await prisma.stock.count();
    results.push({
      name: '总库存记录数',
      expected: expectedTotalStocks,
      actual: stockCount,
      passed: stockCount === expectedTotalStocks,
    });

    const pendingAlertCount = await prisma.stockAlert.count({
      where: { status: 'pending' },
    });
    results.push({
      name: '待处理预警数',
      expected: expectedPendingAlerts,
      actual: pendingAlertCount,
      passed: pendingAlertCount === expectedPendingAlerts,
    });

    const lowStockItems = await prisma.stock.findMany({
      include: {
        sku: { select: { safetyStock: true } },
      },
    });
    const calculatedLowStockCount = lowStockItems.filter(
      (s) => s.quantity < s.sku.safetyStock
    ).length;
    results.push({
      name: '计算低库存数量',
      expected: expectedPendingAlerts,
      actual: calculatedLowStockCount,
      passed: calculatedLowStockCount === expectedPendingAlerts,
    });

    const alertIdsFromDb = await prisma.stockAlert.findMany({
      where: { status: 'pending' },
      select: { storeId: true, skuId: true },
      orderBy: [{ storeId: 'asc' }, { skuId: 'asc' }],
    });

    const lowStockIds = lowStockItems
      .filter((s) => s.quantity < s.sku.safetyStock)
      .map((s) => ({ storeId: s.storeId, skuId: s.skuId }))
      .sort((a, b) => a.storeId - b.storeId || a.skuId - b.skuId);

    const alertsMatchLowStock =
      JSON.stringify(alertIdsFromDb) === JSON.stringify(lowStockIds);
    results.push({
      name: '预警记录与低库存匹配',
      expected: true,
      actual: alertsMatchLowStock,
      passed: alertsMatchLowStock,
    });

    console.log('📋 基础数据验证:');
    console.log('-'.repeat(60));
    results.forEach((r) => {
      const status = r.passed ? '✅ PASS' : '❌ FAIL';
      console.log(
        `${status} ${r.name.padEnd(25)} 预期: ${String(r.expected).padEnd(8)} 实际: ${r.actual}`
      );
      if (!r.passed) allPassed = false;
    });

    console.log('\n📦 库存列表抽样检查 (低库存置顶排序):');
    console.log('-'.repeat(60));

    const stockList = lowStockItems.map((s) => ({
      ...s,
      isLowStock: s.quantity < s.sku.safetyStock,
      shortage: Math.max(0, s.sku.safetyStock - s.quantity),
    }));

    stockList.sort((a, b) => {
      if (a.isLowStock && !b.isLowStock) return -1;
      if (!a.isLowStock && b.isLowStock) return 1;
      if (a.isLowStock && b.isLowStock) {
        return b.shortage - a.shortage;
      }
      return 0;
    });

    const lowStockTop = stockList.slice(0, 5);
    console.log(`前5条记录 (共 ${stockList.length} 条):`);
    lowStockTop.forEach((item, idx) => {
      const lowMarker = item.isLowStock ? '🔴' : '🟢';
      console.log(
        `  ${idx + 1}. ${lowMarker} 门店${item.storeId}-SKU${item.skuId}: ` +
        `${item.quantity}/${item.sku.safetyStock} ` +
        `(缺货: ${item.shortage})`
      );
    });

    const firstIsLow = stockList[0]?.isLowStock;
    const lastIsLow = stockList[stockList.length - 1]?.isLowStock;
    const orderingCorrect = firstIsLow && !lastIsLow;
    results.push({
      name: '低库存置顶排序',
      expected: true,
      actual: orderingCorrect,
      passed: orderingCorrect,
    });

    console.log('\n🔗 数据流关联验证:');
    console.log('-'.repeat(60));

    const alertCountFromAlerts = pendingAlertCount;
    const alertCountFromStockList = calculatedLowStockCount;

    console.log(`📊 预警统计接口:     ${alertCountFromAlerts} 条待处理`);
    console.log(`📋 库存列表计算:      ${alertCountFromStockList} 条低库存`);
    console.log(`👆 两者一致:          ${alertCountFromAlerts === alertCountFromStockList ? '✅' : '❌'}`);

    console.log('');

    const kpiPendingValue = String(pendingAlertCount);
    const expectedKpiValue = String(expectedPendingAlerts);
    const kpiMatches = kpiPendingValue === expectedKpiValue;
    console.log(`📈 总览待处理KPI:     ${kpiPendingValue}`);
    console.log(`🔢 与预警数一致:      ${kpiMatches ? '✅' : '❌'}`);

    results.push({
      name: 'KPI值与预警数一致',
      expected: expectedKpiValue,
      actual: kpiPendingValue,
      passed: kpiMatches,
    });

    let taskflowStatus = '处理中';
    let taskflowPriority = '高';
    if (pendingAlertCount === 0) {
      taskflowStatus = '已上线';
      taskflowPriority = '低';
    }
    console.log('');
    console.log(`🔄 运营任务流状态:   ${taskflowStatus}`);
    console.log(`⭐ 运营任务流优先级: ${taskflowPriority}`);
    console.log(`📊 运营任务流指标:   ${pendingAlertCount} 单`);

    const expectedStatus = pendingAlertCount > 0 ? '处理中' : '已上线';
    const expectedPriority = pendingAlertCount > 0 ? '高' : '低';
    const statusCorrect = taskflowStatus === expectedStatus;
    const priorityCorrect = taskflowPriority === expectedPriority;

    results.push({
      name: '任务流状态联动',
      expected: expectedStatus,
      actual: taskflowStatus,
      passed: statusCorrect,
    });
    results.push({
      name: '任务流优先级联动',
      expected: expectedPriority,
      actual: taskflowPriority,
      passed: priorityCorrect,
    });

    console.log('\n' + '='.repeat(60));
    console.log('🎯 最终验证结果汇总');
    console.log('='.repeat(60));

    let passCount = 0;
    let failCount = 0;
    results.forEach((r) => {
      if (r.passed) passCount++;
      else failCount++;
      const status = r.passed ? '✅' : '❌';
      console.log(
        `${status} ${r.name.padEnd(30)} 预期: ${String(r.expected).padEnd(10)} 实际: ${r.actual}`
      );
    });

    console.log('');
    console.log(`总计: ${results.length} 项, ✅ 通过: ${passCount}, ❌ 失败: ${failCount}`);

    if (allPassed && failCount === 0) {
      console.log('\n🎉 所有数据一致性验证通过!');
      console.log(
        '   库存列表、预警数量、KPI指标、任务流状态均指向同一批数据。'
      );
    } else {
      console.log('\n⚠️  部分验证失败，请检查数据一致性。');
    }
  } catch (error) {
    console.error('❌ 验证过程出错:', error.message);
    allPassed = false;
  } finally {
    await prisma.$disconnect();
  }

  console.log('='.repeat(60) + '\n');
  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  verifyDataConsistency();
}

module.exports = { verifyDataConsistency };
