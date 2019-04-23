'use strict'

import StorageData from '@/classes/StorageData'
import { isObject } from '@/scripts/helpers'
import moment from 'moment'
import i18n from '@/locale'

// Get all languages on the site
// global.name - key is required!
const languages = i18n.messages
const LANGUAGES = {}

Object.keys(languages).forEach((key) => {
	if (isObject(languages[key].global) && typeof languages[key].global.name !== 'undefined') {
		LANGUAGES[key] = languages[key].global.name
	}
})

export { LANGUAGES }

/** @type {string} */
export const DEFAULT_LANG = 'en-US'

export default class Lang {

	static init() {
		const storageLang = StorageData.lang

		if (storageLang) {
			Lang.setLocale(storageLang)
		} else {
			Lang.setLocale(navigator.language)
		}
	}

	/**
	 * Set locale global on the site:
	 *  - DOM
	 *  - libraries
	 * @param {string} lang
	 * @example
	 *  en-US
	 *  ru-RU
	 *  uk-UA
	 */
	static setLocale(lang) {
		if (!LANGUAGES[lang]) {
			lang = DEFAULT_LANG
		}

		const langShort = lang.split('-')[0]

		// Update vue-i18n library
		i18n.locale = lang

		// Save choose lang to localStorage
		StorageData.lang = lang

		// Set html lang
		document.querySelector('html').setAttribute('lang', langShort)

		// Change language in moment.js plugin
		moment.locale(langShort)
	}
}
