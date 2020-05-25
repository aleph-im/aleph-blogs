<template>
  <div>
    <div class="container">
    	<div class="jumbotron jumbotron-fluid mb-3 pl-0 pt-0 pb-0 bg-white position-relative">
    		<div class="h-100 tofront">
    			<div class="row justify-content-between">
    				<div class="col-md-6 pt-6 pb-6 pr-6 align-self-center">
    					<!--<p class="text-uppercase font-weight-bold">
    						<a class="text-danger" href="./category.html">Stories</a>
    					</p>-->
              <p class="text-uppercase font-weight-bold">
                <vue-tags-input
                  v-model="tag"
                  :tags="tags"
                  placeholder="Set categories"
                  :add-on-key="[13, ',', ';']"
                  :autocomplete-items="filteredItems"
                  @tags-changed="newTags => tags = newTags"
                />
              </p>
    					<h1 class="display-4 secondfont mb-3 font-weight-bold">
                <b-form-textarea v-model="title"
                type="text"
                placeholder="Enter a title"
                class="form-inherit"
                :rows="Math.ceil(title.length/15)"
                required></b-form-textarea>
              </h1>
    					<p class="mb-3">
                  <b-form-textarea v-model="subtitle"
                    type="text"
                    class="form-inherit"
                    placeholder="subtitle (optional)"
                    :rows="Math.ceil(subtitle.length/40)"></b-form-textarea>
    					</p>
    					<div class="d-flex align-items-center">
                <account-avatar :address="account.address"
                 linkclass="avatar-lg ml-2"
                 imgclass="rounded-circle" />
    						<small class="ml-2">
                  <account-name :address="account.address" linkclass="text-dark"></account-name>
                  <span class="text-muted d-block" v-if="transaction">
                    {{moment.unix(transaction.time).fromNow()}},
                      updated now.
                  </span>
                  <span class="text-muted d-block" v-else>
                    Just now
                  </span>
    						</small>
    					</div>
    				</div>
    				<div class="col-md-6" :style="banner_hash ? `background-image: url('${ipfs_gateway}${banner_hash}'); background-size: cover; background-position: center center;   background-repeat: no-repeat;` : ''">
                 <b-form-group
                   id="banner"
                   label="Banner Picture"
                   label-for="banner_file"
                   class="bg-lightblue p-4 mt-4"
                   >
                   <b-input-group>
                     <b-form-file v-model="banner_file"
                     placeholder="Choose a file..." accept="image/jpeg, image/png, image/gif"
                     plain @input="banner_upload"></b-form-file>
                   </b-input-group>
                   <b-form-text v-if="banner_hash">
                      {{banner_hash}}
                   </b-form-text>
                 </b-form-group>
    				</div>
    			</div>
    		</div>
    	</div>
    </div>

    <div class="container pt-4 pb-4">
    	<div class="row justify-content-center">
    		<div class="col-lg-2 pr-4 mb-4 col-md-12">
    			<div class="sticky-top">
    				Your article can be edited using the markdown syntax and previewed using the right tab.
    			</div>
    		</div>
    		<div class="col-md-12 col-lg-8">
    			<article class="article-post">
            <b-tabs>
              <b-tab title="Write" active>
                <b-form-textarea id="textarea1"
                         v-model="body"
                         placeholder="Your post content"
                         class="form-inherit mt-4"
                         :rows="10"
                         :max-rows="20"
                         required>
                </b-form-textarea>
              </b-tab>
              <b-tab title="Preview">
                <vue-markdown :source="body"
                :html="false" class="mt-4" />
              </b-tab>
            </b-tabs>
    			</article>
          <div class="clearfix float-right">
            <b-button :variant="(title&&body) ? 'success' : 'danger'" @click="submit" :disabled="(!(title&&body))||processing">
              {{processing ? 'Please wait...' : 'Submit'}}
            </b-button>
          </div>
    		</div>
    	</div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import moment from 'moment'
import AccountAvatar from './AccountAvatar.vue'
import AccountName from './AccountName.vue'
import {posts, aggregates} from 'aleph-js'
// import {nuls_sign} from '../api/sign'
import { mapState } from 'vuex'
import VueMarkdown from 'vue-markdown'
import VueTagsInput from '@johmun/vue-tags-input';

import bus from '../bus.js'
import router from '../router'

  export default {
    name: 'storyread',
    data() {
      return {
        profile: {},
        transaction: null,
        amends: [],
        banner_file: null,
        banner_hash: null,
        post: null,
        title: '',
        subtitle: '',
        body: '',
        tag: '',
        tags: [],
        moment: moment,
        processing: false
      }
    },
    props: ['hash'],
    computed: {
      filteredItems() {
        return this.autocompleteitems.filter((i) => {
          return i.text.toLowerCase().indexOf(this.tag.toLowerCase()) !== -1;
        });
      },
      ... mapState({
      account: state => state.account,
      api_server: state => state.api_server,
      last_broadcast: state => state.last_broadcast,
      ipfs_gateway: state => state.ipfs_gateway,
      channel: state => state.channel,
      // post(state) {
      //   let post = null
      //   if (this.message&&this.message.content)
      //     post = this.message.content
      //   // if (this.transaction&&this.transaction.info&&this.transaction.info.post) {
      //   //   post = Object.assign({}, this.transaction.info.post)
      //   // }
      //   // if (this.amends.length) {
      //   //   let post_content = Object.assign({}, post.content)
      //   //   for (let amend of this.amends) {
      //   //     Object.assign(post_content, amend.content)
      //   //   }
      //   //   post.content = post_content
      //   // }
      //   return post
      // },
      autocompleteitems(state) {
        return state.categories.map((c) => {return {text:c}})
      }
    })},
    components: {
      AccountAvatar,
      AccountName,
      VueMarkdown,
      VueTagsInput
    },
    methods: {
      async getPost() {
        let response = await axios.get(`${this.api_server}/api/v0/posts.json?hashes=${this.hash}`)
        this.post = response.data.posts[0]
      },
      async getProfile() {
        // let address = this.$route.params.address
        // this.profile = await fetch_profile(address)
        // if (this.profile === null)
        //   this.profile = {}
        // else
        //   this.$store.commit('store_profile', {
        //     address: address,
        //     profile: this.profile
        //   })
      },
      async getAmends() {
        // let response = await axios.get(`${this.api_server}/api/posts.json`, {
        //   params: {
        //     'types': 'amend',
        //     'addresses': this.address,
        //     'refs': this.txhash,
        //     'pagination': 200
        //   }
        // })
        // this.amends = response.data.posts
        // this.amends.reverse()
      },
      async setState() {
        if (this.hash) {
          this.banner_hash = this.post.content.banner
          this.title = this.post.content.title
          this.subtitle = this.post.content.subtitle
          this.body = this.post.content.body
          if (this.post.content.tags !== undefined)
            this.tags = this.post.content.tags.map((t) => {return {text: t}})
          else
            this.tags = []
        } else {
          this.banner_hash = null
          this.title = ''
          this.subtitle = ''
          this.body = ''
          this.tags = []
        }
      },
      async refresh() {
        if (this.hash) {
          await this.getPost()
          //await this.getProfile()
          //await this.getAmends()
        }
        await this.setState()
      },
      applyTextEdit(operation) {
        this.text = operation.api.origElements.innerHTML
      },
      async banner_upload(){
        this.banner_hash = await ipfs_push_file(this.banner_file, {api_server: this.api_server})
      },
      async submit() {
        let msg = null
        if (this.hash)
          msg = await posts.submit(
            this.account.address, 'amend', {
              body: this.body,
              title: this.title,
              subtitle: this.subtitle,
              banner: this.banner_hash,
              tags: this.tags.map(t => t.text)
            },
            {ref: this.hash,
             channel: this.channel,
             api_server: this.api_server,
             chain: this.account.type})
        else
          msg = await posts.submit(
            this.account.address, 'blog_pers', {
              body: this.body,
              title: this.title,
              subtitle: this.subtitle,
              banner: this.banner_hash,
              tags: this.tags.map(t => t.text)
            }, {
              channel: this.channel,
              api_server: this.api_server,
              chain: this.account.type})

        // nuls_sign(Buffer.from(this.account.private_key, 'hex'), msg)
        // await broadcast(msg, {api_server: this.api_server})
        await this.$root.send(msg)

        this.processing = true
        function sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
        await sleep(200)
        this.processing = false

        if (this.hash)
          router.push({ name: "StoryRead", params: {hash: this.hash} })
        else
          router.push({ name: "StoryRead", params: {hash: msg.item_hash} })


        // this.$store.commit('sign_tx', {
        //   'tx': tx,
        //   'reason': 'New comment on tx ' + this.post.hash
        // })
      }
    },
    watch: {
      async txhash() {
        await this.refresh()
      }
    },
    async created() {
      await this.refresh()
    }
  }
</script>
<style>
header.masthead .post-heading {
  padding: 100px 0;
}
</style>
