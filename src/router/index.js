import Vue from 'vue'
import Router from 'vue-router'
import Hello from '@/components/Hello'
import StoryRead from '@/components/StoryRead'
import Profile from '@/components/Profile'
import EditProfile from '@/components/EditProfile'
import Write from '@/components/Write'
import Login from '@/components/Login'
import TagDetail from '@/components/TagDetail'
// import Organization from '@/components/Organization'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Hello',
      component: Hello
    },
    {
      path: '/@:alias',
      name: 'Profile',
      component: Profile
    },
    {
      path: '/a/:address',
      name: 'ProfileAddress',
      component: Profile
    },
    {
      path: '/a/:address/edit',
      name: 'EditProfile',
      component: EditProfile,
      props: true
    },
    // {
    //   path: '/o/:alias',
    //   name: 'Organization',
    //   component: Organization,
    //   props: true
    // },
    {
      path: '/s/:hash',
      name: 'StoryRead',
      component: StoryRead,
      props: true
    },
    {
      path: '/s/:hash/amend',
      name: 'StoryAmend',
      component: Write,
      props: true
    },
    {
      path: '/t/:tag',
      name: 'TagDetail',
      component: TagDetail,
      props: true
    },
    {
      path: '/write',
      name: 'Write',
      component: Write,
      props: true
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      props: true
    }
  ]
})
