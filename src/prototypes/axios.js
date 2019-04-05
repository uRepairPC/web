'use strict'

import SettingsFrontend from '@/classes/SettingsFrontend'
import { isArray, isObject } from '@/scripts/helpers'
import { Message, Notification } from 'element-ui'
import { runLoadingService } from '@/scripts/dom'
import StorageData from '@/classes/StorageData'
import { serverProd, isProd } from '@/data/env'
import * as types from '@/enum/types'
import store from '@/store'
import axios from 'axios'

/*
 * The server API should be accessible at the following address:
 *  http(s)://example.com/api
 * In dev mode, all requests are sent to the server via
 * PROXY_PATH (webpack), to bypass CORS.
 */
axios.defaults.baseURL = isProd ? serverProd + '/api' : 'api'

/** @type {Array} */
let requestsToRefresh = []

/** @type {boolean} */
let isRequestToRefresh = false

axios.interceptors.response.use(
	(resp) => {
		// Notification
		if (resp.config.method !== 'get' && resp.data.message) {
			Message({ message: resp.data.message, type: types.SUCCESS })
		}

		// Check for update frontend, global settings
		SettingsFrontend.checkUpdate(resp.headers[SettingsFrontend.HEADER_NAME])

		return resp
	},
	async (err) => {
		// Fatal error
		if (!err || !err.response) {
			return Promise.reject(err)
		}

		const { response, config } = err

		// User is not auth
		if (response.status === 401) {

			if (!store.state.profile.isLogin) {
				return Promise.reject(err)
			}

			// After token is refreshed - send requests to all 401 statusCode
			const retryOriginalRequest = new Promise((resolve) => {
				requestsToRefresh.push((access_token) => {
					config.headers['Authorization'] = 'Bearer ' + access_token
					resolve(axios({
						...config,
						// TODO Check on prod
						url: config.urlDomain.replace(/^api\//, '')
					}))
				})
			})

			// User is auth, probably token is expired, try renew
			// And send all failed requests again
			if (!isRequestToRefresh) {
				isRequestToRefresh = true

				// Disable all interface
				const loadingService = runLoadingService('Оновлюється токен безпеки')

				// Send request to refresh token
				try {
					await axios.post('auth/refresh')
						.then(({ data }) => {
							axios.defaults.headers['Authorization'] = 'Bearer ' + data.token
							StorageData.token = data.token
							requestsToRefresh.forEach(callback => callback(data.token))
						})
						.catch(() => {
							store.commit('profile/CLEAR_ALL')
						})
						.finally(() => {
							loadingService.close()
							requestsToRefresh = []
							isRequestToRefresh = false
						})
				} catch (e) {
					return Promise.reject(err)
				}
			}

			return retryOriginalRequest
		}

		// No access, etc
		if (response.status === 403) {
			store.dispatch('profile/update')
		}

		// Notification / Message
		if (isObject(response.data)) {
			if (response.data.message) {
				Message({ message: response.data.message, type: types.ERROR })
			}

			// Show validate form if exists from backend
			if (isObject(response.data.errors)) {
				let message = ''

				/**
				 * @example {'image.png': ['File not saved']}
				 *  <strong>image.png</strong>
				 *  <ul>
				 *    <li>File not saved<li>
				 *    ...
				 *  </ul>
				 */
				Object.entries(response.data.errors).forEach(([key, val]) => {
					message += `<strong>${key}</strong>:<br>`
					if (isArray(val)) {
						message += '<ul>'
						val.forEach((error) => {
							message += '<li>' + error.replace(/<(?:.|\n)*?>/gm, '') + '</li>'
						})
						message += '</ul>'
					}
				})

				Notification.error({ title: 'Помилка валідації', duration: 6000, dangerouslyUseHTMLString: true, message })
			}
		}

		return Promise.reject(err)
	}
)

export default (Vue) => Vue.prototype.$axios = axios
