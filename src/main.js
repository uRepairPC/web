import VueSocketIO from 'vue-socket.io'
import App from './App.vue'
import Vue from 'vue'

// Import styles
import './styles/index'

// Prevent the production tip on Vue startup
Vue.config.productionTip = false

// TODO Move to const (config) + replace to instance socket.io client
Vue.use(new VueSocketIO({
	debug: true,
	connection: 'http://localhost:3000'
}))

new Vue({
	el: '#app',
	render: h => h(App)
})
