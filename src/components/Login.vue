<template>
  <div class="bg-blue-001" id="window">
    <div id="content">
      <b-container>
        <div class="row justify-content-center">
          <div class="col-10 my-5 p-5">

            <!-- Heading -->
            <div class="d-flex flex-row justify-content-between align-items-center">
              <h1 class="display-4 mb-3">
                {{$t('create.heading')}}
              </h1>

              <b-button-group>
                <b-button v-for="[type, label] of Object.entries(account_types)"
                :key="type" :variant="(account_type == type) ? 'primary' : 'outline-primary'"
                @click="account_type = type">{{label}}</b-button>
                <b-button v-if="web3_available" variant="outline-primary" @click="$root.doWeb3Login"><img src="../assets/metamask.png" height="32"/> Web3</b-button>
              </b-button-group>
            </div>

            <b-form-select v-model="mode" class="my-4" size="lg">
              <option v-for="mode of modes" :value="mode" :key="mode">
                {{$t('create.' + mode)}}
              </option>
            </b-form-select>

            <div v-if="mode == 'create'">
              <div class="text-center">
                <vue-markdown :html="false" :source="$t('create.new_text')"></vue-markdown>
              </div>
              <!-- Form -->
              <form>

                <!-- Email address -->
                <div class="form-group my-5">

                  <!-- Label -->
                  <label>{{$t('resource.mnemonics_words')}}</label>
                  <code class="d-block text-truncate my-2">{{tentative_account.mnemonics || '--'}}</code>

                  <label>{{$t('resource.private_key')}}</label>
                  <code class="d-block text-truncate my-2">{{tentative_account.private_key || '--'}}</code>

                  <label>{{$t('resource.public_key')}}</label>
                  <code class="d-block text-truncate my-2">{{tentative_account.public_key || '--'}}</code>

                  <label>{{$t('resource.address')}}</label>
                  <code class="d-block text-truncate my-2">{{tentative_account.address || '--'}}</code>

                </div>

                <!-- Submit -->
                <b-button size="lg" variant="primary" class="btn-block mb-3" v-on:click="generate">
                  {{$t('actions.regenerate')}}
                </b-button>
                <b-button size="lg" variant="primary" class="btn-block mb-3" v-on:click="add">
                  {{$t('actions.add_it')}}
                </b-button>

              </form>
            </div>

            <div v-if="mode == 'import_privkey'">
              <div class="text-center">
                <vue-markdown :html="false" :source="$t('create.import_text')"></vue-markdown>
              </div>
                <!-- Form -->
              <form>
                <!-- Email address -->
                <div class="form-group my-5">

                  <b-form-group
                    :label="$t('resource.private_key')"
                    label-for="private_key"
                    :state="prvState"
                >
                    <b-form-textarea id="private_key" :state="prvState"
                                  v-model="private_key"
                                  v-on:input="analyze"
                                  :maxlength="66"
                                  :rows="1"></b-form-textarea>
                  </b-form-group>

                  <label>{{$t('resource.public_key')}}</label>
                  <code class="d-block text-truncate" v-if="tentative_account">{{tentative_account.public_key||'--'}}</code>

                  <label>{{$t('resource.address')}}</label>
                  <code class="d-block text-truncate" v-if="tentative_account">{{tentative_account.address||'--'}}</code>

                </div>

                <!-- Submit -->
                <b-button  size="lg" variant="primary" class="btn-block mb-3" :disabled="!prvState" v-on:click="add">
                  {{$t('actions.add_it')}}
                </b-button>
            </form>
            </div>
          </div>
        </div> <!-- / .row -->
      </b-container>
    </div>
  </div>
</template>

<script>
import {
  nuls2, neo, ethereum
} from 'aleph-js'
import store from '../store'
import { mapState } from 'vuex'
import VueMarkdown from 'vue-markdown'
var shajs = require('sha.js')

const secp256k1 = require('secp256k1')

const iv = Buffer.from('00000000000000000000000000000000', 'hex')

var webcrypto = window.crypto || window.msCrypto || window.webkitCrypto || window.mozCrypto



var hexRegEx = /([0-9]|[a-f])/gim

function isHex (input) {
  return typeof input === 'string' &&
    (input.match(hexRegEx) || []).length === input.length
}

function readFile(file){
  return new Promise((resolve, reject) => {
    console.log(file)
    var fr = new FileReader();
    fr.onload = () => {
      resolve(fr.result )
    };
    fr.readAsText(file);
  });
}

export default {
  name: 'add',
  data () {
    return {
      // msg: 'Welcome to Your Vue.js App'
      'mode': 'create',
      'encrypted_private_key': '',
      'private_key': '',
      'passphrase': '',
      'public_key': null,
      'address': null,
      'keystore_file': null,
      'tentative_account': {},
      'modes': [
        'create',
        'import_mnemonics',
        'import_privkey'
      ],
      'web3_available': (window.ethereum||window.web3),
      'account_type': 'ETH',
      'account_types': {
        ETH: 'Ethereum',
        NULS2: 'NULS',
        NEO: 'Neo'
      }
    }
  },
  components: {
    VueMarkdown
  },
  computed: {
    prvState () {
      if (!isHex(this.private_key)) { return false }
      if (!this.private_key) { return false }
      if ((this.private_key.length === 66) && (this.private_key.substring(0, 2) === '00')) {
        this.private_key = this.private_key.substring(2, 66)
        return true
      }
      if (this.private_key.length !== 64) { return false }
      try {
        let prvbuffer = Buffer.from(this.private_key, 'hex')
        let pub = private_key_to_public_key(prvbuffer)
        return true
      } catch (e) {
        return false
      }
    },
    ... mapState([
      // map this.count to store.state.count
      'account',
      'network_id',
      'api_server'
    ])
  },
  watch: {
    mode() {
      this.init()
    },
    account_type() {
      this.switch()
    }
  },
  methods: {
    async prvState () {
      await this.analyze()
      if (!this.private_key) { return 'empty' }
      if (!this.tentative_account) { return 'error' }
      return true
    },
    mnemoState() {
      if (this.mnemonics.trim().split(/\s+/g).length < 12) {
        return 'less than 12 words'
      }
      if (bip39.validateMnemonic(this.mnemonics))
      {
        return true
      } else {
        return 'invalid'
      }
    },
    async generate () {
      this.generating = true;

      if (this.account_type == 'NULS2')
        this.tentative_account = await nuls2.new_account()
      else if (this.account_type == 'NEO')
        this.tentative_account = await neo.new_account()
      else if (this.account_type == 'ETH')
        this.tentative_account = await ethereum.new_account()
      this.generating = false;
    },
    async analyze () {
      try {
        if (this.mode == 'import_mnemonics') {
          if (this.mnemoState()===true) {
            if (this.account_type == 'NULS2')
              this.tentative_account = await nuls2.import_account({
                'mnemonics': this.mnemonics
              })
            else if (this.account_type == 'ETH')
              this.tentative_account = await ethereum.import_account({
                'mnemonics': this.mnemonics
              })
            else if (this.account_type == 'NEO')
              this.tentative_account = await neo.import_account({
                'mnemonics': this.mnemonics
              })
          }
        } else if (this.mode == 'import_encrypted_privkey') {
          let sha =  new shajs.sha256().update(Buffer.from(this.passphrase)).digest()
          try {
            let key = await webcrypto.subtle.importKey(
                "raw",
                sha,
                { name: "AES-CBC" },
                true,
                ["encrypt", "decrypt"]
            )
            let out = await webcrypto.subtle.decrypt(
                { name: "AES-CBC", iv: iv },
                key, //from generateKey or importKey above
                Buffer.from(this.encrypted_private_key, 'hex') //ArrayBuffer of data you want to encrypt
            )
            this.private_key = Buffer.from(out).toString('hex')
            this.tentative_account = await nuls2.import_account({
                'private_key': this.private_key
              })
          } catch(error) {
            this.private_key = ''
            this.tentative_account = null
          }
        } else {
          if (this.private_key) {
            if (this.account_type == 'NULS2')
              this.tentative_account = await nuls2.import_account({
                'private_key': this.private_key
              })
            if (this.account_type == 'NEO')
              this.tentative_account = await neo.import_account({
                'private_key': this.private_key
              })
            else if (this.account_type == 'ETH')
              this.tentative_account = await ethereum.import_account({
                'private_key': this.private_key
              })
          }
        }
      } catch(error) {
        console.log("woops", error)
        this.tentative_account = null
      }
    },
    async init () {
      this.encrypted_private_key = ''
      this.passphrase = ''
      this.private_key = ''
      this.mnemonics = ''
      this.public_key = null
      this.address = null
      this.tentative_account = null

      if (this.mode == 'create')
        await this.generate()
    },
    async switch() {
      if (this.mode == 'create')
        await this.generate()
      else
        await this.analyze()
    },
    async add () {
      this.adding = true
      // this.$store.commit('set_account', {
      //   'name': this.address,
      //   'type': 'NULS',
      //   'private_key': this.private_key,
      //   'public_key': this.public_key,
      //   'address': this.address
      // })
      // await this.$fetch_profile(this.tentative_account.address)

      store.commit('set_account', this.tentative_account)
      this.$router.push({name: 'ProfileAddress', params: {address: this.tentative_account.address}})

      this.adding = false
    },
    async keystore_upload() {
      let result = await readFile(this.keystore_file)
      let keystore = JSON.parse(result)

      if ((keystore.prikey !== undefined) && (keystore.prikey !== '') && (keystore.prikey !== null)) {
        this.mode = 'import_privkey'
        await this.$forceUpdate()
        this.private_key = keystore.prikey
      } else if ((keystore.encryptedPrivateKey !== undefined) && (keystore.encryptedPrivateKey !== '') && (keystore.encryptedPrivateKey !== null)) {
        this.mode = 'import_encrypted_privkey'
        await this.$forceUpdate()
        this.encrypted_private_key = keystore.encryptedPrivateKey
      }
    }
  },
  mounted () {
    this.init()
  }

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
