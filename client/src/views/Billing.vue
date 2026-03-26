<template>
  <div class="billing-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card><h3 style="color:#f7fafc;margin-bottom:16px;">Token 余额</h3>
          <div class="balance-display"><span class="bal-val">{{ balance }}</span><span class="bal-label">可用Token</span></div>
          <div style="margin-top:16px;">
            <div class="stat-row"><span>本月已用</span><span>{{ monthlyUsed }}</span></div>
            <div class="stat-row"><span>累计使用</span><span>{{ totalUsed }}</span></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card><h3 style="color:#f7fafc;margin-bottom:16px;">API Keys 管理</h3>
          <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
            <span style="color:#a0aec0;font-size:14px;">API Key 用于程序化访问行情和分析接口</span>
            <el-button type="primary" size="small" @click="createKey">创建新Key</el-button>
          </div>
          <el-table :data="keys" size="small" class="dark-table" empty-text="暂无API Key">
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="keyPrefix" label="Key前缀" />
            <el-table-column label="最后使用">
              <template #default="{ row }">{{ row.lastUsedAt ? new Date(row.lastUsedAt).toLocaleString() : '未使用' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }"><el-button size="small" type="danger" link @click="deleteKey(row.keyId)">删除</el-button></template>
            </el-table-column>
          </el-table>
          <div v-if="newKey" style="margin-top:16px;padding:12px;background:#16213e;border-radius:8px;">
            <div style="color:#ffa502;font-size:12px;margin-bottom:4px;">⚠️ 请立即保存此Key，关闭后将无法再次查看</div>
            <code style="color:#2ed573;word-break:break-all;">{{ newKey }}</code>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'

const API = 'http://localhost:3000/api'
const userStore = useUserStore()
const balance = ref(0)
const monthlyUsed = ref(0)
const totalUsed = ref(0)
const keys = ref([])
const newKey = ref(null)

const load = async () => {
  try {
    const [b, k] = await Promise.all([axios.get(`${API}/billing/balance`, { headers: { Authorization: `Bearer ${userStore.token}` } }), axios.get(`${API}/auth/keys`, { headers: { Authorization: `Bearer ${userStore.token}` } })])
    balance.value = b.data.data.balance; monthlyUsed.value = b.data.data.monthlyUsed; totalUsed.value = b.data.data.totalUsed; keys.value = k.data.data.keys
  } catch (e) {}
}

const createKey = async () => {
  try { const res = await axios.post(`${API}/auth/keys`, { name: 'New Key' }, { headers: { Authorization: `Bearer ${userStore.token}` } }); newKey.value = res.data.data.apiKey; load() } catch (e) { ElMessage.error(e.response?.data?.message) }
}
const deleteKey = async (id) => { try { await axios.delete(`${API}/auth/keys/${id}`, { headers: { Authorization: `Bearer ${userStore.token}` } }); load() } catch (e) {} }
onMounted(load)
</script>

<style scoped>
.balance-display { text-align: center; padding: 24px; background: linear-gradient(135deg, #16213e, #1a1a3e); border-radius: 12px; }
.bal-val { display: block; font-size: 42px; font-weight: 800; color: #f6ad55; }
.bal-label { color: #718096; font-size: 14px; }
.stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #2d2d44; font-size: 14px; color: #a0aec0; }
:deep(.dark-table) { --el-table-bg-color: transparent; --el-table-tr-bg-color: transparent; --el-table-header-bg-color: #16213e; --el-table-row-hover-bg-color: #1f2b47; --el-table-text-color: #e2e8f0; --el-table-header-text-color: #a0aec0; --el-table-border-color: #2d2d44; }
</style>
