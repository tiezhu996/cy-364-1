<script setup lang="ts">
import type { OperationRecord } from "../types";

defineProps<{ records: OperationRecord[] }>();

function getStatusType(status: string) {
  const statusMap: Record<string, string> = {
    "已上线": "success",
    "处理中": "warning",
    "排期中": "info",
    "巡检中": "primary",
    "优化中": "warning",
    "可导出": "success",
  };
  return statusMap[status] || "info";
}

function getPriorityType(priority: string) {
  const priorityMap: Record<string, string> = {
    "高": "danger",
    "中": "warning",
    "低": "success",
  };
  return priorityMap[priority] || "info";
}
</script>

<template>
  <el-table :data="records" style="width: 100%" size="large">
    <el-table-column prop="name" label="模块" min-width="180" />
    <el-table-column prop="owner" label="负责人" width="100" />
    <el-table-column prop="status" label="状态" width="120">
      <template #default="{ row }">
        <el-tag :type="getStatusType(row.status)" effect="light" size="small">
          {{ row.status }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="metric" label="指标" width="120" />
    <el-table-column prop="priority" label="优先级" width="100">
      <template #default="{ row }">
        <el-tag :type="getPriorityType(row.priority)" effect="dark" size="small">
          {{ row.priority }}
        </el-tag>
      </template>
    </el-table-column>
  </el-table>
</template>
