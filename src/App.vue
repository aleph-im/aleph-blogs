<template>
  <div>
    <notifications group="wallet" />
    <notifications group="blog" />
    <b-navbar class="topnav navbar-expand-lg navbar-light bg-white" variant="light" fixed="top">
      <div class="container">
        <b-navbar-brand to="/"><strong>Aleph Blogs</strong>
          <sup><b-badge pill variant="secondary">Testnet</b-badge></sup>
          </b-navbar-brand>

        <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>
        <b-collapse is-nav id="nav_collapse">
          <b-navbar-nav  class="mr-auto d-flex align-items-center">
            <b-nav-item v-for="category_tag of categories"
                        :to="{name: 'TagDetail', params: {tag: category_tag}}"
                        :key="category_tag">{{category_tag}}</b-nav-item>
          </b-navbar-nav>
          <b-navbar-nav  class="ml-auto d-flex align-items-center">
            <b-nav-item v-if="!account" :to="{name: 'Login'}" class="highlight"><i class="fas fa-sign-in-alt"></i> Log-In</b-nav-item>
            <b-nav-item v-if="(!account)&&web3_available" @click="$root.doWeb3Login"><img src="./assets/metamask.png" height="32"/></b-nav-item>
            <b-nav-text v-if="account">
              <account-avatar :address="account.address"
                linkclass="avatar-xs"
                imgclass="rounded-circle" />
                <account-name :address="account.address" /></b-nav-text>
            <b-nav-item v-if="account" :to="{name: 'Write'}" class="highlight secondary ml-2"><i class="fas fa-pen-nib"></i> Write</b-nav-item>
            <b-nav-item v-if="account" @click="logout" class="highlight ml-2"><i class="fas fa-sign-out-alt"></i> Log-Out</b-nav-item>
          </b-navbar-nav>
        </b-collapse>
      </div>
    </b-navbar>
    <router-view></router-view>

    <div class="container mt-5">
    	<footer class="bg-white border-top p-3 text-muted small">
    	<div class="d-flex justify-content-between">
    		<div class="align-self-baseline">
                <span class="navbar-brand mr-2"><strong>Aleph Blogs</strong></span> is a blogging engine based on the Aleph decentralized application network.
    		</div>
        <div class="align-self-baseline">
          Currently on Test-Net.
          <!-- <span v-if="network_id===261">
            Test-Net.
            <b-link @click="set_network(8964, 'https://nuls.world')" class="text-muted font-weight-bold">Switch</b-link>
          </span>
          <span v-if="network_id===8964">
            Main-Net.
            <b-link @click="set_network(261, 'https://testnet.nuls.world')" class="text-muted font-weight-bold">Switch</b-link>
          </span> -->
        </div>
    		<div class="align-self-baseline">
    			Made with the <a href="https://aleph.im" class="text-secondary font-weight-bold">Aleph.IM</a> and <a target="_blank" class="text-secondary font-weight-bold" href="https://www.wowthemes.net/mundana-free-html-bootstrap-template/">Mundana Theme</a>.
    		</div>
    	</div>
    	</footer>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import AccountAvatar from './components/AccountAvatar.vue'
import AccountName from './components/AccountName.vue'

var hexRegEx = /([0-9]|[a-f])/gim
function isHex (input) {
  return typeof input === 'string' &&
    (input.match(hexRegEx) || []).length === input.length
}

export default {
  name: 'app',
  data() {
    return {
      //msg: 'Welcome to Your Vue.js App'
      'private_key': null
    }
  },
  computed: mapState({
    account: state => state.account,
    signShow: state => state.signShow,
    signTx: state => state.signTx,
    signReason: state => state.signReason,
    api_server: state => state.api_server,
    network_id: state => state.network_id,
    categories: state => state.categories,
    web3_available: state => (window.ethereum||window.web3)
  }),
  watch: {
    async network_id() {
      this.update_aliases()
    }
  },
  components: {
    AccountName,
    AccountAvatar
  },
  methods: {
    async logout() {
      this.$store.commit('set_account', null)
    },
    async update_aliases() {
      // let aliases = await get_aliases({api_server: this.api_server})
      // console.log(aliases)
      // this.$store.commit('set_aliases', aliases)
    },
    async set_network(network_id, api_server) {
      this.$store.commit({
        'type': 'set_network',
        'network_id': network_id,
        'api_server': api_server
      })
      this.$router.push('/')
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.update_aliases()
    })
  },

}
</script>

<style lang="scss">
@import 'assets/scss/main.scss';
@import '~bootstrap-vue/dist/bootstrap-vue.css';

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.nav.nav-tabs {
  a.nav-link,
  a.nav-link:hover,
  a.nav-link.active {
    border: 0;
    background: none;
    color: #6c757d;
    padding: 0.2rem 0;
    margin-right: 1.5rem;
  }

  a.nav-link:hover,
  a.nav-link.active {
    font-weight: 800;
    color: inherit;
    border-bottom: 1px solid #000;
  }
}

.form-inherit.form-control {
  background: transparent;
  border: 0;
  padding: 0;
  font-size: inherit;
  color: inherit;
}
</style>
