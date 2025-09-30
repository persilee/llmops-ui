import { defineStore } from 'pinia'
import { ref } from 'vue'

const initAccount = {
  name: '小明',
  email: 'xiaoming@163.com',
  avatar: 'https://cdn.vuetifyjs.com/images/john.jpg',
}

export const useAccountStore = defineStore('account', () => {
  const account = ref({ ...initAccount })

  const update = (params: any) => {
    Object.assign(account.value, params)
  }

  const reset = () => {
    Object.assign(account.value, initAccount)
  }
  return { account, update, reset }
})
