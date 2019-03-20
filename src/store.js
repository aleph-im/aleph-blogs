import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

import VuexPersistence from 'vuex-persist'

const vuexLocal = new VuexPersistence({
  storage: window.localStorage
})

import bus from './bus.js'

export default new Vuex.Store({
  state: {
    api_server: 'http://127.0.0.1:8080',
    network_id: 261,
    ipfs_gateway: 'https://ipfs.io/ipfs/',
    account: null,
    profiles: {},
    address_alias: {},
    alias_address: {},
    signTx: null,
    signReason: null,
    signShow: false,
    editProfileShow: false,
    last_broadcast: null,
    categories: [ // categories are hard-coded for now...
      'Crypto',
      'NULS',
      'Tech',
      'Design',
      '214'
    ]
  },
  mutations: {
    set_account(state, account) {
      state.account = account
    },
    sign_tx(state, payload) {
      state.signTx = payload.tx
      state.signReason = payload.reason
      state.signShow = true
    },
    signed_tx(state) {
      state.signTx = null
      state.signReason = null
      state.signShow = false
      state.last_broadcast = new Date()
      bus.$emit('broadcasted');
    },
    store_profile(state, payload) {
      state.profiles[payload.address] = payload.profile
    },
    set_aliases(state, aliases) {
      let address_alias = {}
      let alias_address = {}
      for (let alias of aliases) {
        address_alias[alias.address] = alias
        alias_address[alias.alias] = alias
      }
      state.address_alias = address_alias
      state.alias_address = alias_address
    },
    edit_profile(state) {
      state.editProfileShow = true
    },
    edited_profile(state) {
      state.editProfileShow = false
    },
    set_network(state, payload) {
      state.network_id = payload.network_id
      state.api_server = payload.api_server
      state.profiles = {}
      state.address_alias = {}
      state.alias_address = {}
      state.last_broadcast = null
    }
  },
  plugins: [vuexLocal.plugin]
})
