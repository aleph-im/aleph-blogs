<template>
  <form :class="loaded ? 'preview-form': 'is-loading is-loading-lg'">
      <div class="container">
        <div class="row">
          <div class="col-lg-8 col-md-10 mx-auto">
            <div class="my-5 d-md-flex justify-content-between">
              <div class="flex-shrink-1 order-1 col-md-4 col-lg-3 align-self-top text-right">
                <a class="avatar avatar-xxl">
                    <img :src="ipfs_gateway + ppic_hash" alt="..." class="avatar-img rounded-circle"
                         v-if="ppic_hash">
                </a>
              </div>
              <div class="flex-grow-1 order-0 mt-4 align-self-top">
                <h1>
                  <b-form-textarea v-model="name"
                  type="text"
                  placeholder="Name"
                  class="form-inherit"
                  :rows="Math.ceil(name.length/30)"
                  :maxlength="100"
                  required></b-form-textarea>
                </h1>
                <p>
                  <b-form-textarea v-model="bio"
                  type="text"
                  class="form-inherit"
                  placeholder="Your bio..."
                  :rows="Math.ceil(bio.length/50)"></b-form-textarea>
                </p>
                <b-form-group
                  id="name"
                  label="Profile Picture"
                  label-for="ppic_file"
                  >
                  <b-input-group>
                    <b-form-file v-model="ppic_file"
                    placeholder="Choose a file..." accept="image/jpeg, image/png, image/gif"
                    plain @input="ppic_upload"></b-form-file>
                  </b-input-group>
                  <b-form-text v-if="ppic_hash">
                     {{ppic_hash}}
                  </b-form-text>
                </b-form-group>
              </div>
            </div>
            <div class="float-right">
              <b-button :variant="(name) ? 'success' : 'danger'" @click="save" :disabled="(!name)||processing">
                {{processing ? 'Please wait...' : 'Save'}}
              </b-button>
            </div>
          </div>
        </div>
      </div>
  </form>
</template>
<script>
import axios from 'axios'
import {fetch_profile, submit} from 'aleph-js/src/api/aggregates'
import {ipfs_push_file, broadcast} from 'aleph-js/src/api/create'
import Transaction from 'nulsworldjs/src/model/transaction.js'
import { mapState } from 'vuex'
import Sign from './Sign.vue'
import router from '../router'

export default {
  name: 'transfer',
  data() {
    return {
      'profile': {},
      'tx': null,
      'loaded': false,
      'name': '',
      'bio': '',
      'ppic_file': '',
      'ppic_hash': '',
      'processing': false
    }
  },
  computed: mapState({
    account: state => state.account,
    api_server: state => state.api_server,
    last_broadcast: state => state.last_broadcast,
    ipfs_gateway: state => state.ipfs_gateway,
    alias(state) {
      let address = this.$route.params.address
      let alias = null
      if (address !== undefined) {
        let aliasobj = state.address_alias[address]
        if (aliasobj !== undefined) {
          alias = aliasobj.alias
        }
      }
      return alias
    }
  }),
  watch: {
    async address() {
      await this.fetch_profile()
    }
  },
  methods: {
    broadcasted(msg) {
      Object.assign(this.$data, this.$options.data())
      this.outputs = null
      this.$emit('message-broadcasted', msg)
    },
    async fetch_profile() {
      this.loaded = false
      let address = this.address
      let profile = await fetch_profile(address, {api_server:this.api_server})
      if (profile !== null) {
        this.name = profile.name ? profile.name : ''
        this.bio = profile.bio ? profile.bio : ''
        this.ppic_hash = profile.profile_picture ? profile.profile_picture : ''
      } else {
        this.name = ''
        this.bio = ''
      }
      this.loaded = true
    },
    async ppic_upload(){
      this.ppic_hash = await ipfs_push_file(this.ppic_file, {api_server: this.api_server})
    },
    async save() {
      let values = {
        'name': this.name,
        'bio': this.bio
      }

      if (this.ppic_hash) {
        values['profile_picture'] = this.ppic_hash
      }

      let message = await submit(
        this.account.address, 'profile', values, {
          api_server: this.api_server,
          channel: 'blog',
          chain: this.account.type
        }
      )
      // this.$store.commit('sign_tx', {
      //   'tx': tx,
      //   'reason': 'Profile modification for ' + this.account.address
      // })
      await this.$root.send(message)
      this.processing = true
      function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
      await sleep(100)
      this.processing = false
      if (this.alias)
        router.push({ name: "Profile", params: {alias: this.alias} })
      else
        router.push({ name: "ProfileAddress", params: {address: this.address} })
    }
  },
  props: ['address'],
  components: {
    Sign
  },
  async created() {
    await this.fetch_profile()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
