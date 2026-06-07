<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { fetchStores, fetchSkus, fetchStockList, updateStock, resolveAlert } from "../api/client";
import type { Store, Sku, StockItem, StockQueryParams } from "../types";

const stores = ref<Store[]>([]);
const skus = ref<Sku[]>([]);
const stockList = ref<StockItem[]>([]);
const alertCount = ref(0);
const totalCount = ref(0);
const normalCount = ref(0);
const loading = ref(false);

const queryParams = ref<StockQueryParams>({
  storeId: undefined,
  filter: "all",
  keyword: "",
});

const editDialogVisible = ref(false);
const editingStock = ref<StockItem | null>(null);
const editQuantity = ref(0);

async function loadData() {
  loading.value = true;
  try {
    const [storesData, skusData, stockData] = await Promise.all([
      fetchStores(),
      fetchSkus(),
      fetchStockList(queryParams.value),
    ]);
    stores.value = storesData;
    skus.value = skusData;
    stockList.value = stockData.list;
    alertCount.value = stockData.alertCount;
    totalCount.value = stockData.totalCount;
    normalCount.value = stockData.normalCount;
  } catch (error) {
    ElMessage.error("加载库存数据失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  loadData();
}

function handleReset() {
  queryParams.value = {
    storeId: undefined,
    filter: "all",
    keyword: "",
  };
  loadData();
}

async function handleRefresh() {
  await loadData();
  ElMessage.success("数据已刷新");
}

function handleEdit(row: StockItem) {
  editingStock.value = row;
  editQuantity.value = row.quantity;
  editDialogVisible.value = true;
}

async function handleSave() {
  if (!editingStock.value) return;

  try {
    await updateStock(editingStock.value.id, {
      quantity: editQuantity.value,
    });
    ElMessage.success("库存更新成功");
    editDialogVisible.value = false;
    await loadData();
  } catch (error) {
    ElMessage.error("库存更新失败");
    console.error(error);
  }
}

async function handleResolveAlert(row: StockItem) {
  try {
    await ElMessageBox.confirm(
      `确认标记 ${row.store.name} - ${row.sku.name} 的预警为已处理？`,
      "预警处理",
      {
        confirmButtonText: "确认处理",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    const alerts = await fetch("/api/alerts", {
      headers: { Accept: "application/json" },
    }).then((r) => r.json());

    const alert = alerts.find(
      (a: any) => a.storeId === row.storeId && a.skuId === row.skuId && a.status === "pending"
    );

    if (alert) {
      await resolveAlert(alert.id);
      ElMessage.success("预警已标记为已处理");
      await loadData();
    } else {
      ElMessage.warning("未找到待处理的预警记录");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error("处理预警失败");
      console.error(error);
    }
  }
}

function tableRowClassName({ row }: { row: StockItem }) {
  if (row.isLowStock) {
    return "low-stock-row";
  }
  return "";
}

const filterOptions = [
  { value: "all", label: "全部" },
  { value: "low", label: "低库存" },
  { value: "normal", label: "正常" },
];

const statsCards = computed(() => [
  {
    label: "总SKU数",
    value: totalCount.value,
    tone: "primary",
  },
  {
    label: "低库存预警",
    value: alertCount.value,
    tone: alertCount.value > 0 ? "danger" : "success",
  },
  {
    label: "正常库存",
    value: normalCount.value,
    tone: "success",
  },
]);

onMounted(() => {
  loadData();
});
</script>

<template>
  <section class="inventory-panel">
    <div class="panel-header">
      <h2>库存实时查询</h2>
      <el-button type="primary" @click="handleRefresh" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>

    <div class="stats-grid">
      <div
        v-for="stat in statsCards"
        :key="stat.label"
        class="stat-card"
        :class="`stat-${stat.tone}`"
      >
        <span>{{ stat.label }}</span>
        <strong>{{ stat.value }}</strong>
      </div>
    </div>

    <div class="filter-bar">
      <el-select
        v-model="queryParams.storeId"
        placeholder="选择门店"
        clearable
        style="width: 180px"
        @change="handleSearch"
      >
        <el-option
          v-for="store in stores"
          :key="store.id"
          :label="store.name"
          :value="store.id"
        />
      </el-select>

      <el-select
        v-model="queryParams.filter"
        placeholder="库存状态"
        style="width: 140px"
        @change="handleSearch"
      >
        <el-option
          v-for="opt in filterOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>

      <el-input
        v-model="queryParams.keyword"
        placeholder="搜索商品名称/SKU编码"
        clearable
        style="width: 280px"
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch">
            <el-icon><Search /></el-icon>
          </el-button>
        </template>
      </el-input>

      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table
      :data="stockList"
      v-loading="loading"
      style="width: 100%"
      size="default"
      :row-class-name="tableRowClassName"
      stripe
    >
      <el-table-column prop="store.name" label="门店" width="120" />
      <el-table-column prop="sku.skuCode" label="SKU编码" width="120" />
      <el-table-column prop="sku.name" label="商品名称" min-width="140" />
      <el-table-column prop="sku.spec" label="规格" width="100" />
      <el-table-column prop="sku.category" label="分类" width="100" />
      <el-table-column label="当前库存" width="120" align="center">
        <template #default="{ row }">
          <span :class="{ 'low-stock-text': row.isLowStock }">
            {{ row.quantity }} {{ row.sku.unit }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="安全阈值" width="100" align="center">
        <template #default="{ row }">
          {{ row.sku.safetyStock }} {{ row.sku.unit }}
        </template>
      </el-table-column>
      <el-table-column label="缺货数量" width="100" align="center">
        <template #default="{ row }">
          <span v-if="row.isLowStock" class="shortage-text">
            {{ row.shortage }} {{ row.sku.unit }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            :type="row.isLowStock ? 'danger' : 'success'"
            effect="light"
            size="small"
          >
            {{ row.isLowStock ? "低库存" : "正常" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="180">
        <template #default="{ row }">
          {{ new Date(row.updatedAt).toLocaleString("zh-CN") }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="handleEdit(row)">
            调整库存
          </el-button>
          <el-button
            v-if="row.isLowStock"
            size="small"
            type="success"
            @click="handleResolveAlert(row)"
          >
            处理预警
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="editDialogVisible"
      title="调整库存"
      width="420px"
    >
      <div v-if="editingStock" class="edit-form">
        <div class="edit-info">
          <p><strong>门店：</strong>{{ editingStock.store.name }}</p>
          <p><strong>商品：</strong>{{ editingStock.sku.name }}</p>
          <p><strong>规格：</strong>{{ editingStock.sku.spec }}</p>
          <p><strong>单位：</strong>{{ editingStock.sku.unit }}</p>
          <p><strong>安全库存：</strong>{{ editingStock.sku.safetyStock }} {{ editingStock.sku.unit }}</p>
          <p><strong>当前库存：</strong>{{ editingStock.quantity }} {{ editingStock.sku.unit }}</p>
        </div>
        <el-form label-width="100px">
          <el-form-item label="新库存">
            <el-input-number
              v-model="editQuantity"
              :min="0"
              :max="10000"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确认保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.inventory-panel {
  background: color-mix(in srgb, #f6f5ee 86%, white 14%);
  border: 1px solid color-mix(in srgb, #1f2417 13%, transparent);
  border-radius: 8px;
  padding: clamp(22px, 4vw, 42px);
  box-shadow: 0 18px 50px color-mix(in srgb, #1f2417 10%, transparent);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.panel-header h2 {
  margin: 0;
  font-size: clamp(20px, 2.5vw, 28px);
  font-weight: 700;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border: 1px solid color-mix(in srgb, #1f2417 13%, transparent);
  border-radius: 8px;
  padding: 18px;
  background: color-mix(in srgb, #f6f5ee 86%, white 14%);
}

.stat-card span {
  font-size: 14px;
  color: color-mix(in srgb, #1f2417 68%, transparent);
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  font-size: clamp(22px, 3vw, 30px);
  font-weight: 800;
}

.stat-primary strong {
  color: #7d8f2d;
}

.stat-danger strong {
  color: #b55239;
}

.stat-success strong {
  color: #529b73;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

:deep(.low-stock-row) {
  background-color: color-mix(in srgb, #b55239 12%, transparent) !important;
}

:deep(.low-stock-row:hover > td) {
  background-color: color-mix(in srgb, #b55239 18%, transparent) !important;
}

.low-stock-text {
  color: #b55239;
  font-weight: 700;
}

.shortage-text {
  color: #b55239;
  font-weight: 600;
}

.edit-info {
  background: color-mix(in srgb, #7d8f2d 10%, transparent);
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.edit-info p {
  margin: 6px 0;
  font-size: 14px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .filter-bar {
    flex-direction: column;
  }

  .filter-bar > * {
    width: 100% !important;
  }
}
</style>
