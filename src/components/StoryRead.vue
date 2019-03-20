<template>
  <div class="articlepage" ref="page">
    <div class="container">
    	<div class="jumbotron jumbotron-fluid mb-3 pl-0 pt-0 pb-0 bg-white position-relative">
    		<div class="h-100 tofront">
    			<div class="row justify-content-between">
    				<div class="col-md-6 pt-6 pb-6 pr-6 align-self-center">
    					<p class="text-uppercase font-weight-bold" v-if="post.content.tags">
    						<b-link class="text-danger mr-2" :to="{name: 'TagDetail', params: {tag: tag}}" v-for="tag of post.content.tags">{{tag}}</b-link>
    					</p>
    					<h1 class="display-4 secondfont mb-3 font-weight-bold">{{post.content.title||"Untitled"}}</h1>
    					<p class="mb-3">
    						 {{post.content.subtitle}}
    					</p>
    					<div class="d-flex align-items-center">
                <account-avatar :address="address"
                 linkclass="avatar-lg ml-2"
                 imgclass="rounded-circle" />
    						<small class="ml-2">
                  <account-name :address="address" linkclass="text-dark"></account-name>
                  <span class="text-muted d-block">
                    {{moment.unix(post.time).fromNow()}}<span v-if="amends.length">
                    </span>
                  </span>
    						</small>
    					</div>
    				</div>
    				<div class="col-md-6 pr-0" :style="post.content.banner ? `background-image: url('${ipfs_gateway}${post.content.banner}'); background-size: cover; background-position: center center;   background-repeat: no-repeat;` : ''"
                 v-if="post&&transaction">
    				</div>
    			</div>
    		</div>
    	</div>
    </div>
    <div class="container pt-4 pb-4">
    	<div class="row justify-content-center">
    		<div class="col-lg-2 pr-4 mb-4 col-md-12">
    			<div class="sticky-top text-center">

    			</div>
    		</div>
    		<div class="col-md-12 col-lg-8">
    			<article class="article-post">
            <b-button class="float-right" style="z-index: 5;"
            :to="{name: 'StoryAmend', params: {hash: post.hash}}"
            v-if="account && (account.address === address)">
              Edit
            </b-button>
            <vue-markdown :source="post.content.body"
            :html="false" />
    			</article>

          <hr v-if="comments.length">
          <div v-if="comments.length">
            <h4 class="my-5">{{comments.length}} thoughts on "{{post.content.title}}"</h4>
            <div v-for="comment in comments"
                 :key="post.hash + Object.keys(profiles).length">
               <div class="d-md-flex justify-content-between">
                 <div class="flex-shrink-1">
                   <account-avatar :address="comment.address"
                     linkclass="avatar-lg"
                     imgclass="rounded-circle" />
                 </div>
                 <div class="flex-grow-1 ml-4">
                   <p class="my-0 text-muted float-right">{{moment.unix(comment.time/1000).fromNow()}}</p>
                   <h5><account-name :address="comment.address" linkclass="text-dark"></account-name> says</h5>
                   <vue-markdown :source="comment.content.body"
                     :html="false" />
                 </div>
               </div>
              <hr />
            </div>
          </div>

          <hr v-if="(account!==null) && (!comments.length)">
          <div class="d-md-flex justify-content-between" v-if="account!==null">
            <div class="flex-shrink-1">
              <!-- Avatar -->
              <account-avatar :address="account.address" imgclass="rounded-circle"></account-avatar>
            </div>
            <div class="flex-grow-1 ml-4">
              <p class="my-0 text-muted float-right">Just now</p>
              <h5><account-name :address="account.address" linkclass="text-dark"></account-name> says</h5>
              <b-form-textarea class="form-control form-inherit" v-model="quick_post_body" placeholder="Leave a comment" rows="2"></b-form-textarea>
            </div>
          </div>
          <div class="row align-items-center justify-content-between mt-2" v-if="quick_post_body">
            <div class="col-auto">
              <!-- more controls here like upload picture and things like that -->
            </div>
            <div class="col-auto">
              <b-button variant="primary" size="sm" @click="quick_post" :disabled="posting">
                {{posting ? 'Please wait...' : 'Comment'}}
              </b-button>
            </div>
          </div>

    			<div class="border p-5" v-if="account===null">
    				<div class="row justify-content-between">
    					<div class="col-md-5 mb-2 mb-md-0">
    						<h5 class="font-weight-bold secondfont">Become a member</h5>
    						 You only need an address with at least 0.01 NULS in it.
    					</div>
    					<div class="col-md-7">
    						<div class="row">
    							<div class="col-md-12 mt-2">
    								<b-button to="/login" variant="success" class="btn-block">Join Us!</b-button>
    							</div>
    						</div>
    					</div>
    				</div>
    			</div>
    		</div>
    	</div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import Posts from './Posts.vue'
import moment from 'moment'
import AccountAvatar from './AccountAvatar.vue'
import AccountName from './AccountName.vue'
import {fetch_profile} from '../api/aggregates'
import {create_post, broadcast} from '../api/create'
import {nuls_sign} from '../api/sign'
import { mapState } from 'vuex'
import VueMarkdown from 'vue-markdown'

import bus from '../bus.js'

  export default {
    name: 'storyread',
    data() {
      return {
        profile: {},
        transaction: null,
        amends: [],
        moment: moment,
        comments: [],
        quick_post_body: '',
        posting: false,
        post: null
      }
    },
    props: ['hash'],
    computed: mapState({
      account: state => state.account,
      profiles: state => state.profiles,
      api_server: state => state.api_server,
      last_broadcast: state => state.last_broadcast,
      ipfs_gateway: state => state.ipfs_gateway,
      // post(state) {
      //   let post = null
      //   if (this.transaction&&this.transaction.info&&this.transaction.info.post) {
      //     post = Object.assign({}, this.transaction.info.post)
      //   }
      //   if (this.amends.length) {
      //     let post_content = Object.assign({}, post.content)
      //     for (let amend of this.amends) {
      //       Object.assign(post_content, amend.content)
      //     }
      //     post.content = post_content
      //   }
      //   return post
      // },
      // original_post(state) {
      //   let post = null
      //   if (this.transaction&&this.transaction.info&&this.transaction.info.post) {
      //     post = Object.assign({}, this.transaction.info.post)
      //   }
      //   return post
      // },
      address() {
        if (this.post)
          return this.post.address
      }
    }),
    components: {
      Posts,
      AccountAvatar,
      AccountName,
      VueMarkdown
    },
    methods: {
      async getPost() {
        let response = await axios.get(`${this.api_server}/api/v0/posts.json?hashes=${this.hash}`)
        this.post = response.data.posts[0]
      },
      async getProfile() {
        await this.$root.fetch_profile(this.address)
      },
      async getAmends() {
        // let response = await axios.get(`${this.api_server}/ipfs/posts.json`, {
        //   params: {
        //     'types': 'amend',
        //     'addresses': this.address,
        //     'refs': this.txhash,
        //     'pagination': 1 // we only need the last modification
        //   }
        // })
        // this.amends = response.data.posts
        // this.amends.reverse()
      },
      async getComments() {
        // posts fron others on this wall
        let response = await axios.get(`${this.api_server}/api/v0/posts.json`, {
          params: {
            'types': 'comment',
            'refs': this.post.hash + (this.post.tx_hash ? ','+this.post.tx_hash:''),
            'pagination': 200
          }
        })
        let comments = response.data.posts

        for (let comment of comments)
          if (this.profiles[comment.address] === undefined)
            await this.$root.fetch_profile(comment.address)

        this.comments = comments // display all for now
      },
      async update() {
        if (this.hash)
          await this.getPost()
        if (this.post) {
          await this.getProfile()
          await this.getAmends()
          await this.getComments()
        }
        this.$forceUpdate()
      },
      async quick_post() {
        this.posting = true
        let msg = await create_post(
          this.account.address, 'comment',
          this.quick_post_body, {
            ref: this.post.hash,
            api_server: this.api_server
          }
        )
        // this.$store.commit('sign_tx', {
        //   'tx': tx,
        //   'reason': 'New comment on tx ' + this.post.hash
        // })
        // tx.sign(Buffer.from(this.account.private_key, 'hex'))
        nuls_sign(Buffer.from(this.account.private_key, 'hex'), msg)
        await broadcast(msg, {api_server: this.api_server})
        function sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
        await sleep(100)
        await this.getComments()
        this.quick_post_body = ''
        this.posting = false
      }
    },
    watch: {
      async txhash() {
        await this.update()
      }
    },
    async mounted() {
      await this.update()
    }
  }
</script>
<style>
header.masthead .post-heading {
  padding: 100px 0;
}

.articlepage {
  min-height: 100%
}
</style>
