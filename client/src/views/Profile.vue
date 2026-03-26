<template>
  <div class="profile-page">
    <el-card>
      <h3 style="color:#f7fafc;margin-bottom:20px;">👤 个人资料</h3>
      <el-form :model="form" label-width="100px">
        <el-form-item label="用户名"><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="投资风格"><el-select v-model="form.profile.investmentStyle"><el-option label="保守型" value="conservative" /><el-option label="稳健型" value="balanced" /><el-option label="激进型" value="aggressive" /><el-option label="日内交易" value="day_trader" /><el-option label="长期持有" value="long_term" /></el-select></el-form-item>
        <el-form-item label="经验水平"><el-select v-model="form.profile.experience"><el-option label="入门" value="beginner" /><el-option label="中级" value="intermediate" /><el-option label="高级" value="advanced" /><el-option label="专业" value="professional" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="save">保存修改</el-button></el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const form = reactive({ username: userStore.user?.username || '', profile: { investmentStyle: userStore.user?.profile?.investmentStyle || 'balanced', experience: userStore.user?.profile?.experience || 'intermediate' } })

const save = async () => { try { await userStore.updateProfile(form); ElMessage.success('保存成功') } catch (e) { ElMessage.error('保存失败') } }
</script>
