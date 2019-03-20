<template>
  <div>
    <title>Blah</title>
    <b-container>
      <h5 class="font-weight-bold spanborder"><span>Latest in {{tag}}</span></h5>
      <posts :posts="displayed_posts"></posts>
      <!-- Pager -->

      <b-pagination size="lg" :total-rows="total_posts" v-model="current_page" :per-page="per_page" v-if="total_posts > per_page">
      </b-pagination>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import moment from 'moment'
import { mapState } from 'vuex'
import Posts from './Posts.vue'
import AccountAvatar from './AccountAvatar.vue'
import AccountName from './AccountName.vue'

import bus from '../bus.js'

export default {
  name: 'tag-detail',
  data() {
    return {
      displayed_posts: [],
      account_profiles: {},
      moment: moment,
      per_page: 20,
      total_posts: 0,
      current_page: 1
    }
  },
  components: {
    Posts,
    AccountAvatar,
    AccountName
  },
  props: ['tag'],
  computed: mapState({
    account: 'account',
    api_server: 'api_server',
    last_broadcast: 'last_broadcast'
  }),
  watch: {
    async api_server() {
      await this.update()
    },
    async current_page() {
      await this.update_posts()
    },
    async tag() {
      await this.update()
    }
  },
  methods: {
    async update() {
      await this.update_posts()
    },
    async update_posts() {
      // TODO: only request metadata, not body
      let response = await axios.get(`${this.api_server}/api/v0/posts.json`, {
        params: {
          'tags': this.tag,
          'types': 'blog_pers,blog_org',
          'pagination': this.per_page,
          'page': this.current_page
        }
      })

      console.log(response.data)
      let posts = response.data.posts // display all for now
      //await this.update_comments(posts);
      this.displayed_posts = response.data.posts // display all for now
      this.total_posts = response.data.pagination_total
      this.current_page = response.data.pagination_page
    },
    async quick_post() {
      let tx = await create_post(
        this.selected_account.address, 'own_feed',
        this.quick_post_body, this.quick_post_title
      )
      this.$store.commit('sign_tx', {
        'tx': tx,
        'reason': 'New post on public timeline'
      })
    }
  },
  async mounted() {
    // We may not have a correct account list yet... So wait a bit.
    this.$nextTick(this.update.bind(this))
    //setTimeout(this.update.bind(this), 500)
    //setInterval(this.update.bind(this), 60000)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.jumbotron-img {
  background-size:cover;
  background-image: url('../assets/mast1.jpg');
}
.masthead .site-heading {
  padding: 50px 0;
}
</style>
