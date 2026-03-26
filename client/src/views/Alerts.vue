<template>
  <div class="alerts-page">
    <el-card>
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;font-size:18px;">🔔 价格预警</span>
          <el-button type="primary" size="small" @click="showDialog = true">新建预警</el-button>
        </div>
      </template>
      <el-table :data="alerts" class="dark-table" empty-text="暂无预警">
        <el-table-column prop="name" label="名称" width="100" />
        <el-table-column prop="symbol" label="代码" width="80" />
        <el-table-column label="条件">
          <template #default="{ row }">
            {{ conditionLabels[row.condition.type] }} {{ row.condition.value }}
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : row.status === 'triggered' ? 'warning' : 'info'" size="small">
              {{ { active: '活跃', triggered: '已触发', expired: '已过期', cancelled: '已取消' }[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="触发次数" prop="triggerCount" width="80" />
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button size="small" link @click="toggleAlert(row._id)">{{ row.status === 'active' ? '暂停' : '恢复' }}</el-button>
            <el-button size="small" type="danger" link @click="deleteAlert(row._id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" title="新建预警" width="450px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="股票代码"><el-input v-model="form.symbol" placeholder="600519" /></el-form-item>
        <el-form-item label="市场"><el-select v-model="form.market"><el-option label="SH" value="SH" /><el-option label="SZ" value="SZ" /></el-select></el-form-item>
        <el-form-item label="预警条件">
          <el-select v-model="form.condition.type" style="width:120px;margin-right:10px;">
            <el-option label="价格高于" value="price_above" /><el-option label="价格低于" value="price_below" />
            <el-option label="涨幅超过" value="change_above" /><el-option label="跌幅超过" value="change_below" />
          </el-select>
          <el-input-number v-model="form.condition.value" :precision="2" />
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.note" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="showDialog = false">取消</el-button><el-button type="primary" @click="createAlert">创建</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'

const API = 'http://localhost:3000/api'
const userStore = useUserStore()
const alerts = ref([])
const showDialog = ref(false)
const form = reactive({ symbol: '', market: 'SH', condition: { type: 'price_above', value: 0 }, note: '' })
const conditionLabels = { price_above: '价格高于', price_below: '价格低于', change_above: '涨幅超过%', change_below: '跌幅超过%', volume_spike: '成交量突破' }

const loadAlerts = async () => {
  try { const res = await axios.get(`${API}/alerts`, { headers: { Authorization: `Bearer ${userStore.token}` } }); alerts.value = res.data.data.alerts || [] } catch (e) {}
}
const createAlert = async () => {
  try { await axios.post(`${API}/alerts`, form, { headers: { Authorization: `Bearer ${userStore.token}` } }); ElMessage.success('预警创建成功'); showDialog.value = false; loadAlerts() } catch (e) { ElMessage.error(e.response?.data?.message) }
}
const toggleAlert = async (id) => {
  try { await axios.put(`${API}/alerts/${id}/toggle`, {}, { headers: { Authorization: `Bearer ${userStore.token}` } }); loadAlerts() } catch (e) {}
}
const deleteAlert = async (id) => {
  try { await axios.delete(`${API}/alerts/${id}`, { headers: { Authorization: `Bearer ${userStore.token}` } }); ElMessage.success('已删除'); loadAlerts() } catch (e) {}
}
onMounted(loadAlerts)
</script>

<style scoped>
:deep(.dark-table) { --el-table-bg-color: transparent; --el-table-tr-bg-color: transparent; --el-table-header-bg-color: #16213e; --el-table-row-hover-bg-color: #1f2b47; --el-table-text-color: #e2e8f0; --el-table-header-text-color: #a0aec0; --el-table-border-color: #2d2d44; }
</style>
