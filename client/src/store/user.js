import { defineStore } from 'pinia'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { API_BASE } from '../utils/config'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: false
  }),

  actions: {
    async loadUser() {
      if (!this.token) return
      try {
        const res = await axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${this.token}` } })
        this.user = res.data.data.user
        this.isAuthenticated = true
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
      } catch (e) { this.logout() }
    },

    async login(email, password) {
      try {
        const res = await axios.post(`${API_BASE}/auth/login`, { email, password })
        this.token = res.data.data.token
        this.user = res.data.data.user
        this.isAuthenticated = true
        localStorage.setItem('token', this.token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        ElMessage.success('登录成功')
      } catch (e) { throw e }
    },

    async register(data) {
      try {
        const res = await axios.post(`${API_BASE}/auth/register`, data)
        this.token = res.data.data.token
        this.user = res.data.data.user
        this.isAuthenticated = true
        localStorage.setItem('token', this.token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        ElMessage.success('注册成功')
      } catch (e) { throw e }
    },

    logout() {
      this.user = null; this.token = null; this.isAuthenticated = false
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    },

    async updateProfile(data) {
      try {
        const res = await axios.put(`${API_BASE}/auth/profile`, data)
        this.user = res.data.data.user
        ElMessage.success('资料更新成功')
      } catch (e) { throw e }
    }
  }
})
