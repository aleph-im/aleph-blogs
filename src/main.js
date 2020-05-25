// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import BootstrapVue from "bootstrap-vue"
import App from './App'
import router from './router'
import Notifications from 'vue-notification'
import vSelect from 'vue-select'
import store from './store'
import { mapState } from 'vuex'
import {
  nuls, nuls2, neo, ethereum, aggregates, broadcast
} from 'aleph-js'
import i18n from './i18n/i18n'
// TODO: use aleph-js instead!!
import Web3 from 'web3'

Vue.use(BootstrapVue)
Vue.use(Notifications)
Vue.component('v-select', vSelect)
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store: store,
  router,
  i18n,
  template: '<App/>',
  components: { App },
  computed: mapState({
    account: state => state.account,
    api_server: state => state.api_server
  }),
  data () {
    return {
      w3: null
    }
  },
  methods: {
    async fetch_profile(address) {
      console.log(address)
      let profile = await aggregates.fetch_profile(address, {api_server: this.api_server})
      this.$store.commit('store_profile', {
        address: address,
        profile: profile
      })
    },
    async send(message) {
      if (this.account.type === "NULS") {
        message = nuls.sign(Buffer.from(this.account.private_key, 'hex'), message)
      } else if (this.account.type === "NULS2") {
        message = await nuls2.sign(this.account, message)
      } else if (this.account.type === "NEO") {
        message = await neo.sign(this.account, message)
      } else if (this.account.type === "ETH") {
        message = await ethereum.sign(this.account, message)
      }
      await broadcast(message, {api_server: this.api_server})
    },
    async setWeb3Account() {
      let account = await ethereum.from_provider(window['ethereum'] || window.web3.currentProvider)
      // let accounts = await this.w3.eth.getAccounts()
      if (account) {
        store.commit('set_account', account)
      }
    },
    async checkWeb3() {
      // Modern dapp browsers...
      if (window.ethereum) {
        this.w3 = new Web3(ethereum)
        try {
          // Request account access if needed
          await ethereum.enable()
          await this.setWeb3Account()
        } catch (error) {
          // User denied account access...
        }
      } else if (window.web3) { // Legacy dapp browsers...
        try {
          this.w3 = new Web3(window.web3.currentProvider)
        } catch (e) {
          this.$notify({
            group: 'wallet',
            title: 'Metamask/Web3 issue',
            'type': 'error',
            text: 'You Web3 provider seems incompatible or too old. Please upgrade.'
          })
        }
        // Acccounts always exposed
        await this.setWeb3Account()
      } else { // Non-dapp browsers...
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
      }

      if ((!this.account) || (this.account.type === 'ETH')) {
        await this.setWeb3Account()
      }

      // var accountInterval = setInterval(function() {
      //   if ((!this.account) || (this.account.type == 'ETH')) {
      //     if (this.w3.eth.accounts[0] !== this.account.address) {
      //       this.setWeb3Account()
      //     }
      //   }
      // }.bind(this), 1000)
    },
    async doWeb3Login() {
      await this.checkWeb3()
      if (this.account) {
        this.$router.push({name: 'ProfileAddress', params: {address: this.account.address}})
      }
    }
  },
  mounted: function() {
    //setTimeout(this.checkWeb3.bind(this), 500)
  },
  // watch: {
  //   'account': {
  //       handler() {
  //         console.log('Account changed!');
  //         localStorage.setItem('account', JSON.stringify(this.account));
  //       },
  //       deep: true,
  //     },
  // },
  // mounted: function() {
  //   try{
  //     if (localStorage.getItem('account'))
  //     {
  //       this.$store.commit('set_account', JSON.parse(localStorage.getItem('account')))
  //     }
  //   } catch (e) {
  //     console.warn("Can't import data", e);
  //   }
  // },
})
