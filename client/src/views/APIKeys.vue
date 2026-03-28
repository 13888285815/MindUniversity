<template>
  <div class="api-keys-page">
    <el-card>
      <template #header><span style="font-weight:600;">🔑 API Keys</span></template>
      <p style="color:#a0aec0;margin-bottom:20px;">API Keys 用于程序化访问行情数据和AI分析接口。请妥善保管您的Key。</p>
      <el-table :data="keys" class="dark-table" empty-text="暂无API Key">
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="keyPrefix" label="Key前缀" />
        <el-table-column label="创建时间"><template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template></el-table-column>
        <el-table-column label="操作" width="80"><template #default="{ row }"><el-button size="small" type="danger" link @click="del(row.keyId)">删除</el-button></template></el-table-column>
      </el-table>
      <el-button type="primary" style="margin-top:16px;" @click="create">创建新Key</el-button>
      <div v-if="newKey" class="key-display"><code>{{ newKey }}</code></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'

import { API_BASE as API } from '../utils/config'
const userStore = useUserStore()
const keys = ref([])
const newKey = ref(null)

const load = async () => { try { const r = await axios.get(`${API}/auth/keys`, { headers: { Authorization: `Bearer ${userStore.token}` } }); keys.value = r.data.data.keys } catch (e) {} }
const create = async () => { try { const r = await axios.post(`${API}/auth/keys`, { name: 'API Key' }, { headers: { Authorization: `Bearer ${userStore.token}` } }); newKey.value = r.data.data.apiKey; load() } catch (e) { ElMessage.error(e.response?.data?.message) } }
const del = async (id) => { try { await axios.delete(`${API}/auth/keys/${id}`, { headers: { Authorization: `Bearer ${userStore.token}` } }); load() } catch (e) {} }
onMounted(load)
</script>

<style scoped>
.key-display { margin-top: 16px; padding: 12px; background: #16213e; border-radius: 8px; }
.key-display code { color: #2ed573; word-break: break-all; }
:deep(.dark-table) { --el-table-bg-color: transparent; --el-table-tr-bg-color: transparent; --el-table-header-bg-color: #16213e; --el-table-row-hover-bg-color: #1f2b47; --el-table-text-color: #e2e8f0; --el-table-header-text-color: #a0aec0; --el-table-border-color: #2d2d44; }
</style>
