import { defineStore } from 'pinia'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const API_BASE = process.env.VITE_API_BASE || 'http://localhost:3000/api'

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
        const response = await axios.get(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        })

        this.user = response.data.data.user
        this.isAuthenticated = true

        // 设置axios默认token
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
      } catch (error) {
        console.error('加载用户信息失败:', error)
        this.logout()
      }
    },

    async login(email, password) {
      try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
          email,
          password
        })

        this.token = response.data.data.token
        this.user = response.data.data.user
        this.isAuthenticated = true

        localStorage.setItem('token', this.token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`

        ElMessage.success('登录成功')
        return response.data
      } catch (error) {
        const message = error.response?.data?.message || '登录失败'
        ElMessage.error(message)
        throw error
      }
    },

    async register(userData) {
      try {
        const response = await axios.post(`${API_BASE}/auth/register`, userData)

        this.token = response.data.data.token
        this.user = response.data.data.user
        this.isAuthenticated = true

        localStorage.setItem('token', this.token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`

        ElMessage.success('注册成功')
        return response.data
      } catch (error) {
        const message = error.response?.data?.message || '注册失败'
        ElMessage.error(message)
        throw error
      }
    },

    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false

      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']

      ElMessage.success('已退出登录')
    },

    async updateProfile(profileData) {
      try {
        const response = await axios.put(`${API_BASE}/auth/profile`, profileData)

        this.user = response.data.data.user
        ElMessage.success('资料更新成功')
        return response.data
      } catch (error) {
        const message = error.response?.data?.message || '更新失败'
        ElMessage.error(message)
        throw error
      }
    }
  }
})
