<template>
  <span>
    <router-link :to="{ name: 'ProfileAddress', params: {'address': this.address} }"
       v-if="(profiles[address]) && (profiles[address].name)"
       :class="linkclass ? linkclass : ''"
       >{{profiles[address].name}}</router-link>
    <router-link :to="{ name: 'ProfileAddress', params: {'address': this.address} }"
      :class="linkclass ? linkclass : ''"
       v-else>{{address}}</router-link>
  </span>
</template>

<script>
import { mapState } from 'vuex'
export default {
  name: 'account-name',
  props: ['address', 'linkclass'],
  computed: mapState([
    'account',
    'profiles',
    'address_alias',
    'profile'
  ]),
  watch: {
    profiles() {
      this.$forceUpdate();
    },
    address_alias() {
      this.$forceUpdate();
    },
    address() {
      if (this.profiles[this.address]===undefined) {
        this.$root.fetch_profile(this.address)
      }
    }
  }
}
</script>
